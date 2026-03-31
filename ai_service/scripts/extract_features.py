import os
import torch
import requests
import pandas as pd
from io import BytesIO
from PIL import Image
from torch.utils.data import Dataset, DataLoader
from transformers import CLIPProcessor, CLIPModel
from supabase import create_client, Client
from tqdm import tqdm
from dotenv import load_dotenv
from functools import partial

load_dotenv()

# --- KHỞI TẠO SUPABASE ---
supabase: Client = create_client(os.getenv("SUPABASE_URL"), os.getenv("SUPABASE_KEY"))

# ==========================================
# 1. CLASS DATASET XỬ LÝ ẢNH & CHỮ BẤT ĐỒNG BỘ
# ==========================================
class AmazonMultimodalDataset(Dataset):
    def __init__(self, products):
        self.products = products
        # Khởi tạo ảnh rỗng (dummy) phòng trường hợp URL bị lỗi [cite: 89, 90]
        self.dummy_image = Image.new('RGB', (224, 224), color='white')

    def __len__(self):
        return len(self.products)

    def __getitem__(self, idx):
        p = self.products[idx]
        
        # --- Xử lý Text (Giữ nguyên như cũ) ---
        feature_text = ""
        if p.get("features") and isinstance(p["features"], dict):
            feature_text = ", ".join([f"{k}: {v}" for k, v in p["features"].items()])
            
        category_name = p.get("main_category", {}).get("name", "") if p.get("main_category") else ""
        text = f"Product: {p.get('title')}. Category: {category_name}. Desc: {p.get('description', '')}. Specs: {feature_text}"
        
        # --- Xử lý Hình ảnh (ĐÃ SỬA LẠI) ---
        img_url = None
        images_list = p.get('images')
        
        # Kiểm tra mảng ảnh và bốc lấy ảnh đầu tiên (thường là variant: "MAIN")
        if isinstance(images_list, list) and len(images_list) > 0:
            first_image = images_list[0]
            # Ưu tiên lấy bản 'large' tải cho lẹ, nếu không có thì lấy 'hi_res'
            img_url = first_image.get('large') or first_image.get('hi_res')

        try:
            if not img_url:
                raise ValueError("SP không có ảnh")

            headers = {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8'
            }
                
            # Tải ảnh với timeout để tránh treo hệ thống
            response = requests.get(img_url, headers=headers, timeout=3)
            response.raise_for_status() # Bắn lỗi nếu link chết (404, 403...)
            image = Image.open(BytesIO(response.content)).convert("RGB")
            is_valid = True
        except Exception:
            # Nếu lỗi (link chết, timeout...), dùng ảnh trắng dummy thay thế
            image = self.dummy_image
            is_valid = False
            
        return {"text": text, "image": image, "is_valid": is_valid, "product_id": p['id']}

# ==========================================
# 2. HÀM COLLATOR (Đóng gói Batch)
# ==========================================
def collate_fn(batch, processor):
    texts = [item["text"] for item in batch]
    images = [item["image"] for item in batch]
    is_valid = torch.tensor([item["is_valid"] for item in batch])
    product_ids = [item["product_id"] for item in batch]

    # Lưu ý: CLIP giới hạn text dài tối đa 77 token. 
    # Tham số truncation=True sẽ tự động cắt bớt phần chữ thừa.
    inputs = processor(
        text=texts, images=images, return_tensors="pt", padding=True, truncation=True, max_length=77
    )
    return inputs, is_valid, product_ids

# ==========================================
# 3. LUỒNG THỰC THI CHÍNH (MAIN)
# ==========================================
def main():
    print("🚀 Bắt đầu tải dữ liệu từ Supabase...")
    # Lấy dữ liệu với alias main_category (Giống file JS)
    response = supabase.table("products") \
        .select("id, title, description, features, images, main_category:categories(name)") \
        .is_("image_embedding", "null") \
        .limit(1000) \
        .execute()
    products = response.data
    
    if not products:
        print("Không có sản phẩm nào.")
        return
        
    print(f"✅ Đã tải {len(products)} sản phẩm. Đang khởi tạo mô hình CLIP...")

    # Thiết lập device (Ưu tiên GPU nếu có)
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    print(f"Đang chạy trên: {device}")

    # Tải pre-trained CLIP model [cite: 120]
    model_id = "openai/clip-vit-base-patch32"
    model = CLIPModel.from_pretrained(model_id).to(device)
    processor = CLIPProcessor.from_pretrained(model_id)
    model.eval()

    # Tạo DataLoader
    dataset = AmazonMultimodalDataset(products)
    dataloader = DataLoader(
        dataset,
        batch_size=32, # Tăng lên 128 hoặc 256 nếu máy bạn có GPU mạnh [cite: 130]
        shuffle=False,
        num_workers=4, # Tận dụng đa luồng CPU [cite: 11]
        collate_fn=partial(collate_fn, processor=processor)
    )

    print("🧠 Bắt đầu trích xuất Vector bằng PyTorch...")
    
    # Sử dụng block with torch.no_grad(): để tắt tính toán gradient[cite: 14]. 
    # Điều này giúp dồn toàn bộ VRAM cho việc tăng batch_size lên mức tối đa, đẩy nhanh tốc độ trích xuất[cite: 15].
    with torch.no_grad():
        for inputs, is_valid, p_ids in tqdm(dataloader, desc="Processing Batches"):
            inputs = {k: v.to(device) for k, v in inputs.items()}

            # Truyền thẳng toàn bộ input vào model để lấy output tổng hợp
            outputs = model(**inputs)
            
            # Bóc tách trực tiếp các Tensor vector chuẩn từ object outputs
            image_features = outputs.image_embeds
            text_features = outputs.text_embeds
            
            # Chuẩn hóa L2 (Bắt buộc phải làm để dùng Cosine Similarity) [cite: 16, 17]
            image_features = torch.nn.functional.normalize(image_features, p=2, dim=1)
            text_features = torch.nn.functional.normalize(text_features, p=2, dim=1)
            
            # Chuyển về CPU và list để đẩy lên Supabase
            img_vecs = image_features.cpu().numpy().tolist()
            txt_vecs = text_features.cpu().numpy().tolist()
            
            # Cập nhật từng sản phẩm trong Batch lên Supabase
            for i, p_id in enumerate(p_ids):
                update_data = {
                    "embedding": txt_vecs[i] # Cập nhật vector chữ
                }
                
                # Chỉ cập nhật vector ảnh nếu link ảnh không bị lỗi
                if is_valid[i].item():
                    update_data["image_embedding"] = img_vecs[i]
                
                # Đẩy lên DB
                try:
                    # Dùng lệnh update thay vì upsert để tránh lỗi NOT NULL
                    res = supabase.table("products").update(update_data).eq("id", p_id).execute()
                    
                    # Kiểm tra xem Supabase có thực sự update dòng nào không
                    if len(res.data) > 0:
                        print(f"✅ Xong ID: {p_id}")
                    else:
                        print(f"⚠️ Cảnh báo: ID {p_id} không tồn tại hoặc bị Supabase từ chối ngầm!")
                        
                except Exception as e:
                    # Bắt tại trận lỗi của Supabase (sai kiểu dữ liệu, v.v.)
                    print(f"❌ LỖI UPDATE DB TẠI ID {p_id}: {str(e)}")

    print("🎉 Hoàn tất toàn bộ!")

if __name__ == "__main__":
    main()