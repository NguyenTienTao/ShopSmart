import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { Link } from "react-router-dom";
import { supabase } from "../services/supabaseClient";
import ProductCard from "../components/ProductCard";
import Loading from "../components/Loading";
import { FaHeart, FaShoppingBag } from "react-icons/fa";

const WishlistPage = () => {
    const { user } = useSelector((state) => state.auth);
    const [favorites, setFavorites] = useState([]);
    const [loading, setLoading] = useState(true);

    // 1. Lấy danh sách yêu thích
    useEffect(() => {
        document.title = "Yêu thích";

        const fetchWishlist = async () => {
            if (!user) {
                setLoading(false);
                return;
            }

            try {
                setLoading(true);
                // Lấy bảng favorites và join sang bảng products để lấy thông tin chi tiết
                const { data, error } = await supabase
                    .from("favorites")
                    .select(`id, product_id, products (*)`)
                    .eq("user_id", user.id)
                    .order("created_at", { ascending: false });

                if (error) throw error;

                // Data trả về dạng [{id: 1, products: {...}}, ...]
                // Chúng ta map lại để lấy danh sách products ra ngoài cho dễ dùng
                const productsOnly = data.map((item) => item.products);

                setFavorites(productsOnly);
            } catch (error) {
                console.error("Lỗi tải wishlist:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchWishlist();
    }, [user?.id]);

    // 2. Hàm xử lý khi người dùng bỏ tim (Callback)
    // Hàm này sẽ được truyền vào ProductCard -> FavoriteButton
    const handleRemoveItem = (productId) => {
        // Xóa ngay trên giao diện cho mượt (Optimistic UI)
        setFavorites((prev) => prev.filter((p) => p.id !== productId));
    };

    // --- RENDER GIAO DIỆN ---

    // Trường hợp 1: Chưa đăng nhập
    if (!user) {
        return (
            <div className="container mx-auto px-4 py-20 text-center">
                <div className="inline-flex bg-red-50 p-4 rounded-full mb-4">
                    <FaHeart className="text-4xl text-red-400" />
                </div>
                <h2 className="text-2xl font-bold text-gray-800 mb-2">
                    Vui lòng đăng nhập
                </h2>
                <p className="text-gray-500 mb-6">
                    Đăng nhập để xem và quản lý danh sách yêu thích của bạn.
                </p>
                <Link
                    to="/login"
                    className="inline-block bg-primary-600 text-white px-6 py-2 rounded-full font-medium hover:bg-primary-700 transition"
                >
                    Đăng nhập ngay
                </Link>
            </div>
        );
    }

    // Trường hợp 2: Đang tải
    if (loading) return <Loading />;

    // Trường hợp 3: Danh sách trống
    if (favorites.length === 0) {
        return (
            <div className="container mx-auto px-4 py-20 text-center">
                <div className="inline-flex bg-gray-100 p-4 rounded-full mb-4">
                    <FaHeart className="text-4xl text-gray-300" />
                </div>
                <h2 className="text-2xl font-bold text-gray-800 mb-2">
                    Danh sách yêu thích trống
                </h2>
                <p className="text-gray-500 mb-6">
                    Hãy thả tim cho các sản phẩm bạn thích để lưu lại đây nhé.
                </p>
                <Link
                    to="/products"
                    className="inline-flex items-center gap-2 bg-primary-600 text-white px-6 py-2 rounded-full font-medium hover:bg-primary-700 transition"
                >
                    <FaShoppingBag /> Tiếp tục mua sắm
                </Link>
            </div>
        );
    }

    // Trường hợp 4: Có dữ liệu
    return (
        <div className="container mx-auto px-4 py-8">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900">
                    Sản phẩm yêu thích
                </h1>
                <p className="text-gray-500 mt-1">
                    Bạn có {favorites.length} sản phẩm trong danh sách.
                </p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {favorites.map((product) => (
                    <ProductCard
                        key={product.id}
                        product={product}
                        // Quan trọng: Truyền callback này xuống để nếu bỏ tim thì Card biến mất luôn
                        onRemoveFromWishlist={() =>
                            handleRemoveItem(product.id)
                        }
                    />
                ))}
            </div>
        </div>
    );
};

export default WishlistPage;
