import { supabase } from "./supabaseClient.js"; // Giả sử bạn đã khởi tạo supabase client

export const trackInteraction = async (userId, parentAsin, type) => {
    if (!userId) return; // Không lưu nếu khách chưa đăng nhập

    const { error } = await supabase
        .from("user_interactions")
        .upsert(
            {
                user_id: userId,
                parent_asin: parentAsin,
                type: type,
                created_at: new Date(),
            },
            { onConflict: "user_id, parent_asin, type" },
        );

    if (error) {
        console.error("Lỗi lưu tương tác:", error.message);
    }
};
