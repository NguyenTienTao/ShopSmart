import React from "react";
import { Link } from "react-router-dom";
import {
    FaFacebook,
    FaInstagram,
    FaTwitter,
    FaMapMarkerAlt,
    FaPhone,
    FaEnvelope,
} from "react-icons/fa";
import Logo from "../components/Logo";

const Footer = () => {
    return (
        <footer className="bg-gray-900 text-gray-300 pt-12 pb-6">
            <div className="container mx-auto px-4">
                {/* Grid 4 Cột */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-8">
                    {/* Cột 1: Thông tin chung */}
                    <div>
                        <Logo fontSize="1.6rem" textColor="#fff" />
                        <p className="text-sm leading-relaxed mb-4 text-gray-400">
                            Nền tảng mua sắm trực tuyến hàng đầu, mang đến trải
                            nghiệm tiện lợi, an toàn và nhanh chóng.
                        </p>
                        <div className="flex gap-4">
                            <a
                                href="#"
                                className="w-8 h-8 bg-gray-800 rounded-full flex items-center justify-center hover:bg-blue-600 transition"
                            >
                                <FaFacebook />
                            </a>
                            <a
                                href="#"
                                className="w-8 h-8 bg-gray-800 rounded-full flex items-center justify-center hover:bg-pink-600 transition"
                            >
                                <FaInstagram />
                            </a>
                            <a
                                href="#"
                                className="w-8 h-8 bg-gray-800 rounded-full flex items-center justify-center hover:bg-blue-400 transition"
                            >
                                <FaTwitter />
                            </a>
                        </div>
                    </div>

                    {/* Cột 2: Liên kết nhanh */}
                    <div>
                        <h3 className="text-white font-semibold text-lg mb-4">
                            Về chúng tôi
                        </h3>
                        <ul className="space-y-2 text-sm">
                            <li>
                                <Link
                                    to="/"
                                    className="hover:text-blue-500 transition"
                                >
                                    Trang chủ
                                </Link>
                            </li>
                            <li>
                                <Link
                                    to="/about"
                                    className="hover:text-blue-500 transition"
                                >
                                    Giới thiệu
                                </Link>
                            </li>
                            <li>
                                <Link
                                    to="/products"
                                    className="hover:text-blue-500 transition"
                                >
                                    Sản phẩm
                                </Link>
                            </li>
                            <li>
                                <Link
                                    to="/contact"
                                    className="hover:text-blue-500 transition"
                                >
                                    Liên hệ
                                </Link>
                            </li>
                        </ul>
                    </div>

                    {/* Cột 3: Hỗ trợ khách hàng */}
                    <div>
                        <h3 className="text-white font-semibold text-lg mb-4">
                            Hỗ trợ khách hàng
                        </h3>
                        <ul className="space-y-2 text-sm">
                            <li>
                                <Link
                                    to="/policy"
                                    className="hover:text-blue-500 transition"
                                >
                                    Chính sách đổi trả
                                </Link>
                            </li>
                            <li>
                                <Link
                                    to="/terms"
                                    className="hover:text-blue-500 transition"
                                >
                                    Điều khoản dịch vụ
                                </Link>
                            </li>
                            <li>
                                <Link
                                    to="/privacy"
                                    className="hover:text-blue-500 transition"
                                >
                                    Chính sách bảo mật
                                </Link>
                            </li>
                            <li>
                                <Link
                                    to="/faq"
                                    className="hover:text-blue-500 transition"
                                >
                                    Câu hỏi thường gặp
                                </Link>
                            </li>
                        </ul>
                    </div>

                    {/* Cột 4: Liên hệ */}
                    <div>
                        <h3 className="text-white font-semibold text-lg mb-4">
                            Liên hệ
                        </h3>
                        <ul className="space-y-3 text-sm">
                            <li className="flex items-start gap-3">
                                <FaMapMarkerAlt className="mt-1 text-blue-500" />
                                <span>
                                    Đường ABC, Phường XYZ, Quận 123, Thành phố
                                    Hà Nội
                                </span>
                            </li>
                            <li className="flex items-center gap-3">
                                <FaPhone className="text-blue-500" />
                                <span>1900 1234 567</span>
                            </li>
                            <li className="flex items-center gap-3">
                                <FaEnvelope className="text-blue-500" />
                                <span>support@shopsmart.com</span>
                            </li>
                        </ul>
                    </div>
                </div>

                {/* Dòng bản quyền dưới cùng */}
                <div className="border-t border-gray-800 pt-6 text-center text-sm text-gray-500">
                    <p>
                        © 2025 ShopSmart. All rights reserved. Designed for
                        User.
                    </p>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
