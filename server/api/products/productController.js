const { GoogleGenerativeAI } = require("@google/generative-ai");
const supabase = require("../../utils/supabaseClient");
require("dotenv").config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
// Model tạo Vector
const embeddingModel = genAI.getGenerativeModel({
    model: "text-embedding-004",
});

// --- HÀM TẠO VECTOR (Thông minh hơn: Đọc cả Features) ---
async function createEmbeddingText(title, description, categoryId, features) {
    try {
        // 1. Lấy tên danh mục
        let categoryName = "";
        if (categoryId) {
            const { data: cate } = await supabase
                .from("categories")
                .select("name")
                .eq("id", categoryId)
                .single();
            if (cate) categoryName = cate.name;
        }

        // 2. Chuyển Features (JSON) thành text
        // VD: { "RAM": "16GB", "Color": "Black" } -> "RAM: 16GB, Color: Black"
        let featureText = "";
        if (features && typeof features === "object") {
            featureText = Object.entries(features)
                .map(([key, value]) => `${key}: ${value}`)
                .join(", ");
        }

        // 3. Tạo chuỗi tổng hợp để AI học
        // Bot sẽ hiểu: "Đây là Laptop Gaming (Category), tên là Asus ROG (Title), RAM 16GB (Features)..."
        const textToEmbed = `Product: ${title}. Category: ${categoryName}. Desc: ${description}. Specs: ${featureText}`;

        const result = await embeddingModel.embedContent(textToEmbed);
        return result.embedding.values;
    } catch (error) {
        console.error("⚠️ Lỗi tạo Vector:", error.message);
        return null;
    }
}

// --- CREATE PRODUCT ---
const createProduct = async (req, res) => {
    try {
        const {
            title,
            price,
            stock,
            category_id,
            description,
            images,
            features,
        } = req.body;

        console.log(`⚡ Thêm SP mới: ${title}`);

        // Tạo vector
        const vector = await createEmbeddingText(
            title,
            description,
            category_id,
            features
        );

        const { data, error } = await supabase
            .from("products")
            .insert([
                {
                    title,
                    price,
                    stock: stock || 0,
                    category_id,
                    description,
                    images: images || [], // Lưu mảng ảnh
                    features: features || {}, // Lưu JSON features
                    embedding: vector, // Lưu Vector
                    rating_number: 0, // Mặc định
                },
            ])
            .select();

        if (error) throw error;
        res.status(201).json({ message: "Thêm thành công!", product: data[0] });
    } catch (error) {
        console.error("❌ Lỗi Create:", error.message);
        res.status(500).json({ error: error.message });
    }
};

// --- UPDATE PRODUCT ---
const updateProduct = async (req, res) => {
    try {
        const { id } = req.params;
        const {
            title,
            price,
            stock,
            category_id,
            description,
            images,
            features,
        } = req.body;

        console.log(`⚡ Update SP ID: ${id}`);

        let updateData = {
            title,
            price,
            stock,
            category_id,
            description,
            images,
            features,
        };

        // Chỉ tạo lại Vector nếu sửa nội dung quan trọng
        if (title || description || features || category_id) {
            console.log("🔄 Nội dung thay đổi -> Tạo lại Vector...");

            // Lấy dữ liệu cũ để bù vào nếu thiếu
            const { data: oldData } = await supabase
                .from("products")
                .select("*")
                .eq("id", id)
                .single();

            const finalTitle = title || oldData.title;
            const finalDesc = description || oldData.description;
            const finalCateId = category_id || oldData.category_id;
            const finalFeatures = features || oldData.features;

            const newVector = await createEmbeddingText(
                finalTitle,
                finalDesc,
                finalCateId,
                finalFeatures
            );
            if (newVector) updateData.embedding = newVector;
        }

        const { data, error } = await supabase
            .from("products")
            .update(updateData)
            .eq("id", id)
            .select();

        if (error) throw error;
        res.json({ message: "Update thành công!", product: data[0] });
    } catch (error) {
        console.error("❌ Lỗi Update:", error.message);
        res.status(500).json({ error: error.message });
    }
};

const deleteProduct = async (req, res) => {
    try {
        const { id } = req.params;
        const { error } = await supabase.from("products").delete().eq("id", id);
        if (error) throw error;
        res.json({ message: "Đã xóa sản phẩm." });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

module.exports = { createProduct, updateProduct, deleteProduct };
