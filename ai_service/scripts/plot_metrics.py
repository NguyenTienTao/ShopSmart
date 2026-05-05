import pandas as pd
import matplotlib.pyplot as plt
import seaborn as sns
import os

# Cấu hình giao diện chuẩn học thuật
sns.set_theme(style="whitegrid", context="paper", font_scale=1.2)

# Đường dẫn đến file log trong thư mục data
csv_file = os.path.join("data", "multimodal_learnable_weights(2)_log.csv")

try:
    df = pd.read_csv(csv_file)
    print(f"✅ Đã tìm thấy file log tại: {csv_file}")
except FileNotFoundError:
    print(f"❌ Lỗi: Không tìm thấy file {csv_file}. Hãy kiểm tra lại thư mục data.")
    exit()

# Lấy giá trị tốt nhất để đánh dấu trên biểu đồ
best_idx = df['Recall_20'].idxmax()
best_epoch = int(df.loc[best_idx, 'Epoch'])
best_recall = df['Recall_20'].max()

# --- BIỂU ĐỒ 1: TRAINING LOSS (Sự hội tụ) ---
plt.figure(figsize=(8, 5))
sns.lineplot(data=df, x='Epoch', y='Avg_Loss', color='crimson', linewidth=2.5)
plt.title('Sự suy giảm của Hàm mất mát (Training Loss)', fontsize=14, fontweight='bold')
plt.xlabel('Vòng lặp (Epoch)')
plt.ylabel('Average Loss')
plt.savefig('chart_training_loss.png', dpi=300, bbox_inches='tight')
print("📈 Đã xuất: chart_training_loss.png")

# --- BIỂU ĐỒ 2: RECALL & NDCG (Hiệu suất gợi ý) ---
plt.figure(figsize=(8, 5))
sns.lineplot(data=df, x='Epoch', y='Recall_20', label='Recall@20', color='royalblue')
sns.lineplot(data=df, x='Epoch', y='NDCG_20', label='NDCG@20', color='darkorange')

# Đánh dấu điểm Peak (Epoch 185)
plt.axvline(x=best_epoch, color='grey', linestyle='--')
plt.text(best_epoch + 3, best_recall - 0.005, f'Best: Epoch {best_epoch}', fontstyle='italic')

plt.title('Hiệu suất Gợi ý (Recall@20 & NDCG@20)', fontsize=14, fontweight='bold')
plt.xlabel('Vòng lặp (Epoch)')
plt.ylabel('Điểm số')
plt.legend(loc='lower right')
plt.savefig('chart_evaluation_metrics.png', dpi=300, bbox_inches='tight')
print("🎯 Đã xuất: chart_evaluation_metrics.png")

print("\n✨ Hoàn tất! Bạn có thể chèn 2 ảnh này vào chương Đánh giá thực nghiệm.")