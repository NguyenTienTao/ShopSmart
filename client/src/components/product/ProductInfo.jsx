import { FaCheckCircle } from "react-icons/fa";

const ProductInfo = ({ product }) => {
    if (!product) return null;

    const renderDetailValue = (value) => {
        // 1. Nếu là null hoặc undefined
        if (value === null || value === undefined) return "---";

        // 2. Nếu là Mảng (Array)
        if (Array.isArray(value)) {
            return value.map((cat, index) => {
                return (
                    <div key={index} className="mb-1 last:mb-0">
                        {cat}
                    </div>
                );
            });
        }

        // 3. Nếu là Object (Ví dụ: Best Sellers Rank) -> Render danh sách nhỏ
        if (typeof value === "object") {
            return (
                <ul className="mt-1 space-y-1">
                    {Object.entries(value).map(([subKey, subValue]) => (
                        <li
                            key={subKey}
                            className="flex justify-between text-xs border-b border-gray-100 last:border-0 pb-1 last:pb-0"
                        >
                            <span className="text-gray-500 w-2/3 pr-2">
                                {subKey}
                            </span>
                            <span className="text-primary-600 font-bold w-1/3 text-right">
                                {/* Thêm dấu # nếu là số hạng (Rank) cho đẹp */}
                                {typeof subValue === "number"
                                    ? `#${subValue.toLocaleString()}`
                                    : subValue}
                            </span>
                        </li>
                    ))}
                </ul>
            );
        }

        // 4. Các trường hợp còn lại (String, Number)
        return String(value);
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 animate-fade-in">
            {/* --- CỘT TRÁI: NỘI DUNG TEXT & TÍNH NĂNG (Chiếm 2/3) --- */}
            <div className="lg:col-span-2 space-y-8">
                {/* 1. Features (Tính năng nổi bật - Dạng list) */}
                {product.features && product.features.length > 0 && (
                    <div>
                        <h3 className="text-lg font-bold text-gray-900 mb-4">
                            Tính năng nổi bật
                        </h3>
                        <ul className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {product.features.map((feat, idx) => (
                                <li
                                    key={idx}
                                    className="flex items-start gap-3 text-gray-700 text-sm bg-gray-50 p-3 rounded-lg border border-gray-100 transition hover:border-primary-200"
                                >
                                    <FaCheckCircle className="text-green-500 mt-0.5 flex-shrink-0" />
                                    <span className="leading-relaxed">
                                        {feat}
                                    </span>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}

                {/* 2. Description (Mô tả chi tiết - Văn bản) */}
                {product.description && product.description.length > 0 && (
                    <div>
                        <h3 className="text-lg font-bold text-gray-900 mb-4">
                            Chi tiết sản phẩm
                        </h3>
                        <div className="prose prose-blue max-w-none text-gray-600 leading-relaxed text-justify">
                            {/* Xử lý trường hợp description là Mảng hoặc Chuỗi */}
                            {Array.isArray(product.description) ? (
                                product.description.map((p, i) => (
                                    <p key={i} className="mb-4 last:mb-0">
                                        {p}
                                    </p>
                                ))
                            ) : (
                                <p>{product.description}</p>
                            )}
                        </div>
                    </div>
                )}

                {/* 3. Author Info (Chỉ hiện nếu là Sách) */}
                {product.author && (
                    <div className="bg-white border border-gray-200 rounded-xl p-6 flex flex-col sm:flex-row gap-6 items-start shadow-sm">
                        <img
                            src={
                                product.author.avatar ||
                                "https://placehold.co/100"
                            }
                            alt={product.author.name}
                            className="w-20 h-20 rounded-full object-cover border-2 border-primary-100"
                        />
                        <div>
                            <h4 className="text-lg font-bold text-gray-900 mb-2">
                                Về tác giả:{" "}
                                <span className="text-primary-600">
                                    {product.author.name}
                                </span>
                            </h4>
                            <div className="text-gray-600 text-sm space-y-2">
                                {Array.isArray(product.author.about) ? (
                                    product.author.about.map((p, i) => (
                                        <p key={i}>{p}</p>
                                    ))
                                ) : (
                                    <p>{product.author.about}</p>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* --- CỘT PHẢI: BẢNG THÔNG SỐ KỸ THUẬT (Chiếm 1/3) --- */}
            <div className="lg:col-span-1">
                <div className="bg-gray-50 rounded-xl p-6 border border-gray-100 sticky top-24">
                    <h3 className="text-lg font-bold text-gray-900 mb-4 border-b border-gray-200 pb-2">
                        Thông số kỹ thuật
                    </h3>

                    {product.details ? (
                        <div className="space-y-0 text-sm">
                            {Object.entries(product.details).map(
                                ([key, value], idx) => (
                                    <div
                                        key={idx}
                                        // Thêm items-start để căn lề trên nếu nội dung bên phải dài (như cái Rank)
                                        className={`flex justify-between items-start py-3 border-b border-gray-200 ${
                                            idx === 0 ? "pt-0" : ""
                                        } last:border-0`}
                                    >
                                        {/* Cột Tên (Key) */}
                                        <span className="text-gray-500 font-medium w-1/3 pr-2 break-words mt-0.5">
                                            {key}
                                        </span>

                                        {/* Cột Giá trị (Value) - Gọi hàm renderDetailValue */}
                                        <div className="text-gray-900 w-2/3 text-right font-medium break-words pl-2">
                                            {renderDetailValue(value)}
                                        </div>
                                    </div>
                                )
                            )}

                            {/* Danh mục */}
                            <div className="flex justify-between items-start py-3 border-t border-gray-200 mt-2 pt-4">
                                <span className="text-gray-500 font-medium w-1/3 mt-0.5">
                                    Phân loại
                                </span>
                                <div className="text-gray-900 w-2/3 text-right font-medium">
                                    {/* Dùng hàm renderDetailValue luôn cho nhất quán */}
                                    {renderDetailValue(product.categories)}
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="text-center py-8 text-gray-400 italic">
                            Đang cập nhật thông số...
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ProductInfo;
