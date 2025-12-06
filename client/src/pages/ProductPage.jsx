import React, { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { supabase } from "../services/supabaseClient";
import ProductCard from "../components/ProductCard";
import {
    FaFilter,
    FaSortAmountDown,
    FaThLarge,
    FaSearch,
    FaAngleLeft,
    FaAngleRight,
    FaRedo,
} from "react-icons/fa";
import Pagination from "../components/Pagination";

const ITEMS_PER_PAGE = 12; // 12 sản phẩm (chia hết cho 4 cột)

const ProductPage = () => {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [total, setTotal] = useState(0);

    // Hook quản lý URL Params (?sort=...&page=...)
    const [searchParams, setSearchParams] = useSearchParams();

    // Lấy các giá trị từ URL (Nếu không có thì lấy mặc định)
    const currentPage = parseInt(searchParams.get("page")) || 1;
    const sortType = searchParams.get("sort") || "newest"; // Mặc định là mới nhất
    const searchQuery = searchParams.get("q") || "";
    const selectedCategory = searchParams.get("category") || "all";

    // 2. Lấy Sản phẩm (Chạy mỗi khi URL thay đổi)
    useEffect(() => {
        document.title = "Danh sách sản phẩm";

        const fetchProducts = async () => {
            setLoading(true);

            // Tính toán phân trang
            const from = (currentPage - 1) * ITEMS_PER_PAGE;
            const to = from + ITEMS_PER_PAGE - 1;

            // Bắt đầu query
            let query = supabase
                .from("products")
                .select("*, categories(name)", { count: "exact" }); // Lấy cả tổng số lượng để phân trang

            // --- A. XỬ LÝ TÌM KIẾM (SEARCH) ---
            if (searchQuery) {
                // Tìm theo tên sản phẩm (ilike: không phân biệt hoa thường)
                query = query.ilike("title", `%${searchQuery}%`);
            }

            // --- B. XỬ LÝ LỌC DANH MỤC ---
            if (selectedCategory !== "all") {
                query = query.eq("category_id", selectedCategory);
            }

            // --- C. XỬ LÝ SẮP XẾP (SORT) ---
            switch (sortType) {
                case "newest":
                    query = query.order("created_at", { ascending: false });
                    break;
                case "oldest":
                    query = query.order("created_at", { ascending: true });
                    break;
                case "price-asc":
                    query = query.order("price", { ascending: true });
                    break;
                case "price-desc":
                    query = query.order("price", { ascending: false });
                    break;
                case "name-asc":
                    query = query.order("title", { ascending: true });
                    break;
                case "name-desc":
                    query = query.order("title", { ascending: false });
                    break;
                default:
                    query = query.order("created_at", { ascending: false });
            }

            // --- D. XỬ LÝ PHÂN TRANG ---
            query = query.range(from, to);

            // --- THỰC THI ---
            const { data, count, error } = await query;

            if (error) {
                console.error("Lỗi tải sản phẩm:", error);
            } else {
                setProducts(data || []);
                setTotal(count || 0);
            }
            setLoading(false);
        };

        fetchProducts();

        // Cuộn lên đầu trang mỗi khi đổi trang/lọc
        window.scrollTo({ top: 0, behavior: "smooth" });
    }, [currentPage, sortType, searchQuery, selectedCategory]);

    // --- CÁC HÀM CẬP NHẬT URL ---

    const handleSortChange = (e) => {
        setSearchParams({
            ...Object.fromEntries(searchParams), // Giữ lại các param khác (q, category)
            sort: e.target.value,
            page: 1, // Reset về trang 1 khi sort lại
        });
    };

    // Hàm này sẽ đưa URL về dạng /products (xóa hết params)
    const handleResetFilters = () => {
        setSearchParams({}); // Set object rỗng nghĩa là xóa hết params
    };

    const handlePageChange = (newPage) => {
        setSearchParams({
            ...Object.fromEntries(searchParams),
            page: newPage,
        });
    };

    const totalPages = Math.ceil(total / ITEMS_PER_PAGE);

    return (
        <div className="container mx-auto px-4 py-8">
            {/* 1. BREADCRUMB & HEADER */}
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                    {searchQuery
                        ? `Kết quả tìm kiếm: "${searchQuery}"`
                        : "Tất cả sản phẩm"}
                    {(searchQuery ||
                        selectedCategory !== "all" ||
                        sortType !== "newest") && (
                        <button
                            onClick={handleResetFilters}
                            className="text-sm font-normal text-primary-600 bg-primary-50 hover:bg-primary-100 px-3 py-1 mt-2 mb-2 rounded-full flex items-center gap-1 transition-colors"
                            title="Xóa bộ lọc"
                        >
                            <FaRedo className="text-xs" /> Làm mới
                        </button>
                    )}
                </h1>
                <p className="text-gray-500">
                    Tìm thấy <strong className="text-gray-800">{total}</strong>{" "}
                    sản phẩm phù hợp
                </p>
            </div>

            <div className="flex flex-col lg:flex-row gap-8">
                {/* 2. SIDEBAR BỘ LỌC (Bên trái) */}
                {/* <aside className="w-full lg:w-1/4 flex-shrink-0">
                    <div className="bg-white p-5 rounded-xl border border-gray-200 sticky top-24">
                        <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                            <FaFilter className="text-primary-600" /> Bộ lọc
                            danh mục
                        </h3>

                        <ul className="space-y-2">
                            <li>
                                <button
                                    onClick={() => handleCategoryChange("all")}
                                    className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
                                        selectedCategory === "all"
                                            ? "bg-primary-50 text-primary-600 font-semibold"
                                            : "text-gray-600 hover:bg-gray-50"
                                    }`}
                                >
                                    Tất cả sản phẩm
                                </button>
                            </li>
                            {categories.map((cat) => (
                                <li key={cat.id}>
                                    <button
                                        onClick={() =>
                                            handleCategoryChange(cat.id)
                                        }
                                        className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
                                            selectedCategory === cat.id
                                                ? "bg-primary-50 text-primary-600 font-semibold"
                                                : "text-gray-600 hover:bg-gray-50"
                                        }`}
                                    >
                                        {cat.name}
                                    </button>
                                </li>
                            ))}
                        </ul>
                    </div>
                </aside> */}

                {/* 3. KHU VỰC SẢN PHẨM (Bên phải) */}
                <div className="flex-1">
                    {/* Thanh công cụ (Sort) */}
                    <div className="bg-white p-4 rounded-xl border border-gray-200 mb-6 flex flex-wrap justify-between items-center gap-4">
                        <div className="flex items-center gap-2 text-gray-500 text-sm">
                            <FaThLarge /> <span>Hiển thị lưới 4 cột</span>
                        </div>

                        <div className="flex items-center gap-3">
                            <label className="text-sm text-gray-600 font-medium">
                                Sắp xếp theo:
                            </label>
                            <div className="relative">
                                <select
                                    value={sortType}
                                    onChange={handleSortChange}
                                    className="appearance-none bg-gray-50 border border-gray-300 text-gray-700 py-2 pl-4 pr-10 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm cursor-pointer"
                                >
                                    <option value="newest">Mới nhất</option>
                                    <option value="oldest">Cũ nhất</option>
                                    <option value="price-asc">
                                        Giá: Thấp đến Cao
                                    </option>
                                    <option value="price-desc">
                                        Giá: Cao đến Thấp
                                    </option>
                                    <option value="name-asc">Tên: A-Z</option>
                                    <option value="name-desc">Tên: Z-A</option>
                                </select>
                                <FaSortAmountDown className="absolute right-3 top-3 text-gray-400 pointer-events-none" />
                            </div>
                        </div>
                    </div>

                    {/* GRID SẢN PHẨM */}
                    {loading ? (
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                            {/* Skeleton Loading */}
                            {[...Array(8)].map((_, i) => (
                                <div
                                    key={i}
                                    className="bg-gray-200 h-80 rounded-xl animate-pulse"
                                ></div>
                            ))}
                        </div>
                    ) : products.length > 0 ? (
                        <>
                            {/* Lưới sản phẩm 4 cột */}
                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                                {products.map((product) => (
                                    <ProductCard
                                        key={product.id}
                                        product={product}
                                    />
                                ))}
                            </div>

                            {/* PHÂN TRANG */}
                            <Pagination
                                currentPage={currentPage}
                                totalCount={total}
                                pageSize={ITEMS_PER_PAGE}
                                onPageChange={handlePageChange}
                            />
                        </>
                    ) : (
                        // Empty State
                        <div className="bg-white rounded-xl p-12 text-center border border-gray-100">
                            <div className="inline-flex bg-gray-100 p-4 rounded-full mb-4">
                                <FaSearch className="text-4xl text-gray-400" />
                            </div>
                            <h3 className="text-xl font-bold text-gray-800 mb-2">
                                Không tìm thấy sản phẩm nào
                            </h3>
                            <p className="text-gray-500">
                                Hãy thử từ khóa khác hoặc xóa bộ lọc.
                            </p>
                            <button
                                onClick={() => {
                                    setSearchParams({});
                                }}
                                className="mt-6 px-6 py-2 bg-primary-600 text-white rounded-full hover:bg-primary-700 transition"
                            >
                                Xóa bộ lọc
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ProductPage;
