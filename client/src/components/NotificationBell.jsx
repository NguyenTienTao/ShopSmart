import React, { useEffect, useState, useRef } from "react";
import { useSelector } from "react-redux";
import { supabase } from "../services/supabaseClient";
import {
    FaBell,
    FaInfoCircle,
    FaBoxOpen,
    FaTicketAlt,
    FaExclamationCircle,
} from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { formatDateTime } from "../helpers/formatters";
import { toast } from "react-hot-toast";

const NotificationBell = () => {
    const { user } = useSelector((state) => state.auth);
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [isOpen, setIsOpen] = useState(false); // State mở menu
    const menuRef = useRef(null); // Ref để bắt sự kiện click ra ngoài
    const navigate = useNavigate();

    // 1. Fetch thông báo
    const fetchNotifications = async () => {
        if (!user) return;
        const { data, error } = await supabase
            .from("notifications")
            .select("*")
            .eq("user_id", user.id)
            .order("created_at", { ascending: false })
            .limit(10);

        if (!error && data) {
            setNotifications(data);
            setUnreadCount(data.filter((n) => !n.is_read).length);
        }
    };

    useEffect(() => {
        fetchNotifications();
        if (!user) return;

        // 2. Realtime
        const channel = supabase
            .channel("realtime-noti")
            .on(
                "postgres_changes",
                {
                    event: "INSERT",
                    schema: "public",
                    table: "notifications",
                    filter: `user_id=eq.${user.id}`,
                },
                (payload) => {
                    toast("🔔 " + payload.new.title, {
                        position: "bottom-right",
                    });
                    setNotifications((prev) => [payload.new, ...prev]);
                    setUnreadCount((prev) => prev + 1);
                },
            )
            .subscribe();

        // 3. Xử lý click ra ngoài để đóng menu
        const handleClickOutside = (event) => {
            if (menuRef.current && !menuRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);

        return () => {
            supabase.removeChannel(channel);
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [user]);

    // 4. Xử lý Đọc
    const handleRead = async (noti) => {
        setIsOpen(false); // Đóng menu

        if (!noti.is_read) {
            await supabase
                .from("notifications")
                .update({ is_read: true })
                .eq("id", noti.id);
            setNotifications((prev) =>
                prev.map((n) =>
                    n.id === noti.id ? { ...n, is_read: true } : n,
                ),
            );
            setUnreadCount((prev) => Math.max(0, prev - 1));
        }

        if (noti.link) navigate(noti.link);
    };

    // Helper chọn icon
    const getIcon = (type) => {
        switch (type) {
            case "order":
                return <FaBoxOpen className="text-blue-500" />;
            case "promo":
                return <FaTicketAlt className="text-orange-500" />;
            case "alert":
                return <FaExclamationCircle className="text-red-500" />;
            default:
                return <FaInfoCircle className="text-gray-500" />;
        }
    };

    return (
        <div className="relative" ref={menuRef}>
            {/* --- NÚT CHUÔNG --- */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`relative p-2 rounded-full transition-colors bg-transparent ${
                    isOpen
                        ? "bg-gray-100 text-primary-600"
                        : "text-gray-600 hover:text-primary-600 hover:bg-gray-50"
                }`}
            >
                <FaBell className="text-xl" />
                {unreadCount > 0 && (
                    <span className="absolute top-0 right-0 bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full border-2 border-white shadow-sm min-w-[18px] text-center">
                        {unreadCount > 99 ? "99+" : unreadCount}
                    </span>
                )}
            </button>

            {/* --- MENU DROPDOWN (Tự code) --- */}
            {isOpen && (
                <div className="absolute right-0 mt-3 w-80 md:w-96 bg-white rounded-xl shadow-2xl border border-gray-100 overflow-hidden z-50 origin-top-right animate-fade-in-up">
                    {/* Header */}
                    <div className="px-4 py-3 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
                        <h3 className="font-bold text-gray-700">Thông báo</h3>
                        {unreadCount > 0 && (
                            <span className="text-xs text-primary-600 font-medium">
                                {unreadCount} chưa đọc
                            </span>
                        )}
                    </div>

                    {/* List */}
                    <div className="max-h-[400px] overflow-y-auto custom-scrollbar">
                        {notifications.length === 0 ? (
                            <div className="py-12 text-center text-gray-400 flex flex-col items-center">
                                <FaBell className="text-4xl mb-2 opacity-20" />
                                <p className="text-sm">
                                    Không có thông báo nào
                                </p>
                            </div>
                        ) : (
                            notifications.map((noti) => (
                                <div
                                    key={noti.id}
                                    onClick={() => handleRead(noti)}
                                    className={`flex gap-4 p-4 border-b border-gray-50 cursor-pointer transition-colors hover:bg-gray-50 ${
                                        !noti.is_read
                                            ? "bg-blue-50/40"
                                            : "bg-white"
                                    }`}
                                >
                                    {/* Icon */}
                                    <div className="mt-1 text-lg flex-shrink-0 bg-white p-2 rounded-full h-fit shadow-sm border border-gray-100">
                                        {getIcon(noti.type)}
                                    </div>

                                    {/* Nội dung */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex justify-between items-start mb-1">
                                            <h4
                                                className={`text-sm truncate pr-2 ${
                                                    !noti.is_read
                                                        ? "font-bold text-gray-900"
                                                        : "font-medium text-gray-700"
                                                }`}
                                            >
                                                {noti.title}
                                            </h4>
                                            {!noti.is_read && (
                                                <span className="w-2 h-2 bg-primary-500 rounded-full flex-shrink-0 mt-1.5"></span>
                                            )}
                                        </div>
                                        <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed mb-1">
                                            {noti.message}
                                        </p>
                                        <span className="text-[10px] text-gray-400 font-medium">
                                            {formatDateTime(noti.created_at)}
                                        </span>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>

                    {/* Footer */}
                    <div className="p-2 bg-gray-50 border-t border-gray-100 text-center">
                        <button
                            onClick={() => {
                                setIsOpen(false);
                                navigate("/notifications"); // <--- Link tới trang vừa tạo
                            }}
                            className="text-xs font-semibold bg-transparent text-primary-600 hover:underline"
                        >
                            Xem tất cả
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default NotificationBell;
