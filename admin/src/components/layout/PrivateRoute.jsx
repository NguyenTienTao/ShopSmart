import { useEffect, useState } from "react";
import { Navigate, Outlet } from "react-router-dom";
import { supabase } from "../../services/supabaseClient";
import { Spin } from "antd";

const PrivateRoute = () => {
    const [session, setSession] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // 1. Lấy session hiện tại
        supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(session);
            setLoading(false);
        });

        // 2. Lắng nghe sự thay đổi (Login/Logout)
        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange((_event, session) => {
            setSession(session);
        });

        return () => subscription.unsubscribe();
    }, []);

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
