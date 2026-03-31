import os
from supabase import create_client, Client
from dotenv import load_dotenv

# Nạp biến môi trường từ file .env
load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")

if not SUPABASE_URL or not SUPABASE_KEY:
    raise ValueError("Thiếu cấu hình SUPABASE_URL hoặc SUPABASE_KEY trong file .env")

# Khởi tạo instance dùng chung
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)