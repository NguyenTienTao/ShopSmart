import { Link } from "react-router-dom";
import { FaShoppingBag } from "react-icons/fa";

const HeroSection = () => {
    return (
        // Container chính, set chiều cao tối thiểu để trông hoành tráng
        <section className="relative bg-gray-900 text-white overflow-hidden">
            {/* --- 1. LỚP ẢNH NỀN & OVERLAY --- */}
            <div className="absolute inset-0">
                {/* Ảnh nền (Thay bằng ảnh thật của bạn sau này) */}
                <img
                    src="https://images.unsplash.com/photo-1483985988355-763728e1935b?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
                    alt="Shopping Banner"
                    className="w-full h-full object-cover object-center"
                />
                {/* Lớp phủ màu đen mờ (overlay) để chữ dễ đọc hơn */}
                <div className="absolute inset-0 bg-black bg-opacity-50"></div>
                {/* Lớp phủ gradient màu cam nhẹ để hợp tông thương hiệu */}
                <div className="absolute inset-0 bg-gradient-to-r from-primary-900/30 to-transparent mix-blend-multiply"></div>
            </div>

            {/* --- 2. NỘI DUNG CHÍNH --- */}
            <div className="relative container mx-auto px-4 py-24 md:py-32 lg:py-40 flex items-center">
                {/* Giới hạn chiều rộng nội dung để không bị bè ra quá */}
                <div className="max-w-2xl animate-fade-in-up">
                    {/* Tagline nhỏ phía trên */}
                    <span className="inline-block py-1 px-3 rounded-full bg-primary-500/20 text-primary-300 text-sm font-semibold mb-4 uppercase tracking-wider border border-primary-500/30">
                        Chào mừng đến với ShopSmart
                    </span>

                    {/* Tiêu đề lớn (H1) */}
                    <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold leading-tight mb-6 tracking-tight">
                        Khám phá thế giới <br className="hidden md:block" />
                        mua sắm{" "}
                        <span className="text-primary-400">thông minh</span>.
                    </h1>

                    {/* Đoạn mô tả (Subtitle) */}
                    <p className="text-lg md:text-xl text-gray-200 mb-10 leading-relaxed">
                        Săn hàng ngàn deal hời, sản phẩm chất lượng với trải
                        nghiệm mua sắm trực tuyến tiện lợi, an toàn và nhanh
                        chóng nhất.
                    </p>

                    {/* Các nút CTA (Call to Action) */}
                    <div className="flex flex-col sm:flex-row gap-4">
                        {/* Nút chính: Mua ngay (Màu cam chủ đạo) */}
                        <Link
                            to="/products"
                            className="inline-flex items-center justify-center gap-2 bg-primary-500 text-white px-8 py-4 rounded-full font-bold text-lg hover:bg-primary-600 transition transform hover:-translate-y-1 shadow-lg hover:shadow-primary-500/30"
                        >
                            <FaShoppingBag />
                            Mua sắm ngay
                        </Link>
                    </div>
                </div>
            </div>

            {/* (Tùy chọn) Hiệu ứng sóng ở đáy để chuyển tiếp mượt mà xuống phần dưới */}
            <div className="absolute bottom-0 left-0 right-0">
                <svg
                    className="fill-gray-50"
                    viewBox="0 0 1440 120"
                    xmlns="http://www.w3.org/2000/svg"
                >
                    <path d="M0,64L80,69.3C160,75,320,85,480,80C640,75,800,53,960,48C1120,43,1280,53,1360,58.7L1440,64L1440,320L1360,320C1280,320,1120,320,960,320C800,320,640,320,480,320C320,320,160,320,80,320L0,320Z"></path>
                </svg>
            </div>
        </section>
    );
};

export default HeroSection;
