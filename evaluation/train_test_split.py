import pandas as pd
import os

# ==========================================
# 1. Đọc dữ liệu đã làm sạch từ Bước 1
# ==========================================
input_path = 'data/processed/musical_instruments_reviews_5core.parquet'

print(f"Đang đọc dữ liệu từ {input_path}...")
df = pd.read_parquet(input_path)
print(f"Tổng số lượng tương tác hiện có: {len(df)}")

# ==========================================
# 2. Sắp xếp và Gắn nhãn thứ tự (Ranking)
# ==========================================
# Sắp xếp theo user_id, và theo timestamp tăng dần (cũ đến mới)
df = df.sort_values(by=['user_id', 'timestamp'])

# Tạo một cột đánh số thứ tự ngược từ mới nhất về cũ nhất cho từng User
# Dòng mới nhất = 1 (Test), áp chót = 2 (Validation), còn lại >= 3 (Train)
df['reverse_rank'] = df.groupby('user_id').cumcount(ascending=False) + 1

# ==========================================
# 3. Phân chia Train / Validation / Test theo LOO
# ==========================================
print("\nĐang phân chia dữ liệu theo chiến lược Leave-One-Out (LOO)...")

# Test set: Lấy tương tác cuối cùng (rank == 1)
df_test = df[df['reverse_rank'] == 1].drop(columns=['reverse_rank'])

# Validation set: Lấy tương tác áp chót (rank == 2)
df_val = df[df['reverse_rank'] == 2].drop(columns=['reverse_rank'])

# Train set: Lấy tất cả tương tác còn lại trước đó (rank >= 3)
df_train = df[df['reverse_rank'] >= 3].drop(columns=['reverse_rank'])

print(f"Kích thước tập Train: {len(df_train)} dòng")
print(f"Kích thước tập Validation: {len(df_val)} dòng")
print(f"Kích thước tập Test: {len(df_test)} dòng")

# ==========================================
# 4. Lưu kết quả ra file Parquet
# ==========================================
output_dir = 'data/processed'

print(f"\nĐang lưu 3 tệp dữ liệu vào thư mục '{output_dir}'...")
df_train.to_parquet(os.path.join(output_dir, 'train_loo.parquet'), index=False)
df_val.to_parquet(os.path.join(output_dir, 'val_loo.parquet'), index=False)
df_test.to_parquet(os.path.join(output_dir, 'test_loo.parquet'), index=False)

print("Hoàn tất Bước 2!")