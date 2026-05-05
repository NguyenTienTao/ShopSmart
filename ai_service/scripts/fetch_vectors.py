import os
import torch
import json
from supabase import create_client, Client
from dotenv import load_dotenv

load_dotenv()
SUPABASE_URL = os.environ.get("SUPABASE_URL")
SUPABASE_KEY = os.environ.get("SUPABASE_KEY")
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

def fetch_and_save_dict():
    print("🚀 Đang tải Vector từ Supabase và lưu dạng Dictionary...")
    text_dict = {}
    image_dict = {}
    
    limit = 1000
    offset = 0
    total_fetched = 0
    
    while True:
        print(f"Đang tải từ dòng {offset}...")
        response = supabase.table('products') \
                           .select('parent_asin, embedding, image_embedding') \
                           .range(offset, offset + limit - 1) \
                           .execute()
        data = response.data
        if not data:
            break
            
        for row in data:
            asin = row['parent_asin']
            
            if row.get('embedding'):
                t_vec = json.loads(row['embedding']) if isinstance(row['embedding'], str) else row['embedding']
                text_dict[asin] = torch.tensor(t_vec, dtype=torch.float32)
            
            if row.get('image_embedding'):
                i_vec = json.loads(row['image_embedding']) if isinstance(row['image_embedding'], str) else row['image_embedding']
                image_dict[asin] = torch.tensor(i_vec, dtype=torch.float32)
                
        total_fetched += len(data)
        offset += limit
        
    os.makedirs('data', exist_ok=True)
    # Lưu dưới dạng Dictionary .pt
    torch.save(text_dict, 'data/text_dict.pt')
    torch.save(image_dict, 'data/image_dict.pt')
    print(f"🎉 Hoàn tất! Đã lưu {len(text_dict)} vector gốc an toàn.")

if __name__ == "__main__":
    fetch_and_save_dict()