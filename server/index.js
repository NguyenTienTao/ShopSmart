const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const { handleChat } = require("./api/chatbot/chatController"); // Import controller

dotenv.config();
const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// --- ROUTES ---

// 1. Route Chatbot
app.post("/api/chat", handleChat);

// 2. Route Recommend (Sau này sẽ thêm vào đây)
// const { getRecommendations } = require('./api/recommend/recommendController');
// app.get('/api/recommend', getRecommendations);

// --- START SERVER ---
app.listen(port, () => {
    console.log(`🚀 Server đang chạy tại http://localhost:${port}`);
});
