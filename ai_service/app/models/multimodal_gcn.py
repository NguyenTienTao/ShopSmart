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
        
        # 1. Initialize learnable ID Embeddings
        self.user_embedding = nn.Embedding(num_users, embedding_dim)
        self.item_embedding = nn.Embedding(num_items, embedding_dim)
        
        # Initialize weights (Xavier/Normal)
        nn.init.normal_(self.user_embedding.weight, std=0.1)
        nn.init.normal_(self.item_embedding.weight, std=0.1)
        
        # 2. Process Multimodal features (pre-extracted from CLIP offline)
        # text_feats and image_feats are tensors of size [num_items, 512]
        self.text_features = nn.Parameter(text_feats, requires_grad=False)
        self.image_features = nn.Parameter(image_feats, requires_grad=False)
        
        # Linear layers to project CLIP vectors (512-dim) to ID embedding space
        self.text_projection = nn.Linear(text_feats.shape[1], embedding_dim)
        self.image_projection = nn.Linear(image_feats.shape[1], embedding_dim)

    def _compute_multimodal_item_embedding(self):
        """Combine ID Embedding with Text and Image Embeddings of Items."""
        id_emb = self.item_embedding.weight
        text_emb = self.text_projection(self.text_features)
        image_emb = self.image_projection(self.image_features)
        
        # Fusion: Sum vectors (can experiment with concat or attention later)
        # fused_item_emb = id_emb + F.normalize(text_emb, p=2, dim=1) + F.normalize(image_emb, p=2, dim=1)
        fused_item_emb = id_emb
        return fused_item_emb

    def forward(self, adj_matrix):
        """Message Passing on the graph."""
        # adj_matrix: Normalized Adjacency Matrix of the User-Item graph.
        
        # Get initial embeddings (Layer 0)
        users_emb_0 = self.user_embedding.weight
        items_emb_0 = self._compute_multimodal_item_embedding()
        
        # Concatenate User and Item into a single graph representation
        ego_embeddings = torch.cat([users_emb_0, items_emb_0], dim=0)
        all_embeddings = [ego_embeddings]
        
        # Perform Graph Convolution through layers
        for layer in range(self.num_layers):
            # Matrix multiplication to aggregate neighbor information
            ego_embeddings = torch.sparse.mm(adj_matrix, ego_embeddings)
            all_embeddings.append(ego_embeddings)
            
        # Aggregate embeddings from all layers (Readout function)
        all_embeddings = torch.stack(all_embeddings, dim=1)
        final_embeddings = torch.mean(all_embeddings, dim=1)
        
        # Split back into User and Item embeddings
        users_emb_final, items_emb_final = torch.split(final_embeddings, [self.num_users, self.num_items])
        return users_emb_final, items_emb_final

    def compute_bpr_loss(self, users, pos_items, neg_items, users_emb_final, items_emb_final):
        """
        Compute Bayesian Personalized Ranking (BPR) Loss.
        Encourages the model to rank pos_item higher than neg_item for each user.
        """
        u_emb = users_emb_final[users]
        pos_i_emb = items_emb_final[pos_items]
        neg_i_emb = items_emb_final[neg_items]
        
        # Compute similarity scores (Inner product)
        pos_scores = torch.sum(u_emb * pos_i_emb, dim=1)
        neg_scores = torch.sum(u_emb * neg_i_emb, dim=1)
        
        # BPR Loss: -ln(sigmoid(pos_score - neg_score))
        bpr_loss = -torch.mean(F.logsigmoid(pos_scores - neg_scores))
        
        # Regularization (L2 norm) to prevent overfitting
        reg_loss = (1/2) * (u_emb.norm(2).pow(2) + pos_i_emb.norm(2).pow(2) + neg_i_emb.norm(2).pow(2)) / float(len(users))
        
        return bpr_loss, reg_loss