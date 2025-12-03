import React, { useState } from "react";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { supabase } from "../services/supabaseClient";
import { FaShoppingCart, FaSpinner } from "react-icons/fa";
import { toast } from "react-hot-toast";

const AddToCartButton = ({ product, quantity = 1, iconOnly = false }) => {
    const { user } = useSelector((state) => state.auth);
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleAddToCart = async (e) => {
        // Ngăn chặn sự kiện click lan ra ngoài (ví dụ click vào card thì mở trang chi tiết)
        e.preventDefault();
        e.stopPropagation();

        // 1. CHẶN KHÁCH VÃNG LAI
        if (!user) {
            toast.error("Vui lòng đăng nhập để mua hàng!");
            // Tùy chọn: Chuyển hướng sang login hoặc chỉ báo lỗi
            navigate("/login");
            return;
        }

        if (loading) return;
        setLoading(true);

        try {
            // 2. KIỂM TRA SẢN PHẨM ĐÃ CÓ TRONG GIỎ CHƯA?
            const { data: existingItem, error: fetchError } = await supabase
                .from("cart_items")
                .select("id, quantity")
                .eq("user_id", user.id)
                .eq("product_id", product.id)
                .maybeSingle();

            if (fetchError) throw fetchError;

            if (existingItem) {
                // TRƯỜNG HỢP A: Đã có -> Tăng số lượng (Update)
                const newQuantity = existingItem.quantity + quantity;

                // Kiểm tra tồn kho (Optional nhưng nên làm)
                if (newQuantity > product.stock) {
                    toast.error(`Chỉ còn ${product.stock} sản phẩm trong kho!`);
                    setLoading(false);
                    return;
                }

                const { error } = await supabase
                    .from("cart_items")
                    .update({ quantity: newQuantity })
                    .eq("id", existingItem.id);

                if (error) throw error;
            } else {
                // TRƯỜNG HỢP B: Chưa có -> Thêm mới (Insert)
                if (quantity > product.stock) {
                    toast.error(`Hết hàng!`);
                    setLoading(false);
                    return;
                }

                const { error } = await supabase.from("cart_items").insert({
                    user_id: user.id,
                    product_id: product.id,
                    quantity: quantity,
                });

                if (error) throw error;
            }

            toast.success("Đã thêm vào giỏ hàng!");
        } catch (err) {
            console.error(err);
            toast.error("Lỗi thêm giỏ hàng: " + err.message);
        } finally {
            setLoading(false);
        }
    };

    // --- RENDER GIAO DIỆN ---

    // 1. Phiên bản Icon nhỏ (Dùng cho ProductCard)
    if (iconOnly) {
        return (
            <button
                onClick={handleAddToCart}
                disabled={loading}
                className="w-10 h-10 bg-primary-600 !text-white rounded-full flex items-center justify-center shadow-md hover:bg-primary-700 transition-transform transform hover:scale-110 disabled:opacity-70 disabled:cursor-not-allowed"
                title="Thêm vào giỏ"
            >
                {loading ? (
                    <FaSpinner className="animate-spin" />
                ) : (
                    <FaShoppingCart className="flex-shrink-0" />
                )}
            </button>
        );
    }

    // 2. Phiên bản Nút to (Dùng cho trang chi tiết)
    return (
        <button
            onClick={handleAddToCart}
            disabled={loading || product.stock === 0}
            className={`flex items-center justify-center gap-2 px-8 py-3 rounded-full font-bold text-lg transition shadow-lg ${
                product.stock === 0
                    ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                    : "bg-primary-600 text-white hover:bg-primary-700 hover:-translate-y-1"
            }`}
        >
            {loading ? (
                <>
                    <FaSpinner className="animate-spin" /> Đang xử lý...
                </>
            ) : product.stock === 0 ? (
                "Hết hàng"
            ) : (
                <>
                    <FaShoppingCart className="flex-shrink-0" /> Thêm vào giỏ
                    hàng
                </>
            )}
        </button>
    );
};

export default AddToCartButton;
