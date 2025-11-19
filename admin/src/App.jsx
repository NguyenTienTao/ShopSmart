import { useEffect, useState } from "react";
import "./App.css";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import MainLayout from "./components/layout/MainLayout.jsx";
import LoginPage from "./pages/Login/LoginPage.jsx";
import PrivateRoute from "./components/layout/PrivateRoute.jsx";

const Dashboard = () => <h2>Trang Thống Kê</h2>;
const Products = () => <h2>Trang Quản Lý Sản Phẩm</h2>;
// const Login = () => <h2>Trang Đăng Nhập</h2>;

function App() {
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
                        <Route
                            path="categories"
                            element={<h2>Trang Danh Mục</h2>}
                        />
                        <Route
                            path="orders"
                            element={<h2>Trang Đơn Hàng</h2>}
                        />
                    </Route>
                </Route>

                {/* Route 404 */}
                <Route path="*" element={<h2>404 Not Found</h2>} />
            </Routes>
        </BrowserRouter>
    );
}

export default App;
