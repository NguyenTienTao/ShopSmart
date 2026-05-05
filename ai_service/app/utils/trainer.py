import torch
import random
from torch.utils.data import Dataset, DataLoader
from tqdm import tqdm
import torch.optim as optim
import os
import csv # Thư viện để ghi file log ra Excel

from app.utils.evaluation import evaluate_model

# ==========================================
# 1. DATASET: LẤY MẪU ÂM ĐỘNG (GIỮ NGUYÊN)
# ==========================================
class BPRDataset(Dataset):
    def __init__(self, df, num_items):
        self.users = df['user_idx'].values
        self.pos_items = df['item_idx'].values
        self.num_items = num_items
        
        print("Building interaction history for each User...")
        self.user_item_set = df.groupby('user_idx')['item_idx'].apply(set).to_dict()

    def __len__(self):
        return len(self.users)

    def __getitem__(self, idx):
        user = self.users[idx]
        pos_item = self.pos_items[idx]
        
        while True:
            neg_item = random.randint(0, self.num_items - 1)
            if neg_item not in self.user_item_set[user]:
                break 
                
        # Ép kiểu chống lỗi IndexError lúc nãy
        return torch.tensor(user, dtype=torch.long), \
               torch.tensor(pos_item, dtype=torch.long), \
               torch.tensor(neg_item, dtype=torch.long)

# ==========================================
# 2. VÒNG LẶP HUẤN LUYỆN (FULL GIÁP)
# ==========================================
def train_lightgcn(model, df_train, adj_matrix, num_items, train_dict, test_dict, epochs=250, batch_size=2048, lr=0.001):
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    model.to(device)
    adj_matrix = adj_matrix.to(device)
    
    train_dataset = BPRDataset(df_train, num_items)
    train_loader = DataLoader(train_dataset, batch_size=batch_size, shuffle=True, num_workers=0)
    optimizer = optim.Adam(model.parameters(), lr=lr)
    
    # --- CHUẨN BỊ FILE CSV LƯU LOG ---
    log_file = "data/multimodal_learnable_weights(2)_log.csv"
    os.makedirs(os.path.dirname(log_file), exist_ok=True)
    with open(log_file, mode='w', newline='') as f:
        writer = csv.writer(f)
        writer.writerow(['Epoch', 'Avg_Loss', 'Recall_20', 'NDCG_20']) # Tiêu đề cột
        
    # --- BIẾN CÀI ĐẶT EARLY STOPPING ---
    best_ndcg = 0.0
    patience_counter = 0
    patience_limit = 20 # Giới hạn chịu đựng: 20 epochs không tăng thì cắt
    
    print(f"🚀 Khởi động lò luyện đan trên {device} (Max Epochs: {epochs})...")
    
    for epoch in range(1, epochs + 1):
        model.train()
        total_loss = 0.0
        
        progress_bar = tqdm(train_loader, desc=f"Epoch {epoch}/{epochs}")
        for batch_users, batch_pos, batch_neg in progress_bar:
            batch_users = batch_users.to(device)
            batch_pos = batch_pos.to(device)
            batch_neg = batch_neg.to(device)
            
            optimizer.zero_grad()
            users_emb_final, items_emb_final = model(adj_matrix)
            
            bpr_loss, reg_loss = model.compute_bpr_loss(
                batch_users, batch_pos, batch_neg, 
                users_emb_final, items_emb_final
            )
            
            loss = bpr_loss + (1e-3 * reg_loss)
            loss.backward()
            optimizer.step()
            
            total_loss += loss.item()
            progress_bar.set_postfix({'loss': f"{loss.item():.4f}"})
            
        avg_loss = total_loss / len(train_loader)
        
        # --- ĐÁNH GIÁ MỖI 5 EPOCH ---
        if epoch % 5 == 0:
            print(f"\n--- Đang đánh giá tại Epoch {epoch} ---")
            recall, ndcg = evaluate_model(model, adj_matrix, test_dict, train_dict, K=20)
            print(f"🏆 Recall@20: {recall:.4f} | NDCG@20: {ndcg:.4f}\n")
            
            # 1. Ghi log ra file CSV
            with open(log_file, mode='a', newline='') as f:
                writer = csv.writer(f)
                writer.writerow([epoch, avg_loss, recall, ndcg])
                
            # 2. Kiểm tra Early Stopping
            if ndcg > best_ndcg:
                best_ndcg = ndcg
                patience_counter = 0 # Điểm tăng -> Xóa bộ đếm làm lại từ đầu
                # Lưu file weights của mô hình ngon nhất lại
                torch.save(model.state_dict(), "data/best_multimodal_dummy.pth") 
            else:
                patience_counter += 5 # Điểm không tăng -> Cộng dồn bộ đếm
                
            if patience_counter >= patience_limit:
                print(f"🛑 PHANH TAY (EARLY STOPPING) KÍCH HOẠT!")
                print(f"Lý do: NDCG không vượt qua {best_ndcg:.4f} trong {patience_limit} epochs liên tiếp.")
                print(f"Đã dừng an toàn tại Epoch {epoch}.")
                break
        
    print("🎉 Hoàn tất huấn luyện!")
    return model