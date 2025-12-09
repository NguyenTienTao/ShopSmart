import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "../services/supabaseClient";
import {
    FaTrashAlt,
    FaHeart,
    FaMinus,
    FaPlus,
    FaArrowLeft,
    FaGift,
} from "react-icons/fa";
import { formatCurrency } from "../helpers/formatters";
import Loading from "../components/Loading";
import { toast } from "react-hot-toast";

const CartPage = () => {
    const { user } = useSelector((state) => state.auth);
    const [cartItems, setCartItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    // Phí ship giả định (sau này có thể tính động)
    const SHIPPING_COST = 0;

    // 1. Fetch dữ liệu giỏ hàng
    const fetchCart = async () => {
        if (!user) {
            setLoading(false);
            return;
        }
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from("cart_items")
                .select(
                    `
          id,
          quantity,
          product_id,
          products ( id, title, price, images, stock, category_id, categories(name) )
        `
                )
                .eq("user_id", user.id)
                .order("created_at", { ascending: false });

            if (error) throw error;
            setCartItems(data);
        } catch (error) {
            console.error(error);
            toast.error("Không thể tải giỏ hàng");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        document.title = "Giỏ hàng";
        fetchCart();
    }, [user?.id]);

    // 2. Cập nhật số lượng
    const updateQuantity = async (itemId, newQuantity, maxStock) => {
        if (newQuantity < 1) return;
        if (newQuantity > maxStock) {
            toast.error(`Chỉ còn ${maxStock} sản phẩm trong kho!`);
            return;
        }

        // Optimistic Update (Cập nhật giao diện trước)
        setCartItems((prev) =>
            prev.map((item) =>
                item.id === itemId ? { ...item, quantity: newQuantity } : item
            )
        );

        // Gọi API ngầm
        await supabase
            .from("cart_items")
            .update({ quantity: newQuantity })
            .eq("id", itemId);
    };

    // 3. Xóa sản phẩm
    const removeItem = async (itemId) => {
        const confirm = window.confirm("Bạn có chắc muốn xóa sản phẩm này?");
        if (!confirm) return;

        // Optimistic Update
        setCartItems((prev) => prev.filter((item) => item.id !== itemId));

        await supabase.from("cart_items").delete().eq("id", itemId);
        toast.success("Đã xóa sản phẩm");
    };

    // 4. Chuyển sang Yêu thích (Save for later)
    const moveToWishlist = async (cartItem) => {
        try {
            // Thêm vào favorites
            await supabase.from("favorites").upsert({
                user_id: user.id,
                product_id: cartItem.product_id,
            });

            // Xóa khỏi cart
            await supabase.from("cart_items").delete().eq("id", cartItem.id);

            setCartItems((prev) =>
                prev.filter((item) => item.id !== cartItem.id)
            );
            toast.success("Đã chuyển sang danh sách yêu thích");
        } catch (error) {
            toast.error("Lỗi: " + error.message);
        }
    };

    // Tính toán tổng tiền
    const subtotal = cartItems.reduce(
        (sum, item) => sum + item.quantity * (item.products?.price || 0),
        0
    );
    const total = subtotal + (cartItems.length > 0 ? SHIPPING_COST : 0);

    // --- RENDER ---

    if (!user) {
        return (
            <div className="container mx-auto px-4 py-20 text-center">
                <h2 className="text-2xl font-bold mb-4">
                    Giỏ hàng của bạn đang chờ!
                </h2>
                <p className="text-gray-500 mb-6">
                    Vui lòng đăng nhập để xem giỏ hàng và tiếp tục mua sắm.
                </p>
                <Link
                    to="/login"
                    className="inline-block bg-primary-600 text-white px-8 py-3 rounded-full font-bold hover:bg-primary-700 transition"
                >
                    Đăng nhập ngay
                </Link>
            </div>
        );
    }

    if (loading) return <Loading />;

    if (cartItems.length === 0) {
        return (
            <div className="container mx-auto px-4 py-20 text-center">
                <img
                    src="https://cdni.iconscout.com/illustration/premium/thumb/empty-cart-2130356-1800917.png"
                    alt="Empty Cart"
                    className="w-64 mx-auto mb-6 opacity-80"
                />
                <h2 className="text-2xl font-bold text-gray-800 mb-2">
                    Giỏ hàng trống trơn
                </h2>
                <p className="text-gray-500 mb-8">
                    Có vẻ như bạn chưa thêm sản phẩm nào. Hãy dạo một vòng nhé!
                </p>
                <Link
                    to="/"
                    className="inline-block bg-primary-600 text-white px-8 py-3 rounded-full font-bold hover:bg-primary-700 transition"
                >
                    Tiếp tục mua sắm
                </Link>
            </div>
        );
    }

    return (
        <div className="bg-gray-50 min-h-screen py-8">
            <div className="container mx-auto px-4">
                <h1 className="text-2xl font-bold text-gray-900 mb-6">
                    Giỏ hàng ({cartItems.length})
                </h1>

                <div className="flex flex-col lg:flex-row gap-8">
                    {/* --- CỘT TRÁI: DANH SÁCH SẢN PHẨM --- */}
                    <div className="flex-1 space-y-4">
                        {cartItems.map((item) => {
                            const product = item.products;
                            const imgUrl = Array.isArray(product.images)
                                ? typeof product.images[0] === "object"
                                    ? product.images[0].large
                                    : product.images[0]
                                : product.images;

                            return (
                                <div
                                    key={item.id}
                                    className="bg-white p-4 sm:p-6 rounded-xl border border-gray-200 shadow-sm flex flex-col sm:flex-row gap-6 transition hover:shadow-md"
                                >
                                    {/* Ảnh sản phẩm */}
                                    <Link
                                        to={`/product/${product.id}`}
                                        className="flex-shrink-0"
                                    >
                                        <div className="w-24 h-24 sm:w-32 sm:h-32 bg-gray-100 rounded-lg overflow-hidden border border-gray-100">
                                            <img
                                                src={imgUrl}
                                                alt={product.title}
                                                className="w-full h-full object-contain p-2"
                                            />
                                        </div>
                                    </Link>

                                    {/* Thông tin chi tiết */}
                                    <div className="flex-1 flex flex-col justify-between">
                                        <div>
                                            <div className="flex justify-between items-start mb-2">
                                                <div>
                                                    <Link
                                                        to={`/product/${product.id}`}
                                                        className="text-lg font-bold text-gray-800 hover:text-primary-600 line-clamp-2"
                                                    >
                                                        {product.title}
                                                    </Link>
                                                    <p className="text-sm text-gray-500 mt-1">
                                                        Phân loại:{" "}
                                                        <span className="text-gray-700 font-medium">
                                                            {
                                                                product
                                                                    .categories
                                                                    ?.name
                                                            }
                                                        </span>
                                                    </p>
                                                    <p className="text-sm text-green-600 font-medium mt-1">
                                                        {product.stock > 0
                                                            ? "Còn hàng"
                                                            : "Hết hàng"}
                                                    </p>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-xl font-bold text-gray-900">
                                                        {formatCurrency(
                                                            product.price
                                                        )}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Bộ điều khiển bên dưới */}
                                        <div className="flex flex-wrap items-center justify-between gap-4 mt-4 pt-4 border-t border-gray-100">
                                            {/* Bộ chọn số lượng */}
                                            <div className="flex items-center gap-3">
                                                <span className="hidden sm:inline text-sm text-gray-500">
                                                    Số lượng:
                                                </span>
                                                <div className="flex items-center border border-gray-300 rounded-lg bg-white">
                                                    <button
                                                        onClick={() =>
                                                            updateQuantity(
                                                                item.id,
                                                                item.quantity -
                                                                    1,
                                                                product.stock
                                                            )
                                                        }
                                                        className="px-3 py-1.5 bg-transparent text-gray-600 hover:bg-gray-50 rounded-l-lg disabled:opacity-50"
                                                        disabled={
                                                            item.quantity <= 1
                                                        }
                                                    >
                                                        <FaMinus className="text-xs" />
                                                    </button>
                                                    <span className="w-10 text-center font-semibold text-gray-700">
                                                        {item.quantity}
                                                    </span>
                                                    <button
                                                        onClick={() =>
                                                            updateQuantity(
                                                                item.id,
                                                                item.quantity +
                                                                    1,
                                                                product.stock
                                                            )
                                                        }
                                                        className="px-3 py-1.5 bg-transparent text-gray-600 hover:bg-gray-50 rounded-r-lg"
                                                    >
                                                        <FaPlus className="text-xs" />
                                                    </button>
                                                </div>
                                            </div>

                                            {/* Các nút hành động */}
                                            <div className="flex items-center gap-4">
                                                <button
                                                    onClick={() =>
                                                        moveToWishlist(item)
                                                    }
                                                    className="flex items-center gap-1.5 text-sm bg-white text-gray-500 hover:text-primary-600 transition"
                                                >
                                                    <FaHeart />{" "}
                                                    <span className="hidden sm:inline">
                                                        Yêu thích
                                                    </span>
                                                </button>
                                                <button
                                                    onClick={() =>
                                                        removeItem(item.id)
                                                    }
                                                    className="flex items-center gap-1.5 bg-transparent text-sm text-gray-500 hover:text-red-500 transition"
                                                >
                                                    <FaTrashAlt />{" "}
                                                    <span className="hidden sm:inline">
                                                        Xóa
                                                    </span>
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}

                        <Link
                            to="/"
                            className="inline-flex items-center gap-2 text-primary-600 font-semibold hover:underline mt-4"
                        >
                            <FaArrowLeft /> Tiếp tục mua sắm
                        </Link>
                    </div>

                    {/* --- CỘT PHẢI: TỔNG KẾT ĐƠN HÀNG --- */}
                    <div className="w-full lg:w-96 flex-shrink-0">
                        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm sticky top-24">
                            <h3 className="text-lg font-bold text-gray-900 mb-6">
                                Tóm tắt đơn hàng
                            </h3>

                            <div className="space-y-4 border-b border-gray-100 pb-6 mb-6">
                                <div className="flex justify-between text-gray-600">
                                    <span>
                                        Tạm tính ({cartItems.length} món)
                                    </span>
                                    <span className="font-medium text-gray-900">
                                        {formatCurrency(subtotal)}
                                    </span>
                                </div>
                                <div className="flex justify-between text-gray-600">
                                    <span>Phí vận chuyển (Dự kiến)</span>
                                    <span className="font-medium text-gray-900">
                                        {formatCurrency(SHIPPING_COST)}
                                    </span>
                                </div>
                                {/* <div className="flex justify-between text-green-600">
                  <span>Giảm giá</span>
                  <span>- 0đ</span>
                </div> */}
                            </div>

                            <div className="flex justify-between items-end mb-6">
                                <span className="text-lg font-bold text-gray-900">
                                    Tổng cộng
                                </span>
                                <span className="text-2xl font-bold text-primary-600">
                                    {formatCurrency(total)}
                                </span>
                            </div>

                            <button
                                onClick={() => navigate("/cart/checkout")}
                                className="w-full bg-secondary-500 text-white font-bold py-4 rounded-xl shadow-lg shadow-secondary-500/30 hover:bg-secondary-600 transition transform hover:-translate-y-1"
                            >
                                THANH TOÁN NGAY
                            </button>

                            <div className="mt-6 flex gap-3 p-4 bg-primary-50 rounded-lg border border-primary-100">
                                <div className="p-2 bg-white rounded-full h-fit text-primary-500 shadow-sm">
                                    <FaGift />
                                </div>
                                <div>
                                    <p className="text-sm font-bold text-gray-800">
                                        Gửi tặng quà?
                                    </p>
                                    <p className="text-xs text-gray-500 mt-1">
                                        Chọn gói quà và viết thiệp ở bước thanh
                                        toán tiếp theo.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CartPage;
