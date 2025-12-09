import React from "react";
import {
    FaTimes,
    FaMapMarkerAlt,
    FaPhone,
    FaBoxOpen,
    FaCreditCard,
    FaStickyNote,
} from "react-icons/fa";
import { formatCurrency, formatDateTime } from "../../helpers/formatters";

const OrderDetailModal = ({ isOpen, onClose, order }) => {
    if (!isOpen || !order) return null;

    // Helper render trạng thái (giống bên ngoài)
    const renderStatus = (status) => {
        const colors = {
            pending: "bg-orange-100 text-orange-700",
            paid: "bg-blue-100 text-blue-700",
            shipped: "bg-cyan-100 text-cyan-700",
            completed: "bg-green-100 text-green-700",
            cancelled: "bg-red-100 text-red-700",
        };
        return (
            <span
                className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide ${
                    colors[status] || "bg-gray-100"
                }`}
            >
                {status}
            </span>
        );
    };

    return (
        // Overlay
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
            {/* Modal Box */}
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col relative animate-scale-up">
                {/* Header */}
                <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                    <div>
                        <h3 className="text-lg font-bold text-gray-800">
                            Chi tiết đơn hàng
                        </h3>
                        <p className="text-sm text-gray-500">
                            Mã đơn:{" "}
                            <span className="font-mono font-bold text-primary-600">
                                #{order.id.slice(0, 8).toUpperCase()}
                            </span>
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full transition"
                    >
                        <FaTimes size={20} />
                    </button>
                </div>

                {/* Scrollable Content */}
                <div className="p-6 overflow-y-auto custom-scrollbar space-y-6">
                    {/* 1. Trạng thái & Ngày */}
                    <div className="flex justify-between items-center bg-blue-50 p-4 rounded-xl border border-blue-100">
                        <div className="flex flex-col">
                            <span className="text-xs text-blue-600 font-semibold uppercase mb-1">
                                Ngày đặt hàng
                            </span>
                            <span className="text-blue-900 font-medium">
                                {formatDateTime(order.created_at)}
                            </span>
                        </div>
                        <div className="text-right">
                            <span className="text-xs text-blue-600 font-semibold uppercase mb-1 block">
                                Trạng thái
                            </span>
                            {renderStatus(order.status)}
                        </div>
                    </div>

                    {/* 2. Danh sách sản phẩm */}
                    <div>
                        <h4 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
                            <FaBoxOpen className="text-primary-600" /> Sản phẩm
                            ({order.order_items.length})
                        </h4>
                        <div className="space-y-3">
                            {order.order_items.map((item) => (
                                <div
                                    key={item.id}
                                    className="flex gap-4 p-3 border border-gray-100 rounded-xl hover:bg-gray-50 transition"
                                >
                                    {/* Ảnh */}
                                    <img
                                        src={
                                            Array.isArray(item.products?.images)
                                                ? typeof item.products
                                                      .images[0] === "object"
                                                    ? item.products.images[0]
                                                          .large
                                                    : item.products.images[0]
                                                : item.products?.images
                                        }
                                        alt=""
                                        className="w-16 h-16 object-cover rounded-lg border border-gray-200 bg-white"
                                    />

                                    {/* Thông tin */}
                                    <div className="flex-1">
                                        <h5 className="font-semibold text-gray-800 line-clamp-2 text-sm">
                                            {item.products?.title}
                                        </h5>
                                        <p className="text-xs text-gray-500 mt-1">
                                            Đơn giá:{" "}
                                            {formatCurrency(item.price)}
                                        </p>
                                    </div>

                                    {/* Số lượng & Tổng */}
                                    <div className="text-right">
                                        <span className="block text-xs text-gray-500">
                                            x{item.quantity}
                                        </span>
                                        <span className="block font-bold text-primary-600">
                                            {formatCurrency(
                                                item.price * item.quantity
                                            )}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* 3. Thông tin giao hàng (2 Cột) */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Địa chỉ */}
                        <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                            <h4 className="font-bold text-gray-800 mb-3 flex items-center gap-2 text-sm">
                                <FaMapMarkerAlt className="text-red-500" /> Địa
                                chỉ nhận hàng
                            </h4>
                            <div className="text-sm text-gray-600 space-y-1">
                                <p className="font-semibold text-gray-900">
                                    {order.shipping_address?.recipient_name}
                                </p>
                                <p className="flex items-center gap-2">
                                    <FaPhone className="text-xs text-gray-400" />{" "}
                                    {order.shipping_address?.phone}
                                </p>
                                <p className="leading-relaxed mt-1">
                                    {order.shipping_address?.address_line1},{" "}
                                    {order.shipping_address?.city}
                                </p>
                            </div>
                        </div>

                        {/* Thanh toán & Ghi chú */}
                        <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                            <h4 className="font-bold text-gray-800 mb-3 flex items-center gap-2 text-sm">
                                <FaCreditCard className="text-blue-500" /> Thanh
                                toán
                            </h4>
                            <div className="text-sm text-gray-600 space-y-3">
                                <div className="flex justify-between">
                                    <span>Phương thức:</span>
                                    <span className="font-medium text-gray-900 capitalize">
                                        {order.payment_method === "cod"
                                            ? "Tiền mặt (COD)"
                                            : "Chuyển khoản"}
                                    </span>
                                </div>
                                {order.shipping_address?.note && (
                                    <div className="pt-2 border-t border-gray-200 mt-2">
                                        <p className="flex items-center gap-1 text-xs text-gray-500 mb-1">
                                            <FaStickyNote /> Ghi chú:
                                        </p>
                                        <p className="italic text-gray-800">
                                            {order.shipping_address.note}
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer: Tổng tiền */}
                <div className="p-6 border-t border-gray-100 bg-gray-50 flex justify-between items-center">
                    <span className="font-semibold text-gray-600">
                        Tổng thanh toán
                    </span>
                    <span className="text-2xl font-bold text-primary-600">
                        {formatCurrency(order.total_price)}
                    </span>
                </div>
            </div>
        </div>
    );
};

export default OrderDetailModal;
