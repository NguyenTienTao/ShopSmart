import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { supabase } from "../services/supabaseClient";
import {
    FaBell,
    FaBoxOpen,
    FaTicketAlt,
    FaInfoCircle,
    FaCheckDouble,
    FaTrashAlt,
    FaCircle,
} from "react-icons/fa";
import { formatDateTime } from "../helpers/formatters";
import { toast } from "react-hot-toast";
import Loading from "../components/Loading";

const NotificationsPage = () => {
    const { user } = useSelector((state) => state.auth);
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState("all"); // 'all' | 'unread'
    const navigate = useNavigate();

    // 1. Fetch dữ liệu
    const fetchNotifications = async () => {
        if (!user) return;
        setLoading(true);
        try {
            let query = supabase
                .from("notifications")
                .select("*")
                .eq("user_id", user.id)
                .order("created_at", { ascending: false });

            // Nếu đang lọc 'Chưa đọc'
            if (filter === "unread") {
                query = query.eq("is_read", false);
            }

            const { data, error } = await query;
            if (error) throw error;
            setNotifications(data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchNotifications();
    }, [user, filter]);

    // 2. Xử lý Đọc tin
    const handleRead = async (noti) => {
        // Nếu chưa đọc thì đánh dấu đã đọc
        if (!noti.is_read) {
            await supabase
                .from("notifications")
                .update({ is_read: true })
                .eq("id", noti.id);
            // Cập nhật UI ngay lập tức
            setNotifications((prev) =>
                prev.map((n) =>
                    n.id === noti.id ? { ...n, is_read: true } : n
                )
            );
        }
        // Chuyển hướng nếu có link
        if (noti.link) navigate(noti.link);
    };

    // 3. Xóa tin
    const handleDelete = async (e, id) => {
        e.stopPropagation(); // Ngăn ko cho click vào dòng cha (handleRead)
        if (!window.confirm("Bạn muốn xóa thông báo này?")) return;

        try {
            await supabase.from("notifications").delete().eq("id", id);
            setNotifications((prev) => prev.filter((n) => n.id !== id));
            toast.success("Đã xóa thông báo");
        } catch (error) {
            toast.error("Lỗi xóa: " + error.message);
        }
    };

    // 4. Đánh dấu đã đọc tất cả
    const handleMarkAllRead = async () => {
        try {
            await supabase
                .from("notifications")
                .update({ is_read: true })
                .eq("user_id", user.id)
                .eq("is_read", false); // Chỉ update những cái chưa đọc

            setNotifications((prev) =>
                prev.map((n) => ({ ...n, is_read: true }))
            );
            toast.success("Đã đánh dấu tất cả là đã đọc");
        } catch (error) {
            toast.error("Lỗi: " + error.message);
        }
    };

    // Helper Icon
    const getIcon = (type) => {
        switch (type) {
            case "order":
                return (
                    <div className="p-3 bg-blue-100 text-blue-600 rounded-full">
                        <FaBoxOpen />
                    </div>
                );
            case "promo":
                return (
                    <div className="p-3 bg-orange-100 text-orange-600 rounded-full">
                        <FaTicketAlt />
                    </div>
                );
            default:
                return (
                    <div className="p-3 bg-gray-100 text-gray-600 rounded-full">
                        <FaInfoCircle />
                    </div>
                );
        }
    };

    if (!user) {
        return (
            <div className="py-20 text-center">
                <h2 className="text-xl font-bold text-gray-700">
                    Vui lòng đăng nhập để xem thông báo
                </h2>
            </div>
        );
    }

    return (
        <div className="bg-gray-50 min-h-screen py-8">
            <div className="container mx-auto px-4 max-w-3xl">
                {/* HEADER */}
                <div className="bg-white rounded-t-xl border-b border-gray-100 p-6 flex flex-col sm:flex-row justify-between items-center gap-4">
                    <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                        <FaBell className="text-primary-600" /> Thông báo của
                        tôi
                    </h1>

                    <button
                        onClick={handleMarkAllRead}
                        className="text-sm font-medium text-primary-600 hover:text-primary-700 flex items-center gap-1 bg-primary-50 px-4 py-2 rounded-lg transition"
                    >
                        <FaCheckDouble /> Đánh dấu đã đọc tất cả
                    </button>
                </div>

                {/* BỘ LỌC (TABS) */}
                <div className="bg-white p-4 flex gap-2 border-b border-gray-100">
                    <button
                        onClick={() => setFilter("all")}
                        className={`px-4 py-2 rounded-full text-sm font-medium transition ${
                            filter === "all"
                                ? "bg-primary-600 text-white shadow-md"
                                : "bg-transparent text-gray-500 hover:bg-gray-100"
                        }`}
                    >
                        Tất cả
                    </button>
                    <button
                        onClick={() => setFilter("unread")}
                        className={`px-4 py-2 rounded-full text-sm font-medium transition ${
                            filter === "unread"
                                ? "bg-primary-600 text-white shadow-md"
                                : "bg-transparent text-gray-500 hover:bg-gray-100"
                        }`}
                    >
                        Chưa đọc
                    </button>
                </div>

                {/* DANH SÁCH */}
                <div className="bg-white rounded-b-xl shadow-sm min-h-[400px]">
                    {loading ? (
                        <Loading />
                    ) : notifications.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-20 text-gray-400">
                            <FaBell className="text-6xl mb-4 opacity-20" />
                            <p>Bạn không có thông báo nào</p>
                        </div>
                    ) : (
                        <div>
                            {notifications.map((noti) => (
                                <div
                                    key={noti.id}
                                    onClick={() => handleRead(noti)}
                                    className={`group flex gap-4 p-5 border-b border-gray-50 cursor-pointer transition-all hover:bg-gray-50 relative ${
                                        !noti.is_read
                                            ? "bg-blue-50/30"
                                            : "bg-white"
                                    }`}
                                >
                                    {/* Chấm xanh chưa đọc */}
                                    {!noti.is_read && (
                                        <div className="absolute top-6 right-4 text-primary-600 text-xs">
                                            <FaCircle size={10} />
                                        </div>
                                    )}

                                    {/* Icon */}
                                    <div className="flex-shrink-0">
                                        {getIcon(noti.type)}
                                    </div>

                                    {/* Content */}
                                    <div className="flex-1 pr-8">
                                        <h4
                                            className={`text-sm mb-1 ${
                                                !noti.is_read
                                                    ? "font-bold text-gray-900"
                                                    : "font-medium text-gray-700"
                                            }`}
                                        >
                                            {noti.title}
                                        </h4>
                                        <p className="text-sm text-gray-600 leading-relaxed mb-2">
                                            {noti.message}
                                        </p>
                                        <span className="text-xs text-gray-400">
                                            {formatDateTime(noti.created_at)}
                                        </span>
                                    </div>

                                    {/* Nút Xóa (Hiện khi hover) */}
                                    <button
                                        onClick={(e) =>
                                            handleDelete(e, noti.id)
                                        }
                                        className="absolute bottom-4 right-4 text-gray-300 hover:text-red-500 p-2 opacity-0 group-hover:opacity-100 transition-opacity"
                                        title="Xóa thông báo"
                                    >
                                        <FaTrashAlt />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default NotificationsPage;
