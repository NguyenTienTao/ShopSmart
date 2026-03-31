from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel
import torch
import torch.nn.functional as F
from typing import List

# Import Database và Model từ các thư mục bạn vừa chia
from app.core.database import supabase
from app.models.clip_extractor import model, processor, device

router = APIRouter()

# Schema kiểm soát kết quả trả về
class ProductResponse(BaseModel):
    id: str
    title: str
    description: str
    price: float
    image_url: str
    fusion_score: float

@router.get("/search/multimodal", response_model=List[ProductResponse])
async def search_multimodal(
    query: str = Query(..., description="Câu lệnh tìm kiếm của người dùng"),
    alpha: float = Query(0.5, ge=0.0, le=1.0, description="Trọng số ưu tiên Text (1.0 = Chỉ chữ, 0.0 = Chỉ ảnh)"),
    limit: int = Query(10, ge=1, le=50, description="Số lượng kết quả trả về")
):
    try:
        # 1. Mã hóa câu lệnh tìm kiếm thành Vector bằng CLIP
        with torch.no_grad():
            inputs = processor(text=[query], return_tensors="pt", padding=True, truncation=True).to(device)
           
            text_outputs = model.text_model(
                input_ids=inputs["input_ids"],
                attention_mask=inputs["attention_mask"]
            )

            query_features = model.text_projection(text_outputs.pooler_output)
            
            # Chuẩn hóa L2
            query_features = F.normalize(query_features, p=2, dim=1)
            query_vector = query_features.cpu().numpy()[0].tolist()

        # 2. Gọi hàm RPC trên Supabase
        response = supabase.rpc(
            "search_products_multimodal",
            {
                "query_vector": query_vector,
                "alpha": alpha,
                "match_limit": limit
            }
        ).execute()

        # 3. Trả về kết quả
        return response.data

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Lỗi hệ thống: {str(e)}")