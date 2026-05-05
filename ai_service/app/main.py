from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware # Bước 1: Import middleware
from app.api.router import api_router
import uvicorn

app = FastAPI(
    title="ShopSmart AI Backend",
    description="Hệ thống Gợi ý Đa phương thức và Chatbot RAG",
    version="1.0.0"
)

# Bước 2: Cấu hình danh sách các nguồn được phép truy cập (CORS)
# Cổng 5173 là cổng mặc định của Vite/React
origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:3000", # Dự phòng nếu bạn dùng Create React App cũ
]

# Bước 3: Thêm Middleware vào app
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,            # Cho phép các nguồn trong danh sách
    allow_credentials=True,
    allow_methods=["*"],              # Cho phép tất cả các phương thức GET, POST, PUT...
    allow_headers=["*"],              # Cho phép tất cả các headers
)

# Nạp tất cả các router vào ứng dụng chính
# Lưu ý: Nếu bạn muốn API có tiền tố /api/v1 thì thêm prefix vào đây
app.include_router(api_router, prefix="/api/v1")

@app.get("/")
def read_root():
    return {"message": "Server AI ShopSmart đang hoạt động 🚀"}

if __name__ == "__main__":
    # Chạy từ thư mục gốc của ai_service
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)