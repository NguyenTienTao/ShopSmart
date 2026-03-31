import requests
import math

# --- 1. Cấu hình thông số ---
API_URL = "http://localhost:8000/search/multimodal"
K = 10
ALPHAS = [0.0, 0.2, 0.4, 0.5, 0.6, 0.8, 1.0] # Các mức trọng số để test [cite: 381, 382]

# --- 2. Tập dữ liệu Test (Ground Truth) ---
# LƯU Ý KHI LÀM ĐỒ ÁN: Bạn phải thay các chuỗi "uuid-..." bằng ID sản phẩm CÓ THẬT trong Supabase của bạn! [cite: 384, 385]
test_cases = [
    {
        "query": "đàn guitar acoustic màu gỗ tự nhiên",
        "ground_truth": ["thay-id-san-pham-that-vao-day-1", "thay-id-san-pham-that-vao-day-2"]
    },
    {
        "query": "micro thu âm condenser chuyên nghiệp",
        "ground_truth": ["thay-id-san-pham-that-vao-day-3"]
    }
]

# --- 3. Các hàm tính toán chỉ số ---
def get_ndcg_at_k(recommended_ids, ground_truth, k):
    """Tính toán Normalized Discounted Cumulative Gain (NDCG)"""
    dcg = 0.0
    for i, rec_id in enumerate(recommended_ids[:k]):
        if rec_id in ground_truth:
            # i = 0 ứng với rank 1 => log2(2) = 1 [cite: 421]
            dcg += 1.0 / math.log2(i + 2) [cite: 422]
            
    idcg = 0.0
    for i in range(min(len(ground_truth), k)):
        idcg += 1.0 / math.log2(i + 2) [cite: 424]
        
    return dcg / idcg if idcg > 0 else 0.0 [cite: 425]

def get_recall_at_k(recommended_ids, ground_truth, k):
    """Tính toán Recall@K"""
    hits = set(recommended_ids[:k]).intersection(set(ground_truth)) [cite: 432]
    return len(hits) / len(ground_truth) if len(ground_truth) > 0 else 0.0 [cite: 433]

# --- 4. Luồng thực thi chính ---
def evaluate_alphas():
    """Chạy vòng lặp kiểm thử qua các hệ số Alpha"""
    for alpha in ALPHAS: 
        print(f"\n--- Đang đánh giá với Alpha = {alpha} ---")
        total_ndcg = 0.0
        total_recall = 0.0
        
        for case in test_cases: 
            query = case["query"]
            gt = case["ground_truth"]
            
            # Gọi API FastAPI [cite: 459]
            try:
                response = requests.get(
                    API_URL,
                    params={"query": query, "alpha": alpha, "limit": K} [cite: 473]
                )
                
                if response.status_code == 200:
                    results = response.json()
                    rec_ids = [item["id"] for item in results] [cite: 475]
                    
                    total_ndcg += get_ndcg_at_k(rec_ids, gt, K) [cite: 476]
                    total_recall += get_recall_at_k(rec_ids, gt, K) [cite: 476]
                else:
                    print(f"Lỗi API ({response.status_code}): {response.text}")
            except Exception as e:
                print(f"Lỗi kết nối: {e}") [cite: 482]
                
        n_cases = len(test_cases)
        if n_cases > 0:
            avg_ndcg = total_ndcg / n_cases
            avg_recall = total_recall / n_cases
            print(f"Kết quả -> NDCG@{K}: {avg_ndcg:.4f} | Recall@{K}: {avg_recall:.4f}") [cite: 502]

if __name__ == "__main__":
    print("Bắt đầu quá trình tìm hệ số Alpha tối ưu...")
    evaluate_alphas() [cite: 506]