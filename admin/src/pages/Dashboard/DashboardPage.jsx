import React, { useEffect, useState } from "react";
import { Row, Col, Table, Tag, Card, Spin, message, Empty } from "antd";
import { supabase } from "../../services/supabaseClient";
import styles from "./DashboardPage.module.scss";
import { formatCurrency, formatDate } from "../../helpers/formatters";

// Icons
import {
    FaShoppingBag,
    FaUser,
    FaMoneyBillWave,
    FaBoxOpen,
} from "react-icons/fa";

// Charts
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
} from "recharts";

const DashboardPage = () => {
    const [loading, setLoading] = useState(true);

    // State dữ liệu
    const [stats, setStats] = useState({
        revenue: 0,
        orders: 0,
        products: 0,
        customers: 0,
    });
    const [recentOrders, setRecentOrders] = useState([]);
    const [chartData, setChartData] = useState([]);
    const [bestSellers, setBestSellers] = useState([]);

    useEffect(() => {
        fetchAllData();
    }, []);

    const fetchAllData = async () => {
        setLoading(true);
        try {
            // Dùng Promise.all để chạy song song 4 luồng lấy dữ liệu
            const [
                productsResult,
                customersResult,
                ordersResult,
                bestSellersResult,
            ] = await Promise.all([
                // 1. Đếm tổng sản phẩm
                supabase
                    .from("products")
                    .select("*", { count: "exact", head: true }),

                // 2. Đếm tổng khách hàng
                supabase
                    .from("profiles")
                    .select("*", { count: "exact", head: true })
                    .eq("role", "customer"),

                // 3. Lấy đơn hàng (để tính doanh thu + vẽ biểu đồ + list đơn mới)
                // Lấy 30 ngày gần nhất để vẽ biểu đồ cho đẹp
                supabase
                    .from("orders")
                    .select(
                        "id, total_price, status, created_at, profiles(name)"
                    )
                    .neq("status", "cancelled") // Không tính đơn hủy
                    .order("created_at", { ascending: false }), // Mới nhất lên đầu

                // 4. Lấy Best Sellers (Gọi hàm RPC bạn đã tạo)
                supabase.rpc("get_best_selling_products"),
            ]);

            // --- XỬ LÝ KẾT QUẢ ---

            // A. Thống kê cơ bản
            const orders = ordersResult.data || [];
            const totalRevenue = orders.reduce(
                (sum, order) => sum + (Number(order.total_price) || 0),
                0
            );

            setStats({
                products: productsResult.count || 0,
                customers: customersResult.count || 0,
                orders: orders.length, // Tổng đơn (đã trừ hủy)
                revenue: totalRevenue,
            });

            // B. Xử lý Biểu đồ (Nhóm theo ngày)
            // Tạo map để gom doanh thu: { '22/11': 500000, '23/11': 1200000 }
            const chartMap = {};
            // Lấy 7 ngày gần nhất để hiển thị
            const last7DaysOrders = orders.filter((o) => {
                const diffTime = Math.abs(new Date() - new Date(o.created_at));
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                return diffDays <= 7;
            });

            last7DaysOrders.forEach((order) => {
                const date = new Date(order.created_at).toLocaleDateString(
                    "vi-VN",
                    { day: "2-digit", month: "2-digit" }
                );
                if (!chartMap[date]) chartMap[date] = 0;
                chartMap[date] += Number(order.total_price);
            });

            // Chuyển thành mảng cho Recharts và sort lại theo ngày
            const chartArray = Object.keys(chartMap)
                .map((date) => ({ name: date, value: chartMap[date] }))
                .reverse(); // Đảo ngược vì orders đang sort giảm dần (mới -> cũ)

            setChartData(chartArray);

            // C. Danh sách đơn mới (Lấy 5 cái đầu)
            setRecentOrders(orders.slice(0, 5));

            // D. Best Sellers
            if (bestSellersResult.error) console.error(bestSellersResult.error);
            setBestSellers(bestSellersResult.data || []);
        } catch (error) {
            console.error("Lỗi dashboard:", error);
            message.error("Không thể tải dữ liệu dashboard");
        } finally {
            setLoading(false);
        }
    };

    // Cấu hình cột cho bảng Đơn hàng mới
    const orderColumns = [
        {
            title: "Mã đơn",
            dataIndex: "id",
            key: "id",
            render: (id) => <Tag>#{id.slice(0, 6).toUpperCase()}</Tag>,
        },
        {
            title: "Khách hàng",
            dataIndex: "profiles",
            key: "customer",
            render: (p) => (
                <span style={{ fontWeight: 500 }}>
                    {p?.name || "Khách vãng lai"}
                </span>
            ),
        },
        {
            title: "Ngày đặt",
            dataIndex: "created_at",
            key: "created_at",
            render: (date) => (
                <span style={{ color: "#888" }}>{formatDate(date)}</span>
            ),
        },
        {
            title: "Tổng tiền",
            dataIndex: "total_price",
            key: "total",
            render: (price) => (
                <span style={{ color: "#1890ff", fontWeight: "bold" }}>
                    {formatCurrency(price)}
                </span>
            ),
        },
        {
            title: "Trạng thái",
            dataIndex: "status",
            key: "status",
            align: "center",
            render: (status) => {
                const colors = {
                    pending: "orange",
                    paid: "blue",
                    shipped: "cyan",
                    completed: "green",
                };
                return (
                    <Tag color={colors[status] || "default"}>
                        {status.toUpperCase()}
                    </Tag>
                );
            },
        },
    ];

    if (loading) {
        return (
            <div
                style={{
                    display: "flex",
                    justifyContent: "center",
                    paddingTop: 100,
                }}
            >
                <Spin size="large" tip="Đang tổng hợp dữ liệu..." />
            </div>
        );
    }

    return (
        <div className={styles.dashboardContainer}>
            {/* 1. THẺ THỐNG KÊ */}
            <Row gutter={[24, 24]}>
                <Col xs={24} sm={12} lg={6}>
                    <StatCard
                        title="Tổng doanh thu"
                        value={formatCurrency(stats.revenue)}
                        icon={<FaMoneyBillWave />}
                        color="green"
                    />
                </Col>
                <Col xs={24} sm={12} lg={6}>
                    <StatCard
                        title="Đơn hàng"
                        value={stats.orders}
                        icon={<FaShoppingBag />}
                        color="blue"
                    />
                </Col>
                <Col xs={24} sm={12} lg={6}>
                    <StatCard
                        title="Sản phẩm"
                        value={stats.products}
                        icon={<FaBoxOpen />}
                        color="gold"
                    />
                </Col>
                <Col xs={24} sm={12} lg={6}>
                    <StatCard
                        title="Khách hàng"
                        value={stats.customers}
                        icon={<FaUser />}
                        color="purple"
                    />
                </Col>
            </Row>

            {/* 2. BIỂU ĐỒ & BEST SELLER */}
            <Row gutter={[24, 24]}>
                {/* Biểu đồ doanh thu (Chiếm 16/24 phần) */}
                <Col xs={24} lg={16}>
                    <div className={styles.chartSection}>
                        <h3>Biểu đồ doanh thu (7 ngày qua)</h3>
                        {chartData.length > 0 ? (
                            <div style={{ width: "100%", height: 320 }}>
                                <ResponsiveContainer>
                                    <AreaChart data={chartData}>
                                        <defs>
                                            <linearGradient
                                                id="colorRev"
                                                x1="0"
                                                y1="0"
                                                x2="0"
                                                y2="1"
                                            >
                                                <stop
                                                    offset="5%"
                                                    stopColor="#1890ff"
                                                    stopOpacity={0.8}
                                                />
                                                <stop
                                                    offset="95%"
                                                    stopColor="#1890ff"
                                                    stopOpacity={0}
                                                />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid
                                            strokeDasharray="3 3"
                                            vertical={false}
                                        />
                                        <XAxis dataKey="name" />
                                        <YAxis />
                                        <Tooltip
                                            formatter={(value) =>
                                                formatCurrency(value)
                                            }
                                        />
                                        <Area
                                            type="monotone"
                                            dataKey="value"
                                            stroke="#1890ff"
                                            fillOpacity={1}
                                            fill="url(#colorRev)"
                                        />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                        ) : (
                            <Empty
                                description="Chưa có dữ liệu doanh thu"
                                image={Empty.PRESENTED_IMAGE_SIMPLE}
                            />
                        )}
                    </div>
                </Col>

                {/* Top Sản Phẩm (Chiếm 8/24 phần) */}
                <Col xs={24} lg={8}>
                    <div className={styles.chartSection}>
                        <h3>Sản phẩm bán chạy</h3>
                        {bestSellers.length > 0 ? (
                            <div className={styles.bestSellerList}>
                                {bestSellers.map((item, index) => (
                                    <div
                                        key={item.product_id}
                                        className={styles.item}
                                    >
                                        <div className={styles.info}>
                                            <div
                                                className={`${styles.rank} ${
                                                    index === 0
                                                        ? styles.top1
                                                        : index === 1
                                                        ? styles.top2
                                                        : index === 2
                                                        ? styles.top3
                                                        : ""
                                                }`}
                                            >
                                                {index + 1}
                                            </div>
                                            <img
                                                src={
                                                    item.image_url ||
                                                    "https://placehold.co/50"
                                                }
                                                alt=""
                                            />
                                            <div
                                                className={styles.name}
                                                title={item.title}
                                            >
                                                {item.title}
                                            </div>
                                        </div>
                                        <div className={styles.sales}>
                                            <span className={styles.count}>
                                                {item.total_sold}
                                            </span>
                                            <span className={styles.label}>
                                                đã bán
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <Empty
                                description="Chưa có số liệu"
                                image={Empty.PRESENTED_IMAGE_SIMPLE}
                            />
                        )}
                    </div>
                </Col>
            </Row>

            {/* 3. ĐƠN HÀNG MỚI */}
            <Card
                title="Đơn hàng mới nhất"
                bordered={false}
                className={styles.recentOrdersCard}
            >
                <Table
                    columns={orderColumns}
                    dataSource={recentOrders}
                    rowKey="id"
                    pagination={false}
                    locale={{
                        emptyText: <Empty description="Chưa có đơn hàng nào" />,
                    }}
                />
            </Card>
        </div>
    );
};

// Component con: StatCard
const StatCard = ({ title, value, icon, color }) => (
    <div className={styles.statCard}>
        <div className={styles.content}>
            <span className={styles.title}>{title}</span>
            <h4 className={styles.value}>{value}</h4>
        </div>
        <div className={`${styles.iconBox} ${styles[color]}`}>{icon}</div>
    </div>
);

export default DashboardPage;
