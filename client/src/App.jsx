import React, { useEffect } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { useDispatch } from "react-redux";
import { Toaster } from "react-hot-toast"; // Thông báo đẹp
import { supabase } from "./services/supabaseClient";
import { setSession, setLogout, setLoading } from "./store/authSlice";

// Import Layouts
import MainLayout from "./layouts/MainLayout";
// import LoginPage from './pages/LoginPage'; // Giả sử bạn đã có file này (copy từ Admin sửa lại chút UI)

// --- TRANG GIẢ (Placeholder) ĐỂ TEST GIAO DIỆN ---
const HomePage = () => (
    <div className="text-center py-20">
        <h1 className="text-4xl font-bold text-gray-800 mb-4">
            Chào mừng đến với ShopSmart! 🛍️
        </h1>
        <p className="text-gray-600">Săn deal hời, mua sắm thả ga.</p>
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
                <div
                    key={i}
                    className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 h-64 flex items-center justify-center text-gray-400"
                >
                    Sản phẩm mẫu {i}
                </div>
            ))}
        </div>
    </div>
);

const ProductPage = () => (
    <div className="text-2xl font-bold text-gray-700">
        Trang Danh sách Sản phẩm
    </div>
);
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
