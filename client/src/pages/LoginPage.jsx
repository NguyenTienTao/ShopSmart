import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "../services/supabaseClient";
import { useDispatch } from "react-redux";
import { setSession, setLoading } from "../store/authSlice";
import { getUserProfile, getUserRole } from "../helpers/authHelpers";
import {
    FaEnvelope,
    FaLock,
    FaGoogle,
    FaEye,
    FaEyeSlash,
} from "react-icons/fa";
import { toast } from "react-hot-toast";
import Logo from "../components/Logo";

const LoginPage = () => {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setBtnLoading] = useState(false);

    const dispatch = useDispatch();
    const navigate = useNavigate();

    useEffect(() => {
        document.title = "Đăng nhập";
    }, []);

    // Xử lý đăng nhập Email/Pass
    const handleLogin = async (e) => {
        e.preventDefault();
        setBtnLoading(true);
        dispatch(setLoading(true)); // Bật loading toàn cục nếu muốn

        try {
            const { data, error } = await supabase.auth.signInWithPassword({
                email,
                password,
            });

            if (error) throw error;

            // Lấy role và lưu vào Redux
            const profile = await getUserProfile(data.user.id);
            dispatch(setSession({ session: data.session, profile }));

            toast.success(`Chào mừng trở lại, ${data.user.email}!`);
            navigate("/"); // Chuyển về trang chủ
        } catch (error) {
            toast.error(error.message || "Đăng nhập thất bại");
            dispatch(setLoading(false));
        } finally {
            setBtnLoading(false);
        }
    };

    // Xử lý đăng nhập Google
    const handleGoogleLogin = async () => {
        const { error } = await supabase.auth.signInWithOAuth({
            provider: "google",
            options: {
                redirectTo: `${window.location.origin}/`, // Quay về trang chủ sau khi login
            },
        });
        if (error) toast.error(error.message);
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
            {/* Container chính: Chia đôi màn hình, Bo tròn, Đổ bóng */}
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-5xl overflow-hidden flex flex-col md:flex-row h-[600px] md:h-[700px]">
                {/* --- CỘT TRÁI: HÌNH ẢNH (Ẩn trên mobile) --- */}
                <div className="hidden md:flex md:w-1/2 bg-primary-50 items-center justify-center p-12 relative overflow-hidden">
                    {/* Vòng tròn trang trí nền */}
                    <div className="absolute top-[-50px] left-[-50px] w-40 h-40 bg-primary-200 rounded-full opacity-50 blur-3xl"></div>
                    <div className="absolute bottom-[-50px] right-[-50px] w-60 h-60 bg-orange-200 rounded-full opacity-50 blur-3xl"></div>

                    <div className="text-center relative z-10">
                        {/* Hình minh họa (Dùng ảnh shopping vector) */}
                        <img
                            src="https://plus.unsplash.com/premium_vector-1719829071159-66b351c8f2d4?fm=jpg&q=60&w=3000&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
                            alt="Shopping Illustration"
                            className="w-full max-w-md mx-auto mb-8 drop-shadow-lg transform hover:scale-105 transition-transform duration-500 rounded-[20px]"
                        />

                        <h3 className="text-2xl font-bold text-gray-800 mb-2">
                            Mua sắm thông minh
                        </h3>
                        <p className="text-gray-500 max-w-xs mx-auto">
                            Trải nghiệm mua sắm tuyệt vời nhất với hàng ngàn sản
                            phẩm chất lượng cao.
                        </p>
                    </div>
                </div>

                {/* --- CỘT PHẢI: FORM ĐĂNG NHẬP --- */}
                <div className="w-full md:w-1/2 p-8 md:p-16 flex flex-col justify-center bg-white">
                    <div className="text-center mb-8">
                        <Link
                            to="/"
                            className="inline-flex items-center gap-2 mb-2 group"
                        >
                            <Logo
                                className="w-8 h-8 group-hover:rotate-12 transition-transform duration-300"
                                fontSize="1.7rem"
                            />
                        </Link>
                        <h2 className="text-3xl font-bold text-gray-900 mb-2 mt-2">
                            Chào mừng trở lại!
                        </h2>
                        <p className="text-gray-500 text-sm">
                            Vui lòng nhập thông tin để đăng nhập.
                        </p>
                    </div>

                    <form onSubmit={handleLogin} className="space-y-5">
                        {/* Input Email */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1 ml-1">
                                Email
                            </label>
                            <div className="relative">
                                <input
                                    type="email"
                                    required
                                    placeholder="Email"
                                    className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 transition-all bg-gray-50 focus:bg-white"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                />
                                <FaEnvelope className="absolute left-3.5 top-3.5 text-gray-400" />
                            </div>
                        </div>

                        {/* Input Password */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1 ml-1">
                                Mật khẩu
                            </label>
                            <div className="relative">
                                <input
                                    type={showPassword ? "text" : "password"}
                                    required
                                    placeholder="Password"
                                    className="w-full pl-10 pr-10 py-3 border border-gray-200 rounded-xl focus:outline-none focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 transition-all bg-gray-50 focus:bg-white"
                                    value={password}
                                    onChange={(e) =>
                                        setPassword(e.target.value)
                                    }
                                />
                                <FaLock className="absolute left-3.5 top-3.5 text-gray-400" />
                                <button
                                    type="button"
                                    onClick={() =>
                                        setShowPassword(!showPassword)
                                    }
                                    className="absolute right-0 top-[50%] translate-y-[-50%] bg-transparent text-gray-400 hover:text-gray-600 focus:outline-none"
                                >
                                    {showPassword ? <FaEyeSlash /> : <FaEye />}
                                </button>
                            </div>
                        </div>

                        {/* Remember & Forgot Pass */}
                        <div className="flex items-center justify-between text-sm">
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="checkbox"
                                    className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                                />
                                <span className="text-gray-600">Ghi nhớ</span>
                            </label>
                            <Link
                                to="/forgot-password"
                                className="text-primary-600 hover:underline font-medium"
                            >
                                Quên mật khẩu?
                            </Link>
                        </div>

                        {/* Nút Login */}
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-primary-500 hover:bg-primary-600 text-white font-bold py-3 rounded-xl shadow-lg shadow-primary-500/30 transition-all active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                        >
                            {loading ? <>Đang xử lý...</> : "Đăng nhập"}
                        </button>

                        {/* Google Login */}
                        <button
                            type="button"
                            onClick={handleGoogleLogin}
                            className="w-full bg-white border border-gray-200 text-gray-700 font-semibold py-3 rounded-xl hover:bg-gray-50 transition-all flex items-center justify-center gap-3"
                        >
                            <FaGoogle className="text-red-500" />
                            <span>Đăng nhập với Google</span>
                        </button>
                    </form>

                    {/* Footer Link */}
                    <div className="mt-8 text-center text-sm text-gray-500">
                        Chưa có tài khoản?{" "}
                        <Link
                            to="/register"
                            className="text-primary-600 font-bold hover:underline"
                        >
                            Đăng ký ngay
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LoginPage;
