import React, { useEffect, useState } from "react";
import {
    Table,
    Card,
    Tag,
    Select,
    Input,
    Button,
    Modal,
    message,
    Popconfirm,
    Empty,
    Tooltip,
    Badge,
} from "antd";
import {
    EyeOutlined,
    SearchOutlined,
    FilterOutlined,
    DeleteOutlined,
} from "@ant-design/icons";
import { supabase } from "../../services/supabaseClient";
import styles from "./OrdersPage.module.scss";
import { formatCurrency, formatDateTime } from "../../helpers/formatters";

const { Option } = Select;

const OrdersPage = () => {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searchText, setSearchText] = useState("");
    const [filterStatus, setFilterStatus] = useState(null);

    // State cho Modal chi tiết
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [orderItems, setOrderItems] = useState([]); // Danh sách sản phẩm trong đơn
    const [loadingItems, setLoadingItems] = useState(false);

    // 1. Lấy danh sách đơn hàng (Join với Profiles)
    const fetchOrders = async () => {
        setLoading(true);
        try {
            // Lấy orders + thông tin user (tên, email) từ bảng profiles
            const { data, error } = await supabase
                .from("orders")
                .select(
                    `
          *,
          profiles:user_id (name, email, phone)
        `
                )
                .order("created_at", { ascending: false });

            if (error) throw error;
            setOrders(data);
        } catch (error) {
            message.error("Lỗi tải đơn hàng: " + error.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchOrders();
    }, []);

    // 2. Lấy chi tiết sản phẩm của 1 đơn hàng (Khi mở Modal)
    const fetchOrderItems = async (orderId) => {
        setLoadingItems(true);
        try {
            const { data, error } = await supabase
                .from("order_items")
                .select(
                    `
          *,
          products (title, images)
        `
                )
                .eq("order_id", orderId);

            if (error) throw error;
            setOrderItems(data);
        } catch (error) {
            message.error("Không tải được chi tiết đơn: " + error.message);
        } finally {
            setLoadingItems(false);
        }
    };

    const handleOpenDetail = (record) => {
        setSelectedOrder(record);
        setIsModalOpen(true);
        fetchOrderItems(record.id); // Gọi API lấy sản phẩm
    };

    // 3. Cập nhật trạng thái đơn hàng (Nhanh)
    const handleStatusChange = async (orderId, newStatus) => {
        try {
            const { error } = await supabase
                .from("orders")
                .update({ status: newStatus })
                .eq("id", orderId);

            if (error) throw error;

            message.success(
                `Đã cập nhật trạng thái: ${newStatus.toUpperCase()}`
            );
            // Cập nhật lại state local để không cần reload
            setOrders((prev) =>
                prev.map((o) =>
                    o.id === orderId ? { ...o, status: newStatus } : o
                )
            );
        } catch (error) {
            message.error("Lỗi cập nhật: " + error.message);
        }
    };

    // 4. Xử lý Xóa đơn (Chỉ admin mới đc xóa)
    const handleDelete = async (id) => {
        try {
            const { error } = await supabase
                .from("orders")
                .delete()
                .eq("id", id);
            if (error) throw error;
            message.success("Đã xóa đơn hàng");
            fetchOrders();
        } catch (error) {
            message.error("Lỗi xóa: " + error.message);
        }
    };

    // --- HELPER: Màu sắc trạng thái ---
    const getStatusColor = (status) => {
        switch (status) {
            case "pending":
                return "orange";
            case "paid":
                return "blue";
            case "shipped":
                return "cyan";
            case "completed":
                return "green";
            case "cancelled":
                return "red";
            default:
                return "default";
        }
    };

    // --- LỌC CLIENT-SIDE ---
    const filteredOrders = orders.filter((order) => {
        const matchStatus = filterStatus ? order.status === filterStatus : true;
        // Tìm theo Mã đơn HOẶC Tên khách hàng
        const matchSearch =
            order.id.toLowerCase().includes(searchText.toLowerCase()) ||
            order.profiles?.name
                ?.toLowerCase()
                .includes(searchText.toLowerCase());
        return matchStatus && matchSearch;
    });

    // --- CẤU HÌNH CỘT ---
    const columns = [
        {
            title: "Mã đơn",
            dataIndex: "id",
            key: "id",
            width: 100,
            render: (id) => (
                <span className={styles.orderId}>
                    #{id.slice(0, 8).toUpperCase()}
                </span>
            ),
        },
        {
            title: "Khách hàng",
            dataIndex: "profiles",
            key: "customer",
            render: (profile, record) => (
                <div>
                    <div style={{ fontWeight: 500 }}>
                        {profile?.name || "Khách vãng lai"}
                    </div>
                    <div style={{ fontSize: 12, color: "#888" }}>
                        {profile?.email}
                    </div>
                </div>
            ),
        },
        {
            title: "Ngày đặt",
            dataIndex: "created_at",
            key: "date",
            render: (date) => formatDateTime(date),
            sorter: (a, b) => new Date(a.created_at) - new Date(b.created_at),
        },
        {
            title: "Tổng tiền",
            dataIndex: "total_price",
            key: "total",
            render: (price) => (
                <span className={styles.totalPrice}>
                    {formatCurrency(price)}
                </span>
            ),
            sorter: (a, b) => a.total_price - b.total_price,
        },
        {
            title: "Trạng thái",
            dataIndex: "status",
            key: "status",
            render: (status, record) => (
                <Select
                    defaultValue={status}
                    style={{ width: 130 }}
                    onChange={(val) => handleStatusChange(record.id, val)}
                    bordered={false}
                    suffixIcon={<FilterOutlined style={{ fontSize: 10 }} />}
                >
                    <Option value="pending">
                        <Badge status="warning" text="Pending" />
                    </Option>
                    <Option value="paid">
                        <Badge status="processing" text="Paid" />
                    </Option>
                    <Option value="shipped">
                        <Badge status="default" text="Shipped" />
                    </Option>
                    <Option value="completed">
                        <Badge status="success" text="Completed" />
                    </Option>
                    <Option value="cancelled">
                        <Badge status="error" text="Cancelled" />
                    </Option>
                </Select>
            ),
        },
        {
            title: "",
            key: "action",
            render: (_, record) => (
                <div style={{ display: "flex", gap: 8 }}>
                    <Tooltip title="Xem chi tiết">
                        <Button
                            type="text"
                            icon={<EyeOutlined />}
                            style={{ color: "#1890ff" }}
                            onClick={() => handleOpenDetail(record)}
                        />
                    </Tooltip>
                    <Popconfirm
                        title="Xóa đơn này?"
                        onConfirm={() => handleDelete(record.id)}
                        okButtonProps={{ danger: true }}
                    >
                        <Button type="text" danger icon={<DeleteOutlined />} />
                    </Popconfirm>
                </div>
            ),
        },
    ];

    return (
        <div style={{ padding: "0 24px" }}>
            {/* Header & Filter */}
            <div className={styles.pageHeader}>
                <h2>Quản lý Đơn hàng</h2>

                <div className={styles.filters}>
                    <Input
                        placeholder="Tìm mã đơn hoặc tên khách..."
                        prefix={<SearchOutlined style={{ color: "#ccc" }} />}
                        className={styles.searchBar}
                        onChange={(e) => setSearchText(e.target.value)}
                        allowClear
                    />
                    <Select
                        placeholder="Lọc trạng thái"
                        allowClear
                        className={styles.statusSelect}
                        onChange={setFilterStatus}
                    >
                        <Option value="pending">Pending</Option>
                        <Option value="paid">Paid</Option>
                        <Option value="shipped">Shipped</Option>
                        <Option value="completed">Completed</Option>
                        <Option value="cancelled">Cancelled</Option>
                    </Select>
                </div>
            </div>

            {/* Bảng dữ liệu */}
            <Card className={styles.tableCard}>
                <Table
                    columns={columns}
                    dataSource={filteredOrders}
                    rowKey="id"
                    loading={loading}
                    pagination={{ pageSize: 10 }}
                    // Xử lý Empty State đẹp mắt
                    locale={{
                        emptyText: (
                            <Empty
                                image={Empty.PRESENTED_IMAGE_SIMPLE}
                                description="Chưa có đơn hàng nào"
                            />
                        ),
                    }}
                />
            </Card>

            {/* Modal Chi tiết Đơn hàng */}
            <Modal
                title={
                    <div
                        style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 10,
                        }}
                    >
                        <span>Chi tiết đơn hàng</span>
                        {selectedOrder && (
                            <Tag color={getStatusColor(selectedOrder.status)}>
                                {selectedOrder.status.toUpperCase()}
                            </Tag>
                        )}
                    </div>
                }
                open={isModalOpen}
                onCancel={() => setIsModalOpen(false)}
                footer={[
                    <Button key="close" onClick={() => setIsModalOpen(false)}>
                        Đóng
                    </Button>,
                    <Button key="print" type="primary">
                        In hóa đơn
                    </Button>,
                ]}
                width={700}
            >
                {selectedOrder && (
                    <>
                        <div className={styles.detailSection}>
                            <h4>Thông tin giao hàng</h4>
                            <div className={styles.infoGrid}>
                                <div className={styles.infoItem}>
                                    <label>Người nhận:</label>
                                    {/* Kiểm tra shipping_address (JSONB) */}
                                    <span>
                                        {selectedOrder.shipping_address
                                            ?.recipient_name ||
                                            selectedOrder.profiles?.name}
                                    </span>
                                </div>
                                <div className={styles.infoItem}>
                                    <label>Số điện thoại:</label>
                                    <span>
                                        {selectedOrder.shipping_address
                                            ?.phone ||
                                            selectedOrder.profiles?.phone ||
                                            "---"}
                                    </span>
                                </div>
                                <div
                                    className={styles.infoItem}
                                    style={{ gridColumn: "1 / span 2" }}
                                >
                                    <label>Địa chỉ:</label>
                                    <span>
                                        {selectedOrder.shipping_address
                                            ? `${selectedOrder.shipping_address.address_line1}, ${selectedOrder.shipping_address.city}`
                                            : "Chưa cập nhật địa chỉ"}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className={styles.detailSection}>
                            <h4>Danh sách sản phẩm</h4>
                            {loadingItems ? (
                                <Card loading={true} bordered={false} />
                            ) : (
                                <div>
                                    {orderItems.map((item) => (
                                        <div
                                            key={item.id}
                                            className={styles.productItem}
                                        >
                                            <div className={styles.prodInfo}>
                                                {/* Lấy ảnh từ sản phẩm join được */}
                                                <img
                                                    src={
                                                        // Xử lý jsonb image của product (tương tự bài trước)
                                                        Array.isArray(
                                                            item.products
                                                                ?.images
                                                        ) &&
                                                        item.products.images[0]
                                                            ?.large
                                                            ? item.products
                                                                  .images[0]
                                                                  .large
                                                            : item.products
                                                                  ?.images?.[0] ||
                                                              "https://placehold.co/50"
                                                    }
                                                    alt=""
                                                />
                                                <div>
                                                    <div
                                                        style={{
                                                            fontWeight: 500,
                                                        }}
                                                    >
                                                        {item.products?.title}
                                                    </div>
                                                    <div
                                                        style={{
                                                            fontSize: 12,
                                                            color: "#888",
                                                        }}
                                                    >
                                                        x {item.quantity}
                                                    </div>
                                                </div>
                                            </div>
                                            <div style={{ fontWeight: "bold" }}>
                                                {formatCurrency(
                                                    item.price * item.quantity
                                                )}
                                            </div>
                                        </div>
                                    ))}

                                    <div
                                        style={{
                                            display: "flex",
                                            justifyContent: "space-between",
                                            marginTop: 20,
                                            paddingTop: 10,
                                            borderTop: "1px solid #eee",
                                        }}
                                    >
                                        <span style={{ fontSize: 16 }}>
                                            Tổng tiền:
                                        </span>
                                        <span
                                            style={{
                                                fontSize: 18,
                                                fontWeight: "bold",
                                                color: "#1890ff",
                                            }}
                                        >
                                            {formatCurrency(
                                                selectedOrder.total_price
                                            )}
                                        </span>
                                    </div>
                                </div>
                            )}
                        </div>
                    </>
                )}
            </Modal>
        </div>
    );
};

export default OrdersPage;
