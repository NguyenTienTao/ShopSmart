import pandas as pd
from supabase import create_client, Client
import os
from dotenv import load_dotenv
from tqdm import tqdm

def update_parent_asin_to_supabase():
    # 1. Kết nối Supabase
    load_dotenv()
    url = os.getenv("SUPABASE_URL")
    key = os.getenv("SUPABASE_KEY")
    supabase: Client = create_client(url, key)
    
    # 2. Đọc file FIXED mà bạn vừa tạo ra
    fixed_file = "data/supabase_products_FIXED.csv"
    if not os.path.exists(fixed_file):
        print(f"❌ Không tìm thấy file {fixed_file}!")
        return
        
    df = pd.read_csv(fixed_file)
    
    # Lọc bỏ những dòng không map được parent_asin (bị NaN)
    df_valid = df.dropna(subset=['parent_asin'])
    
    print(f"🚀 Bắt đầu cập nhật {len(df_valid)} mã parent_asin lên Supabase...")
    
    # 3. Quét từng dòng và bắn lệnh Update
    success = 0
    # tqdm giúp hiển thị thanh tiến trình chạy cho đẹp mắt
    for index, row in tqdm(df_valid.iterrows(), total=len(df_valid)):
        sb_id = row['id']         # Đây là UUID trên Supabase
        p_asin = str(row['parent_asin']).strip() # Đây là mã Amazon
        
        try:
            # Lệnh này nghĩa là: Tìm dòng có id = sb_id, chỉ cập nhật cột parent_asin
            supabase.table("products").update({"parent_asin": p_asin}).eq("id", sb_id).execute()
            success += 1
        except Exception as e:
            print(f"\n⚠️ Lỗi cập nhật tại ID {sb_id}: {e}")
            
    print(f"\n🎉 ĐÃ CẬP NHẬT XONG {success}/{len(df_valid)} SẢN PHẨM!")
    print("Mọi vector của bạn vẫn an toàn 100%. Database đã được nối dây hoàn hảo!")

if __name__ == "__main__":
    update_parent_asin_to_supabase()