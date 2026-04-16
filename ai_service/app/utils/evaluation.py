import torch
import numpy as np

# GPU-based Evaluation Function
def evaluate_model(model, adj_matrix, test_data_dict, train_data_dict, K=20):
    model.eval() # Switch model to evaluation mode
    device = next(model.parameters()).device
    users = list(test_data_dict.keys())
    
    recall_list, ndcg_list = [], []
    batch_size = 1024
    
    with torch.no_grad():
        users_emb, items_emb = model(adj_matrix)
        
        for i in range(0, len(users), batch_size):
            batch_users = users[i:i+batch_size]
            u_emb = users_emb[batch_users]
            
            # Compute scores for ALL items: [batch_size, num_items]
            scores = torch.matmul(u_emb, items_emb.T)
            
            # MASKING: Remove items already in the Train set
            for j, u in enumerate(batch_users):
                if u in train_data_dict:
                    train_items = train_data_dict[u]
                    # LƯU Ý KỸ THUẬT: Tài liệu ghi gán bằng "âm vô cùng" nhưng trong code mẫu lại gõ thiếu dấu trừ thành float('inf')[cite: 539, 580].
                    # Phải sửa thành -float('inf') thì điểm mới bị dìm xuống!
                    scores[j, train_items] = -float('inf') 
                    
            # Get Top-K items with highest scores
            topk_indices = torch.topk(scores, K, dim=1)[1].cpu().numpy()
            
            # Compute Recall and NDCG for each user
            for j, u in enumerate(batch_users):
                pred_items = topk_indices[j]
                ground_truth = test_data_dict[u]
                
                # Compute Recall
                hits = len(set(pred_items) & set(ground_truth))
                recall = hits / len(ground_truth) if len(ground_truth) > 0 else 0.0
                recall_list.append(recall)
                
                # Compute NDCG
                dcg = sum([1.0 / np.log2(rank + 2) for rank, item in enumerate(pred_items) if item in ground_truth])
                idcg = sum([1.0 / np.log2(rank + 2) for rank in range(min(len(ground_truth), K))])
                ndcg = dcg / idcg if idcg > 0 else 0.0
                ndcg_list.append(ndcg)
                
    return np.mean(recall_list), np.mean(ndcg_list)