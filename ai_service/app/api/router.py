from fastapi import APIRouter
from app.api.endpoints import recommend
# from app.api.endpoints import chat  <-- (Tạm thời comment lại, sau này bạn chuyển file chat xong thì mở ra nhé)

api_router = APIRouter()

# Đăng ký API Recommend
api_router.include_router(recommend.router, tags=["Multimodal Recommendation"])

# Đăng ký API Chatbot (Bỏ comment sau)
# api_router.include_router(chat.router, tags=["AI Chatbot"])