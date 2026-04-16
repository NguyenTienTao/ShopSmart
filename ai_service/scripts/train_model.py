import pandas as pd
import torch
import os

# --- Triệu hồi các "vũ khí" từ các file Phụ lục ---
from app.utils.graph_builder import build_sparse_adj_matrix
from app.models.multimodal_gcn import MultimodalLightGCN
from app.utils.trainer import train_lightgcn

def main():
    print("🚀 BƯỚC 1: TẢI VÀ CHUẨN BỊ DỮ LIỆU")
    # Thay đổi đường dẫn này trỏ tới đúng file CSV đồ án của bạn
    train_path = "data/train_5core.csv"
    test_path = "data/test_5core.csv"
    
    if not os.path.exists(train_path) or not os.path.exists(test_path):
        print("❌ Lỗi: Không tìm thấy file dữ liệu. Vui lòng kiểm tra lại đường dẫn!")
        return

    df_train = pd.read_csv(train_path)
    df_test = pd.read_csv(test_path)

    print("🧠 BƯỚC 2: ÁNH XẠ DỮ LIỆU (MAPPING STRING -> INTEGER)")
    # Gộp chung train và test lại để tạo danh sách ID tổng quát nhất
    all_users = pd.concat([df_train['user_id'], df_test['user_id']]).astype('category')
    all_items = pd.concat([df_train['product_id'], df_test['product_id']]).astype('category')
    
    # Ép ID (từ chuỗi UUID/ASIN) về dạng số nguyên (0, 1, 2...)
    df_train['user_idx'] = pd.Categorical(df_train['user_id'], categories=all_users.cat.categories).codes
    df_train['item_idx'] = pd.Categorical(df_train['product_id'], categories=all_items.cat.categories).codes
    
    df_test['user_idx'] = pd.Categorical(df_test['user_id'], categories=all_users.cat.categories).codes
    df_test['item_idx'] = pd.Categorical(df_test['product_id'], categories=all_items.cat.categories).codes

    num_users = len(all_users.cat.categories)
    num_items = len(all_items.cat.categories)
    print(f"✅ Đã ánh xạ xong: {num_users} Users và {num_items} Items.")

    print("📚 BƯỚC 3: TẠO TỪ ĐIỂN MASKING & ĐÁP ÁN (GROUND TRUTH)")
    # Tạo test_data_dict và train_data_dict [cite: 646, 647]
    train_dict = df_train.groupby('user_idx')['item_idx'].apply(list).to_dict()
    test_dict = df_test.groupby('user_idx')['item_idx'].apply(list).to_dict()

    print("🕸️ BƯỚC 4: XÂY DỰNG ĐỒ THỊ VÀ CHUẨN HÓA MA TRẬN KỀ")
    adj_matrix = build_sparse_adj_matrix(df_train, num_users, num_items)

    print("🤖 BƯỚC 5: KHỞI TẠO MÔ HÌNH LIGHTGCN ĐA PHƯƠNG THỨC")
    # Ở đồ án thực tế, bạn sẽ load 2 ma trận đặc trưng từ Supabase hoặc file Numpy offline
    # Tạm thời dùng vector ngẫu nhiên để test luồng chạy không bị lỗi
    dummy_text_feats = torch.randn(num_items, 512) 
    dummy_image_feats = torch.randn(num_items, 512)
    
    model = MultimodalLightGCN(
        num_users=num_users, 
        num_items=num_items, 
        embedding_dim=64, 
        text_feats=dummy_text_feats, 
        image_feats=dummy_image_feats
    )

    print("🔥 BƯỚC 6: BẮT ĐẦU KHÂU HUẤN LUYỆN (TRAINING)")
    # Truyền luôn train_dict và test_dict vào để hàm train tự động gọi hàm Đánh giá
    model = train_lightgcn(
        model=model,
        df_train=df_train,
        adj_matrix=adj_matrix,
        num_items=num_items,
        train_dict=train_dict,  # Truyền từ điển Masking
        test_dict=test_dict,    # Truyền từ điển Test
        epochs=250,
        batch_size=2048,
        lr=0.001
    )

if __name__ == "__main__":
    main()