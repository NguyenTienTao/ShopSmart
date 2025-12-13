const { GoogleGenAI } = require("@google/genai");
const supabase = require("../../utils/supabaseClient.js");
require("dotenv").config();

const genAI = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const handleChat = async (req, res) => {
    try {
        const { message } = req.body; // Câu hỏi của khách

        // BƯỚC 1: Tìm kiếm sản phẩm liên quan trong Database
        // (Tìm các sản phẩm có tên hoặc mô tả khớp với từ khóa trong câu hỏi)
        // Lưu ý: Đây là tìm kiếm Text cơ bản. Nâng cao hơn thì dùng Vector Search.
        const { data: products, error } = await supabase
            .from("products")
            .select("title, price, description, category_id, categories(name)")
            .textSearch("title", `'${message}'`, {
                config: "english",
                type: "websearch",
            })
            .limit(5);

        // BƯỚC 2: Xây dựng ngữ cảnh (Context) cho AI
        let productContext =
            "Hiện tại không tìm thấy sản phẩm nào khớp trong dữ liệu.";

        if (products && products.length > 0) {
            productContext = products
                .map(
                    (p) =>
                        `- Tên: ${p.title} | Giá: ${p.price} | Loại: ${p.categories?.name}`
                )
                .join("\n");
        }

        const prompt = `
      Bạn là trợ lý AI ảo của trang thương mại điện tử ShopSmart.
      
      NHIỆM VỤ:
      Trả lời câu hỏi của khách hàng dựa trên danh sách sản phẩm được cung cấp dưới đây.
      
      NGUYÊN TẮC:
      1. Chỉ tư vấn các sản phẩm có trong danh sách. Nếu không có, hãy xin lỗi và bảo khách thử từ khóa khác.
      2. Trả lời ngắn gọn, thân thiện, dùng biểu tượng cảm xúc (emoji) phù hợp, dùng tiếng việt.
      3. Định dạng giá tiền sang VNĐ (ví dụ 200000 thành 200.000đ).
      4. KHÔNG bịa đặt thông tin sản phẩm không có trong danh sách.

      DANH SÁCH SẢN PHẨM TÌM THẤY TỪ DB:
      ${productContext}

      CÂU HỎI CỦA KHÁCH: "${message}"
    `;

        const response = await genAI.models.generateContent({
            model: "gemini-2.0-flash",
            content: [
                {
                    role: "user",
                    parts: [{ text: prompt }],
                },
            ],
        });

        const text = response.text();

        res.json({ reply: text });
    } catch (error) {
        console.error("Lỗi Chatbot:", error);
        res.status(500).json({ reply: "Lỗi hệ thống AI." });
    }
};

module.exports = { handleChat };
