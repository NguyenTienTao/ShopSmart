import pandas as pd
from sklearn.model_selection import train_test_split
import os

def split_interaction_data():
    # 1. Đường dẫn tới file review ĐỊNH DẠNG PARQUET của bạn
    # Đổi lại tên file này cho khớp nhé
    review_file = "data/musical_instruments_reviews_5core.parquet" 
    
    if not os.path.exists(review_file):
        print(f"❌ Không tìm thấy file: {review_file}")
        return

    print("📦 Đang đọc dữ liệu Review (từ định dạng siêu tốc Parquet)...")
    # SỬA Ở ĐÂY: Dùng read_parquet thay vì read_csv
    df = pd.read_parquet(review_file)

    # 2. Rút trích đúng 2 cột làm đỉnh của đồ thị (Người dùng và Sản phẩm)
    # Đổi tên 'parent_asin' thành 'product_id'
    interaction_df = df[['user_id', 'parent_asin']].rename(columns={
        'parent_asin': 'product_id'
    })
    
    # Xóa các dòng trùng lặp
    interaction_df = interaction_df.drop_duplicates()
    
    print(f"✅ Đã trích xuất được {len(interaction_df)} lượt tương tác User-Item duy nhất.")

    # 3. Chia 80% Train (Để học) - 20% Test (Để thi sát hạch)
    print("✂️ Đang chia dữ liệu (80% Train, 20% Test)...")
    train_df, test_df = train_test_split(interaction_df, test_size=0.2, random_state=42)

    # 4. Vẫn xuất ra đuôi .csv để cho file train_model.py đọc bình thường
    os.makedirs("data", exist_ok=True)
    train_df.to_csv("data/train_5core.csv", index=False)
    test_df.to_csv("data/test_5core.csv", index=False)
    
    print("🎉 CHIA DỮ LIỆU THÀNH CÔNG!")
    print(f"📚 Tập Train (Dạy AI): {len(train_df)} dòng -> Lưu tại data/train_5core.csv")
    print(f"🎯 Tập Test (Chấm điểm): {len(test_df)} dòng -> Lưu tại data/test_5core.csv")

if __name__ == "__main__":
    split_interaction_data()