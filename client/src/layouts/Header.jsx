// client/src/components/layout/Header.jsx
import React, { useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { supabase } from "../services/supabaseClient";
import { setLogout } from "../store/authSlice";
import {
    FaSearch,
    FaRegHeart,
    FaUser,
    FaSignOutAlt,
    FaHistory,
} from "react-icons/fa";
import { toast } from "react-hot-toast";
import CartBadge from "../components/CartBadge";
import Logo from "../components/Logo";

const Header = () => {
    const { user, profile } = useSelector((state) => state.auth);
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const [searchTerm, setSearchTerm] = useState("");
    const [showUserMenu, setShowUserMenu] = useState(false);

    const handleSearch = (e) => {
        e.preventDefault();
        if (searchTerm.trim()) {
            navigate(`/products?q=${encodeURIComponent(searchTerm)}`);
            setSearchTerm("");
        }
    };

    const handleLogout = async () => {
        await supabase.auth.signOut();
        dispatch(setLogout());
        navigate("/login");
        toast.success("Đã đăng xuất");
        setShowUserMenu(false);
    };

    // Class cho link menu (để đỡ lặp code)
    const navLinkClass = ({ isActive }) =>
        `text-sm font-semibold uppercase tracking-wide transition-colors ${
            isActive
                ? "text-primary-600"
                : "text-gray-600 hover:text-primary-600"
        }`;

    return (
        <header className="sticky top-0 z-50 bg-white shadow-sm border-b border-gray-100">
            <div className="container mx-auto px-4 pb-5 pt-5">
                {/* --- HÀNG 1: LOGO - MENU - AUTH --- */}
                <div className="flex items-center justify-between mb-4">
                    {/* 1. Logo & Menu */}
                    <div className="flex items-center gap-12">
                        {/* Logo */}
                        <Link to="/">
                            <Logo fontSize="1.6rem" />
                        </Link>

                        {/* Navigation (Desktop) */}
                        <nav className="hidden md:flex items-center gap-6">
                            <NavLink to="/" className={navLinkClass}>
                                Trang chủ
                            </NavLink>
                            <NavLink to="/products" className={navLinkClass}>
                                Sản phẩm
                            </NavLink>
                            <NavLink to="/categories" className={navLinkClass}>
                                Danh mục
                            </NavLink>
                            {/* History chỉ hiện khi đã đăng nhập (hoặc luôn hiện tùy bạn) */}
                            {user && (
                                <NavLink
                                    to="/my-orders"
                                    className={navLinkClass}
                                >
                                    Lịch sử
                                </NavLink>
                            )}
                        </nav>
                    </div>

                    {/* 2. Khu vực Tài khoản & Tiện ích */}
                    <div className="flex items-center gap-4">
                        {/* --- CHỈ HIỆN KHI ĐÃ ĐĂNG NHẬP --- */}
                        {user ? (
                            <>
                                {/* Yêu thích */}
                                <Link
                                    to="/wishlist"
                                    className="text-gray-500 hover:text-red-500 transition relative p-2"
                                >
                                    <FaRegHeart size={20} />
                                </Link>

                                {/* Giỏ hàng */}
                                <div className="mr-2">
                                    <CartBadge />
                                </div>

                                {/* Avatar User */}
                                <div className="relative">
                                    <div
                                        className="flex items-center gap-2 cursor-pointer border border-gray-200 rounded-full pl-1 pr-3 py-1 hover:border-primary-300 transition"
                                        onClick={() =>
                                            setShowUserMenu(!showUserMenu)
                                        }
                                    >
                                        <img
                                            src={
                                                profile?.avatar_url ||
                                                "https://placehold.co/40?text=U"
                                            }
                                            alt="User"
                                            className="w-8 h-8 rounded-full object-cover"
                                        />
                                        <span className="text-sm font-medium text-gray-700 max-w-[80px] truncate">
                                            {profile?.name || "User"}
                                        </span>
                                    </div>

                                    {/* Dropdown Menu */}
                                    {showUserMenu && (
                                        <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-xl shadow-xl border border-gray-100 py-2 z-50">
                                            <Link
                                                to="/profile"
                                                className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-orange-50 hover:text-primary-600"
                                            >
                                                <FaUser /> Hồ sơ cá nhân
                                            </Link>
                                            <Link
                                                to="/my-orders"
                                                className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-orange-50 hover:text-primary-600"
                                            >
                                                <FaHistory /> Lịch sử đơn hàng
                                            </Link>
                                            <div className="h-px bg-gray-100 my-1"></div>
                                            <button
                                                onClick={handleLogout}
                                                className="w-full flex items-center gap-2 text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                                            >
                                                <FaSignOutAlt /> Đăng xuất
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </>
                        ) : (
                            // --- CHƯA ĐĂNG NHẬP (Hiện nút Login & Register) ---
                            <div className="flex items-center gap-3">
                                <Link
                                    to="/register"
                                    className="text-primary-600 font-medium hover:underline px-2"
                                >
                                    Đăng ký
                                </Link>
                                <Link
                                    to="/login"
                                    className="bg-primary-500 hover:bg-primary-600 text-white px-5 py-3 rounded-full font-medium shadow-md transition transform hover:-translate-y-0.5"
                                >
                                    Đăng nhập
                                </Link>
                            </div>
                        )}
                    </div>
                </div>

                {/* --- HÀNG 2: THANH TÌM KIẾM (RỘNG RÃI) --- */}
                <div className="max-w-4xl mx-auto">
                    <form
                        onSubmit={handleSearch}
                        className="relative flex shadow-sm rounded-full overflow-hidden border border-primary-200 hover:border-primary-400 transition bg-primary-50"
                    >
                        <div className="pl-4 flex items-center justify-center text-gray-400">
                            <FaSearch />
                        </div>
                        <input
                            type="text"
                            placeholder="Bạn muốn tìm gì hôm nay? (Ví dụ: iPhone 15, Váy đầm...)"
                            className="w-full bg-transparent py-3 px-3 text-gray-700 focus:outline-none placeholder-gray-400"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            style={{ lineHeight: "none" }}
                        />
                        <button
                            type="submit"
                            className="bg-primary-500 text-white px-8 font-medium hover:bg-primary-600 transition"
                        >
                            Tìm kiếm
                        </button>
                    </form>
                </div>
            </div>
        </header>
    );
};

export default Header;
