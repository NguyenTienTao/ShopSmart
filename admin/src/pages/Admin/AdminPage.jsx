import { useEffect, useState } from "react";
import { Table, Card, Input, Tag, Avatar, message } from "antd";
import { FaUserShield, FaSearch, FaPhone, FaEnvelope } from "react-icons/fa";
import { useSelector } from "react-redux";
import { supabase } from "../../services/supabaseClient";
import styles from "./AdminPage.module.scss";

const AdminPage = () => {
    const [admins, setAdmins] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searchText, setSearchText] = useState("");

    // Lấy session từ Redux
    const { session } = useSelector((state) => state.auth);

    // 1. Chỉ giữ lại hàm Lấy danh sách (Fetch)
    const fetchAdmins = async () => {
        if (!session) return;
        setLoading(true);

        try {
            const { data, error } = await supabase
                .from("profiles")
                .select("*")
                .eq("role", "admin")
                .neq("id", session.user.id); // Trừ chính mình ra

            if (error) throw error;
            setAdmins(data);
        } catch (error) {
            message.error("Lỗi tải danh sách: " + error.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAdmins();
    }, [session]);

    // --- CẤU HÌNH CỘT (Đã xóa cột Hành động/Sửa/Xóa) ---
    const columns = [
        {
            title: "Quản trị viên",
            dataIndex: "name",
            key: "name",
            render: (text, record) => (
                <div className={styles.userInfo}>
                    <Avatar
                        src={record.avatar_url}
                        icon={<FaUserShield />}
                        style={{ backgroundColor: "#1890ff" }}
                    />
                    <div>
                        <div className={styles.name}>
                            {text || "Chưa đặt tên"}
                        </div>
                        <Tag color="blue">Admin</Tag>
                    </div>
                </div>
            ),
        },
        {
            title: "Email liên hệ",
            dataIndex: "email",
            key: "email",
            render: (text) => (
                <div className={styles.contactInfo}>
                    <FaEnvelope />
                    {text || (
                        <span className={styles.empty}>Chưa cập nhật</span>
                    )}
                </div>
            ),
        },
        {
            title: "Số điện thoại",
            dataIndex: "phone",
            key: "phone",
            render: (text) => (
                <div className={styles.contactInfo}>
                    <FaPhone style={{ color: "#52c41a" }} />
                    {text ? (
                        <strong>{text}</strong>
                    ) : (
                        <span className={styles.empty}>---</span>
                    )}
                </div>
            ),
        },
        // Đã XÓA cột 'Hành động' ở đây
    ];

    return (
        <div style={{ padding: "0 24px" }}>
            {/* Header chỉ còn Tiêu đề và Tìm kiếm */}
            <div className={styles.pageHeader}>
                <h2>Danh bạ Quản Trị Viên</h2>

                <Input
                    placeholder="Tìm theo tên, email, sđt..."
                    prefix={<FaSearch style={{ color: "#ccc" }} />}
                    className={styles.searchBar}
                    onChange={(e) => setSearchText(e.target.value)}
                    allowClear
                />
            </div>

            <Card className={styles.tableCard}>
                <Table
                    columns={columns}
                    dataSource={admins.filter(
                        (admin) =>
                            admin.name
                                ?.toLowerCase()
                                .includes(searchText.toLowerCase()) ||
                            admin.email
                                ?.toLowerCase()
                                .includes(searchText.toLowerCase()) ||
                            admin.phone?.includes(searchText)
                    )}
                    rowKey="id"
                    loading={loading}
                    pagination={{ pageSize: 10 }}
                />
            </Card>
        </div>
    );
};

export default AdminPage;
