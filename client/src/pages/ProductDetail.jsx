import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "../services/supabaseClient";
import {
    FaStar,
    FaStarHalfAlt,
    FaRegStar,
    FaShareAlt,
    FaTruck,
    FaUndo,
} from "react-icons/fa";
import { formatCurrency } from "../helpers/formatters";
import AddToCartButton from "../components/AddToCartButton";
import FavoriteButton from "../components/FavoriteButton";
import Loading from "../components/Loading";
import ProductInfo from "../components/product/ProductInfo";
import SimilarProducts from "../components/product/SimilarProducts";
import ReviewSection from "../components/product/ReviewSection";

const ProductDetail = () => {
    const { id } = useParams();
    const [product, setProduct] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activeImage, setActiveImage] = useState("");
    const [quantity, setQuantity] = useState(1);

    // State quản lý Tab đang mở
    const [activeTab, setActiveTab] = useState("description"); // 'description', 'reviews', 'similar'

    // State quản lý Hover Tác giả
    const [showAuthorTooltip, setShowAuthorTooltip] = useState(false);

    useEffect(() => {
        const fetchProduct = async () => {
            setLoading(true);
            const { data, error } = await supabase
                .from("products")
                .select("*, main_category:categories(name, id)")
                .eq("id", id)
                .single();

            if (error) {
                console.error("Lỗi:", error);
            } else {
                document.title = data.title;
                setProduct(data);
                if (data.images && data.images.length > 0) {
                    const firstImg = data.images[0];
                    setActiveImage(
                        typeof firstImg === "object" ? firstImg.large : firstImg
                    );
                }
            }
            setLoading(false);
        };

        fetchProduct();
        window.scrollTo(0, 0);
    }, [id]);

    if (loading) return <Loading fullScreen={true} />;
    if (!product)
        return (
            <div className="text-center py-20">Không tìm thấy sản phẩm.</div>
        );

    // --- HELPER: Render Sao ---
    const renderStars = (rating) => {
        const stars = [];
        for (let i = 1; i <= 5; i++) {
            if (i <= rating)
                stars.push(<FaStar key={i} className="text-yellow-400" />);
            else if (i === Math.ceil(rating) && !Number.isInteger(rating))
                stars.push(
                    <FaStarHalfAlt key={i} className="text-yellow-400" />
                );
            else stars.push(<FaRegStar key={i} className="text-gray-300" />);
        }
        return stars;
    };

    return (
        <div className="container mx-auto px-4 py-8">
            {/* --- PHẦN 1: ẢNH & MUA HÀNG --- */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 md:p-8 mb-10">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                    {/* CỘT TRÁI: ẢNH SẢN PHẨM */}
                    <div className="flex flex-col gap-4">
                        {/* Ảnh chính */}
                        <div className="relative aspect-square rounded-xl overflow-hidden bg-gray-50 border border-gray-100 group">
                            <img
                                src={
                                    activeImage ||
                                    "https://placehold.co/600x600?text=No+Image"
                                }
                                alt={product.title}
                                className="w-full h-full object-contain p-4 transition-transform duration-500 group-hover:scale-105"
                            />
                            <div className="absolute top-4 right-4 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                {/* Nút yêu thích đặt trên ảnh cho đẹp */}
                                <div className="bg-white rounded-full shadow p-1">
                                    <FavoriteButton product={product} />
                                </div>
                            </div>
                        </div>

                        {/* Thumbnails */}
                        {product.images && product.images.length > 1 && (
                            <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-thin">
                                {product.images.map((img, index) => {
                                    const imgLink =
                                        typeof img === "object"
                                            ? img.large
                                            : img;
                                    const thumbLink =
                                        typeof img === "object"
                                            ? img.thumb || img.large
                                            : img;
                                    return (
                                        <button
                                            key={index}
                                            onClick={() =>
                                                setActiveImage(imgLink)
                                            }
                                            className={`w-20 h-20 flex-shrink-0 bg-white rounded-lg border-2 overflow-hidden ${
                                                activeImage === imgLink
                                                    ? "border-primary-600 ring-2 ring-primary-100"
                                                    : "border-gray-200 hover:border-primary-300"
                                            }`}
                                        >
                                            <img
                                                src={thumbLink}
                                                alt=""
                                                className={`w-full h-full p-1 ${
                                                    activeImage === imgLink
                                                        ? "object-contain"
                                                        : "object-cover"
                                                }`}
                                            />
                                        </button>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    {/* CỘT PHẢI: THÔNG TIN & MUA HÀNG */}
                    <div>
                        {/* Breadcrumb nhỏ */}
                        <Link
                            to={`/products?category=${product.category_id}`}
                            className="text-sm text-primary-600 font-semibold uppercase tracking-wider mb-2 inline-block hover:underline"
                        >
                            {product.main_category.name || "Sản phẩm"}
                        </Link>

                        {/* Tên sản phẩm */}
                        <h1 className="text-3xl font-bold text-gray-900 mb-2 leading-tight">
                            {product.title}
                        </h1>

                        {/* Rating & Author */}
                        <div className="flex flex-wrap items-center gap-4 mb-6 pb-6 border-b border-gray-100">
                            <div className="flex items-center gap-1">
                                <span className="flex text-sm">
                                    {renderStars(product.average_rating || 0)}
                                </span>
                                <span className="text-sm text-gray-500 ml-1">
                                    ({product.rating_number || 0} reviews)
                                </span>
                            </div>

                            {/* Tác giả (Nếu có) - Hiển thị Tooltip khi hover */}
                            {product.author && (
                                <div className="relative flex items-center gap-2 text-sm text-gray-600">
                                    <span>Tác giả:</span>
                                    <span
                                        className="font-bold text-primary-600 cursor-pointer hover:underline"
                                        onMouseEnter={() =>
                                            setShowAuthorTooltip(true)
                                        }
                                        onMouseLeave={() =>
                                            setShowAuthorTooltip(false)
                                        }
                                    >
                                        {product.author.name}
                                    </span>

                                    {/* TOOLTIP TÁC GIẢ */}
                                    {showAuthorTooltip && (
                                        <div className="absolute top-6 left-0 z-50 w-72 bg-white p-4 rounded-xl shadow-xl border border-gray-100 animate-fade-in">
                                            <div className="flex items-center gap-3 mb-3">
                                                <img
                                                    src={
                                                        product.author.avatar ||
                                                        "https://placehold.co/50"
                                                    }
                                                    alt={product.author.name}
                                                    className="w-12 h-12 rounded-full object-cover border border-gray-200"
                                                />
                                                <h4 className="font-bold text-gray-900">
                                                    {product.author.name}
                                                </h4>
                                            </div>
                                            <p className="text-xs text-gray-600 leading-relaxed line-clamp-4">
                                                {Array.isArray(
                                                    product.author.about
                                                )
                                                    ? product.author.about[0]
                                                    : product.author.about}
                                            </p>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Giá tiền */}
                        <div className="flex items-baseline gap-4 mb-6">
                            <span className="text-4xl font-bold text-primary-600">
                                {formatCurrency(product.price)}
                            </span>
                            {/* Giả sử có giá gốc để hiện giảm giá (Tùy chọn) */}
                            {/* <span className="text-lg text-gray-400 line-through">{formatCurrency(product.price * 1.2)}</span> */}
                            {/* <span className="bg-red-100 text-red-600 px-2 py-1 rounded text-xs font-bold">-20%</span> */}
                        </div>

                        {/* Mô tả ngắn (Short Desc) */}
                        {product.description && (
                            <div className="mb-8">
                                <p className="text-gray-600 text-sm leading-relaxed line-clamp-4 text-justify">
                                    {/* Xử lý nếu description là mảng chuỗi hoặc chuỗi đơn */}
                                    {Array.isArray(product.description)
                                        ? product.description.join(" ")
                                        : product.description}
                                </p>
                            </div>
                        )}

                        {/* Bộ chọn (Số lượng) & Nút Mua */}
                        <div className="bg-gray-50 p-6 rounded-xl border border-gray-100 mb-6">
                            <div className="flex items-center gap-6 mb-6">
                                <span className="font-semibold text-gray-700">
                                    Số lượng:
                                </span>
                                <div className="flex items-center bg-white border border-gray-300 rounded-lg">
                                    <button
                                        onClick={() =>
                                            setQuantity(
                                                Math.max(1, quantity - 1)
                                            )
                                        }
                                        className="px-3 py-1 text-gray-600 bg-white hover:bg-gray-100 rounded-l-lg transition"
                                    >
                                        -
                                    </button>
                                    <input
                                        type="number"
                                        value={quantity}
                                        readOnly
                                        className="w-12 pl-[14px] text-center text-gray-900 font-bold focus:outline-none py-1"
                                    />
                                    <button
                                        onClick={() =>
                                            setQuantity(
                                                Math.min(
                                                    product.stock,
                                                    quantity + 1
                                                )
                                            )
                                        }
                                        className="px-3 py-1 text-gray-600 bg-white hover:bg-gray-100 rounded-r-lg transition"
                                    >
                                        +
                                    </button>
                                </div>
                                <span className="text-sm text-gray-500">
                                    {product.stock > 0
                                        ? `${product.stock} sản phẩm có sẵn`
                                        : "Hết hàng"}
                                </span>
                            </div>

                            <div className="flex gap-4">
                                <div className="flex-1">
                                    <AddToCartButton
                                        product={product}
                                        quantity={quantity}
                                    />
                                </div>
                                {/* Nút phụ (So sánh / Share) - Tùy chọn */}
                                <button className="w-12 h-12 flex items-center justify-center border border-gray-300 rounded-full text-gray-500 hover:text-primary-600 hover:border-primary-600 transition bg-white">
                                    <FaShareAlt />
                                </button>
                            </div>
                        </div>

                        {/* Policy nhỏ */}
                        <div className="grid grid-cols-2 gap-4 text-sm text-gray-500">
                            <div className="flex items-center gap-2">
                                <FaTruck className="text-primary-500" /> Miễn
                                phí vận chuyển
                            </div>
                            <div className="flex items-center gap-2">
                                <FaUndo className="text-primary-500" /> Đổi trả
                                30 ngày
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* --- PHẦN 2: TABS CHI TIẾT (Description, Reviews, Similar) --- */}
            <div>
                {/* Tab Header */}
                <div className="flex border-b border-gray-200 mb-8">
                    <button
                        onClick={() => setActiveTab("description")}
                        className={`px-8 py-4 font-semibold text-lg bg-transparent transition border-b-2 ${
                            activeTab === "description"
                                ? "border-primary-600 text-primary-600"
                                : "border-transparent text-gray-500 hover:text-gray-700"
                        }`}
                    >
                        Mô tả & Thông số
                    </button>
                    <button
                        onClick={() => setActiveTab("reviews")}
                        className={`px-8 py-4 font-semibold text-lg bg-transparent transition border-b-2 ${
                            activeTab === "reviews"
                                ? "border-primary-600 text-primary-600"
                                : "border-transparent text-gray-500 hover:text-gray-700"
                        }`}
                    >
                        Đánh giá ({product.rating_number})
                    </button>
                    <button
                        onClick={() => setActiveTab("similar")}
                        className={`px-8 py-4 font-semibold text-lg bg-transparent transition border-b-2 ${
                            activeTab === "similar"
                                ? "border-primary-600 text-primary-600"
                                : "border-transparent text-gray-500 hover:text-gray-700"
                        }`}
                    >
                        Sản phẩm tương tự
                    </button>
                </div>

                {/* Tab Content */}
                <div className="bg-white rounded-xl p-6 min-h-[300px]">
                    {/* NỘI DUNG: MÔ TẢ & THÔNG SỐ */}
                    {activeTab === "description" && (
                        <ProductInfo product={product} />
                    )}

                    {/* Placeholder cho các tab chưa làm */}
                    {activeTab === "reviews" && (
                        <ReviewSection productId={product.id} />
                    )}
                    {activeTab === "similar" && (
                        <SimilarProducts
                            categoryId={product.category_id}
                            currentProductId={product.id}
                        />
                    )}
                </div>
            </div>
        </div>
    );
};

export default ProductDetail;
