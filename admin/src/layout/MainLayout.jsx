import React, { useState } from "react";
import {
    Avatar,
    Button,
    Col,
    Layout,
    Menu,
    Row,
    theme,
    message,
    Dropdown,
} from "antd";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import { supabase } from "../services/supabaseClient";
import { useSelector } from "react-redux";
import {
    MenuFoldOutlined,
    MenuUnfoldOutlined,
    UserOutlined,
    LogoutOutlined,
} from "@ant-design/icons";
import {
    FaChartPie,
    FaBox,
    FaList,
    FaClipboardList,
    FaUserShield,
} from "react-icons/fa";
import styles from "./MainLayout.module.scss";
import { useDispatch } from "react-redux";
import { setLogout } from "../store/authSlice.js"; // Import action logout
import Logo from "../components/Logo.jsx";
import ProfileModal from "../components/ProfileModal.jsx";
import NotificationBell from "../components/NotificationBell.jsx";

const { Header, Sider, Content } = Layout;

const MainLayout = () => {
    const [collapsed, setCollapsed] = useState(false);
    const navigate = useNavigate();
    const location = useLocation();
    const dispatch = useDispatch();
    const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

    const { profile, user } = useSelector((state) => state.auth);

    // Ant Design theme token (để lấy màu chuẩn của hệ thống nếu cần)
    const {
        token: { colorBgContainer, borderRadiusLG },
    } = theme.useToken();

    // 1. Cấu hình Menu
    const menuItems = [
        {
            key: "/dashboard",
            icon: <FaChartPie />,
            label: "Tổng quan",
        },
        {
            key: "/products",
            icon: <FaBox />,
            label: "Sản phẩm",
        },
        {
            key: "/categories",
            icon: <FaList />,
            label: "Danh mục",
        },
        {
            key: "/my-orders",
            icon: <FaClipboardList />,
            label: "Đơn hàng",
        },
        {
            key: "/admins",
            icon: <FaUserShield />,
            label: "Quản trị viên",
        },
    ];

    // 3. Xử lý Đăng xuất
    const handleLogout = async () => {
        const { error } = await supabase.auth.signOut();
        if (error) {
            message.error("Lỗi đăng xuất: " + error.message);
        } else {
            message.success("Đã đăng xuất");
            dispatch(setLogout());
            navigate("/login");
        }
    };

    // Cấu hình Menu Dropdown
    const userMenuItems = [
        {
            key: "profile",
            label: "Thông tin cá nhân",
            icon: <UserOutlined />,
            onClick: () => setIsProfileModalOpen(true), // Mở Modal
        },
        {
            type: "divider",
        },
        {
            key: "logout",
            label: "Đăng xuất",
            icon: <LogoutOutlined />,
            danger: true, // Màu đỏ
            onClick: handleLogout, // Hàm logout cũ của bạn
        },
    ];

    // 2. Xử lý Click Menu
    const handleMenuClick = ({ key }) => {
        navigate(key);
    };

    return (
        <Layout className={styles.layoutContainer}>
            <Sider trigger={null} collapsible collapsed={collapsed}>
                <div className="demo-logo-vertical" />
                <div className={styles.logo}>
                    {/* Ẩn chữ ShopSmart khi thu nhỏ sidebar */}
                    <Logo
                        collapsed={collapsed}
                        textColor="#ffffffa6"
                        fontSize="2.2rem"
                        widthLogoIcon={collapsed ? "32px" : "28px"}
                    />
                </div>
                <Menu
                    theme="dark"
                    mode="inline"
                    defaultSelectedKeys={["/dashboard"]}
                    selectedKeys={[location.pathname]}
                    items={menuItems}
                    onClick={handleMenuClick}
                />
            </Sider>
            <Layout>
                <Header style={{ padding: 0, background: colorBgContainer }}>
                    <Row>
                        <Col span={18}>
                            <Button
                                type="text"
                                icon={
                                    collapsed ? (
                                        <MenuUnfoldOutlined />
                                    ) : (
                                        <MenuFoldOutlined />
                                    )
                                }
                                onClick={() => setCollapsed(!collapsed)}
                                style={{
                                    fontSize: "16px",
                                    width: 64,
                                    height: 64,
                                }}
                            />
                        </Col>
                        <Col span={6}>
                            <div
                                style={{
                                    marginRight: 24,
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "15px",
                                }}
                            >
                                <NotificationBell />

                                {/* Dropdown bọc lấy Avatar */}
                                <Dropdown
                                    menu={{ items: userMenuItems }}
                                    placement="bottomRight"
                                    arrow
                                >
                                    <div
                                        style={{
                                            cursor: "pointer",
                                            display: "flex",
                                            alignItems: "center",
                                            gap: 10,
                                        }}
                                    >
                                        {/* Hiển thị Tên (Ưu tiên tên trong profile, nếu ko có lấy email) */}
                                        <span
                                            style={{
                                                fontWeight: 500,
                                                color: "#333",
                                            }}
                                        >
                                            Xin chào,{" "}
                                            {profile?.name ||
                                                user?.email?.split("@")[0] ||
                                                "Admin"}
                                        </span>

                                        {/* Hiển thị Avatar (Lấy từ Redux profile) */}
                                        <Avatar
                                            src={profile?.avatar_url}
                                            icon={<UserOutlined />}
                                            style={{
                                                backgroundColor: "#1890ff",
                                            }}
                                            size="large"
                                        />
                                    </div>
                                </Dropdown>
                            </div>
                        </Col>
                    </Row>
                </Header>
                <Content
                    className={styles.content}
                    style={{
                        margin: "24px 16px",
                        padding: 24,
                        minHeight: 280,
                        background: colorBgContainer,
                        borderRadius: borderRadiusLG,
                    }}
                >
                    {/* <Outlet /> là nơi các trang con (Dashboard, Products...) sẽ hiện ra */}
                    <Outlet />
                </Content>

                <ProfileModal
                    isOpen={isProfileModalOpen}
                    onClose={() => setIsProfileModalOpen(false)}
                />
            </Layout>
        </Layout>
    );
};

export default MainLayout;
