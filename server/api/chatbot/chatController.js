const { GoogleGenerativeAI } = require("@google/generative-ai");
const supabase = require("../../utils/supabaseClient");
const { formatCurrency } = require("../../utils/formatCurrency.js");
require("dotenv").config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const chatModel = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
const embeddingModel = genAI.getGenerativeModel({
    model: "text-embedding-004",
});

// --- UTILS ---
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function callGeminiWithRetry(prompt, retries = 3) {
    for (let i = 0; i < retries; i++) {
        try {
            const result = await chatModel.generateContent(prompt);
            return (await result.response).text();
        } catch (error) {
            if (error.status === 429 || error.status === 503) {
                await delay(2000 * (i + 1));
                continue;
            }
            throw error;
        }
    }
    throw new Error("Server AI quá tải.");
}

const SHOP_CONTEXT = `
VAI TRÒ: Trợ lý AI của ShopSmart.
THÔNG TIN SHOP:
- 🏢 Đ/c: Đường ABC Trần Duy Hưng, Hà Nội.
- ☎️ Hotline: 1900 6688.
- 🚚 Ship: Đồng giá 30k, Free > 500k.

QUY TẮC:
- Luôn báo giá bằng TIỀN VIỆT (VND).
- Dùng emoji (🔥, 💰, 💖).
- Xưng "mình" - gọi "bạn".
`;

// --- MAIN CONTROLLER ---
const handleChat = async (req, res) => {
    try {
        const { message } = req.body;

        // 1. Router
        const routerPrompt = `
      ${SHOP_CONTEXT}
      User: "${message}"
      CHỌN 1 HÀNH ĐỘNG:
      1. GET_CATEGORIES (Hỏi danh mục)
      2. RECOMMEND: <english_target> (Gợi ý, top bán chạy)
      3. SEARCH: <english_keyword> (Tìm mua, hỏi chi tiết SP)
         - Dịch ý định tìm kiếm sang tiếng Anh.
         - VD: "Laptop ram 16gb" -> "SEARCH: Laptop 16GB RAM"
      4. CHAT: <reply> (Xã giao)
    `;
        const decision = (await callGeminiWithRetry(routerPrompt)).trim();
        console.log(`🤖 Bot chọn: ${decision}`);

        // Nhánh 1: Categories
        if (decision.includes("GET_CATEGORIES")) {
            const { data } = await supabase.from("categories").select("name");
            const list = data?.map((c) => c.name).join(", ") || "nhiều loại";
            return res.json({
                reply: `Shop có: **${list}**. Bạn xem gì nè? 😉`,
            });
        }

        // Nhánh 2: Recommend (Dùng Rating)
        if (decision.startsWith("RECOMMEND:")) {
            const target = decision.replace("RECOMMEND:", "").trim();
            let query = supabase
                .from("products")
                .select(
                    "title, price, rating_number, main_category:categories(name)"
                ) // Alias main_category
                .order("rating_number", { ascending: false })
                .limit(5);

            if (target !== "all" && !target.includes("null")) {
                query = query.textSearch("title", `'${target}'`, {
                    config: "english",
                    type: "websearch",
                });
            }
            const { data: products } = await query;

            const context = products?.length
                ? products
                      .map(
                          (p, i) =>
                              `🏆 Top ${i + 1}: ${p.title} - ${formatCurrency(
                                  p.price
                              )} (${p.rating_number}⭐)`
                      )
                      .join("\n")
                : "Chưa có dữ liệu.";

            const reply = await callGeminiWithRetry(
                `${SHOP_CONTEXT}\nKhách: "${message}"\nData: ${context}\nGiới thiệu ngắn gọn.`
            );
            return res.json({ reply });
        }

        // Nhánh 3: SEARCH (Dùng Vector)
        if (decision.startsWith("SEARCH:")) {
            const keyword = decision
                .replace("SEARCH:", "")
                .trim()
                .replace(/['"]/g, "");
            if (!keyword || keyword.includes("null"))
                return res.json({ reply: "Bạn tìm gì nè? 😊" });

            // Tạo Vector từ keyword
            const embedRes = await embeddingModel.embedContent(keyword);
            const userVector = embedRes.embedding.values;

            // Gọi hàm RPC match_products
            const { data: products, error } = await supabase.rpc(
                "match_products",
                {
                    query_embedding: userVector,
                    match_threshold: 0.45, // Hạ thấp chút để dễ tìm
                    match_count: 5,
                }
            );

            if (error) console.error("Lỗi Vector Search:", error);

            const context = products?.length
                ? products
                      .map(
                          (p) =>
                              `- ${p.title}: ${formatCurrency(
                                  p.price
                              )} (Khớp: ${Math.round(p.similarity * 100)}%)`
                      )
                      .join("\n")
                : "Không tìm thấy SP phù hợp.";

            const reply = await callGeminiWithRetry(
                `${SHOP_CONTEXT}\nKhách: "${message}" (Ý định: ${keyword})\nData: ${context}\nTư vấn và báo giá.`
            );
            return res.json({ reply });
        }

        // Nhánh 4: Chat
        if (decision.startsWith("CHAT:"))
            return res.json({ reply: decision.replace("CHAT:", "").trim() });

        res.json({ reply: "Mình chưa hiểu lắm 🥺" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ reply: "Server bận xíu!" });
    }
};

module.exports = { handleChat };
