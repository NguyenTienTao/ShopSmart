import React, { useEffect, useState } from "react";
import { Modal, Form, Input, Button, Upload, Avatar, message } from "antd";
import {
    UserOutlined,
    UploadOutlined,
    MailOutlined,
    PhoneOutlined,
} from "@ant-design/icons";
import { useDispatch, useSelector } from "react-redux";
import { supabase } from "../services/supabaseClient";
import { updateProfile } from "../store/authSlice";

const ProfileModal = ({ isOpen, onClose }) => {
    const [form] = Form.useForm();
    const [loading, setLoading] = useState(false);

    // State quản lý file ảnh
    const [avatarFile, setAvatarFile] = useState(null);
    const [previewAvatar, setPreviewAvatar] = useState("");

    // Lấy thông tin từ Redux Store
    const { session, profile } = useSelector((state) => state.auth);
    const dispatch = useDispatch();

    // 1. Đồng bộ dữ liệu từ Redux vào Form khi mở Modal
    useEffect(() => {
        if (isOpen && profile) {
            // Điền thông tin vào form
            form.setFieldsValue({
                name: profile.name || "",
                phone: profile.phone || "",
                email: profile.email || session?.user?.email,
            });

            // Hiển thị avatar hiện tại
            setPreviewAvatar(profile.avatar_url);
            // Reset file đang chọn (nếu có)
            setAvatarFile(null);
        }
    }, [isOpen, profile, form, session]);

    // 2. Xử lý khi chọn ảnh từ máy tính (Chưa upload ngay, chỉ preview)
    const handleFileChange = ({ file }) => {
        // Lưu file gốc để tí nữa upload
        setAvatarFile(file.originFileObj);

        // Tạo URL ảo để hiển thị preview ngay lập tức
        const reader = new FileReader();
        reader.onload = (e) => setPreviewAvatar(e.target.result);
        reader.readAsDataURL(file.originFileObj);
    };

    // 3. Hàm Upload ảnh lên Supabase Storage
    const uploadAvatarToStorage = async () => {
        if (!avatarFile) return profile?.avatar_url; // Nếu không đổi ảnh, trả về ảnh cũ

        try {
            const fileExt = avatarFile.name.split(".").pop();
            const fileName = `${session.user.id}-${Date.now()}.${fileExt}`;
            const filePath = `avatars/${fileName}`;

            // Upload file
            const { error: uploadError } = await supabase.storage
                .from("images") // Tên Bucket bạn đã tạo
                .upload(filePath, avatarFile);

            if (uploadError) throw uploadError;

            // Lấy Public URL
            const { data } = supabase.storage
                .from("images")
                .getPublicUrl(filePath);
            return data.publicUrl;
        } catch (error) {
            console.error("Lỗi upload ảnh:", error);
            throw new Error("Không thể tải ảnh lên. Vui lòng thử lại.");
        }
    };

    // 4. Xử lý Lưu toàn bộ Form
    const handleSave = async (values) => {
        setLoading(true);
        try {
            // Bước A: Upload ảnh (nếu có)
            const avatarUrl = await uploadAvatarToStorage();

            // Bước B: Cập nhật Database
            const updates = {
                name: values.name,
                phone: values.phone,
                email: values.email, // Lưu email hiển thị vào bảng profiles
                avatar_url: avatarUrl,
                updated_at: new Date(),
            };

            const { error } = await supabase
                .from("profiles")
                .update(updates)
                .eq("id", session.user.id);

            if (error) throw error;

            // Bước C: Cập nhật Redux Store (Quan trọng!)
            // Để UI ở Header và các chỗ khác tự động đổi theo
            dispatch(updateProfile(updates));

            message.success("Cập nhật hồ sơ thành công!");
            onClose();
        } catch (error) {
            message.error(error.message || "Có lỗi xảy ra khi cập nhật.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal
            title="Thông tin cá nhân"
            open={isOpen}
            onCancel={onClose}
            footer={null} // Tắt footer mặc định để dùng nút trong form
            centered
            maskClosable={false} // Không cho click ra ngoài để đóng khi đang nhập
        >
            <div
                style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    marginBottom: 24,
                }}
            >
                {/* Avatar Preview */}
                <Avatar
                    size={100}
                    src={previewAvatar}
                    icon={<UserOutlined />}
                    style={{
                        marginBottom: 16,
                        border: "2px solid #f0f0f0",
                        backgroundColor: "#f56a00",
                    }}
                />

                {/* Nút Upload */}
                <Upload
                    showUploadList={false}
                    onChange={handleFileChange}
                    accept="image/*"
                    customRequest={({ onSuccess }) => onSuccess("ok")} // Hack để Antd không tự upload
                >
                    <Button icon={<UploadOutlined />} size="small">
                        Đổi ảnh đại diện
                    </Button>
                </Upload>
            </div>

            <Form form={form} layout="vertical" onFinish={handleSave}>
                <Form.Item
                    label="Họ và Tên"
                    name="name"
                    rules={[
                        { required: true, message: "Vui lòng nhập họ tên!" },
                    ]}
                >
                    <Input
                        prefix={<UserOutlined style={{ color: "#bfbfbf" }} />}
                        placeholder="Nhập tên của bạn"
                    />
                </Form.Item>

                <Form.Item label="Email" name="email">
                    {/* Email thường không cho sửa trực tiếp để tránh lỗi Auth */}
                    <Input
                        prefix={<MailOutlined style={{ color: "#bfbfbf" }} />}
                        disabled
                        style={{ color: "#888" }}
                    />
                </Form.Item>

                <Form.Item
                    label="Số điện thoại"
                    name="phone"
                    rules={[
                        {
                            pattern: /^[0-9]{10,11}$/,
                            message: "Số điện thoại không hợp lệ",
                        },
                    ]}
                >
                    <Input
                        prefix={<PhoneOutlined style={{ color: "#bfbfbf" }} />}
                        placeholder="09xxxxxxxx"
                    />
                </Form.Item>

                {/* Footer Buttons */}
                <div
                    style={{
                        display: "flex",
                        justifyContent: "flex-end",
                        gap: 10,
                        marginTop: 24,
                        paddingTop: 16,
                        borderTop: "1px solid #f0f0f0",
                    }}
                >
                    <Button onClick={onClose} disabled={loading}>
                        Hủy
                    </Button>
                    <Button type="primary" htmlType="submit" loading={loading}>
                        Lưu thay đổi
                    </Button>
                </div>
            </Form>
        </Modal>
    );
};

export default ProfileModal;
