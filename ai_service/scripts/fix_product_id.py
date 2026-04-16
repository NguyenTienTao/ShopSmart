import pandas as pd

def fix_missing_asin_with_parquet():
    print("🚀 BƯỚC 1: ĐỌC DỮ LIỆU TỪ PARQUET VÀ CSV")
    
    # 1. Đường dẫn file Supabase của bạn (đang bị thiếu parent_asin)
    supabase_file = "data/supabase_products_musical_5core.csv" 
    
    # 2. Đường dẫn file Parquet đã lọc của bạn
    # Sửa lại tên file và đường dẫn cho đúng với máy của bạn nhé
    parquet_meta_file = "data/musical_instruments_meta_filtered.parquet" 
    
    try:
        # Đọc file Supabase
        df_supabase = pd.read_csv(supabase_file)
        print(f"✅ Đã đọc file Supabase: {len(df_supabase)} dòng.")

        # Đọc file Parquet
        df_meta = pd.read_parquet(parquet_meta_file)
        print(f"✅ Đã đọc file Meta Parquet: {len(df_meta)} dòng.")
        
    except FileNotFoundError as e:
        print(f"❌ Lỗi: Không tìm thấy file. Chi tiết: {e}")
        return
    except ImportError:
        print("❌ Lỗi: Thiếu thư viện đọc Parquet. Hãy gõ lệnh này vào Terminal:")
        print("pip install pyarrow fastparquet")
        return

    print("\n🧠 BƯỚC 2: THỰC HIỆN GHÉP NỐI (MERGE)")
    # Trích xuất 2 cột từ file Parquet để làm cầu nối
    df_bridge = df_meta[['title', 'parent_asin']].drop_duplicates(subset=['title'])
    
    # Thực hiện ghép (Left Join) dựa trên sự trùng khớp của cột 'title'
    df_fixed = pd.merge(df_supabase, df_bridge, on='title', how='left')

    # Kiểm tra xem có bao nhiêu sản phẩm không tìm thấy parent_asin
    missing_count = df_fixed['parent_asin'].isna().sum()
    
    print("\n✅ BƯỚC 3: LƯU KẾT QUẢ")
    # Lưu ra một file mới hoàn chỉnh
    fixed_file_name = "data/supabase_products_FIXED.csv"
    df_fixed.to_csv(fixed_file_name, index=False)
    
    print(f"🎉 TẠO FILE THÀNH CÔNG: {fixed_file_name}")
    print(f"⚠️ Có {missing_count} sản phẩm không map được mã.")

if __name__ == "__main__":
    fix_missing_asin_with_parquet()