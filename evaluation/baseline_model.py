import pandas as pd
import numpy as np
import math
import os
from sentence_transformers import SentenceTransformer
from sklearn.metrics.pairwise import cosine_similarity

# ==========================================
# 1. KHỞI TẠO MÔ HÌNH VÀ TẢI DỮ LIỆU
# ==========================================
print("="*50)
print("BƯỚC 1: KHỞI TẠO VÀ ĐỌC DỮ LIỆU")
print("="*50)

print("Đang tải mô hình AI (Sentence-Transformers)...")
model = SentenceTransformer('all-MiniLM-L6-v2') 

print("Đang đọc dữ liệu Train, Test và Metadata...")
df_train = pd.read_parquet('data/processed/train_loo.parquet')
df_test = pd.read_parquet('data/processed/test_loo.parquet')
df_meta = pd.read_parquet('data/processed/musical_instruments_meta_filtered.parquet')

# ==========================================
# 2. TIỀN XỬ LÝ VĂN BẢN SẢN PHẨM
# ==========================================
print("\n" + "="*50)
print("BƯỚC 2: TIỀN XỬ LÝ VĂN BẢN")
print("="*50)

def clean_and_join(x):
    """Xử lý mảng (list/numpy array) thành chuỗi và loại bỏ giá trị rỗng"""
    # 1. Nếu dữ liệu là mảng (list, numpy array, hoặc tuple)
    if isinstance(x, (list, np.ndarray, tuple)):
        return " ".join([str(item) for item in x if item])
    
    # 2. Xử lý giá trị rỗng một cách an toàn
    try:
        if pd.isna(x):
            return ""
    except ValueError:
        # Bắt lỗi dự phòng nếu x là một định dạng mảng lạ nào đó
        pass
        
    # 3. Các trường hợp còn lại (số, chuỗi đơn)
    return str(x)

print("Đang gộp Tên + Mô tả + Tính năng + Danh mục...")
df_meta['combined_text'] = (
    df_meta['title'].apply(clean_and_join) + " " + 
    df_meta['description'].apply(clean_and_join) + " " + 
    df_meta['features'].apply(clean_and_join) + " " + 
    df_meta['categories'].apply(clean_and_join)
).str.strip()

# ==========================================
# 3. TẠO VECTOR SẢN PHẨM (ITEM EMBEDDINGS)
# ==========================================
print("\n" + "="*50)
print("BƯỚC 3: TẠO ITEM EMBEDDINGS")
print("="*50)
print("Quá trình này có thể mất vài phút tùy sức mạnh CPU...")

item_vectors = model.encode(df_meta['combined_text'].tolist(), show_progress_bar=True)
item_asin_list = df_meta['parent_asin'].tolist()
item_vec_dict = {asin: vec for asin, vec in zip(item_asin_list, item_vectors)}
print(f"-> Đã tạo xong vector cho {len(item_vec_dict)} sản phẩm.")

# ==========================================
# 4. TẠO HỒ SƠ NGƯỜI DÙNG (USER PROFILES)
# ==========================================
print("\n" + "="*50)
print("BƯỚC 4: TẠO USER PROFILES (MEAN POOLING)")
print("="*50)

user_profiles = {}
user_interactions = df_train.groupby('user_id')['parent_asin'].apply(list)

for user_id, interacted_items in user_interactions.items():
    vecs = [item_vec_dict[item] for item in interacted_items if item in item_vec_dict]
    if vecs:
        user_profiles[user_id] = np.mean(vecs, axis=0)

print(f"-> Đã tổng hợp hồ sơ cho {len(user_profiles)} người dùng từ tập Train.")

# ==========================================
# 5. HÀM TÌM KIẾM VÀ GỢI Ý (ĐÃ TỐI ƯU BẰNG NUMPY)
# ==========================================
def get_top_k_recommendations(user_id, k=10):
    """Tính toán và trả về Top K sản phẩm gần nhất với User"""
    if user_id not in user_profiles:
        return []
    
    user_vec = user_profiles[user_id].reshape(1, -1)
    similarities = cosine_similarity(user_vec, item_vectors)[0]
    
    interacted_items = set(user_interactions.get(user_id, []))
    
    # Dùng thuật toán argsort của Numpy chạy bằng lõi C siêu tốc
    # Nó trả về danh sách vị trí (index) của các sản phẩm có điểm từ cao xuống thấp
    sorted_indices = np.argsort(similarities)[::-1]
    
    top_k_items = []
    # Chỉ bốc đủ 10 món (có loại trừ đồ cũ) là dừng lại ngay, không lặp hết 50.000 món nữa
    for idx in sorted_indices:
        item_id = item_asin_list[idx]
        if item_id not in interacted_items:
            top_k_items.append(item_id)
            if len(top_k_items) == k:
                break
                
    return top_k_items

# ==========================================
# 6. ĐÁNH GIÁ ĐỊNH LƯỢNG (EVALUATION)
# ==========================================
print("\n" + "="*50)
print("BƯỚC 5: CHẤM ĐIỂM HỆ THỐNG TRÊN TẬP TEST")
print("="*50)

K = 20
hits = 0
precision_sum = 0
ndcg_sum = 0
total_evaluated_users = 0

test_dict = df_test.set_index('user_id')['parent_asin'].to_dict()
total_test_users = len(test_dict)

print(f"Đang tiến hành thi trắc nghiệm cho {total_test_users} User...")

for index, (user_id, target_item) in enumerate(test_dict.items()):
    # ----------------------------------------------------
    # BÁO CÁO TIẾN ĐỘ: Cứ chấm xong 500 user thì in ra 1 lần
    if (index + 1) % 500 == 0 or (index + 1) == total_test_users:
        print(f" -> Đã chấm xong: {index + 1} / {total_test_users} người dùng...")
    # ----------------------------------------------------
    
    if user_id not in user_profiles:
        continue

    total_evaluated_users += 1
    
    top_k_items = get_top_k_recommendations(user_id, k=K)
    
    if target_item in top_k_items:
        hits += 1
        precision_sum += 1 / K
        rank = top_k_items.index(target_item) + 1
        ndcg_sum += 1 / math.log2(rank + 1)

recall_at_k = hits / total_evaluated_users if total_evaluated_users > 0 else 0
precision_at_k = precision_sum / total_evaluated_users if total_evaluated_users > 0 else 0
ndcg_at_k = ndcg_sum / total_evaluated_users if total_evaluated_users > 0 else 0

# ==========================================
# 7. KẾT QUẢ CUỐI CÙNG
# ==========================================
print("\n" + "*"*50)
print(" KẾT QUẢ BASELINE TỔNG THỂ CỦA HỆ THỐNG")
print("*"*50)
print(f"Tổng số người dùng được đánh giá: {total_evaluated_users}")
print(f"Hit Rate (Recall@{K}) : {recall_at_k:.5f}")
print(f"Precision@{K}       : {precision_at_k:.5f}")
print(f"NDCG@{K}            : {ndcg_at_k:.5f}")
print("*"*50)