import torch
from transformers import CLIPProcessor, CLIPModel

device = "cuda" if torch.cuda.is_available() else "cpu"
model_id = "openai/clip-vit-base-patch32"

print(f"Đang tải mô hình CLIP lên {device}...")
model = CLIPModel.from_pretrained(model_id).to(device)
processor = CLIPProcessor.from_pretrained(model_id)

# Chuyển sang chế độ đánh giá (không train) để tối ưu bộ nhớ
model.eval()
print("Tải mô hình thành công!")