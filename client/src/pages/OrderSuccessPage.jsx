import React, { useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { FaCheckCircle, FaShoppingBag, FaFileAlt } from "react-icons/fa";

const OrderSuccessPage = () => {
    const location = useLocation();
    const navigate = useNavigate();

    // Lấy mã đơn hàng từ trang Checkout truyền sang
    const orderId = location.state?.orderId;

    useEffect(() => {
        // Nếu ai đó cố tình vào trang này mà không có mã đơn -> Đá về trang chủ
        if (!orderId) {
            navigate("/");
            return;
        }
    }, [orderId, navigate]);

    if (!orderId) return null;

    return (
        <div className="min-h-[70vh] flex items-center justify-center bg-gray-50 px-4 py-12">
            <div className="max-w-md w-full bg-white rounded-3xl shadow-xl p-8 md:p-12 text-center border border-gray-100 relative overflow-hidden">
                {/* Hình nền trang trí mờ */}
                <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-green-400 to-primary-500"></div>

                {/* Icon Thành công */}
                <div className="mb-6 relative">
                    <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto animate-bounce-slow">
                        <FaCheckCircle className="text-6xl text-green-500" />
                    </div>
                </div>

                {/* Nội dung chính */}
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                    Đặt hàng thành công!
                </h1>
                <p className="text-gray-500 mb-8">
                    Cảm ơn bạn đã mua sắm tại ShopSmart. Đơn hàng của bạn đã
                    được tiếp nhận và đang xử lý.
                </p>

                {/* Box thông tin đơn hàng */}
                <div className="bg-gray-50 rounded-xl p-5 mb-8 border border-gray-200 border-dashed">
                    <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold mb-1">
                        Mã đơn hàng
                    </p>
                    <p className="text-2xl font-mono font-bold text-primary-600 tracking-widest">
                        #{orderId.slice(0, 8).toUpperCase()}
                    </p>
                    <p className="text-xs text-gray-400 mt-2">
                        (Vui lòng lưu lại mã này để tra cứu)
                    </p>
                </div>

                {/* Nút hành động */}
                <div className="space-y-3">
                    <Link
                        to="/my-orders"
                        className="w-full flex items-center justify-center gap-2 bg-primary-600 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-primary-500/30 hover:bg-primary-700 transition transform hover:-translate-y-1"
                    >
                        <FaFileAlt /> Xem chi tiết đơn hàng
                    </Link>

                    <Link
                        to="/"
                        className="w-full flex items-center justify-center gap-2 bg-white text-gray-700 font-semibold py-3.5 rounded-xl border border-gray-200 hover:bg-gray-50 transition"
                    >
                        <FaShoppingBag /> Tiếp tục mua sắm
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default OrderSuccessPage;
