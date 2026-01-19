const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const { handleChat } = require("./api/chatbot/chatController"); // Import controller
const productRoutes = require("./api/products/productRoutes"); // Import product routes

dotenv.config();
const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// --- ROUTES ---

// 1. Route Chatbot
app.post("/api/chat", handleChat);

// 2. Route Products
app.use("/api/products", productRoutes);

// 2. Route Recommend (Sau này sẽ thêm vào đây)
// const { getRecommendations } = require('./api/recommend/recommendController');
// app.get('/api/recommend', getRecommendations);

// --- START SERVER ---
if (process.env.NODE_ENV !== "production") {
    app.listen(port, () => {
        console.log(`🚀 Server đang chạy tại cổng ${port}`);
    });
}

module.exports = app;
