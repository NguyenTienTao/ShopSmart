import { useEffect, useState } from "react";
import { supabase } from "../../services/supabaseClient";
import ProductCard from "../ProductCard";
import Loading from "../Loading"; // Dùng Loading của mình
import { FaBoxOpen } from "react-icons/fa"; // Icon cho Empty state

const SimilarProducts = ({ categoryId, currentProductId }) => {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchSimilar = async () => {
            if (!categoryId) {
                setLoading(false);
                return;
            }

            try {
                const { data, error } = await supabase
                    .from("products")
                    .select("*, categories(name)")
                    .eq("category_id", categoryId) // Cùng danh mục
                    .neq("id", currentProductId) // Trừ chính nó ra
                    .limit(4); // Lấy 4 cái

                if (error) throw error;
                setProducts(data || []);
            } catch (err) {
                console.error("Lỗi lấy sản phẩm tương tự:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchSimilar();
    }, [categoryId, currentProductId]);

    if (loading) {
        return <Loading />;
    }

    if (products.length === 0) {
        // Empty State tự chế bằng Tailwind
        return (
            <div className="py-16 text-center flex flex-col items-center justify-center text-gray-400">
                <FaBoxOpen className="text-6xl mb-4 opacity-50" />
                <p className="text-lg">Không có sản phẩm tương tự nào.</p>
            </div>
        );
    }

    return (
        <div className="animate-fade-in mt-8">
            <h3 className="text-xl font-bold text-gray-900 mb-6 border-l-4 border-primary-600 pl-3">
                Có thể bạn cũng thích
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {products.map((product) => (
                    <ProductCard key={product.id} product={product} />
                ))}
            </div>
        </div>
    );
};

export default SimilarProducts;
