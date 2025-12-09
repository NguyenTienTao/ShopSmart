import React, { useEffect, useState } from "react";
import {
    Table,
    Card,
    Tag,
    Button,
    Tooltip,
    message,
    Popconfirm,
    Select,
} from "antd";
import { CheckOutlined, DeleteOutlined, EyeOutlined } from "@ant-design/icons";
import { supabase } from "../../services/supabaseClient";
import { useSelector } from "react-redux";
import { formatDateTime } from "../../helpers/formatters";

const NotificationsPage = () => {
    const { user } = useSelector((state) => state.auth);
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filterType, setFilterType] = useState("all"); // all, unread

    const fetchNotifications = async () => {
        setLoading(true);
        let query = supabase
            .from("notifications")
            .select("*")
            .eq("user_id", user.id)
            .order("created_at", { ascending: false });

        if (filterType === "unread") {
            query = query.eq("is_read", false);
        }

        const { data, error } = await query;
        if (!error) {
            setNotifications(data);
        }
        setLoading(false);
    };

    useEffect(() => {
        if (user) fetchNotifications();
    }, [user, filterType]);

    // Hành động: Đánh dấu đã đọc
    const handleMarkRead = async (id) => {
        await supabase
            .from("notifications")
            .update({ is_read: true })
            .eq("id", id);
        // Update UI local
        setNotifications((prev) =>
            prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
        );
        message.success("Đã đánh dấu đã đọc");
    };

    // Hành động: Xóa
    const handleDelete = async (id) => {
        await supabase.from("notifications").delete().eq("id", id);
        setNotifications((prev) => prev.filter((n) => n.id !== id));
        message.success("Đã xóa thông báo");
    };

    // Hành động: Đánh dấu tất cả đã đọc
    const handleMarkAllRead = async () => {
        await supabase
            .from("notifications")
            .update({ is_read: true })
            .eq("user_id", user.id)
            .eq("is_read", false);

        fetchNotifications();
        message.success("Đã đọc tất cả");
    };

    const columns = [
        {
            title: "Tiêu đề",
            dataIndex: "title",
            key: "title",
            render: (text, record) => (
                <span
                    style={{ fontWeight: record.is_read ? "normal" : "bold" }}
                >
                    {!record.is_read && <Tag color="red">Mới</Tag>}
                    {text}
                </span>
            ),
        },
        {
            title: "Nội dung",
            dataIndex: "message",
            key: "message",
            width: "40%",
        },
        {
            title: "Thời gian",
            dataIndex: "created_at",
            key: "created_at",
            render: (date) => formatDateTime(date),
        },
        {
            title: "Hành động",
            key: "action",
            render: (_, record) => (
                <div style={{ display: "flex", gap: 8 }}>
                    {!record.is_read && (
                        <Tooltip title="Đánh dấu đã đọc">
                            <Button
                                icon={<CheckOutlined />}
                                size="small"
                                onClick={() => handleMarkRead(record.id)}
                            />
                        </Tooltip>
                    )}
                    {record.link && (
                        <Tooltip title="Xem chi tiết">
                            <Button
                                size="small"
                                icon={<EyeOutlined />}
                                href={record.link}
                            />
                        </Tooltip>
                    )}
                    <Popconfirm
                        title="Xóa thông báo này?"
                        onConfirm={() => handleDelete(record.id)}
                    >
                        <Button icon={<DeleteOutlined />} size="small" danger />
                    </Popconfirm>
                </div>
            ),
        },
    ];

    return (
        <div style={{ padding: 24 }}>
            <div
                style={{
                    marginBottom: 16,
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                }}
            >
                <h2 style={{ margin: 0 }}>Trung tâm thông báo</h2>
                <div style={{ display: "flex", gap: 10 }}>
                    <Select
                        defaultValue="all"
                        style={{ width: 150 }}
                        onChange={setFilterType}
                        options={[
                            { value: "all", label: "Tất cả" },
                            { value: "unread", label: "Chưa đọc" },
                        ]}
                    />
                    <Button onClick={handleMarkAllRead}>
                        Đánh dấu đã đọc hết
                    </Button>
                </div>
            </div>

            <Card variant={false}>
                <Table
                    dataSource={notifications}
                    columns={columns}
                    rowKey="id"
                    loading={loading}
                    pagination={{ pageSize: 10 }}
                />
            </Card>
        </div>
    );
};

export default NotificationsPage;
