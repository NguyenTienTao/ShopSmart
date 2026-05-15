# ShopSmart: Hệ Thống Web App TMĐT Thông Minh với Multimodal Recommendation

[![Python](https://img.shields.io/badge/Python-3.10+-blue.svg)](https://www.python.org/)
[![React](https://img.shields.io/badge/React-18.x-61dafb.svg)](https://reactjs.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-v0.100+-009688.svg)](https://fastapi.tiangolo.com/)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-3ecf8e.svg)](https://supabase.com/)

**ShopSmart** là một nền tảng thương mại điện tử chuyên biệt cho nhạc cụ, được phát triển trong khuôn khổ Khóa luận tốt nghiệp. Hệ thống tích hợp mô hình **Multimodal LightGCN** nhằm tối ưu hóa trải nghiệm cá nhân hóa bằng cách kết hợp hành vi người dùng với đặc trưng hình ảnh và văn bản của sản phẩm.

---

## ✨ Tính năng nổi bật

- **Gợi ý đa phương thức (Multimodal Recs):** Sử dụng mạng nơ-ron đồ thị để kết hợp tín hiệu tương tác (ID) với đặc trưng từ **CLIP (OpenAI)**.
- **Tìm kiếm ngữ nghĩa (Semantic Search):** Tìm kiếm sản phẩm thông minh dựa trên độ tương đồng vector thông qua **pgvector**.
- **Dung hợp trọng số học được:** Tự động điều chỉnh tỷ lệ ảnh hưởng của Hình ảnh/Văn bản cho từng loại nhạc cụ.
- **Thông báo thời gian thực:** Cập nhật trạng thái đơn hàng và tương tác người dùng qua **Supabase Realtime**.
- **Quản lý TMĐT toàn diện:** Luồng nghiệp vụ từ xem sản phẩm, giỏ hàng đến thanh toán và lịch sử mua hàng.

---

## 🏗️ Kiến trúc Hệ thống

Hệ thống được thiết kế theo kiến trúc phân tầng hiện đại:

- **Frontend:** ReactJS, Redux Toolkit, Tailwind CSS, Ant Design.
- **Backend API:** FastAPI (Python), xử lý logic AI và nghiệp vụ.
- **Database:** PostgreSQL (Supabase) + tiện ích mở rộng **pgvector**.
- **AI Core:**
    - **CLIP:** Trích xuất đặc trưng (Embeddings) từ Hình ảnh và Mô tả sản phẩm.
    - **LightGCN:** Thực hiện lan truyền tin nhắn (Message Passing) trên đồ thị hai phía User-Item.

---

## 🔬 Kết quả Thực nghiệm

Mô hình được đánh giá trên tập dữ liệu **Amazon Reviews 2023 (Musical Instruments)**:

| Chỉ số         | Kết quả (K=20)                   |
| :------------- | :------------------------------- |
| **Recall@20**  | **0.0898** (Xấp xỉ 9%)           |
| **NDCG@20**    | **0.0467**                       |
| **Best Epoch** | **185** (Sử dụng Early Stopping) |

**Đóng góp chính:** Cơ chế **Learnable Weights** kết hợp với **Dropout (p=0.3)** đã giúp cải thiện hiệu suất thêm **3.3%** so với phương pháp cộng tuyến tính thông thường, đồng thời giải quyết tốt bài toán **Cold-start** và **Semantic Gap**.

---

## 💻 Cài đặt & Khởi chạy

### 1. Yêu cầu hệ thống

- Python 3.10+
- Node.js 16+
- Tài khoản Supabase (đã kích hoạt pgvector)

### 2. Cài đặt backend chạy API Recommend

```bash
cd ai_service
pip install -r requirements.txt
# Tạo file .env và cấu hình SUPABASE_URL, SUPABASE_KEY
uvicorn app.main:app --reload
```

### 3. Cài đặt Frontend

```bash
cd client
npm install
npm run dev
```

---

## 📂 Cấu trúc thư mục

```bash
|
|---admin/
|   |---src/
│   │   |---components/        # Các component
│   │   |---layouts/           # Layout của trang (header, footer, ...)
│   │   |---pages/             # Các pages (dashboard, orders, products)
|   |   |---services/          # Chứa kết nối với Supabase
|   |   |---store/             # Chứa các state được quản lý bởi redux
|   |   |---main.jsx
|   |   |---...
│   |---index.html
|   |---package.json
|   |---...
│
|---client/
│   ├── src/
│   │   |---src/
│   │   |---components/        # Các component
│   │   |---layouts/           # Layout của trang (header, footer, ...)
│   │   |---pages/             # Các pages (CartPage, ProductDetail, HomePage, ...)
|   |   |---services/          # Chứa kết nối với Supabase, call API
|   |   |---store/             # Chứa các state được quản lý bởi redux
|   |   |---main.jsx
|   |   |---...
|   |---...
|
|---ai_service
|   |---app/
|   |   |---api/               # Các endpoint fastapi
|   |   |---models/            # Kiến trúc Multimodal LightGCN
|   |   |---utils/             # Các file tiền xử lý dữ liệu
|   |   |---...
|   |---data/                  # Lưu trữ các dữ liệu
|   |---scripts/               # Các file chạy offline khi huấn luyện mô hình
|   |---...
|---...
```

---

## 🧠 Công nghệ sử dụng

| Thành phần    | Công nghệ                                       |
| ------------- | ----------------------------------------------- |
| Frontend      | ReactJS, Redux Toolkit, TailwindCSS, Ant Design |
| Backend       | FastAPI, Python                                 |
| Database      | PostgreSQL, Supabase                            |
| AI/ML         | PyTorch, LightGCN, CLIP                         |
| Vector Search | pgvector                                        |
| Realtime      | Supabase Realtime                               |

---

## 👤 Thông tin Tác giả

Sinh viên: Nguyễn Tiến Tạo
Khoa Khoa học Máy tính — Trường Đại học Công nghệ, ĐHQGHN

Giảng viên hướng dẫn: ThS. Lê Minh Khôi
