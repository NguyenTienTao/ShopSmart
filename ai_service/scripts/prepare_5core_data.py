from datasets import load_dataset
import pandas as pd
import numpy as np
import uuid
import json

def filter_k_core(df, user_col, item_col, k=5):
    print(f"Bắt đầu lọc {k}-Core...")
    iteration = 1
    while True:
        start_len = len(df)
        
        # 1. Lọc Item
        item_counts = df[item_col].value_counts()
        valid_items = item_counts[item_counts >= k].index
        df = df[df[item_col].isin(valid_items)]
        
        # 2. Lọc User
        user_counts = df[user_col].value_counts()
        valid_users = user_counts[user_counts >= k].index
        df = df[df[user_col].isin(valid_users)]
        
        print(f"  Vòng lặp {iteration}: Còn lại {len(df)} tương tác")
        if len(df) == start_len:
            break
        iteration += 1
    return df

def generate_uuid_from_asin(asin):
    return str(uuid.uuid5(uuid.NAMESPACE_DNS, str(asin)))

def clean_json_column(val):
    # 1. Kiểm tra None an toàn
    if val is None:
        return None
        
    # 2. Chỉ dùng pd.isna nếu giá trị là số (float), né mảng numpy ra để không bị lỗi
    if isinstance(val, float) and pd.isna(val):
        return None
        
    try:
        # 3. Nếu là List, Dict, hoặc NumPy Array thì ép về chuỗi JSON chuẩn
        if isinstance(val, (list, dict, np.ndarray)):
            if isinstance(val, np.ndarray):
                val = val.tolist()
            return json.dumps(val)
            
        # 4. Ép các giá trị còn lại về chuỗi văn bản cho an toàn
        return str(val)
    except Exception as e:
        return None

# ==========================================
# CÁC HÀM XỬ LÝ ĐẶC TRỊ CHO HUGGING FACE
# ==========================================
def has_valid_image(x):
    """Bắt đúng cấu trúc Dict của Hugging Face"""
    try:
        if isinstance(x, dict):
            # Kiểm tra xem có chứa key 'large' hoặc 'hi_res' không
            for key in ['large', 'hi_res', 'thumb']:
                if key in x and len(x[key]) > 0:
                    return True
        elif isinstance(x, (list, np.ndarray)) and len(x) > 0:
            return True
        elif isinstance(x, str) and len(x) > 10:
            return True
        return False
    except:
        return False

def format_hf_images(x):
    """Biến đổi {'large': ['url1']} ngược lại thành [{'large': 'url1'}] chuẩn Supabase"""
    if pd.isna(x) or x is None:
        return None
    try:
        if isinstance(x, dict):
            keys = list(x.keys())
            if not keys: return None
            
            # Lấy độ dài của mảng bên trong
            length = len(x[keys[0]])
            if length == 0: return None
            
            result = []
            for i in range(length):
                item = {}
                for k in keys:
                    # Rút từng phần tử ra gom lại thành object
                    val = x[k][i] if i < len(x[k]) else None
                    if isinstance(val, np.ndarray):
                        val = val.tolist()
                    item[k] = val
                result.append(item)
            return json.dumps(result)
        
        # Nếu đã là list chuẩn thì chỉ cần dump
        elif isinstance(x, (list, np.ndarray)):
            if isinstance(x, np.ndarray):
                x = x.tolist()
            return json.dumps(x)
        return str(x)
    except Exception as e:
        return None

def main():
    print("Đang tải dữ liệu Musical Instruments từ Amazon Reviews 2023...")
    reviews_ds = load_dataset("McAuley-Lab/Amazon-Reviews-2023", "raw_review_Musical_Instruments", split="full", trust_remote_code=True)
    meta_ds = load_dataset("McAuley-Lab/Amazon-Reviews-2023", "raw_meta_Musical_Instruments", split="full", trust_remote_code=True)

    df_reviews = reviews_ds.to_pandas()
    df_meta = meta_ds.to_pandas()

    print(f"\n1. Số lượng review ban đầu: {len(df_reviews)}")
    print(f"1. Số lượng sản phẩm ban đầu: {len(df_meta)}")

    # Bước 1: Chạy 5-Core
    df_reviews_5core = filter_k_core(df_reviews, user_col='user_id', item_col='parent_asin', k=5)
    valid_5core_items = df_reviews_5core['parent_asin'].unique()
    df_meta_5core = df_meta[df_meta['parent_asin'].isin(valid_5core_items)].copy()
    print(f"\n2. [SAU 5-CORE] Số lượng sản phẩm còn lại: {len(df_meta_5core)}")

    # Bước 2: Lọc Multimodal (Giữ lại hàng có ảnh)
    print("\nĐang loại bỏ các sản phẩm thiếu Ảnh/Văn bản...")
    df_meta_5core = df_meta_5core[df_meta_5core['images'].apply(has_valid_image)]
    df_meta_5core['title'] = df_meta_5core['title'].fillna("")
    df_meta_5core = df_meta_5core[df_meta_5core['title'].str.strip() != ""]
    print(f"3. [CHỐT HẠ] Số lượng sản phẩm Multimodal 5-Core: {len(df_meta_5core)}")

    # Bước 3: Định dạng cho Supabase
    print("\nĐang định dạng lại dữ liệu khớp với bảng 'products'...")
    supabase_df = pd.DataFrame()
    
    supabase_df['id'] = df_meta_5core['parent_asin'].apply(generate_uuid_from_asin)
    supabase_df['title'] = df_meta_5core['title']
    supabase_df['price'] = pd.to_numeric(df_meta_5core['price'], errors='coerce').fillna(0)
    supabase_df['average_rating'] = df_meta_5core['average_rating']
    supabase_df['rating_number'] = df_meta_5core['rating_number']
    supabase_df['store'] = df_meta_5core['store']
    
    # Ép chuẩn JSON
    supabase_df['description'] = df_meta_5core['description'].apply(clean_json_column)
    supabase_df['categories'] = df_meta_5core['categories'].apply(clean_json_column)
    supabase_df['features'] = df_meta_5core['features'].apply(clean_json_column)
    supabase_df['details'] = df_meta_5core['details'].apply(clean_json_column)
    
    # Dùng hàm dịch ngược ĐẶC BIỆT cho cột Ảnh
    supabase_df['images'] = df_meta_5core['images'].apply(format_hf_images)

    supabase_df['stock'] = 100
    supabase_df['subtitle'] = None
    supabase_df['author'] = None
    supabase_df['category_id'] = '3d04ab79-cd4c-4312-b666-dbc37a412f50'

    output_file = "data/supabase_products_musical_5core.csv"
    supabase_df.to_csv(output_file, index=False)
    
    print(f"\nHoàn tất! Đã lưu file sẵn sàng import tại: {output_file}")

if __name__ == "__main__":
    main()