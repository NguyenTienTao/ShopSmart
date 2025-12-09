import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { supabase } from "../services/supabaseClient"; // Nhớ sửa đường dẫn nếu cần
import {
    Badge,
    Dropdown,
    List,
    Avatar,
    Typography,
    Button,
    theme,
    message,
} from "antd";
import {
    BellOutlined,
    ShoppingCartOutlined,
    InfoCircleOutlined,
    CheckCircleOutlined,
} from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import { formatDistanceToNow } from "date-fns";
import { vi } from "date-fns/locale"; // Format thời gian tiếng Việt (VD: 5 phút trước)

const { Text, Title } = Typography;
const { useToken } = theme;

const NotificationBell = () => {
    const { user } = useSelector((state) => state.auth);
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();
    const { token } = useToken(); // Lấy màu từ theme Antd
    const [open, setOpen] = useState(false);

    // 1. Fetch thông báo ban đầu
    const fetchNotifications = async () => {
        if (!user) return;
        setLoading(true);
        const { data, error } = await supabase
            .from("notifications")
            .select("*")
            .eq("user_id", user.id)
            .order("created_at", { ascending: false })
            .limit(10);

        if (!error && data) {
            setNotifications(data);
            setUnreadCount(data.filter((n) => !n.is_read).length);
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchNotifications();

        if (!user) return;

        // 2. Lắng nghe Realtime (Ting ting!)
        const channel = supabase
            .channel("admin-noti")
            .on(
                "postgres_changes",
                {
                    event: "INSERT",
                    schema: "public",
                    table: "notifications",
                    filter: `user_id=eq.${user.id}`,
                },
                (payload) => {
                    // Hiện popup thông báo nhỏ bên góc
                    message.info({
                        content: `🔔 ${payload.new.title}`,
                        key: "new_noti", // Để tránh spam nhiều thông báo trùng
                        duration: 3,
                    });

                    setNotifications((prev) => [payload.new, ...prev]);
                    setUnreadCount((prev) => prev + 1);
                }
            )
            .subscribe();

        return () => supabase.removeChannel(channel);
    }, [user]);

    // 3. Xử lý khi click vào thông báo
    const handleItemClick = async (item) => {
        setOpen(false);

        // Đánh dấu đã đọc
        if (!item.is_read) {
            const { error } = await supabase
                .from("notifications")
                .update({ is_read: true })
                .eq("id", item.id);

            if (!error) {
                setNotifications((prev) =>
                    prev.map((n) =>
                        n.id === item.id ? { ...n, is_read: true } : n
                    )
                );
                setUnreadCount((prev) => Math.max(0, prev - 1));
            }
        }

        // Chuyển trang
        if (item.link) {
            navigate(item.link);
        }
    };

    // 4. Đánh dấu tất cả là đã đọc
    const markAllAsRead = async () => {
        if (unreadCount === 0) return;

        await supabase
            .from("notifications")
            .update({ is_read: true })
            .eq("user_id", user.id)
            .eq("is_read", false);

        setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
        setUnreadCount(0);
        message.success("Đã đánh dấu tất cả là đã đọc");
    };

    // --- Render Nội dung Dropdown ---
    const notificationMenu = (
        <div
            style={{
                width: 350,
                backgroundColor: token.colorBgContainer,
                borderRadius: token.borderRadiusLG,
                boxShadow: token.boxShadowSecondary,
                overflow: "hidden",
                border: `1px solid ${token.colorBorderSecondary}`,
            }}
        >
            {/* Header */}
            <div
                style={{
                    padding: "12px 16px",
                    borderBottom: `1px solid ${token.colorSplit}`,
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                }}
            >
                <Title level={5} style={{ margin: 0, fontSize: 16 }}>
                    Thông báo
                </Title>
                {unreadCount > 0 && (
                    <Button
                        type="link"
                        size="small"
                        onClick={markAllAsRead}
                        style={{ padding: 0 }}
                    >
                        Đánh dấu đã đọc hết
                    </Button>
                )}
            </div>

            {/* List */}
            <div style={{ maxHeight: 400, overflowY: "auto" }}>
                <List
                    itemLayout="horizontal"
                    dataSource={notifications}
                    loading={loading}
                    locale={{ emptyText: "Không có thông báo nào" }}
                    renderItem={(item) => (
                        <List.Item
                            onClick={() => handleItemClick(item)}
                            style={{
                                padding: "12px 16px",
                                cursor: "pointer",
                                backgroundColor: item.is_read
                                    ? "transparent"
                                    : token.colorPrimaryBg, // Nền xanh nhạt nếu chưa đọc
                                transition: "background-color 0.3s",
                                borderBottom: `1px solid ${token.colorSplit}`,
                            }}
                            className="hover:bg-gray-50" // Class hover (nếu dùng tailwind hoặc css thường)
                        >
                            <List.Item.Meta
                                avatar={
                                    <Avatar
                                        style={{
                                            backgroundColor:
                                                item.type === "order"
                                                    ? "#1890ff"
                                                    : "#faad14",
                                            verticalAlign: "middle",
                                        }}
                                        icon={
                                            item.type === "order" ? (
                                                <ShoppingCartOutlined />
                                            ) : (
                                                <InfoCircleOutlined />
                                            )
                                        }
                                    />
                                }
                                title={
                                    <div
                                        style={{
                                            display: "flex",
                                            justifyContent: "space-between",
                                        }}
                                    >
                                        <Text
                                            strong={!item.is_read}
                                            style={{
                                                fontSize: 13,
                                                color: token.colorText,
                                            }}
                                        >
                                            {item.title}
                                        </Text>
                                        {!item.is_read && (
                                            <Badge status="error" />
                                        )}
                                    </div>
                                }
                                description={
                                    <div>
                                        <div
                                            style={{
                                                fontSize: 12,
                                                color: token.colorTextSecondary,
                                                marginBottom: 4,
                                                lineHeight: "1.4",
                                            }}
                                        >
                                            {item.message}
                                        </div>
                                        <Text
                                            type="secondary"
                                            style={{ fontSize: 10 }}
                                        >
                                            {formatDistanceToNow(
                                                new Date(item.created_at),
                                                { addSuffix: true, locale: vi }
                                            )}
                                        </Text>
                                    </div>
                                }
                            />
                        </List.Item>
                    )}
                />
            </div>

            {/* Footer */}
            <div
                style={{
                    padding: "8px 0",
                    textAlign: "center",
                    borderTop: `1px solid ${token.colorSplit}`,
                }}
            >
                <Button
                    type="link"
                    size="small"
                    onClick={() => {
                        setOpen(false);
                        navigate("/notifications");
                    }}
                >
                    Xem tất cả lịch sử
                </Button>
            </div>
        </div>
    );

    return (
        <Dropdown
            popupRender={() => notificationMenu}
            trigger={["click"]}
            placement="bottomRight"
            arrow
            open={open}
            onOpenChange={(nextOpen) => setOpen(nextOpen)}
        >
            <div
                style={{
                    cursor: "pointer",
                    padding: "0 12px",
                    display: "inline-block",
                }}
            >
                <Badge count={unreadCount} overflowCount={99} size="small">
                    <BellOutlined
                        style={{ fontSize: 20, color: token.colorText }}
                    />
                </Badge>
            </div>
        </Dropdown>
    );
};

export default NotificationBell;
