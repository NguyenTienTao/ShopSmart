import { FaPaperPlane } from "react-icons/fa";

const NewsLetter = () => {
    return (
        <section className="py-20 bg-primary-600 text-white relative overflow-hidden">
            {/* Họa tiết nền (trang trí) */}
            <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
                <div className="absolute -top-24 -left-24 w-96 h-96 bg-white rounded-full mix-blend-overlay blur-3xl"></div>
                <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-white rounded-full mix-blend-overlay blur-3xl"></div>
            </div>

            <div className="container mx-auto px-4 text-center relative z-10">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-white/20 rounded-full mb-6 backdrop-blur-sm">
                    <FaPaperPlane className="text-2xl" />
                </div>

                <h2 className="text-3xl md:text-4xl font-bold mb-4">
                    Đăng ký nhận bản tin
                </h2>
                <p className="text-primary-100 mb-8 max-w-lg mx-auto text-lg">
                    Nhận thông tin về các sản phẩm mới, khuyến mãi đặc biệt và
                    mã giảm giá độc quyền gửi thẳng vào hộp thư của bạn.
                </p>

                <form
                    className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto"
                    onSubmit={(e) => e.preventDefault()}
                >
                    <input
                        type="email"
                        placeholder="Nhập địa chỉ email của bạn..."
                        className="flex-1 px-5 py-3 rounded-full text-gray-800 focus:outline-none focus:ring-4 focus:ring-primary-400/50 shadow-lg"
                        required
                    />
                    <button
                        type="submit"
                        className="px-8 py-3 bg-gray-900 text-white font-bold rounded-full hover:bg-gray-800 transition shadow-lg whitespace-nowrap"
                    >
                        Đăng ký
                    </button>
                </form>

                <p className="text-xs text-primary-200 mt-4">
                    Chúng tôi cam kết không spam. Bạn có thể hủy đăng ký bất cứ
                    lúc nào.
                </p>
            </div>
        </section>
    );
};

export default NewsLetter;
