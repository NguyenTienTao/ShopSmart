import { useEffect, useState } from "react";
import { Navigate, Outlet } from "react-router-dom";
import { supabase } from "../../services/supabaseClient";
import { Spin } from "antd";
import { useSelector } from "react-redux";

const PrivateRoute = () => {
    const { session, loading } = useSelector((state) => state.auth);

    if (loading) {
        return (
            <div
                style={{
                    height: "100vh",
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                }}
            >
                <Spin size="large" tip="Đang tải..." />
            </div>
        );
    }

    // Nếu có session -> Cho phép đi tiếp vào các trang con (Outlet)
    // Nếu không -> Đá về trang /login
    return session ? <Outlet /> : <Navigate to="/login" replace />;
};

export default PrivateRoute;
