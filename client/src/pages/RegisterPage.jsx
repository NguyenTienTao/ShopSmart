import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "../services/supabaseClient";
import {
    FaEnvelope,
    FaLock,
    FaUser,
    FaGoogle,
    FaEye,
    FaEyeSlash,
} from "react-icons/fa";
import { toast } from "react-hot-toast";

const RegisterPage = () => {
    // State quản lý form
    const [formData, setFormData] = useState({
        username: "",
        email: "",
        password: "",
        confirmPassword: "",
    });

    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    // Hàm xử lý nhập liệu chung
    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    // Xử lý Đăng ký
    const handleRegister = async (e) => {
        e.preventDefault();

        // 1. Validate cơ bản
        if (formData.password !== formData.confirmPassword) {
            toast.error("Mật khẩu xác nhận không khớp!");
            return;
        }
        if (formData.password.length < 6) {
            toast.error("Mật khẩu phải có ít nhất 6 ký tự!");
            return;
        }

        setLoading(true);

        try {
            // 2. Gọi Supabase SignUp
            const { data, error } = await supabase.auth.signUp({
                email: formData.email,
                password: formData.password,
                options: {
                    // Gửi kèm tên để Trigger tự lưu vào bảng profiles
                    data: {
                        name: formData.username,
                        // avatar_url: '', // Có thể thêm avatar mặc định nếu muốn
                    },
                },
            });

            if (error) throw error;

            // 3. Kiểm tra kết quả
            if (data.session) {
                // Nếu tắt "Confirm Email" -> Đăng ký xong là có session luôn
                toast.success("Đăng ký thành công! Đang chuyển hướng...");
                navigate("/"); // Vào thẳng trang chủ
            } else {
                // Nếu bật "Confirm Email" -> Chưa có session
                toast.success(
                    "Đăng ký thành công! Vui lòng kiểm tra email để xác nhận."
                );
                navigate("/login");
            }
        } catch (error) {
            toast.error(error.message || "Đăng ký thất bại");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
            {/* Container chính */}
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl overflow-hidden flex flex-col md:flex-row h-auto">
                {/* --- CỘT TRÁI: HÌNH ẢNH --- */}
                <div className="hidden md:block md:w-1/2 relative">
                    <img
                        // Ảnh khác trang Login: Một cô gái đang vui vẻ với gói hàng
                        src="https://plus.unsplash.com/premium_vector-1726815506676-ad43e01e2b6c?q=80&w=2148&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
                        alt="Register"
                        className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-primary-600/20 mix-blend-multiply"></div>

                    <div className="absolute bottom-12 left-12 text-white p-6 bg-black/30 backdrop-blur-sm rounded-xl max-w-xs">
                        <h3 className="text-2xl font-bold mb-2">
                            Tham gia cùng chúng tôi
                        </h3>
                        <p className="text-gray-100 text-sm">
                            Tạo tài khoản ngay để nhận ưu đãi thành viên và theo
                            dõi đơn hàng dễ dàng.
                        </p>
                    </div>
                </div>

                {/* --- CỘT PHẢI: FORM ĐĂNG KÝ --- */}
                <div className="w-full md:w-1/2 p-8 md:p-12 flex flex-col justify-center bg-white relative">
                    {/* Nút về trang chủ */}
                    <Link
                        to="/"
                        className="absolute top-6 right-6 text-gray-400 hover:text-primary-600 transition"
                    >
                        Trang chủ &rarr;
                    </Link>

                    <div className="text-center mt-5 mb-6">
                        <h2 className="text-3xl font-bold text-gray-900 mb-2">
                            Tạo tài khoản mới
                        </h2>
                        <p className="text-gray-500 text-sm">
                            Điền thông tin bên dưới để bắt đầu.
                        </p>
                    </div>

                    <form
                        onSubmit={handleRegister}
                        className="space-y-4"
                        autoComplete="off"
                    >
                        {/* 1. Username */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1 ml-1">
                                Họ và Tên
                            </label>
                            <div className="relative">
                                <input
                                    type="text"
                                    name="username"
                                    required
                                    placeholder="Nguyễn Văn A"
                                    className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 transition-all bg-gray-50 focus:bg-white"
                                    value={formData.username}
                                    onChange={handleChange}
                                    autoComplete="off"
                                />
                                <FaUser className="absolute left-3.5 top-3.5 text-gray-400" />
                            </div>
                        </div>

                        {/* 2. Email */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1 ml-1">
                                Email
                            </label>
                            <div className="relative">
                                <input
                                    type="email"
                                    name="email"
                                    required
                                    placeholder="name@example.com"
                                    className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 transition-all bg-gray-50 focus:bg-white"
                                    value={formData.email}
                                    onChange={handleChange}
                                    autoComplete="off"
                                />
                                <FaEnvelope className="absolute left-3.5 top-3.5 text-gray-400" />
                            </div>
                        </div>

                        {/* 3. Password */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1 ml-1">
                                Mật khẩu
                            </label>
                            <div className="relative">
                                <input
                                    type={showPassword ? "text" : "password"}
                                    name="password"
                                    required
                                    placeholder="password"
                                    className="w-full pl-10 pr-10 py-3 border border-gray-200 rounded-xl focus:outline-none focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 transition-all bg-gray-50 focus:bg-white"
                                    value={formData.password}
                                    onChange={handleChange}
                                    autoComplete="new-password"
                                />
                                <FaLock className="absolute left-3.5 top-3.5 text-gray-400" />
                                <button
                                    type="button"
                                    onClick={() =>
                                        setShowPassword(!showPassword)
                                    }
                                    className="absolute right-0 top-[50%] translate-y-[-50%] bg-transparent top-3.5 text-gray-400 hover:text-gray-600 focus:outline-none"
                                >
                                    {showPassword ? <FaEyeSlash /> : <FaEye />}
                                </button>
                            </div>
                        </div>

                        {/* 4. Confirm Password */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1 ml-1">
                                Xác nhận mật khẩu
                            </label>
                            <div className="relative">
                                <input
                                    type={showPassword ? "text" : "password"}
                                    name="confirmPassword"
                                    required
                                    placeholder="Confirm password"
                                    className="w-full pl-10 pr-10 py-3 border border-gray-200 rounded-xl focus:outline-none focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 transition-all bg-gray-50 focus:bg-white"
                                    value={formData.confirmPassword}
                                    onChange={handleChange}
                                    autoComplete="new-password"
                                />
                                <FaLock className="absolute left-3.5 top-3.5 text-gray-400" />
                            </div>
                        </div>

                        {/* Nút Đăng ký */}
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-primary-600 hover:bg-primary-700 text-white font-bold py-3 rounded-xl shadow-lg shadow-primary-600/30 transition-all active:scale-[0.98] mt-4 flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                        >
                            {loading ? "Đang xử lý..." : "Đăng ký tài khoản"}
                        </button>
                    </form>

                    <div className="mt-6 text-center text-sm text-gray-500">
                        Đã có tài khoản?{" "}
                        <Link
                            to="/login"
                            className="text-primary-600 font-bold hover:underline"
                        >
                            Đăng nhập ngay
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default RegisterPage;
