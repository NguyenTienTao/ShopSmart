import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../services/supabaseClient";
import { FaLayerGroup, FaArrowRight } from "react-icons/fa";
import Loading from "../components/Loading";

const CategoryPage = () => {
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        document.title = "Danh mục sản phẩm";

        const fetchCategories = async () => {
            setLoading(true);
            try {
                // Lấy danh mục VÀ đếm số sản phẩm trong đó
                const { data, error } = await supabase
                    .from("categories")
                    .select("*, products(count)");

                if (error) throw error;

                // Sắp xếp theo tên A-Z
                const sortedData = data.sort((a, b) =>
                    a.name.localeCompare(b.name)
                );
                setCategories(sortedData);
            } catch (error) {
                console.error("Lỗi tải danh mục:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchCategories();
    }, []);

    if (loading) {
        return <Loading fullScreen={true} />;
    }

    return (
        <div className="container mx-auto px-4 py-12">
            {/* Header */}
            <div className="text-center mb-16">
                <span className="text-primary-600 font-semibold tracking-wider uppercase text-sm">
                    Khám phá
                </span>
                <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mt-2 mb-4">
                    Danh mục sản phẩm
                </h1>
                <p className="text-gray-500 max-w-2xl mx-auto">
                    Tìm kiếm sản phẩm dễ dàng hơn theo các nhóm hàng chuyên
                    biệt.
                </p>
            </div>

            {/* Grid Danh mục */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8">
                {categories.map((cat) => (
                    <Link
                        key={cat.id}
                        // 🔥 LINK QUAN TRỌNG: Chuyển sang ProductPage và tự động lọc
                        to={`/products?category=${cat.id}`}
                        className="group flex flex-col bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden h-full"
                    >
                        {/* 1. Hình ảnh (Thumbnail) */}
                        <div className="relative h-48 overflow-hidden bg-gray-50">
                            {cat.image_url ? (
                                <img
                                    src={cat.image_url}
                                    alt={cat.name}
                                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                                />
                            ) : (
                                // Fallback nếu không có ảnh
                                <div className="w-full h-full flex items-center justify-center text-gray-300">
                                    <FaLayerGroup className="text-6xl opacity-50" />
                                </div>
                            )}

                            {/* Overlay màu khi hover */}
                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300"></div>
                        </div>

                        {/* 2. Nội dung text */}
                        <div className="p-6 flex flex-col flex-grow">
                            <div className="flex justify-between items-start mb-2">
                                <h3 className="text-xl font-bold text-gray-800 group-hover:text-primary-600 transition-colors">
                                    {cat.name}
                                </h3>
                                {/* Số lượng sản phẩm (Badge) */}
                                <span className="bg-gray-100 text-gray-600 text-xs font-semibold px-2 py-1 rounded-full">
                                    {cat.products?.[0]?.count || 0} sản phẩm
                                </span>
                            </div>

                            {/* Mô tả (Cắt ngắn nếu dài quá) */}
                            <p className="text-gray-500 text-sm line-clamp-2 mb-4 flex-grow">
                                {cat.description ||
                                    "Chưa có mô tả cho danh mục này."}
                            </p>

                            {/* Nút Xem ngay */}
                            <div className="flex items-center text-primary-600 font-medium text-sm mt-auto group/btn">
                                Xem ngay
                                <FaArrowRight className="ml-2 transform group-hover/btn:translate-x-1 transition-transform" />
                            </div>
                        </div>
                    </Link>
                ))}
            </div>
        </div>
    );
};

export default CategoryPage;
