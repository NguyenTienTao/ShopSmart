import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { Link } from "react-router-dom";
import { supabase } from "../services/supabaseClient";
import { formatCurrency, formatDateTime } from "../helpers/formatters";
import Loading from "../components/Loading";
import OrderDetailModal from "../components/order/OrderDetailModal";
import {
    FaBoxOpen,
    FaTruck,
    FaCheckCircle,
    FaTimesCircle,
    FaClock,
    FaEye,
} from "react-icons/fa";

const MyOrdersPage = () => {
    const { user } = useSelector((state) => state.auth);
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);

    const [selectedOrder, setSelectedOrder] = useState(null);

    // 1. Fetch Đơn hàng của tôi
    useEffect(() => {
        document.title = "Lịch sử đơn hàng";

        const fetchMyOrders = async () => {
            if (!user) return;
            try {
                setLoading(true);
                // Lấy Orders kèm theo Order Items và thông tin Product
                const { data, error } = await supabase
                    .from("orders")
                    .select(
                        `*, order_items (id, quantity, price, products(title, images))`
                    )
                    .eq("user_id", user.id)
                    .order("created_at", { ascending: false }); // Mới nhất lên đầu

                if (error) throw error;
                setOrders(data);
            } catch (error) {
                console.error("Lỗi tải đơn hàng:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchMyOrders();
    }, [user?.id]);

    // --- HELPER: Render trạng thái đơn hàng (Màu sắc & Icon) ---
    const renderStatus = (status) => {
        const styles = {
            pending: {
                color: "text-orange-600",
                bg: "bg-orange-50",
                icon: <FaClock />,
                label: "Chờ xử lý",
            },
            paid: {
                color: "text-blue-600",
                bg: "bg-blue-50",
                icon: <FaBoxOpen />,
                label: "Đã thanh toán",
            },
            shipped: {
                color: "text-cyan-600",
                bg: "bg-cyan-50",
                icon: <FaTruck />,
                label: "Đang giao hàng",
            },
            completed: {
                color: "text-green-600",
                bg: "bg-green-50",
                icon: <FaCheckCircle />,
                label: "Hoàn thành",
            },
            cancelled: {
                color: "text-red-600",
                bg: "bg-red-50",
                icon: <FaTimesCircle />,
                label: "Đã hủy",
            },
        };

        const s = styles[status] || styles.pending;

        return (
            <span
                className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${s.bg} ${s.color}`}
            >
                {s.icon} {s.label}
            </span>
        );
    };

    // --- RENDER ---

    if (loading) return <Loading fullScreen />;

    if (orders.length === 0) {
        return (
            <div className="container mx-auto px-4 py-20 text-center">
                <div className="inline-flex bg-gray-100 p-6 rounded-full mb-6">
                    <FaBoxOpen className="text-5xl text-gray-400" />
                </div>
                <h2 className="text-2xl font-bold text-gray-800 mb-2">
                    Bạn chưa có đơn hàng nào
                </h2>
                <p className="text-gray-500 mb-8">
                    Hãy khám phá các sản phẩm tuyệt vời của chúng tôi nhé!
                </p>
                <Link
                    to="/"
                    className="bg-primary-600 text-white px-8 py-3 rounded-full font-bold hover:bg-primary-700 transition"
                >
                    Bắt đầu mua sắm
                </Link>
            </div>
        );
    }

    return (
        <div className="bg-gray-50 min-h-screen py-8">
            <div className="container mx-auto px-4 max-w-5xl">
                <h1 className="text-2xl font-bold text-gray-900 mb-6">
                    Lịch sử đơn hàng
                </h1>

                <div className="space-y-4">
                    {orders.map((order) => (
                        // --- THẺ ĐƠN HÀNG (GỌN HƠN) ---
                        <div
                            key={order.id}
                            className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden hover:shadow-md transition-shadow"
                        >
                            <div className="p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                                {/* Cột trái: Thông tin chính */}
                                <div className="flex-1">
                                    <div className="flex items-center gap-3 mb-2">
                                        <span className="font-mono font-bold text-gray-800 text-lg">
                                            #
                                            {order.id.slice(0, 8).toUpperCase()}
                                        </span>
                                        {renderStatus(order.status)}
                                    </div>

                                    <div className="text-sm text-gray-500 space-y-1">
                                        <p>
                                            Ngày đặt:{" "}
                                            <span className="font-medium text-gray-700">
                                                {formatDateTime(
                                                    order.created_at
                                                )}
                                            </span>
                                        </p>
                                        <p>
                                            Số lượng:{" "}
                                            <span className="font-medium text-gray-700">
                                                {order.order_items.length} sản
                                                phẩm
                                            </span>
                                        </p>
                                    </div>
                                </div>

                                {/* Cột phải: Tổng tiền & Nút bấm */}
                                <div className="flex flex-col items-end gap-3 min-w-[150px]">
                                    <p className="text-sm text-gray-500">
                                        Tổng tiền
                                    </p>
                                    <p className="text-2xl font-bold text-primary-600">
                                        {formatCurrency(order.total_price)}
                                    </p>

                                    <button
                                        onClick={() => setSelectedOrder(order)} // <--- BẤM ĐỂ MỞ MODAL
                                        className="flex items-center gap-2 px-5 py-2 bg-white border border-primary-200 text-primary-600 rounded-lg hover:bg-primary-50 transition font-medium text-sm"
                                    >
                                        <FaEye /> Xem chi tiết
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* --- MODAL CHI TIẾT ĐƠN HÀNG --- */}
            <OrderDetailModal
                isOpen={!!selectedOrder}
                onClose={() => setSelectedOrder(null)}
                order={selectedOrder}
            />
        </div>
    );
};

export default MyOrdersPage;
