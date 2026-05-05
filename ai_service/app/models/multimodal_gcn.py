import torch
import torch.nn as nn
import torch.nn.functional as F

class MultimodalLightGCN(nn.Module):
    def __init__(self, num_users, num_items, embedding_dim, text_feats, image_feats, num_layers=3):
        super(MultimodalLightGCN, self).__init__()
        self.num_users = num_users
        self.num_items = num_items
        self.embedding_dim = embedding_dim
        self.num_layers = num_layers
        
        # --- FIX 1: Lưu feature vào self để dùng ở các hàm khác ---
        self.text_feats = text_feats
        self.image_feats = image_feats
        # --------------------------------------------------------
        
        # 1. Initialize learnable ID Embeddings
        self.user_embedding = nn.Embedding(num_users, embedding_dim)
        self.item_embedding = nn.Embedding(num_items, embedding_dim)
        
        # Initialize weights (Xavier/Normal)
        nn.init.normal_(self.user_embedding.weight, std=0.1)
        nn.init.normal_(self.item_embedding.weight, std=0.1)
        
        # 2. Process Multimodal features (pre-extracted from CLIP offline)
        self.weight_text = nn.Parameter(torch.tensor(0.1))
        self.weight_image = nn.Parameter(torch.tensor(0.1))
        
        # Linear layers to project CLIP vectors (512-dim) to ID embedding space
        self.text_projection = nn.Sequential(
            nn.Linear(text_feats.shape[1], embedding_dim, bias=False),
            nn.ReLU(),
            nn.Dropout(p=0.3) # Tắt ngẫu nhiên 30% nơ-ron
        )
        self.image_projection = nn.Sequential( 
            nn.Linear(image_feats.shape[1], embedding_dim, bias=False), 
            nn.ReLU(), 
            nn.Dropout(p=0.3) 
        )

    def _compute_multimodal_item_embedding(self):
        """Combine ID Embedding with Text and Image Embeddings of Items."""
        id_emb = self.item_embedding.weight
        
        # Gọi đúng tên biến self.text_feats
        text_emb = self.text_projection(self.text_feats)
        image_emb = self.image_projection(self.image_feats)
        
        # --- FIX 2: Sửa lại phép tính trọng số (Learnable Weights) ---
        fused_item_emb = id_emb + \
                         self.weight_text * F.normalize(text_emb, p=2, dim=1) + \
                         self.weight_image * F.normalize(image_emb, p=2, dim=1)
        # --------------------------------------------------------------
        
        return fused_item_emb

    def forward(self, adj_matrix):
        """Message Passing on the graph."""
        users_emb_0 = self.user_embedding.weight
        items_emb_0 = self._compute_multimodal_item_embedding()
        
        ego_embeddings = torch.cat([users_emb_0, items_emb_0], dim=0)
        all_embeddings = [ego_embeddings]
        
        for layer in range(self.num_layers):
            ego_embeddings = torch.sparse.mm(adj_matrix, ego_embeddings)
            all_embeddings.append(ego_embeddings)
            
        all_embeddings = torch.stack(all_embeddings, dim=1)
        final_embeddings = torch.mean(all_embeddings, dim=1)
        
        users_emb_final, items_emb_final = torch.split(final_embeddings, [self.num_users, self.num_items])
        return users_emb_final, items_emb_final

    def compute_bpr_loss(self, users, pos_items, neg_items, users_emb_final, items_emb_final):
        u_emb = users_emb_final[users]
        pos_i_emb = items_emb_final[pos_items]
        neg_i_emb = items_emb_final[neg_items]
        
        pos_scores = torch.sum(u_emb * pos_i_emb, dim=1)
        neg_scores = torch.sum(u_emb * neg_i_emb, dim=1)
        
        bpr_loss = -torch.mean(F.logsigmoid(pos_scores - neg_scores))
        
        # Regularization (L2 norm)
        reg_loss = (1/2) * (u_emb.norm(2).pow(2) + pos_i_emb.norm(2).pow(2) + neg_i_emb.norm(2).pow(2)) / float(len(users))
        
        return bpr_loss, reg_loss