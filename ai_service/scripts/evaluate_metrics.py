import requests
import math
import os
import random
import re
import time
from supabase import create_client, Client
from dotenv import load_dotenv

# --- 1. Cấu hình thông số ---
load_dotenv()
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

API_URL = "http://localhost:8000/search/multimodal"
K = 20  # Đã sửa thành 20 để đánh giá NDCG@20 và Recall@20 theo chuẩn khoa học
ALPHAS = [0.0, 0.2, 0.4, 0.5, 0.6, 0.8, 1.0]

# --- 2. Hàm Tự động tạo Test Cases từ Database ---
def simulate_user_query(full_title):
    """Giả lập cách người dùng gõ tìm kiếm từ một tên sản phẩm dài"""
    # 1. Xóa ký tự đặc biệt (dấu -, /, ngoặc...)
    clean_title = re.sub(r'[^\w\s]', '', full_title)
    words = clean_title.split()
    
    if len(words) <= 3:
        return full_title # Nếu tên vốn đã ngắn thì giữ nguyên
        
    # 2. Người dùng thường chỉ gõ 2-4 từ khóa quan trọng nhất (thường nằm ở đầu)
    num_words_to_pick = random.randint(2, 4)
    core_words = words[:num_words_to_pick]
    
    # 3. Random: Thêm màu sắc hoặc mã sản phẩm (thường nằm ở cuối Title)
    if random.random() > 0.5 and len(words) > 5:
        core_words.append(words[-1])
        
    return " ".join(core_words)

def generate_test_cases(num_cases=100):
    print(f"📦 Đang lấy ngẫu nhiên {num_cases} sản phẩm và GIẢ LẬP TRUY VẤN...")
    
    response = supabase.table("products").select("id, title").limit(500).execute()
    products = response.data
    
    valid_products = [p for p in products if p.get("title") and len(p["title"].strip()) > 0]
    sample_size = min(num_cases, len(valid_products))
    random_products = random.sample(valid_products, sample_size)
    
    test_cases = []
    for p in random_products:
        # CẮT GỌT TITLE THÀNH QUERY THỰC TẾ
        realistic_query = simulate_user_query(p["title"])
        ground_truth = [p["id"]]
        test_cases.append({
            "query": realistic_query, # VD: "Yamaha F310 Natural" thay vì tên dài
            "ground_truth": ground_truth,
            "original_title": p["title"] # Lưu lại để debug nếu cần
        })
        
    print(f"✅ Đã tạo {len(test_cases)} bộ test cases với truy vấn giả lập siêu thực!")
    return test_cases

# --- 3. Các hàm tính toán chỉ số ---
def get_ndcg_at_k(recommended_ids, ground_truth, k):
    """Tính toán Normalized Discounted Cumulative Gain (NDCG)"""
    dcg = 0.0
    for i, rec_id in enumerate(recommended_ids[:k]):
        if rec_id in ground_truth:
            dcg += 1.0 / math.log2(i + 2)
            
    idcg = 0.0
    for i in range(min(len(ground_truth), k)):
        idcg += 1.0 / math.log2(i + 2)
        
    return dcg / idcg if idcg > 0 else 0.0

def get_recall_at_k(recommended_ids, ground_truth, k):
    """Tính toán Recall@K"""
    hits = set(recommended_ids[:k]).intersection(set(ground_truth))
    return len(hits) / len(ground_truth) if len(ground_truth) > 0 else 0.0

