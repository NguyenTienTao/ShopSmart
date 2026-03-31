import pandas as pd
from supabase import create_client, Client
import os
from dotenv import load_dotenv
import math
import numpy as np
import json  # <--- Khai báo thêm thư viện json

# 1. Nạp biến môi trường từ file .env
load_dotenv()
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")

if not SUPABASE_URL or not SUPABASE_KEY:
    raise ValueError("Thiếu cấu hình SUPABASE_URL hoặc SUPABASE_KEY trong file .env")

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

def parse_json_safely(val):
    """Hàm biến chuỗi Text từ CSV ngược lại thành Array/Object thật của Python"""
    if pd.isna(val) or val is None:
        return None
    if isinstance(val, str):
        try:
            return json.loads(val)  # Mở khóa chuỗi thành JSON thật
        except:
            return val
    return val

def main():
    csv_file = "data/supabase_products_musical_5core.csv"
    print(f"Đang đọc file {csv_file}...")
    
    # Đọc file CSV
    df = pd.read_csv(csv_file)
    initial_len = len(df)
    
    # 2. DỌN DẸP RÁC
    df = df.drop_duplicates(subset=['id'], keep='first')
    print(f"Đã xóa {initial_len - len(df)} dòng bị trùng lặp trong CSV.")
    
    # Xử lý các giá trị NaN/NaT
    df = df.replace({np.nan: None})

    # ==========================================
    # BƯỚC GIẢI MÃ JSON (MỚI THÊM VÀO)
    # ==========================================
    print("Đang giải mã các cột JSON để trả về nguyên trạng...")
    json_cols = ['description', 'categories', 'features', 'images', 'details']
    for col in json_cols:
        if col in df.columns:
            df[col] = df[col].apply(parse_json_safely)
    # ==========================================

    # 3. CHIA NHỎ ĐỂ ĐẨY LÊN (BATCH PROCESSING)
    batch_size = 500
    total_batches = math.ceil(len(df) / batch_size)

    print(f"\nBắt đầu quá trình Upsert {len(df)} sản phẩm lên Supabase...")
    
    for i in range(total_batches):
        start_idx = i * batch_size
        end_idx = start_idx + batch_size
        
        batch_df = df.iloc[start_idx:end_idx]
        records = batch_df.to_dict(orient="records")
        
        try:
            response = supabase.table("products").upsert(records).execute()
            print(f"  -> Đã đẩy thành công Batch {i+1}/{total_batches} (Sản phẩm {start_idx} đến {end_idx-1})")
        except Exception as e:
            print(f"  [LỖI] Batch {i+1} gặp sự cố: {e}")
            
    print("\n🎉 Hoàn tất toàn bộ quá trình tải dữ liệu chuẩn JSONB!")

if __name__ == "__main__":
    main()