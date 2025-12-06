import { FaCheckCircle } from "react-icons/fa";

const ProductInfo = ({ product }) => {
    if (!product) return null;

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
                            {/* Duyệt qua Object details để tạo bảng */}
                            {Object.entries(product.details).map(
                                ([key, value], idx) => (
                                    <div
                                        key={key}
                                        className={`flex justify-between py-3 border-b border-gray-200 ${
                                            idx === 0 ? "pt-0" : ""
                                        } last:border-0`}
                                    >
                                        <span className="text-gray-500 font-medium w-1/3 pr-2 break-words">
                                            {key}
                                        </span>
                                        <span className="text-gray-900 w-2/3 text-right font-medium break-words pl-2">
                                            {value}
                                        </span>
                                    </div>
                                )
                            )}

                            {/* Thêm Category vào bảng thông số */}
                            <div className="flex justify-between py-3 border-t border-gray-200 mt-2 pt-4">
                                <span className="text-gray-500 font-medium">
                                    Danh mục
                                </span>
                                <span className="text-primary-600 font-bold">
                                    {product.categories?.length > 0
                                        ? product.categories.map(
                                              (cat, index) => {
                                                  return (
                                                      <div
                                                          key={index}
                                                          className="mb-1 last:mb-0"
                                                      >
                                                          {cat}
                                                      </div>
                                                  );
                                              }
                                          )
                                        : product.main_category?.name ||
                                          "Sản phẩm"}
                                </span>
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