# --- 4. Luồng thực thi chính ---
def evaluate_alphas(test_cases):
    if not test_cases:
        return
        
    for alpha in ALPHAS: 
        print(f"\n--- Đang đánh giá với Alpha = {alpha} ---")
        total_ndcg = 0.0
        total_recall = 0.0
        successful_cases = 0 # Đếm số lượng query thành công để chia trung bình cho chuẩn
        
        for case in test_cases: 
            query = case["query"]
            gt = case["ground_truth"]
            
            try:
                response = requests.get(
                    API_URL,
                    params={"query": query, "alpha": alpha, "limit": K},
                    timeout=20 # Báo cho Python kiên nhẫn chờ API tối đa 20s
                )
                
                if response.status_code == 200:
                    results = response.json()
                    if len(results) > 0:
                        rec_ids = [item["id"] for item in results]
                        total_ndcg += get_ndcg_at_k(rec_ids, gt, K)
                        total_recall += get_recall_at_k(rec_ids, gt, K)
                        successful_cases += 1
                else:
                    print(f"⚠️ Bỏ qua query '{query}' do DB quá tải.")
                    
            except Exception as e:
                print(f"❌ Lỗi mạng tại query '{query}'")
                
            # ĐIỂM MẤU CHỐT LÀ ĐÂY: Cho DB nghỉ ngơi 1.5 giây trước khi hỏi câu tiếp theo
            time.sleep(1.5) 
                
        if successful_cases > 0:
            avg_ndcg = total_ndcg / successful_cases
            avg_recall = total_recall / successful_cases
            print(f"✅ Kết quả Alpha = {alpha:<3} | NDCG@{K}: {avg_ndcg:.4f} | Recall@{K}: {avg_recall:.4f} (Dựa trên {successful_cases} cases thành công)")
        else:
            print(f"❌ Toàn bộ test case cho Alpha = {alpha} đều thất bại.")
    if not test_cases:
        return
        
    for alpha in ALPHAS: 
        total_ndcg = 0.0
        total_recall = 0.0
        
        for case in test_cases: 
            query = case["query"]
            gt = case["ground_truth"]
            
            # Gọi API FastAPI
            try:
                response = requests.get(
                    API_URL,
                    params={"query": query, "alpha": alpha, "limit": K}
                )
                
                if response.status_code == 200:
                    results = response.json()
                    
                    # BẮT LỖI 1: Trả về rỗng
                    if len(results) == 0:
                        print(f"⚠️ [CẢNH BÁO] API trả về 0 kết quả cho Query: '{query}'")
                    else:
                        rec_ids = [item["id"] for item in results]
                        
                        # BẮT LỖI 2: ID lệch pha (Chỉ in ra cho case đầu tiên để xem thử)
                        if total_ndcg == 0.0 and alpha == 0.0: 
                            print(f"\n[DEBUG ID] Ground Truth ID: {gt[0]}")
                            print(f"[DEBUG ID] API Top 1 ID   : {rec_ids[0]}")
                            
                        total_ndcg += get_ndcg_at_k(rec_ids, gt, K)
                        total_recall += get_recall_at_k(rec_ids, gt, K)
                else:
                    # BẮT LỖI 3: API sập
                    print(f"❌ [LỖI API {response.status_code}] - Query: '{query}'")
                    print(f"Chi tiết: {response.text}")
                    
            except Exception as e:
                print(f"❌ [LỖI KẾT NỐI MẠNG]: {e}")
                
        n_cases = len(test_cases)
        avg_ndcg = total_ndcg / n_cases
        avg_recall = total_recall / n_cases
        
        # In kết quả theo từng mức Alpha
        print(f"Alpha = {alpha:<3} | NDCG@{K}: {avg_ndcg:.4f} | Recall@{K}: {avg_recall:.4f}")

if __name__ == "__main__":
    print("🚀 BẮT ĐẦU QUÁ TRÌNH TÌM HỆ SỐ ALPHA TỐI ƯU...")
    
    # GIẢM SỐ LƯỢNG TEST CASE XUỐNG 20
    dynamic_tests = generate_test_cases(20) 
    
    print("\n--- ĐANG ĐÁNH GIÁ (Vui lòng chờ, hệ thống đang chạy chậm để bảo vệ DB) ---")
    evaluate_alphas(dynamic_tests)
    print("\n🎉 Hoàn tất đánh giá!")