import React, { useEffect, useState } from "react";
import { getRecommendations } from "../services/recommendService";
// Giả sử bạn có component ProductCard để hiển thị sản phẩm
import ProductCard from "../components/ProductCard";
import { useSelector } from "react-redux";

const RecommendPage = () => {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const { user } = useSelector((state) => state.auth);

    useEffect(() => {
        const fetchRecs = async () => {
            try {
                const data = await getRecommendations(user.id);
                setProducts(data);
            } catch (error) {
                console.error("Lỗi lấy gợi ý:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchRecs();
    }, [user?.id]);

    return (
        <div className="container mx-auto px-4 py-8">
            <h1 className="text-2xl font-bold mb-6 uppercase">
                Gợi ý dành riêng cho bạn
            </h1>
            {loading ? (
                <p>Đang tính toán sở thích của bạn...</p>
            ) : (
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-4 gap-4">
                    {products.map((product) => (
                        <ProductCard key={product.id} product={product} />
                    ))}
                </div>
            )}
        </div>
    );
};

export default RecommendPage;
