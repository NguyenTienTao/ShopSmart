import React from "react";
import { Link } from "react-router-dom";
import { FaShoppingCart } from "react-icons/fa";
import { formatCurrency } from "../helpers/formatters"; // Nhớ file này mình tạo ở bài trước
import AddToCartButton from "./AddToCartButton"; // Tái sử dụng nút thêm giỏ
import FavoriteButton from "./FavoriteButton"; // Tái sử dụng nút tim

const ProductCard = ({ product, badge }) => {
    return (
        <div className="group bg-white rounded-xl border border-gray-100 overflow-hidden hover:shadow-xl transition-all duration-300 relative flex flex-col h-full">
            {/* 1. Hình ảnh & Badge */}
            <div className="relative aspect-square overflow-hidden bg-gray-100">
                <Link to={`/product/${product.id}`}>
                    <img
                        src={
                            Array.isArray(product.images)
                                ? product.images[0]?.large || product.images[0]
                                : product.images
                        }
                        alt={product.title}
                        className="w-full h-full object-contain group-hover:scale-110 transition-transform duration-500"
                    />
                </Link>

                {/* Nút Yêu thích (Hiện khi hover hoặc luôn hiện trên mobile) */}
                <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <FavoriteButton product={product} />
                </div>

                {/* Nhãn (Mới / Hot / Sale) */}
                {badge && (
                    <span className="absolute top-3 left-3 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded shadow-sm">
                        {badge}
                    </span>
                )}
            </div>

            {/* 2. Thông tin sản phẩm */}
            <div className="p-4 flex flex-col flex-grow">
                {/* Danh mục nhỏ */}
                <div className="text-xs text-gray-500 mb-1 uppercase tracking-wide">
                    {product.categories?.name || "Sản phẩm"}
                </div>

                {/* Tên sản phẩm (Cắt dòng nếu dài) */}
                <Link to={`/product/${product.id}`} className="block">
                    <h3
                        className="text-gray-800 font-semibold mb-2 line-clamp-2 hover:text-primary-600 transition-colors"
                        title={product.title}
                    >
                        {product.title}
                    </h3>
                </Link>

                {/* Giá & Đánh giá (đẩy xuống đáy) */}
                <div className="mt-auto flex items-end justify-between">
                    <div className="flex flex-col">
                        {/* Giá gốc (nếu có giảm giá thì thêm logic gạch ngang) */}
                        <span className="text-lg font-bold text-primary-600">
                            {formatCurrency(product.price)}
                        </span>
                    </div>

                    {/* Nút thêm giỏ hàng nhỏ gọn */}
                    <div className="translate-y-2 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300">
                        {/* Truyền quantity=1 mặc định */}
                        <AddToCartButton product={product} iconOnly={true} />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProductCard;
