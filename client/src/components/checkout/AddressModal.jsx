import React, { useEffect } from "react";
import { useForm } from "react-hook-form";
import { supabase } from "../../services/supabaseClient";
import { useSelector } from "react-redux";
import { toast } from "react-hot-toast";
import { FaTimes, FaSpinner } from "react-icons/fa";

const AddressModal = ({ isOpen, onClose, onSuccess, initialValues }) => {
    const { user } = useSelector((state) => state.auth);
    const {
        register,
        handleSubmit,
        reset,
        setValue,
        formState: { errors, isSubmitting },
    } = useForm();

    // Reset form khi mở Modal hoặc khi bấm Sửa
    useEffect(() => {
        if (isOpen) {
            if (initialValues) {
                // Điền dữ liệu cũ vào form
                setValue("recipient_name", initialValues.recipient_name);
                setValue("phone", initialValues.phone);
                setValue("address_line1", initialValues.address_line1);
                setValue("city", initialValues.city);
                setValue("note", initialValues.note);
                setValue("is_default", initialValues.is_default);
            } else {
                reset(); // Xóa trắng form
            }
        }
    }, [isOpen, initialValues, reset, setValue]);

    const onSubmit = async (data) => {
        try {
            const payload = {
                user_id: user.id,
                ...data,
            };

            // Nếu đặt mặc định -> Reset các cái khác
            if (data.is_default) {
                await supabase
                    .from("addresses")
                    .update({ is_default: false })
                    .eq("user_id", user.id);
            }

            if (initialValues) {
                // UPDATE
                const { error } = await supabase
                    .from("addresses")
                    .update(payload)
                    .eq("id", initialValues.id);
                if (error) throw error;
                toast.success("Cập nhật địa chỉ thành công");
            } else {
                // INSERT
                const { error } = await supabase
                    .from("addresses")
                    .insert([payload]);
                if (error) throw error;
                toast.success("Thêm địa chỉ mới thành công");
            }

            onSuccess(); // Reload list bên ngoài
            onClose(); // Đóng modal
        } catch (error) {
            toast.error("Lỗi: " + error.message);
        }
    };

    if (!isOpen) return null;

    return (
        // Overlay nền đen mờ
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fade-in">
            {/* Modal Box */}
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden relative animate-scale-up">
                {/* Header */}
                <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                    <h3 className="font-bold text-lg text-gray-800">
                        {initialValues
                            ? "Cập nhật địa chỉ"
                            : "Thêm địa chỉ mới"}
                    </h3>
                    <button
                        onClick={onClose}
                        className="text-gray-400 bg-transparent hover:text-red-500 transition"
                    >
                        <FaTimes size={20} />
                    </button>
                </div>

                {/* Body */}
                <div className="p-6">
                    <form
                        onSubmit={handleSubmit(onSubmit)}
                        className="space-y-4"
                    >
                        {/* Hàng 1: Tên + SĐT */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Họ và tên
                                </label>
                                <input
                                    {...register("recipient_name", {
                                        required: "Bắt buộc nhập",
                                    })}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                                    placeholder="Nguyễn Văn A"
                                />
                                {errors.recipient_name && (
                                    <span className="text-red-500 text-xs">
                                        {errors.recipient_name.message}
                                    </span>
                                )}
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Số điện thoại
                                </label>
                                <input
                                    {...register("phone", {
                                        required: "Bắt buộc nhập",
                                        pattern: {
                                            value: /^[0-9]+$/,
                                            message: "SĐT không hợp lệ",
                                        },
                                    })}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                                    placeholder="0912345678"
                                />
                                {errors.phone && (
                                    <span className="text-red-500 text-xs">
                                        {errors.phone.message}
                                    </span>
                                )}
                            </div>
                        </div>

                        {/* Địa chỉ cụ thể */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Địa chỉ (Số nhà, Đường, Phường/Xã)
                            </label>
                            <input
                                {...register("address_line1", {
                                    required: "Bắt buộc nhập",
                                })}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                                placeholder="Số 123, Đường ABC..."
                            />
                            {errors.address_line1 && (
                                <span className="text-red-500 text-xs">
                                    {errors.address_line1.message}
                                </span>
                            )}
                        </div>

                        {/* Tỉnh/Thành phố (Dùng Select đơn giản) */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Tỉnh / Thành phố
                            </label>
                            <select
                                {...register("city", {
                                    required: "Vui lòng chọn",
                                })}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none bg-white"
                            >
                                <option value="">-- Chọn tỉnh thành --</option>
                                <option value="Hà Nội">Hà Nội</option>
                                <option value="TP. Hồ Chí Minh">
                                    TP. Hồ Chí Minh
                                </option>
                                <option value="Đà Nẵng">Đà Nẵng</option>
                                {/* Bạn có thể thêm list dài ở đây */}
                            </select>
                            {errors.city && (
                                <span className="text-red-500 text-xs">
                                    {errors.city.message}
                                </span>
                            )}
                        </div>

                        {/* Ghi chú */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Ghi chú (Tùy chọn)
                            </label>
                            <textarea
                                {...register("note")}
                                rows="2"
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                                placeholder="Ví dụ: Giao hàng giờ hành chính"
                            ></textarea>
                        </div>

                        {/* Checkbox Default */}
                        <div className="flex items-center gap-2">
                            <input
                                type="checkbox"
                                id="is_default"
                                {...register("is_default")}
                                className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500 cursor-pointer"
                            />
                            <label
                                htmlFor="is_default"
                                className="text-sm text-gray-700 cursor-pointer"
                            >
                                Đặt làm địa chỉ mặc định
                            </label>
                        </div>

                        {/* Footer Buttons */}
                        <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-100">
                            <button
                                type="button"
                                onClick={onClose}
                                className="px-5 py-2 bg-transparent text-gray-600 hover:bg-gray-100 rounded-lg font-medium transition"
                            >
                                Hủy
                            </button>
                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className="px-6 py-2 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 transition flex items-center gap-2 disabled:opacity-70"
                            >
                                {isSubmitting && (
                                    <FaSpinner className="animate-spin" />
                                )}
                                Lưu địa chỉ
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default AddressModal;
