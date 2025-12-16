const { GoogleGenerativeAI } = require("@google/generative-ai");
require("dotenv").config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

async function listRealModels() {
    try {
        // Gọi thẳng lên Google hỏi: "Tao được dùng những cái nào?"
        const modelResponse = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models?key=${process.env.GEMINI_API_KEY}`
        );
        const data = await modelResponse.json();

        console.log("=== DANH SÁCH MODEL CHẠY ĐƯỢC 100% ===");
        const availableModels = data.models
            .filter((m) =>
                m.supportedGenerationMethods.includes("generateContent")
            )
            .map((m) => m.name.replace("models/", ""));

        console.log(availableModels);
    } catch (error) {
        console.error("Lỗi:", error.message);
    }
}

listRealModels();
