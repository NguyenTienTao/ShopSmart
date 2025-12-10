import { useEffect } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { Toaster } from "react-hot-toast";
import { supabase } from "./services/supabaseClient";
import {
    setSession,
    setLogout,
    setLoading,
    updateProfile,
} from "./store/authSlice";

// Import Layouts
import MainLayout from "./layouts/MainLayout";
import HomePage from "./pages/HomePage";
import ProductPage from "./pages/ProductPage";
import CategoryPage from "./pages/CategoryPage";
import ProductDetail from "./pages/ProductDetail";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import WishlistPage from "./pages/WishlistPage";
import CartPage from "./pages/CartPage";
import CheckoutPage from "./pages/CheckoutPage";
import { getUserProfile } from "./helpers/authHelpers";
import OrderSuccessPage from "./pages/OrderSuccessPage";
import MyOrdersPage from "./pages/MyOrdersPage";
import NotificationsPage from "./pages/NotificationsPage";
import ProfilePage from "./pages/ProfilePage";

function App() {
    const dispatch = useDispatch();
    const { user } = useSelector((state) => state.auth);

    // Logic Auth giữ nguyên như cũ để đồng bộ session
    useEffect(() => {
        // Kiểm tra session khi load app
        const handleSession = async (session) => {
            dispatch(setLoading(true));

            if (session) {
                try {
                    const profile = await getUserProfile(session.user.id);

                    dispatch(
                        setSession({ session, profile, role: profile.role })
                    );
                } catch (err) {
                    dispatch(setLogout());
                }
            } else {
                dispatch(setLogout());
            }
        };

        // Lắng nghe sự thay đổi session
        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange(async (event, session) => {
            if (event === "INITIAL_SESSION") {
                // Sự kiện này luôn bắn ra khi F5 hoặc mới vào App
                handleSession(session);
            } else if (event === "SIGNED_IN" || event === "TOKEN_REFRESHED") {
                // Khi đăng nhập hoặc gia hạn token
                handleSession(session);
            } else if (event === "SIGNED_OUT") {
                dispatch(setLogout());
            }
        });

        return () => subscription.unsubscribe();
    }, [dispatch]);

    useEffect(() => {
        if (!user) return;

        // Tạo kênh lắng nghe bảng 'profiles'
        const channel = supabase
            .channel("public:profiles")
            .on(
                "postgres_changes",
                {
                    event: "UPDATE", // Chỉ nghe sự kiện Sửa
                    schema: "public",
                    table: "profiles",
                    filter: `id=eq.${user.id}`, // Quan trọng: Chỉ nghe dòng của chính mình
                },
                (payload) => {
                    console.log("⚡ Profile thay đổi:", payload.new);

                    // Cập nhật Redux ngay lập tức
                    dispatch(updateProfile(payload.new));
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [user, dispatch]);

    return (
        <BrowserRouter>
            {/* Component thông báo toàn cục */}
            <Toaster position="top-center" reverseOrder={false} />

            <Routes>
                {/* Route Chính: Dùng MainLayout */}
                <Route path="/" element={<MainLayout />}>
                    <Route index element={<HomePage />} />
                    <Route path="products" element={<ProductPage />} />
                    <Route path="categories" element={<CategoryPage />} />
                    <Route path="cart" element={<CartPage />} />
                    <Route path="product/:id" element={<ProductDetail />} />
                    <Route path="wishlist" element={<WishlistPage />} />
                    <Route path="cart/checkout" element={<CheckoutPage />} />
                    <Route
                        path="/order-success"
                        element={<OrderSuccessPage />}
                    />
                    <Route path="my-orders" element={<MyOrdersPage />} />
                    <Route
                        path="notifications"
                        element={<NotificationsPage />}
                    />
                    <Route path="profile" element={<ProfilePage />} />
                </Route>

                {/* Route Phụ: Không có Header/Footer (như Login) */}
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />
            </Routes>
        </BrowserRouter>
    );
}

export default App;
