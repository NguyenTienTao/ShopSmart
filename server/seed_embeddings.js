const { GoogleGenerativeAI } = require("@google/generative-ai");
const { createClient } = require("@supabase/supabase-js");
require("dotenv").config();

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_KEY
);
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const embeddingModel = genAI.getGenerativeModel({
    model: "text-embedding-004",
});

async function generateEmbeddings() {
    console.log("🚀 Bắt đầu cập nhật Vector (Bao gồm Features)...");

    // Lấy dữ liệu với alias main_category để tránh lỗi trùng tên
    const { data: products } = await supabase
        .from("products")
        .select(
            "id, title, description, features, main_category:categories(name)"
        );

    if (!products?.length) return console.log("Không có sản phẩm.");

    for (const p of products) {
        // Xử lý Features -> Text
        let featureText = "";
        if (p.features && typeof p.features === "object") {
            featureText = Object.entries(p.features)
                .map(([k, v]) => `${k}: ${v}`)
                .join(", ");
        }

        const text = `Product: ${p.title}. Category: ${p.main_category?.name}. Desc: ${p.description}. Specs: ${featureText}`;

        try {
            const res = await embeddingModel.embedContent(text);

            await supabase
                .from("products")
                .update({ embedding: res.embedding.values })
                .eq("id", p.id);

            console.log(`✅ Đã vector hóa: ${p.title}`);
            await new Promise((r) => setTimeout(r, 500)); // Delay tránh lỗi 429
        } catch (e) {
            console.error(`❌ Lỗi SP ${p.title}:`, e.message);
        }
    }
    console.log("🎉 Hoàn tất!");
}

generateEmbeddings();
