import { useState, useEffect, useRef } from "react";
import {
    FaRobot,
    FaPaperPlane,
    FaTimes,
    FaMinus,
    FaCommentDots,
} from "react-icons/fa";
import ReactMarkdown from "react-markdown"; // Để render text đẹp (in đậm, xuống dòng)

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const ChatBot = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState([
        {
            id: 1,
            text: "Xin chào! Mình là AI của ShopSmart. Bạn cần tìm sản phẩm gì không?",
            sender: "bot",
        },
    ]);
    const [input, setInput] = useState("");
    const [isTyping, setIsTyping] = useState(false);
    const messagesEndRef = useRef(null);

    // Auto scroll xuống cuối
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages, isOpen]);

    const handleSend = async (e) => {
        e.preventDefault();
        if (!input.trim()) return;

        const userMessage = input;
        setInput(""); // Xóa ô nhập liệu

        // 1. Hiện tin nhắn user
        setMessages((prev) => [
            ...prev,
            { id: Date.now(), text: userMessage, sender: "user" },
        ]);
        setIsTyping(true);

        try {
            // 2. Gọi API Server (Localhost:5000)
            const response = await fetch(`${API_URL}/chat`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ message: userMessage }),
            });

            const data = await response.json();

            // 3. Hiện tin nhắn Bot
            setMessages((prev) => [
                ...prev,
                { id: Date.now() + 1, text: data.reply, sender: "bot" },
            ]);
        } catch (error) {
            setMessages((prev) => [
                ...prev,
                {
                    id: Date.now() + 1,
                    text: "⚠️ Lỗi kết nối server. Hãy đảm bảo bạn đã chạy 'npm run dev' ở folder server!",
                    sender: "bot",
                },
            ]);
        } finally {
            setIsTyping(false);
        }
    };

    return (
        <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end font-sans">
            {/* KHUNG CHAT */}
            {isOpen && (
                <div className="bg-white w-[350px] h-[500px] rounded-2xl shadow-2xl border border-gray-200 flex flex-col overflow-hidden animate-fade-in-up mb-4">
                    {/* Header */}
                    <div className="bg-gradient-to-r from-primary-600 to-primary-500 p-4 flex justify-between items-center text-white shadow-sm">
                        <div className="flex items-center gap-3">
                            <div className="bg-white/20 p-2 rounded-full">
                                <FaRobot className="text-white text-lg" />
                            </div>
                            <div>
                                <h3 className="font-bold text-sm">
                                    ShopSmart AI
                                </h3>
                                <span className="text-xs text-green-200 flex items-center gap-1">
                                    <span className="w-2 h-2 bg-green-300 rounded-full animate-pulse"></span>{" "}
                                    Online
                                </span>
                            </div>
                        </div>
                        <button
                            onClick={() => setIsOpen(false)}
                            className="bg-transparent text-white/80 hover:text-white transition"
                        >
                            <FaMinus />
                        </button>
                    </div>

                    {/* Body */}
                    <div className="flex-1 p-4 overflow-y-auto bg-gray-50 space-y-4 custom-scrollbar">
                        {messages.map((msg) => (
                            <div
                                key={msg.id}
                                className={`flex ${
                                    msg.sender === "user"
                                        ? "justify-end"
                                        : "justify-start"
                                }`}
                            >
                                {msg.sender === "bot" && (
                                    <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center mr-2 flex-shrink-0">
                                        <FaRobot className="text-primary-600 text-xs" />
                                    </div>
                                )}
                                <div
                                    className={`max-w-[75%] p-3 text-sm leading-relaxed shadow-sm ${
                                        msg.sender === "user"
                                            ? "bg-primary-600 text-white rounded-2xl rounded-tr-sm"
                                            : "bg-white text-gray-800 border border-gray-100 rounded-2xl rounded-tl-sm"
                                    }`}
                                >
                                    {/* Dùng ReactMarkdown để bot trả về chữ in đậm hoặc list được */}
                                    <ReactMarkdown>{msg.text}</ReactMarkdown>
                                </div>
                            </div>
                        ))}

                        {isTyping && (
                            <div className="flex justify-start items-center gap-2">
                                <div className="w-8 h-8 rounded-full bg-gray-200 animate-pulse"></div>
                                <div className="bg-white p-3 rounded-2xl rounded-tl-sm border border-gray-100 shadow-sm text-gray-400">
                                    <FaCommentDots className="animate-bounce" />
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Input */}
                    <form
                        onSubmit={handleSend}
                        className="p-3 bg-white border-t border-gray-100 flex gap-2 items-center"
                    >
                        <input
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            placeholder="Hỏi về sản phẩm..."
                            className="flex-1 px-4 py-2.5 bg-gray-100 rounded-full focus:outline-none focus:ring-2 focus:ring-primary-100 focus:bg-white transition text-sm text-gray-700"
                        />
                        <button
                            type="submit"
                            disabled={!input.trim() || isTyping}
                            className="p-3 bg-primary-600 text-white rounded-full hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
                        >
                            <FaPaperPlane />
                        </button>
                    </form>
                </div>
            )}

            {/* NÚT TRÒN MỞ CHAT */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`w-14 h-14 rounded-full shadow-2xl flex items-center justify-center transition-all transform hover:scale-110 duration-300 ${
                    isOpen
                        ? "bg-gray-200 text-gray-600 rotate-90"
                        : "bg-gradient-to-tr from-primary-600 to-primary-400 text-white animate-bounce-slow"
                }`}
            >
                {isOpen ? <FaTimes size={24} /> : <FaRobot size={28} />}
            </button>
        </div>
    );
};

export default ChatBot;
