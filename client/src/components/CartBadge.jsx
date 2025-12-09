import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useSelector } from "react-redux";
import { supabase } from "../services/supabaseClient";
import { FaShoppingBag } from "react-icons/fa";

const CartBadge = () => {
    const [count, setCount] = useState(0);
    const { user } = useSelector((state) => state.auth);

    // Hàm đếm số lượng item trong giỏ (Dùng count: exact cho nhẹ)
    const fetchCount = async () => {
        if (!user) {
            setCount(0);
            return;
        }

        try {
            // Đếm số dòng (rows) trong bảng cart_items
            // Nếu bạn muốn đếm tổng số lượng (quantity) thì phải dùng .select('quantity') rồi reduce
            // Ở đây mình đếm số loại sản phẩm (số dòng) cho nhanh và phổ biến
            const { count: cartCount, error } = await supabase
                .from("cart_items")
                .select("*", { count: "exact", head: true }) // head: true nghĩa là chỉ đếm, không lấy data
                .eq("user_id", user.id);

            if (!error) {
                setCount(cartCount || 0);
            }
        } catch (error) {
            console.error("Lỗi đếm giỏ hàng:", error);
        }
    };

    useEffect(() => {
        // 1. Lấy số lượng ban đầu
        fetchCount();

        // 2. Nếu chưa đăng nhập thì không cần realtime
        if (!user) return;

        // 3. Lắng nghe Realtime (Tự cập nhật khi thêm/xóa)
        const channel = supabase
            .channel("cart_badge_updates")
            .on(
                "postgres_changes",
                {
                    event: "*", // Nghe tất cả: INSERT, UPDATE, DELETE
                    schema: "public",
                    table: "cart_items",
                },
                (payload) => {
                    console.log("Giỏ hàng thay đổi:", payload);
                    fetchCount(); // Gọi lại hàm đếm
                }
            )
            .subscribe();

        // Dọn dẹp khi component bị hủy
        return () => {
            supabase.removeChannel(channel);
        };
    }, [user]);

    return (
        <Link
            to="/cart"
            className="relative group flex items-center justify-center"
        >
            {/* Icon Giỏ hàng */}
            <FaShoppingBag className="text-2xl text-gray-600 group-hover:text-blue-600 transition-colors" />

            {/* Số lượng (Badge) - Chỉ hiện khi > 0 */}
            {count > 0 && (
                <span className="absolute -top-2 -right-2 bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center border-2 border-white shadow-sm">
                    {count > 99 ? "99+" : count}
                </span>
            )}
        </Link>
    );
};

export default CartBadge;
