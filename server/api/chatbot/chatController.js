const { GoogleGenerativeAI } = require("@google/generative-ai");
const supabase = require("../../utils/supabaseClient");
const { formatCurrency } = require("../../utils/formatCurrency");
require("dotenv").config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

// ============================================================================
// 🎓 KIẾN THỨC SHOP
// ============================================================================
const SHOP_CONTEXT = `
VAI TRÒ: Trợ lý AI của ShopSmart.
THÔNG TIN SHOP:
- 🏢 Đ/c: Đường abc Trần Duy Hưng, Hà Nội.
- ☎️ Hotline: 1900 6688.
- 🚚 Ship: Đồng giá 30k, Free > 500k.
- ⌚ Giờ: 8h - 22h.

QUY TẮC:
- Xưng "mình" - gọi "bạn".
- Luôn dùng emoji (🌟, 🏆, 💖).
- Ưu tiên giới thiệu sản phẩm có ĐÁNH GIÁ CAO (Rating cao) khi được hỏi gợi ý.
`;

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function callGeminiWithRetry(prompt, retries = 3) {
    for (let i = 0; i < retries; i++) {
        try {
            const result = await model.generateContent(prompt);
            const response = await result.response;
            return response.text();
        } catch (error) {
            if (
                error.message.includes("429") ||
                error.status === 429 ||
                error.status === 503
            ) {
                await delay(3000 * (i + 1));
                continue;
            }
            throw error;
        }
    }
    throw new Error("Server quá tải.");
}

// ============================================================================
// 🧠 CONTROLLER
// ============================================================================
const handleChat = async (req, res) => {
    try {
        const { message } = req.body;

        // --- BƯỚC 1: PHÂN LOẠI & TRÍCH XUẤT TỪ KHÓA ---
        // 👇 ĐÂY LÀ PHẦN QUAN TRỌNG ĐÃ ĐƯỢC NÂNG CẤP
        const routerPrompt = `
      ${SHOP_CONTEXT}
      User input: "${message}"
      
      HÃY PHÂN TÍCH VÀ CHỌN 1 TRONG 4 HÀNH ĐỘNG (Chỉ trả về mã lệnh):

      1. GET_CATEGORIES
         - Nếu khách hỏi: "Shop có những loại nào?", "Bán mặt hàng gì?".

      2. RECOMMEND: <target_english>
         - Nếu khách hỏi gợi ý, top bán chạy, top đánh giá cao.
         - QUY TẮC: Dịch loại sản phẩm sang tiếng Anh.
         - Ví dụ: "Sách nào hay" -> "RECOMMEND: book"
         - Ví dụ: "Gợi ý cho tôi" -> "RECOMMEND: all"

      3. SEARCH: <keyword_english>
         - Nếu khách tìm sản phẩm cụ thể, hỏi giá.
         - QUY TẮC QUAN TRỌNG:
           + Dịch tên loại sản phẩm sang tiếng Anh (Ví dụ: "giày" -> "shoes").
           + GIỮ NGUYÊN tên riêng, tên thương hiệu, tên tiếng Anh (Ví dụ: "iPhone 15", "Harry Potter", "Nike").
         
         - Ví dụ 1: "giày nike màu đỏ" -> "SEARCH: nike shoes red" (Dịch giày->shoes, giữ nike).
         - Ví dụ 2: "sách Girl Made of Glass" -> "SEARCH: Girl Made of Glass book" (Giữ nguyên tên riêng).
         - Ví dụ 3: "điện thoại samsung" -> "SEARCH: samsung phone".

      4. CHAT: <vietnamese_reply>
         - Chào hỏi, toán, địa lý, hỏi thông tin shop...
    `;

        const aiDecisionText = await callGeminiWithRetry(routerPrompt);
        const aiDecision = aiDecisionText.trim();
        console.log(`🤖 Bot chọn: ${aiDecision}`);

        // --- NHÁNH 1: DANH MỤC ---
        if (aiDecision.includes("GET_CATEGORIES")) {
            const { data: categories } = await supabase
                .from("categories")
                .select("name");
            const list =
                categories?.map((c) => c.name).join(", ") || "nhiều loại lắm";
            return res.json({
                reply: `Shop mình có: **${list}**. Bạn thích loại nào? 😉`,
            });
        }

        // --- NHÁNH 2: GỢI Ý (RATING CAO) ---
        if (aiDecision.startsWith("RECOMMEND:")) {
            let target = aiDecision.replace("RECOMMEND:", "").trim();

            let query = supabase
                .from("products")
                .select(
                    "title, price, description, category_id, categories(name), rating_number"
                )
                .order("rating_number", { ascending: false })
                .limit(5);

            if (target !== "all" && !target.includes("null")) {
                query = query.textSearch("title", `'${target}'`, {
                    config: "english",
                    type: "websearch",
                });
            }

            const { data: products } = await query;
            let productContext = products?.length
                ? products
                      .map(
                          (p, i) =>
                              `🌟 Top ${i + 1}: ${
                                  p.title
                              } - ${p.price.toLocaleString()}đ (${
                                  p.rating_number
                              } sao)`
                      )
                      .join("\n")
                : "Chưa có dữ liệu.";

            const finalReply = await callGeminiWithRetry(`
            ${SHOP_CONTEXT}
            Khách: "${message}"
            Top sản phẩm: ${productContext}
            Yêu cầu: Giới thiệu hấp dẫn.
        `);
            return res.json({ reply: finalReply });
        }

        // --- NHÁNH 3: TÌM KIẾM (ĐÃ TỐI ƯU KEYWORD) ---
        if (aiDecision.startsWith("SEARCH:")) {
            let searchKeyword = aiDecision
                .replace("SEARCH:", "")
                .trim()
                .replace(/['"]/g, "");

            if (!searchKeyword || searchKeyword.includes("null"))
                return res.json({
                    reply: "Bạn muốn tìm món gì nè? Nói tên giúp mình nha! 😊",
                });

            // Tìm trong DB với keyword đã được AI xử lý (Vừa Anh vừa Việt)
            const { data: products } = await supabase
                .from("products")
                .select(
                    "title, price, description, categories(name), rating_number"
                )
                .textSearch("title", `'${searchKeyword}'`, {
                    config: "english",
                    type: "websearch",
                })
                .limit(5);

            let productContext = products?.length
                ? products
                      .map((p) => `- ${p.title}: (${formatCurrency(p.price)})`)
                      .join("\n")
                : "Không tìm thấy sản phẩm nào khớp.";

            const finalReply = await callGeminiWithRetry(`
            ${SHOP_CONTEXT}
            Khách hỏi: "${message}"
            Dữ liệu tìm được:
            ${productContext}
            Trả lời ngắn gọn, nếu không có thì gợi ý tìm từ khóa khác.
        `);
            return res.json({ reply: finalReply });
        }

        // --- NHÁNH 4: CHAT ---
        if (aiDecision.startsWith("CHAT:")) {
            return res.json({ reply: aiDecision.replace("CHAT:", "").trim() });
        }

        res.json({ reply: "Mình chưa hiểu lắm, bạn nói lại nha? 🥺" });
    } catch (error) {
        console.error("Lỗi:", error.message);
        res.status(500).json({ reply: "Server đang bận xíu!" });
    }
};

module.exports = { handleChat };
