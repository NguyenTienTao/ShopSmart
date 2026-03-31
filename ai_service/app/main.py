from fastapi import FastAPI
from app.api.router import api_router
import uvicorn

app = FastAPI(
    title="ShopSmart AI Backend",
    description="Hệ thống Gợi ý Đa phương thức và Chatbot RAG",
    version="1.0.0"
)

# Nạp tất cả các router vào ứng dụng chính
app.include_router(api_router)

@app.get("/")
def read_root():
    return {"message": "Server AI ShopSmart đang hoạt động 🚀"}

if __name__ == "__main__":
    # Lệnh này cho phép bạn chạy file main.py trực tiếp
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)