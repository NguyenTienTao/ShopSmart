import { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import { FaHeart, FaRegHeart, FaSpinner } from "react-icons/fa";
import { supabase } from "../services/supabaseClient";
import { toast } from "react-hot-toast";

const FavoriteButton = ({ product }) => {
    const { user } = useSelector((state) => state.auth);
    const [isLiked, setIsLiked] = useState(false);
    const [loading, setLoading] = useState(false);
    const [checking, setChecking] = useState(true); // Trạng thái đang kiểm tra xem đã like chưa

    // 1. Kiểm tra trạng thái ban đầu (Khi load trang)
    useEffect(() => {
        const checkLikedStatus = async () => {
            if (!user) {
                setChecking(false);
                return;
            }

            // Tìm xem trong bảng favorites có dòng nào của user này với product này không
            const { data, error } = await supabase
                .from("favorites")
                .select("id")
                .eq("user_id", user.id)
                .eq("product_id", product.id)
                .maybeSingle();

            if (!error && data) {
                setIsLiked(true);
            }
            setChecking(false);
        };

        checkLikedStatus();
    }, [user, product.id]);

    // 2. Xử lý khi bấm nút
    const handleToggle = async (e) => {
        e.preventDefault(); // Chặn click lan ra ngoài (để không nhảy vào trang chi tiết)
        e.stopPropagation();

        // CHẶN KHÁCH VÃNG LAI
        if (!user) {
            toast.error("Vui lòng đăng nhập để yêu thích sản phẩm!");
            return;
        }

        if (loading) return; // Chống spam click

        // OPTIMISTIC UPDATE: Đổi trạng thái ngay lập tức
        const previousState = isLiked;
        setIsLiked(!previousState);
        setLoading(true);

        try {
            if (!previousState) {
                // --- THÊM VÀO YÊU THÍCH ---
                const { error } = await supabase
                    .from("favorites")
                    .insert([{ user_id: user.id, product_id: product.id }]);

                if (error) throw error;
                toast.success("Đã thêm vào yêu thích");
            } else {
                // --- XÓA KHỎI YÊU THÍCH ---
                const { error } = await supabase
                    .from("favorites")
                    .delete()
                    .eq("user_id", user.id)
                    .eq("product_id", product.id);

                if (error) throw error;
                toast.success("Đã bỏ yêu thích");
            }
        } catch (error) {
            // Nếu lỗi -> Hoàn tác lại trạng thái cũ
            setIsLiked(previousState);
            toast.error("Lỗi: " + error.message);
        } finally {
            setLoading(false);
        }
    };

    // Nếu đang check trạng thái lần đầu thì có thể hiện loading nhẹ hoặc icon rỗng
    if (checking) {
        return (
            <div className="p-2 rounded-full text-gray-300">
                <FaRegHeart />
            </div>
        );
    }

    return (
        <button
            onClick={handleToggle}
            disabled={loading}
            className={`p-2 rounded-full transition-all duration-200 transform active:scale-90 shadow-sm ${
                isLiked
                    ? "bg-red-50 text-red-500 hover:bg-red-100"
                    : "bg-white text-gray-400 hover:text-red-500 hover:bg-gray-50"
            }`}
            title={isLiked ? "Bỏ thích" : "Yêu thích"}
        >
            {/* Hiệu ứng loading khi bấm */}
            {loading ? (
                <FaSpinner className="animate-spin text-xs" />
            ) : isLiked ? (
                <FaHeart />
            ) : (
                <FaRegHeart />
            )}
        </button>
    );
};

export default FavoriteButton;
