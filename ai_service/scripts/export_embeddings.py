import os
import torch
import numpy as np
import pandas as pd
from app.models.multimodal_gcn import MultimodalLightGCN
from app.utils.graph_builder import build_sparse_adj_matrix

def export_final_embeddings():
    print("🚀 BƯỚC 1: NẠP DỮ LIỆU VÀ CẤU HÌNH")
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    
    # 1. Đọc file CSV gốc
    df_train = pd.read_csv("data/train_5core.csv")
    df_test = pd.read_csv("data/test_5core.csv")

    # --- KHẮC PHỤC LỖI: ÁNH XẠ LẠI ID SANG INDEX ---
    print("🧠 Đang ánh xạ lại ID sang Index (giống lúc train)...")
    all_users = pd.concat([df_train['user_id'], df_test['user_id']]).astype('category')
    all_items = pd.concat([df_train['product_id'], df_test['product_id']]).astype('category')
    
    # Tạo cột idx cho df_train để build_sparse_adj_matrix không bị lỗi KeyError
    df_train['user_idx'] = pd.Categorical(df_train['user_id'], categories=all_users.cat.categories).codes
    df_train['item_idx'] = pd.Categorical(df_train['product_id'], categories=all_items.cat.categories).codes
    
    num_users = len(all_users.cat.categories)
    num_items = len(all_items.cat.categories)
    # -----------------------------------------------
    
    # 2. Xây dựng lại ma trận kề (Adj Matrix)
    print("🕸️ Đang xây dựng lại ma trận kề...")
    adj_matrix = build_sparse_adj_matrix(df_train, num_users, num_items).to(device)

    # 3. Nạp và ráp lại Vector Multimodal
    print("🧩 Đang ráp lại ma trận vector đặc trưng...")
    text_dict = torch.load('data/text_dict.pt')
    image_dict = torch.load('data/image_dict.pt')
    
    real_text_feats = torch.zeros((num_items, 512))
    real_image_feats = torch.zeros((num_items, 512))
    for idx, asin in enumerate(all_items.cat.categories):
        if asin in text_dict: real_text_feats[idx] = text_dict[asin]
        if asin in image_dict: real_image_feats[idx] = image_dict[asin]

    # 4. Khởi tạo mô hình
    model = MultimodalLightGCN(
        num_users=num_users, 
        num_items=num_items, 
        embedding_dim=64, 
        text_feats=real_text_feats.to(device), 
        image_feats=real_image_feats.to(device)
    ).to(device)

    print("🧠 BƯỚC 2: NẠP TRỌNG SỐ TỐI ƯU (EPOCH 185)")
    # Nhớ kiểm tra lại tên file checkpoint của bạn trong thư mục models/
    checkpoint_path = "data/best_multimodal_dummy.pth" 
    if os.path.exists(checkpoint_path):
        model.load_state_dict(torch.load(checkpoint_path, map_location=device))
        print(f"✅ Đã nạp trọng số từ {checkpoint_path}")
    else:
        print(f"⚠️ Không tìm thấy file {checkpoint_path}. Vui lòng kiểm tra lại đường dẫn!")
        return

    print("⚡ BƯỚC 3: TRÍCH XUẤT EMBEDDINGS CUỐI CÙNG")
    model.eval()
    with torch.no_grad():
        # Thực hiện suy luận để lấy vector cuối cùng
        users_emb_final, items_emb_final = model(adj_matrix)

    # Chuyển về NumPy để lưu trữ[cite: 2]
    users_np = users_emb_final.cpu().numpy()
    items_np = items_emb_final.cpu().numpy()

    print("💾 BƯỚC 4: LƯU TRỮ XUỐNG Ổ ĐĨA")
    os.makedirs('exports', exist_ok=True)
    np.save('exports/users_emb_final.npy', users_np)
    np.save('exports/items_emb_final.npy', items_np)
    
    print(f"🎉 Hoàn tất! Đã lưu 'bộ não' vào thư mục exports/")

if __name__ == "__main__":
    export_final_embeddings()