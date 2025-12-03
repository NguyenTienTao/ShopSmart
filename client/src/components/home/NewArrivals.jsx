import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../../services/supabaseClient";
import ProductCard from "../ProductCard";
import { FaArrowRight } from "react-icons/fa";

const NewArrivals = () => {
    const [products, setProducts] = useState([]);

    useEffect(() => {
        const fetchNewest = async () => {
            // Lấy 8 sản phẩm mới nhất
            const { data } = await supabase
                .from("products")
                .select("*, categories(name)")
                .order("created_at", { ascending: false })
                .limit(8);
            setProducts(data || []);
        };
        fetchNewest();
    }, []);

    return (
        <section className="py-16 bg-gray-50">
            <div className="container mx-auto px-4">
                {/* Header Section */}
                <div className="flex justify-between items-end mb-10">
                    <div>
                        <span className="text-primary-600 font-semibold tracking-wider uppercase text-sm">
                            Mới lên kệ
                        </span>
                        <h2 className="text-3xl font-bold text-gray-900 mt-2">
                            Sản phẩm mới về
                        </h2>
                    </div>
                    <Link
                        to="/products"
                        className="hidden md:flex items-center gap-2 text-gray-600 hover:text-primary-600 font-medium transition"
                    >
                        Xem tất cả <FaArrowRight size={14} />
                    </Link>
                </div>

                {/* Grid Sản phẩm */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                    {products.map((product) => (
                        <ProductCard
                            key={product.id}
                            product={product}
                            badge="Mới"
                        />
                    ))}
                </div>

                {/* Nút xem thêm cho Mobile */}
                <div className="mt-10 text-center md:hidden">
                    <Link
                        to="/products"
                        className="inline-block border border-gray-300 px-6 py-2 rounded-full text-gray-700 font-medium hover:bg-gray-100"
                    >
                        Xem tất cả
                    </Link>
                </div>
            </div>
        </section>
    );
};

export default NewArrivals;
