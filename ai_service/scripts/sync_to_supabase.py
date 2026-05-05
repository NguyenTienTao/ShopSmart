import numpy as np
import pandas as pd
import os
import time
from supabase import create_client, Client
from dotenv import load_dotenv

# Nạp biến môi trường
load_dotenv()
url = os.getenv("SUPABASE_URL")
key = os.getenv("SUPABASE_KEY")
supabase: Client = create_client(url, key)

def sync_vector_to_supabase():
    print("🚀 BẮT ĐẦU ĐỒNG BỘ VECTOR HỘI TỤ (64-DIM) LÊN SUPABASE")
    
    # 1. Nạp dữ liệu từ file đã export ở Bước 1
    # File này chứa tri thức đã học từ Text, Image và Graph tại Epoch 185
    try:
        items_np = np.load('exports/items_emb_final.npy')
        print(f"✅ Đã nạp file vector. Kích thước: {items_np.shape}")
    except FileNotFoundError:
        print("❌ Lỗi: Không tìm thấy file 'exports/items_emb_final.npy'. Hãy chạy Bước 1 trước!")
        return

    # 2. Chuẩn bị danh sách ID để ánh xạ y hệt như lúc huấn luyện
    df_train = pd.read_csv("data/train_5core.csv")
    df_test = pd.read_csv("data/test_5core.csv")
    all_items = pd.concat([df_train['product_id'], df_test['product_id']]).astype('category')
    asin_list = all_items.cat.categories.tolist()

    # 3. CẤU HÌNH ĐIỂM BẮT ĐẦU (OFFSET)
    # Thay số 9900 bằng con số cuối cùng bạn thấy trên màn hình trước khi lỗi
    start_index = 19880 
    batch_size = 20  # Giữ batch nhỏ để ổn định kết nối
    
    total_items = len(asin_list)
    print(f"🔄 Sẽ bắt đầu cập nhật từ sản phẩm thứ {start_index} đến {total_items}...")

    # 4. Vòng lặp cập nhật (UPSERT)
    for i in range(start_index, total_items, batch_size):
        batch_end = min(i + batch_size, total_items)
        
        try:
            # Chạy từng sản phẩm trong batch để đảm bảo an toàn dữ liệu
            for j in range(i, batch_end):
                asin = asin_list[j]
                # Lấy vector 64 chiều đã được tối ưu hóa
                vector_64 = items_np[j].tolist()
                
                # Thực hiện cập nhật vào cột embedding (đã được ALTER sang 64 chiều)
                supabase.table('products').update({
                    'embedding': vector_64 
                }).eq('parent_asin', asin).execute()
            
            print(f"✅ Đã hoàn thành batch: {i} -> {batch_end} / {total_items}")
            
            # Nghỉ ngắn giữa các batch để tránh RemoteProtocolError
            time.sleep(0.4) 
            
        except Exception as e:
            print(f"⚠️ Gặp sự cố tại vị trí {i}. Lỗi: {e}")
            print(f"💡 Lời khuyên: Hãy dừng script, kiểm tra mạng và sửa start_index = {i} rồi chạy lại.")
            break 

    print("🎉 QUÁ TRÌNH ĐỒNG BỘ HOÀN TẤT!")

if __name__ == "__main__":
    sync_vector_to_supabase()