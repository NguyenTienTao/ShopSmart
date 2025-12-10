import React, { useEffect, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { supabase } from "../services/supabaseClient";
import { toast } from "react-hot-toast";
import {
    FaUser,
    FaMapMarkerAlt,
    FaEnvelope,
    FaPhone,
    FaCamera,
    FaSpinner,
    FaListAlt,
    FaHeart,
    FaSignOutAlt,
    FaBuilding,
} from "react-icons/fa";
import { formatDateTime } from "../helpers/formatters";
import { setLogout } from "../store/authSlice";
import { useNavigate } from "react-router-dom";

const ProfilePage = () => {
    const { user } = useSelector((state) => state.auth);
    const dispatch = useDispatch();
    const navigate = useNavigate();

    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState(false);

    // State chia làm 2 phần: Profile và Default Address
    const [profile, setProfile] = useState({
        name: "",
        phone: "",
        avatar_url: "",
    });

    const [address, setAddress] = useState({
        id: null, // Lưu ID để biết là update hay insert
        address_line1: "",
        city: "",
    });

    // 1. Fetch Dữ liệu (Profile + Address)
    useEffect(() => {
        const fetchData = async () => {
            if (!user) {
                toast("Cần đăng nhập mới có thông tin cá nhân!");
                return;
            }
            try {
                setLoading(true);

                // A. Lấy thông tin Profile
                const { data: profileData, error: profileError } =
                    await supabase
                        .from("profiles")
                        .select("*")
                        .eq("id", user.id)
                        .single();

                if (profileError && profileError.code !== "PGRST116")
                    throw profileError;

                if (profileData) {
                    setProfile({
                        name: profileData.name || "",
                        phone: profileData.phone || "", // Giả sử phone cũng lưu ở profile (hoặc address tùy bạn)
                        avatar_url: profileData.avatar_url || "",
                    });
                }

                // B. Lấy Địa chỉ Mặc định từ bảng 'addresses'
                const { data: addressData, error: addressError } =
                    await supabase
                        .from("addresses")
                        .select("*")
                        .eq("user_id", user.id)
                        .eq("is_default", true) // Chỉ lấy cái mặc định
                        .maybeSingle(); // Dùng maybeSingle để không báo lỗi nếu không có

                if (addressError) throw addressError;

                if (addressData) {
                    setAddress({
                        id: addressData.id,
                        address_line1: addressData.address_line1 || "",
                        city: addressData.city || "",
                    });
                } else {
                    // Nếu chưa có mặc định, thử lấy cái mới nhất bất kỳ
                    const { data: anyAddress } = await supabase
                        .from("addresses")
                        .select("*")
                        .eq("user_id", user.id)
                        .order("created_at", { ascending: false })
                        .limit(1)
                        .maybeSingle();

                    if (anyAddress) {
                        setAddress({
                            id: anyAddress.id,
                            address_line1: anyAddress.address_line1 || "",
                            city: anyAddress.city || "",
                        });
                    }
                }
            } catch (error) {
                console.error("Lỗi tải dữ liệu:", error.message);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [user?.id]);

    // 2. Xử lý Input Change
    const handleProfileChange = (e) => {
        setProfile({ ...profile, [e.target.name]: e.target.value });
    };

    const handleAddressChange = (e) => {
        setAddress({ ...address, [e.target.name]: e.target.value });
    };

    // 3. Update Tất cả
    const handleUpdate = async (e) => {
        e.preventDefault();
        setUpdating(true);
        try {
            // A. Update bảng Profile
            const profileUpdates = {
                name: profile.name,
                phone: profile.phone,
                updated_at: new Date(),
            };
            const { error: errorProfile } = await supabase
                .from("profiles")
                .update(profileUpdates)
                .eq("id", user.id);
            if (errorProfile) throw errorProfile;

            // B. Update bảng Addresses (Nếu người dùng có nhập địa chỉ)
            if (address.address_line1 || address.city) {
                const addressPayload = {
                    user_id: user.id,
                    recipient_name: profile.name, // Lấy tên từ profile đắp sang
                    phone: profile.phone, // Lấy sđt từ profile đắp sang
                    address_line1: address.address_line1,
                    city: address.city,
                    is_default: true, // Auto set làm mặc định
                    updated_at: new Date(),
                };

                if (address.id) {
                    // Nếu đã có ID -> UPDATE
                    const { error } = await supabase
                        .from("addresses")
                        .update(addressPayload)
                        .eq("id", address.id);
                    if (error) throw error;
                } else {
                    // Nếu chưa có -> INSERT MỚI
                    const { error } = await supabase
                        .from("addresses")
                        .insert([addressPayload]);
                    if (error) throw error;
                }
            }

            toast.success("Cập nhật hồ sơ thành công!");
        } catch (error) {
            toast.error("Lỗi: " + error.message);
        } finally {
            setUpdating(false);
        }
    };

    // 4. Upload Avatar (Giữ nguyên logic cũ)
    const handleAvatarUpload = async (event) => {
        try {
            setUpdating(true);
            const file = event.target.files[0];
            if (!file) return;

            const fileExt = file.name.split(".").pop();
            const fileName = `${user.id}-${Math.random()}.${fileExt}`;
            const filePath = `avatars/${fileName}`;

            const { error: uploadError } = await supabase.storage
                .from("images")
                .upload(filePath, file);
            if (uploadError) throw uploadError;

            const { data } = supabase.storage
                .from("images")
                .getPublicUrl(filePath);

            const { error: updateError } = await supabase
                .from("profiles")
                .update({ avatar_url: data.publicUrl })
                .eq("id", user.id);

            if (updateError) throw updateError;

            setProfile((prev) => ({ ...prev, avatar_url: data.publicUrl }));
            toast.success("Đã thay đổi ảnh đại diện");
        } catch (error) {
            toast.error("Lỗi: " + error.message);
        } finally {
            setUpdating(false);
        }
    };

    const handleLogout = async () => {
        await supabase.auth.signOut();
        dispatch(setLogout());
        navigate("/login");
        toast.success("Đã đăng xuất");
    };

    if (loading)
        return (
            <div className="min-h-screen flex items-center justify-center">
                <FaSpinner className="animate-spin text-4xl text-primary-600" />
            </div>
        );

    return (
        <div className="bg-gray-50 min-h-screen py-8">
            <div className="container mx-auto px-4 max-w-6xl">
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                    {/* --- CỘT TRÁI: SIDEBAR (Giữ nguyên giao diện đẹp cũ) --- */}
                    <div className="lg:col-span-1 space-y-6">
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                            <div className="h-24 bg-gradient-to-r from-green-400 to-teal-500 relative"></div>
                            <div className="px-6 pb-6 text-center -mt-10 relative">
                                <div className="relative inline-block">
                                    <img
                                        src={
                                            profile.avatar_url ||
                                            "https://placehold.co/150?text=User"
                                        }
                                        alt="Avatar"
                                        className="w-20 h-20 rounded-full border-4 border-white shadow-md object-cover bg-white"
                                    />
                                    <label
                                        htmlFor="avatar-upload"
                                        className="absolute bottom-0 right-0 bg-gray-800 text-white p-1.5 rounded-full cursor-pointer hover:bg-gray-700 transition border-2 border-white"
                                    >
                                        <FaCamera size={10} />
                                    </label>
                                    <input
                                        id="avatar-upload"
                                        type="file"
                                        accept="image/*"
                                        className="hidden"
                                        onChange={handleAvatarUpload}
                                        disabled={updating}
                                    />
                                </div>
                                <h3 className="font-bold text-gray-800 text-lg mt-2">
                                    {profile.name || "Người dùng"}
                                </h3>
                                <p className="text-xs text-gray-500">
                                    Thành viên ShopSmart
                                </p>
                            </div>
                        </div>

                        {/* Menu điều hướng */}
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                            <div className="p-4">
                                <nav className="space-y-1">
                                    <a
                                        href="#"
                                        className="flex items-center gap-3 px-3 py-2 text-primary-600 bg-primary-50 rounded-lg font-medium transition"
                                    >
                                        <FaUser /> Thông tin cá nhân
                                    </a>
                                    <button
                                        onClick={() => navigate("/my-orders")}
                                        className="w-full flex items-center gap-3 px-3 py-2 bg-transparent text-gray-600 hover:bg-gray-50 hover:text-gray-900 rounded-lg font-medium transition"
                                    >
                                        <FaListAlt /> Đơn hàng của tôi
                                    </button>
                                    {/* ... các nút khác giữ nguyên ... */}
                                    <div className="border-t border-gray-100 my-2 pt-2">
                                        <button
                                            onClick={handleLogout}
                                            className="w-full flex items-center gap-3 px-3 py-2 bg-transparent text-red-500 hover:bg-red-50 rounded-lg font-medium transition"
                                        >
                                            <FaSignOutAlt /> Đăng xuất
                                        </button>
                                    </div>
                                </nav>
                            </div>
                        </div>
                    </div>

                    {/* --- CỘT PHẢI: FORM CHÍNH --- */}
                    <div className="lg:col-span-3">
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 md:p-8">
                            <div className="mb-6 border-b border-gray-100 pb-4">
                                <h2 className="text-xl font-bold text-gray-900">
                                    Thông tin tài khoản
                                </h2>
                                <p className="text-sm text-gray-500">
                                    Cập nhật thông tin cá nhân và địa chỉ giao
                                    hàng mặc định.
                                </p>
                            </div>

                            <form onSubmit={handleUpdate} className="space-y-6">
                                {/* NHÓM 1: THÔNG TIN CÁ NHÂN (Bảng profiles) */}
                                <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wide border-l-4 border-primary-500 pl-2 mb-4">
                                    Thông tin cá nhân
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Họ và tên
                                        </label>
                                        <div className="relative">
                                            <FaUser className="absolute top-3 left-3 text-gray-400" />
                                            <input
                                                type="text"
                                                name="name"
                                                value={profile.name}
                                                onChange={handleProfileChange}
                                                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                                                placeholder="Nhập tên của bạn"
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Số điện thoại
                                        </label>
                                        <div className="relative">
                                            <FaPhone className="absolute top-3 left-3 text-gray-400" />
                                            <input
                                                type="text"
                                                name="phone"
                                                value={profile.phone}
                                                onChange={handleProfileChange}
                                                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                                                placeholder="Số điện thoại liên hệ"
                                            />
                                        </div>
                                    </div>

                                    <div className="md:col-span-2">
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Email đăng nhập
                                        </label>
                                        <div className="relative">
                                            <FaEnvelope className="absolute top-3 left-3 text-gray-400" />
                                            <input
                                                type="email"
                                                value={user?.email}
                                                readOnly
                                                className="w-full pl-10 pr-4 py-2 border border-gray-200 bg-gray-50 text-gray-500 rounded-lg cursor-not-allowed outline-none"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* NHÓM 2: ĐỊA CHỈ MẶC ĐỊNH (Bảng addresses) */}
                                <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wide border-l-4 border-primary-500 pl-2 mt-8 mb-4">
                                    Địa chỉ mặc định
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="md:col-span-2">
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Địa chỉ (Số nhà, Đường)
                                        </label>
                                        <div className="relative">
                                            <FaMapMarkerAlt className="absolute top-3 left-3 text-gray-400" />
                                            <input
                                                type="text"
                                                name="address_line1"
                                                value={address.address_line1}
                                                onChange={handleAddressChange}
                                                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                                                placeholder="Ví dụ: 123 Đường Nguyễn Huệ..."
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Tỉnh / Thành phố
                                        </label>
                                        <div className="relative">
                                            <FaBuilding className="absolute top-3 left-3 text-gray-400" />
                                            <input
                                                type="text"
                                                name="city"
                                                value={address.city}
                                                onChange={handleAddressChange}
                                                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                                                placeholder="Ví dụ: TP. Hồ Chí Minh"
                                            />
                                        </div>
                                    </div>

                                    {/* Nút gợi ý quản lý nhiều địa chỉ */}
                                    <div className="md:col-span-2 text-right">
                                        <span className="text-xs text-gray-500 mr-2">
                                            Bạn có nhiều địa chỉ?
                                        </span>
                                        <button
                                            type="button" // Type button để không submit form
                                            onClick={() =>
                                                toast(
                                                    "Tính năng quản lý sổ địa chỉ đang được phát triển!"
                                                )
                                            } // Hoặc navigate tới trang AddressesPage nếu bạn làm riêng
                                            className="text-sm bg-transparent text-primary-600 hover:underline font-medium"
                                        >
                                            Quản lý sổ địa chỉ &rarr;
                                        </button>
                                    </div>
                                </div>

                                {/* Footer Buttons */}
                                <div className="flex items-center justify-end gap-4 pt-6 border-t border-gray-100">
                                    <button
                                        type="button"
                                        onClick={() => window.location.reload()}
                                        className="px-6 py-2.5 rounded-lg bg-transparent text-gray-700 font-medium hover:bg-gray-100 transition"
                                    >
                                        Hủy
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={updating}
                                        className="px-6 py-2.5 rounded-lg bg-primary-600 text-white font-bold shadow-lg shadow-primary-500/30 hover:bg-primary-700 hover:-translate-y-0.5 transition transform disabled:opacity-70 flex items-center gap-2"
                                    >
                                        {updating && (
                                            <FaSpinner className="animate-spin" />
                                        )}
                                        Lưu thay đổi
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProfilePage;
