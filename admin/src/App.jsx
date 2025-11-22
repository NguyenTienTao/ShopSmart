import "./App.css";
import { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { supabase } from "./services/supabaseClient.js";
import { getUserRole, getUserProfile } from "./helpers/authHelpers.js";
import { setLoading, setSession, setLogout } from "./store/authSlice.js";
import MainLayout from "./layout/MainLayout.jsx";
import LoginPage from "./pages/Login/LoginPage.jsx";
import PrivateRoute from "./layout/PrivateRoute.jsx";
import CategoryPage from "./pages/Category/CategoryPage.jsx";
import AdminPage from "./pages/Admin/AdminPage.jsx";

const Dashboard = () => <h2>Trang Thống Kê</h2>;
const Products = () => <h2>Trang Quản Lý Sản Phẩm</h2>;

function App() {
    const dispatch = useDispatch();

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
            <Routes>
                {/* Route cho trang Login (nằm ngoài Layout) */}
                <Route path="/login" element={<LoginPage />} />

                <Route element={<PrivateRoute />}>
                    {/* Route có Layout (Admin) */}
                    <Route path="/" element={<MainLayout />}>
                        {/* Mặc định vào / sẽ chuyển hướng sang /dashboard */}
                        <Route
                            index
                            element={<Navigate to="/dashboard" replace />}
                        />

                        <Route path="dashboard" element={<Dashboard />} />
                        <Route path="products" element={<Products />} />
                        <Route path="categories" element={<CategoryPage />} />
                        <Route
                            path="orders"
                            element={<h2>Trang Đơn Hàng</h2>}
                        />
                        <Route path="admins" element={<AdminPage />} />
                    </Route>
                </Route>

                {/* Route 404 */}
                <Route path="*" element={<h2>404 Not Found</h2>} />
            </Routes>
        </BrowserRouter>
    );
}

export default App;
