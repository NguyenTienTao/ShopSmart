import React, { useEffect } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { useDispatch } from "react-redux";
import { Toaster } from "react-hot-toast"; // Thông báo đẹp
import { supabase } from "./services/supabaseClient";
import { setSession, setLogout, setLoading } from "./store/authSlice";

// Import Layouts
import MainLayout from "./layouts/MainLayout";
import HomePage from "./pages/HomePage";
import ProductPage from "./pages/ProductPage";
import CategoryPage from "./pages/CategoryPage";
import ProductDetail from "./pages/ProductDetail";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import { getUserProfile } from "./helpers/authHelpers";

const CartPage = () => (
    <div className="text-2xl font-bold text-gray-700">
        Giỏ hàng của bạn (Trống)
    </div>
);

function App() {
    const dispatch = useDispatch();

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
                    {/* Thêm các route khác vào đây: /product/:id, /checkout... */}
                </Route>

                {/* Route Phụ: Không có Header/Footer (như Login) */}
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />
            </Routes>
        </BrowserRouter>
    );
}

export default App;
