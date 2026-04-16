import numpy as np
import pandas as pd
import scipy.sparse as sp
import torch

def build_sparse_adj_matrix(df, num_users, num_items):
    """
    Build normalized adjacency matrix from 5-core dataframe.
    Requires: df must have 2 columns 'user_idx' and 'item_idx' mapped to int
    """
    print("Building Bipartite Graph adjacency matrix...")
    
    # Get index lists of users and items
    users = df['user_idx'].values
    items = df['item_idx'].values
    
    # 1. Create interaction matrix R of size (num_users x num_items)
    interactions = np.ones(len(users))
    R = sp.coo_matrix((interactions, (users, items)), shape=(num_users, num_items))
    
    # 2. Create Adjacency Matrix A of size (num_users + num_items) x (num_users + num_items)
    zero_user = sp.csr_matrix((num_users, num_users))
    zero_item = sp.csr_matrix((num_items, num_items))
    
    A = sp.vstack([
        sp.hstack([zero_user, R]),
        sp.hstack([R.transpose(), zero_item])
    ])
    
    # 3. Compute Degree Matrix D
    print("Computing Symmetric Normalization...")
    rowsum = np.array(A.sum(axis=1)) # Sum of edges per node
    
    d_inv_sqrt = np.power(rowsum, -0.5).flatten()
    d_inv_sqrt[np.isinf(d_inv_sqrt)] = 0.0
    D_inv_sqrt = sp.diags(d_inv_sqrt)
    
    # 4. Apply formula: D^(-1/2) * A * D^(-1/2)
    norm_A = D_inv_sqrt.dot(A).dot(D_inv_sqrt).tocoo()
    
    # 5. Convert from SciPy Sparse Matrix to PyTorch Sparse Tensor
    print("Converting to PyTorch Sparse Tensor...")
    indices = torch.LongTensor(np.vstack((norm_A.row, norm_A.col)))
    values = torch.FloatTensor(norm_A.data)
    shape = torch.Size(norm_A.shape)
    
    sparse_tensor = torch.sparse_coo_tensor(indices, values, shape)
    
    # Move to GPU if available
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    return sparse_tensor.to(device)