import { FaShippingFast, FaShieldAlt, FaHeadset, FaUndo } from "react-icons/fa";

const features = [
    {
        icon: <FaShippingFast />,
        title: "Miễn phí vận chuyển",
        desc: "Cho đơn hàng từ 500k",
    },
    {
        icon: <FaShieldAlt />,
        title: "Thanh toán bảo mật",
        desc: "An toàn tuyệt đối 100%",
    },
    {
        icon: <FaUndo />,
        title: "30 Ngày đổi trả",
        desc: "Thủ tục hoàn tiền đơn giản",
    },
    {
        icon: <FaHeadset />,
        title: "Hỗ trợ 24/7",
        desc: "Luôn sẵn sàng giải đáp",
    },
];

const ServiceFeatures = () => {
    return (
        <section className="py-12 bg-white border-b border-gray-100">
            <div className="container mx-auto px-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                    {features.map((item, index) => (
                        <div
                            key={index}
                            className="flex items-start gap-4 p-4 rounded-lg hover:bg-gray-50 transition"
                        >
                            <div className="text-4xl text-primary-500">
                                {item.icon}
                            </div>
                            <div>
                                <h3 className="font-bold text-gray-800 text-lg mb-1">
                                    {item.title}
                                </h3>
                                <p className="text-gray-500 text-sm">
                                    {item.desc}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default ServiceFeatures;
