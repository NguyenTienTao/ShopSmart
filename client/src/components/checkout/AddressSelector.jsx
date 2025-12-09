import React, { useEffect, useState } from "react";
import { supabase } from "../../services/supabaseClient";
import { useSelector } from "react-redux";
import {
    FaMapMarkerAlt,
    FaPlus,
    FaEdit,
    FaTrash,
    FaCheckCircle,
    FaSpinner,
    FaBoxOpen,
} from "react-icons/fa";
import { toast } from "react-hot-toast";
import AddressModal from "./AddressModal";

const AddressSelector = ({ onSelectAddress, selectedId }) => {
    const { user } = useSelector((state) => state.auth);
    const [addresses, setAddresses] = useState([]);
    const [loading, setLoading] = useState(true);

    // State Modal
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingAddress, setEditingAddress] = useState(null);

    // Fetch danh sách
    const fetchAddresses = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from("addresses")
                .select("*")
                .eq("user_id", user.id)
                .order("is_default", { ascending: false })
                .order("created_at", { ascending: false });

            if (error) throw error;
            setAddresses(data);

            // Auto-select cái đầu tiên nếu chưa chọn
            if (!selectedId && data.length > 0) {
                onSelectAddress(data[0]);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (user) fetchAddresses();
    }, [user]);

    // Xóa địa chỉ
    const handleDelete = async (id) => {
        if (!window.confirm("Bạn có chắc muốn xóa địa chỉ này?")) return;
        try {
            await supabase.from("addresses").delete().eq("id", id);
            toast.success("Đã xóa địa chỉ");
            fetchAddresses();
        } catch (error) {
            toast.error("Lỗi xóa: " + error.message);
        }
    };

    const openModal = (addr = null) => {
        setEditingAddress(addr);
        setIsModalOpen(true);
    };

    if (loading)
        return (
            <div className="py-8 text-center text-primary-600">
                <FaSpinner className="animate-spin inline-block text-2xl" />
            </div>
        );

    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="flex justify-between items-center mb-2">
                <h3 className="font-bold text-gray-800 flex items-center gap-2 text-lg">
                    <FaMapMarkerAlt className="text-primary-600" /> Địa chỉ nhận
                    hàng
                </h3>
                <button
                    type="button"
                    onClick={() => openModal(null)}
                    className="text-sm font-semibold bg-transparent text-primary-600 hover:text-primary-700 flex items-center gap-1 transition"
                >
                    <FaPlus /> Thêm mới
                </button>
            </div>

            {/* Danh sách địa chỉ (Grid) */}
            {addresses.length === 0 ? (
                // Empty State (Tự chế)
                <div className="text-center py-8 border-2 border-dashed border-gray-200 rounded-xl bg-gray-50 flex flex-col items-center">
                    <FaBoxOpen className="text-4xl text-gray-300 mb-2" />
                    <p className="text-gray-500 mb-3">
                        Bạn chưa có địa chỉ nào.
                    </p>
                    <button
                        type="button"
                        onClick={() => openModal(null)}
                        className="px-4 py-2 bg-primary-600 text-white rounded-lg font-medium shadow-sm hover:bg-primary-700 transition"
                    >
                        + Tạo địa chỉ ngay
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-3 max-h-[350px] overflow-y-auto pr-2 custom-scrollbar">
                    {addresses.map((addr) => {
                        const isSelected = selectedId === addr.id;
                        return (
                            <div
                                key={addr.id}
                                className={`relative p-4 border rounded-xl cursor-pointer transition-all group ${
                                    isSelected
                                        ? "border-primary-500 bg-primary-50 ring-1 ring-primary-500"
                                        : "border-gray-200 hover:border-primary-300 bg-white"
                                }`}
                                onClick={() => onSelectAddress(addr)}
                            >
                                <div className="flex justify-between items-start">
                                    <div className="flex gap-3">
                                        {/* Radio Icon mô phỏng */}
                                        <div
                                            className={`mt-1 w-5 h-5 flex-shrink-0 rounded-full border flex items-center justify-center transition-colors ${
                                                isSelected
                                                    ? "bg-primary-600 border-primary-600"
                                                    : "border-gray-300 bg-white"
                                            }`}
                                        >
                                            {isSelected && (
                                                <FaCheckCircle className="text-white text-xs" />
                                            )}
                                        </div>

                                        {/* Thông tin */}
                                        <div>
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <span className="font-bold text-gray-900">
                                                    {addr.recipient_name}
                                                </span>
                                                <span className="text-gray-400">
                                                    |
                                                </span>
                                                <span className="text-gray-600 font-medium">
                                                    {addr.phone}
                                                </span>
                                                {addr.is_default && (
                                                    <span className="text-[10px] bg-red-100 text-red-600 px-2 py-0.5 rounded-full font-bold uppercase tracking-wide border border-red-200">
                                                        Mặc định
                                                    </span>
                                                )}
                                            </div>

                                            <p className="text-sm text-gray-600 mt-1 leading-relaxed">
                                                {addr.address_line1},{" "}
                                                {addr.city}
                                            </p>

                                            {addr.note && (
                                                <p className="text-xs text-gray-400 mt-1 italic bg-gray-50 inline-block px-2 py-0.5 rounded border border-gray-100">
                                                    Ghi chú: {addr.note}
                                                </p>
                                            )}
                                        </div>
                                    </div>

                                    {/* Nút hành động (Sửa/Xóa) - Hiện khi hover (Desktop) hoặc luôn hiện (Mobile) */}
                                    <div className="flex gap-1 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity">
                                        <button
                                            type="button"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                openModal(addr);
                                            }}
                                            className="bg-transparent text-gray-400 hover:text-primary-600 p-2 rounded hover:bg-primary-50 transition"
                                            title="Sửa"
                                        >
                                            <FaEdit />
                                        </button>
                                        <button
                                            type="button"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleDelete(addr.id);
                                            }}
                                            className="bg-transparent text-gray-400 hover:text-red-500 p-2 rounded hover:bg-red-50 transition"
                                            title="Xóa"
                                        >
                                            <FaTrash />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Render Modal */}
            <AddressModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSuccess={fetchAddresses}
                initialValues={editingAddress}
            />
        </div>
    );
};

export default AddressSelector;
