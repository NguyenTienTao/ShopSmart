import React from "react";
import { Link, useLocation } from "react-router-dom";
import { FaChevronRight, FaHome } from "react-icons/fa";

const routeNameMap = {
    products: "Danh sách sản phẩm",
    product: "Chi tiết sản phẩm",
    cart: "Giỏ hàng",
    wishlist: "Yêu thích",
    login: "Đăng nhập",
    register: "Đăng ký",
    profile: "Tài khoản",
    "my-orders": "Lịch sử đơn hàng",
    checkout: "Thanh toán",
    search: "Tìm kiếm",
    categories: "Danh mục",
};

const Breadcrumbs = () => {
    const location = useLocation();
    const pathnames = location.pathname.split("/").filter((x) => x);

    const productNameFromState = location.state?.productName;

    // --- LOGIC ẨN BREADCRUMBS ---

    // 1. Ẩn nếu là Trang chủ
    if (pathnames.length === 0) {
        return null;
    }

    // 2. Ẩn nếu là trang Login hoặc Register (HOẶC BẤT KỲ TRANG NÀO BẠN MUỐN)
    const hiddenRoutes = [
        "/login",
        "/register",
        "/forgot-password",
        "/update-password",
    ];

    if (hiddenRoutes.includes(location.pathname)) {
        return null;
    }

    // -----------------------------

    return (
        <div className="bg-gray-100 py-3 border-b border-gray-200">
            <div className="container mx-auto px-4">
                <nav className="flex items-center text-sm text-gray-500">
                    <Link
                        to="/"
                        className="flex items-center hover:text-primary-600 transition-colors"
                    >
                        <FaHome className="mr-1" /> Trang chủ
                    </Link>

                    {pathnames[0] === "product" && (
                        <>
                            <FaChevronRight className="mx-2 text-xs text-gray-400 flex-shrink-0" />
                            <Link
                                to="/products"
                                className="hover:text-primary-600 transition-colors capitalize flex-shrink-0"
                            >
                                Danh sách sản phẩm
                            </Link>
                        </>
                    )}

                    {pathnames.map((value, index) => {
                        const to = `/${pathnames
                            .slice(0, index + 1)
                            .join("/")}`;
                        const isLast = index === pathnames.length - 1;

                        // Nếu đang ở trang chi tiết, bỏ qua chữ 'product' đầu tiên vì mình đã chèn node giả ở trên rồi
                        if (pathnames[0] === "product" && index === 0)
                            return null;

                        let displayName = routeNameMap[value] || value;

                        // Xử lý tên sản phẩm
                        if (isLast && value.length > 20 && /\d/.test(value)) {
                            displayName =
                                productNameFromState || "Chi tiết sản phẩm";
                        }

                        return (
                            <React.Fragment key={to}>
                                <FaChevronRight className="mx-2 text-xs text-gray-400" />
                                {isLast ? (
                                    <span className="font-semibold text-gray-700 capitalize">
                                        {displayName}
                                    </span>
                                ) : (
                                    <Link
                                        to={to}
                                        className="hover:text-primary-600 transition-colors capitalize"
                                    >
                                        {displayName}
                                    </Link>
                                )}
                            </React.Fragment>
                        );
                    })}
                </nav>
            </div>
        </div>
    );
};

export default Breadcrumbs;
