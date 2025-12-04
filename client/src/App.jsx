import React, { useEffect } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { useDispatch } from "react-redux";
import { Toaster } from "react-hot-toast"; // Thông báo đẹp
import { supabase } from "./services/supabaseClient";
import { setSession, setLogout, setLoading } from "./store/authSlice";

// Import Layouts
import MainLayout from "./layouts/MainLayout";
// import LoginPage from './pages/LoginPage'; // Giả sử bạn đã có file này (copy từ Admin sửa lại chút UI)
import HomePage from "./pages/HomePage";
import ProductPage from "./pages/ProductPage";
import CategoryPage from "./pages/CategoryPage";

const CartPage = () => (
    <div className="text-2xl font-bold text-gray-700">
        Giỏ hàng của bạn (Trống)
    </div>
);

function App() {
    const dispatch = useDispatch();

    // Logic Auth giữ nguyên như cũ để đồng bộ session
    useEffect(() => {
        const initSession = async () => {
            dispatch(setLoading(true));
            const {
                data: { session },
            } = await supabase.auth.getSession();
            if (session) {
                // Bên Client thường không cần check role gắt gao ngay lúc init,
                // cứ cho vào đã, trừ khi vào trang profile/admin
                dispatch(setSession({ session, role: "customer" }));
            } else {
                dispatch(setLogout());
            }
        };
        initSession();

        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange((_event, session) => {
            if (session) {
                dispatch(setSession({ session, role: "customer" }));
            } else {
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
                    {/* Thêm các route khác vào đây: /product/:id, /checkout... */}
                </Route>

                {/* Route Phụ: Không có Header/Footer (như Login) */}
                {/* <Route path="/login" element={<LoginPage />} /> */}
                {/* <Route path="/register" element={<RegisterPage />} /> */}
            </Routes>
        </BrowserRouter>
    );
}

export default App;
