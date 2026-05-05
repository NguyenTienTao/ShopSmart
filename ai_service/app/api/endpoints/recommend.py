from fastapi import APIRouter, HTTPException
import numpy as np
import pandas as pd
import json
from supabase import create_client, Client
import os
from dotenv import load_dotenv

load_dotenv()
router = APIRouter()

# Khởi tạo Supabase
supabase: Client = create_client(os.getenv("SUPABASE_URL"), os.getenv("SUPABASE_KEY"))

# Tải "Bộ não" User Embedding (64-dim)
# Lưu ý: Trong thực tế nên load cái này vào một Singleton Class
USER_EMBEDDINGS = np.load('exports/users_emb_final.npy')

# Tải danh sách ID Amazon để ánh xạ (giả sử bạn đã lưu lúc train)
# index 0 trong npy tương ứng với id đầu tiên trong list này
try:
    df_train = pd.read_csv("data/train_5core.csv")
    df_test = pd.read_csv("data/test_5core.csv")
    all_users_cat = pd.concat([df_train['user_id'], df_test['user_id']]).astype('category')
    AMAZON_USER_LIST = all_users_cat.cat.categories.tolist()
except:
    AMAZON_USER_LIST = []

@router.get("/recommend/{user_id}")
async def get_recommendations(user_id: str, limit: int = 20):
    target_vector = None
    exclude_asins = []

    # --- GIẢI PHÁP 1: KIỂM TRA XEM CÓ PHẢI USER TRONG TẬP TRAIN (AMAZON ID) ---
    if user_id in AMAZON_USER_LIST:
        user_idx = AMAZON_USER_LIST.index(user_id)
        target_vector = USER_EMBEDDINGS[user_idx].tolist()
        print(f"🎯 Found Amazon User: {user_id}")

    # --- GIẢI PHÁP 2: FOLDING-IN CHO USER SUPABASE (DỰA TRÊN TƯƠNG TÁC) ---
    if not target_vector:
        # Lấy các sản phẩm User đã 'like' hoặc 'purchase'
        interactions = supabase.table('user_interactions') \
            .select('parent_asin') \
            .eq('user_id', user_id) \
            .in_('type', ['like', 'purchase', 'cart', 'view']) \
            .order('created_at', desc=True) \
            .limit(20).execute()
        
        if interactions.data:
            recent_interactions = interactions.data[::-1]
            exclude_asins = [i['parent_asin'] for i in recent_interactions]
            
            # Lấy vector của các sản phẩm đó từ DB
            item_data = supabase.table('products') \
                .select('embedding') \
                .in_('parent_asin', exclude_asins).execute()
            
            vectors = []
            
            for v in item_data.data:
                raw_emb = v.get('embedding')
                if raw_emb:
                    # FIX LỖI DTYPE: Xử lý chuỗi JSON và ép kiểu float32
                    if isinstance(raw_emb, str):
                        vec = np.array(json.loads(raw_emb), dtype=np.float32)
                    else:
                        vec = np.array(raw_emb, dtype=np.float32)
                    vectors.append(vec)
            
            if vectors:
                weights = np.linspace(0.5, 1.0, num=len(vectors))
                # User Vector = Trung bình cộng các Item Vector
                target_vector = np.average(vectors, axis=0, weights=weights).tolist()
                print(f"🔄 Folding-in for Supabase User: {user_id}")

    # --- GIẢI PHÁP 3: COLD START (NGƯỜI DÙNG MỚI TINH) ---
    if not target_vector:
        print("❄️ Cold Start: Showing Top Rated Products")
        # Trả về các sản phẩm có rating cao nhất từ schema của bạn
        top_products = supabase.table('products') \
            .select('id, title, price, images, parent_asin, average_rating') \
            .order('average_rating', desc=True) \
            .limit(limit).execute()
        return top_products.data

    # --- TRUY VẤN SUPABASE BẰNG PGVECTOR (RPC) ---
    # Sử dụng hàm get_recommendations_by_vector đã tạo ở bước trước
    try:
        recommended = supabase.rpc('get_recommendations_by_vector', {
            'query_embedding': target_vector,
            'match_threshold': 0.3, # Điều chỉnh tùy độ khắt khe
            'match_count': limit,
            'exclude_asins': exclude_asins
        }).execute()
        
        return recommended.data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))