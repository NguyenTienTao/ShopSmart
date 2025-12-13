import { Outlet } from "react-router-dom";
import Header from "./Header"; // Import Header bạn đã có
import Footer from "./Footer"; // Import Footer vừa tạo
import Breadcrumbs from "../components/Breadcrumbs";
import ChatBot from "../components/ChatBot";

const MainLayout = () => {
    return (
        <div className="flex flex-col min-h-screen bg-gray-50 font-sans">
            {/* Header luôn dính trên cùng */}
            <Header />

            <Breadcrumbs />

            {/* Nội dung chính (Outlet) sẽ thay đổi tùy theo trang */}
            <main className="flex-grow">
                <Outlet />
            </main>

            {/* Footer luôn ở dưới cùng */}
            <Footer />

            <ChatBot />
        </div>
    );
};

export default MainLayout;
