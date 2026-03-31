from datasets import load_dataset
import pandas as pd
import os

# ==========================================
# 1. Tải dữ liệu từ Hugging Face
# ==========================================
domain = "Musical_Instruments"

print(f"Đang tải tập Reviews cho {domain}...")
# Sử dụng split="full" theo cấu trúc của dataset McAuley-Lab
dataset_reviews = load_dataset("McAuley-Lab/Amazon-Reviews-2023", f"raw_review_{domain}", split="full", trust_remote_code=True)
df_reviews = dataset_reviews.to_pandas()

print(f"Đang tải tập Metadata cho {domain}...")
dataset_meta = load_dataset("McAuley-Lab/Amazon-Reviews-2023", f"raw_meta_{domain}", split="full", trust_remote_code=True)
df_meta = dataset_meta.to_pandas()

# ==========================================
# 2. Thực hiện lọc 5-core cho ma trận tương tác
# ==========================================
print(f"\nKích thước tập Reviews ban đầu: {len(df_reviews)} tương tác")

def filter_k_core(df, user_col, item_col, k=5):
    """
    Lọc k-core lặp đi lặp lại. Khi loại bỏ User < 5 tương tác, 
    có thể làm một số Item rớt xuống < 5 tương tác. 
    Do đó cần lặp lại cho đến khi cả ma trận đều đạt chuẩn.
    """
    while True:
        start_len = len(df)
        
        # Bước 1: Lọc giữ lại các Item có >= k tương tác
        item_counts = df[item_col].value_counts()
        valid_items = item_counts[item_counts >= k].index
        df = df[df[item_col].isin(valid_items)]
        
        # Bước 2: Lọc giữ lại các User có >= k tương tác
        user_counts = df[user_col].value_counts()
        valid_users = user_counts[user_counts >= k].index
        df = df[df[user_col].isin(valid_users)]
        
        # Nếu số lượng dòng không đổi nữa tức là ma trận đã ổn định
        if len(df) == start_len:
            break
            
    return df

df_reviews_5core = filter_k_core(df_reviews, user_col='user_id', item_col='parent_asin', k=5)
print(f"Kích thước tập Reviews sau khi lọc 5-core: {len(df_reviews_5core)} tương tác")

# ==========================================
# 3. Đồng bộ hóa tập Metadata
# ==========================================
# Chỉ giữ lại thông tin của những sản phẩm (Item) còn tồn tại trong tập Reviews 5-core
valid_item_ids = df_reviews_5core['parent_asin'].unique()
df_meta_filtered = df_meta[df_meta['parent_asin'].isin(valid_item_ids)]
print(f"Kích thước tập Metadata sau khi đồng bộ: {len(df_meta_filtered)} sản phẩm")

# ==========================================
# 4. Lưu ra định dạng Parquet
# ==========================================
# Chọn lọc các cột cần thiết cho bảng Reviews để tối ưu dung lượng
df_reviews_final = df_reviews_5core[['user_id', 'parent_asin', 'rating', 'timestamp']]

# Khai báo đường dẫn thư mục đích
output_dir = 'data/processed'

print(f"\nĐang lưu file vào thư mục {output_dir}...")

# Cập nhật đường dẫn lưu file
df_reviews_final.to_parquet(os.path.join(output_dir, 'musical_instruments_reviews_5core.parquet'), index=False)
df_meta_filtered.to_parquet(os.path.join(output_dir, 'musical_instruments_meta_filtered.parquet'), index=False)

print("Hoàn tất Bước 1!")