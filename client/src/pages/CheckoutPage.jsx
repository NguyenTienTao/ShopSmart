// client/src/pages/CheckoutPage.jsx
import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { supabase } from "../services/supabaseClient";
import { formatCurrency } from "../helpers/formatters";
import { FaTruck, FaMoneyBillWave, FaCreditCard } from "react-icons/fa";
import { toast } from "react-hot-toast";
import Loading from "../components/Loading";
import AddressSelector from "../components/checkout/AddressSelector";

const CheckoutPage = () => {
    const { user } = useSelector((state) => state.auth);
    const [cartItems, setCartItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [processing, setProcessing] = useState(false);
    const navigate = useNavigate();

    // State lưu địa chỉ đang chọn (Object)
    const [selectedAddress, setSelectedAddress] = useState(null);
    const [paymentMethod, setPaymentMethod] = useState("cod");

    const SHIPPING_COST = 0;

    // 1. Load Cart (Giữ nguyên)
    useEffect(() => {
        const fetchCart = async () => {
            try {
                setLoading(true);
                const { data } = await supabase
                    .from("cart_items")
                    .select("*, products(*)")
                    .eq("user_id", user.id);

                if (!data || data.length === 0) {
                    navigate("/cart");
                    return;
                }
                setCartItems(data);
            } finally {
                setLoading(false);
            }
        };
        if (user) fetchCart();
    }, [user?.id]);

    const subtotal = cartItems.reduce(
        (sum, item) => sum + item.quantity * item.products.price,
        0
    );
    const total = subtotal + SHIPPING_COST;

    // 2. Xử lý Đặt hàng
    const handlePlaceOrder = async () => {
        if (!selectedAddress) {
            toast.error("Vui lòng chọn địa chỉ nhận hàng!");
            return;
        }

        setProcessing(true);
        try {
            // A. Tạo đơn hàng
            // Lưu SNAPSHOT địa chỉ vào đơn hàng (để sau này user sửa địa chỉ trong sổ thì đơn cũ ko bị đổi)
            const orderData = {
                user_id: user.id,
                total_price: total,
                status: "pending",
                payment_method: paymentMethod,
                shipping_address: selectedAddress, // Lưu nguyên object địa chỉ vào JSONB
            };

            const { data: newOrder, error: orderError } = await supabase
                .from("orders")
                .insert([orderData])
                .select()
                .single();

            if (orderError) throw orderError;

            // B. Copy sang Order Items (Giữ nguyên)
            const orderItemsData = cartItems.map((item) => ({
                order_id: newOrder.id,
                product_id: item.product_id,
                quantity: item.quantity,
                price: item.products.price,
            }));

            await supabase.from("order_items").insert(orderItemsData);

            // C. Xóa giỏ hàng (Giữ nguyên)
            await supabase.from("cart_items").delete().eq("user_id", user.id);

            navigate("/order-success", { state: { orderId: newOrder.id } });
            toast.success("Đặt hàng thành công!");
        } catch (error) {
            toast.error("Lỗi đặt hàng: " + error.message);
        } finally {
            setProcessing(false);
        }
    };

    if (loading) return <Loading fullScreen />;

    return (
        <div className="bg-gray-50 min-h-screen py-8">
            <div className="container mx-auto px-4">
                <h1 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                    <FaTruck className="text-primary-600" /> Thanh toán
                </h1>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* CỘT TRÁI: ĐỊA CHỈ & THANH TOÁN */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* 1. KHU VỰC CHỌN ĐỊA CHỈ (COMPONENT MỚI) */}
                        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                            <AddressSelector
                                selectedId={selectedAddress?.id}
                                onSelectAddress={(addr) =>
                                    setSelectedAddress(addr)
                                }
                            />
                        </div>

                        {/* 2. Phương thức thanh toán */}
                        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                            <h3 className="font-bold text-gray-800 mb-4">
                                Phương thức thanh toán
                            </h3>
                            <div className="space-y-3">
                                <label
                                    className={`flex items-center p-4 border rounded-lg cursor-pointer transition ${
                                        paymentMethod === "cod"
                                            ? "border-primary-500 bg-primary-50"
                                            : "border-gray-200"
                                    }`}
                                >
                                    <input
                                        type="radio"
                                        name="pay"
                                        value="cod"
                                        checked={paymentMethod === "cod"}
                                        onChange={() => setPaymentMethod("cod")}
                                        className="w-5 h-5 text-primary-600"
                                    />
                                    <div className="ml-3 flex items-center gap-3">
                                        <div className="w-10 h-10 bg-green-100 text-green-600 rounded-full flex items-center justify-center">
                                            <FaMoneyBillWave />
                                        </div>
                                        <div>
                                            <p className="font-semibold text-gray-800">
                                                Thanh toán khi nhận hàng (COD)
                                            </p>
                                            <p className="text-xs text-gray-500">
                                                Thanh toán tiền mặt cho shipper
                                            </p>
                                        </div>
                                    </div>
                                </label>

                                <label
                                    className={`flex items-center p-4 border rounded-lg cursor-pointer transition ${
                                        paymentMethod === "banking"
                                            ? "border-primary-500 bg-primary-50"
                                            : "border-gray-200"
                                    }`}
                                >
                                    <input
                                        type="radio"
                                        name="pay"
                                        value="banking"
                                        checked={paymentMethod === "banking"}
                                        onChange={() =>
                                            setPaymentMethod("banking")
                                        }
                                        className="w-5 h-5 text-primary-600"
                                    />
                                    <div className="ml-3 flex items-center gap-3">
                                        <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center">
                                            <FaCreditCard />
                                        </div>
                                        <div>
                                            <p className="font-semibold text-gray-800">
                                                Chuyển khoản ngân hàng
                                            </p>
                                            <p className="text-xs text-gray-500">
                                                Quét mã QR tiện lợi
                                            </p>
                                        </div>
                                    </div>
                                </label>
                            </div>
                        </div>
                    </div>

                    {/* CỘT PHẢI: TÓM TẮT (Giữ nguyên) */}
                    <div className="lg:col-span-1">
                        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm sticky top-24">
                            <h3 className="text-lg font-bold text-gray-800 mb-6">
                                Tóm tắt đơn hàng
                            </h3>
                            {/* List sản phẩm rút gọn (Text Only) */}
                            <div className="space-y-0 max-h-[300px] overflow-y-auto pr-1 scrollbar-thin mb-6 border border-gray-100 rounded-lg bg-gray-50 p-2">
                                {cartItems.map((item) => (
                                    <div
                                        key={item.id}
                                        className="flex justify-between items-start py-2 border-b border-gray-200 last:border-0"
                                    >
                                        {/* Tên & Số lượng */}
                                        <div className="flex-1 pr-3">
                                            <p className="text-sm font-medium text-gray-700 line-clamp-2">
                                                {item.products.title}
                                            </p>
                                            <p className="text-xs text-gray-500 mt-0.5">
                                                Số lượng:{" "}
                                                <span className="font-bold text-gray-800">
                                                    x{item.quantity}
                                                </span>
                                            </p>
                                        </div>

                                        {/* Giá tiền */}
                                        <span className="text-sm font-semibold text-gray-900 whitespace-nowrap">
                                            {formatCurrency(
                                                item.products.price *
                                                    item.quantity
                                            )}
                                        </span>
                                    </div>
                                ))}
                            </div>

                            <div className="border-t border-gray-100 pt-4 space-y-2">
                                <div className="flex justify-between text-gray-600 text-sm">
                                    <span>Tạm tính</span>
                                    <span>{formatCurrency(subtotal)}</span>
                                </div>
                                <div className="flex justify-between text-gray-600 text-sm">
                                    <span>Phí vận chuyển</span>
                                    <span>{formatCurrency(SHIPPING_COST)}</span>
                                </div>
                            </div>

                            <div className="border-t border-gray-100 pt-4 mt-4 flex justify-between items-center">
                                <span className="text-lg font-bold text-gray-800">
                                    Tổng cộng
                                </span>
                                <span className="text-2xl font-bold text-secondary-600">
                                    {formatCurrency(total)}
                                </span>
                            </div>

                            <button
                                onClick={handlePlaceOrder}
                                disabled={processing || !selectedAddress}
                                className="w-full mt-6 bg-secondary-500 text-white font-bold py-4 rounded-xl shadow-lg shadow-secondary-500/30 hover:bg-secondary-600 transition transform hover:-translate-y-1 disabled:opacity-70 disabled:cursor-not-allowed"
                            >
                                {processing ? "Đang xử lý..." : `ĐẶT HÀNG`}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CheckoutPage;
