import { useEffect, useState } from "react";
import { supabase } from "../../services/supabaseClient";
import ProductCard from "../ProductCard";

const BestSellers = () => {
    const [products, setProducts] = useState([]);

    useEffect(() => {
        const fetchBestSellers = async () => {
            const { data } = await supabase
                .from("products")
                .select("*, categories(name)")
                .order("rating_number", { ascending: false }) // Giả lập bán chạy bằng số lượt đánh giá
                .limit(4);

            setProducts(data || []);
        };
        fetchBestSellers();
    }, []);

    return (
        <section className="py-16 bg-white">
            <div className="container mx-auto px-4">
                <h2 className="text-3xl font-bold text-center mb-4 text-gray-900">
                    Sản phẩm bán chạy
                </h2>
                <p className="text-gray-500 text-center mb-12 max-w-2xl mx-auto">
                    Những sản phẩm được khách hàng yêu thích và chọn mua nhiều
                    nhất tuần qua.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
                    {products.map((product) => (
                        <ProductCard
                            key={product.id}
                            product={product}
                            badge="Hot"
                        />
                    ))}
                </div>
            </div>
        </section>
    );
};

export default BestSellers;
