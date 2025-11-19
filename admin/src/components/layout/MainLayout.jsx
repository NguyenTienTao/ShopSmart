import React, { useState } from "react";
import { Avatar, Button, Col, Layout, Menu, Row, theme, message } from "antd";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import { supabase } from "../../services/supabaseClient";
import {
    MenuFoldOutlined,
    MenuUnfoldOutlined,
    UserOutlined,
} from "@ant-design/icons";
import { FaChartPie, FaBox, FaList, FaClipboardList } from "react-icons/fa";
import styles from "./MainLayout.module.scss";

const { Header, Sider, Content } = Layout;

const MainLayout = () => {
    const [collapsed, setCollapsed] = useState(false);
    const navigate = useNavigate();
    const location = useLocation();

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
            key: "/orders",
            icon: <FaClipboardList />,
            label: "Đơn hàng",
        },
    ];

    // 2. Xử lý Click Menu
    const handleMenuClick = ({ key }) => {
        navigate(key);
    };

    // 3. Xử lý Đăng xuất
    const handleLogout = async () => {
        const { error } = await supabase.auth.signOut();
        if (error) {
            message.error("Lỗi đăng xuất: " + error.message);
        } else {
            message.success("Đã đăng xuất");
            navigate("/login");
        }
    };

    return (
        <Layout className={styles.layoutContainer}>
            <Sider trigger={null} collapsible collapsed={collapsed}>
                <div className="demo-logo-vertical" />
                <div className={styles.logo}>
                    {/* Ẩn chữ ShopSmart khi thu nhỏ sidebar */}
                    {!collapsed && (
                        <>
                            ShopSmart <span>Admin</span>
                        </>
                    )}
                    {collapsed && <span>SS</span>}
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
                        <Col span={16}>
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
                        <Col span={8}>
                            <Avatar size="default" icon={<UserOutlined />} />
                            <span>Nguyen Tien Tao</span>
                            <Button
                                type="primary"
                                danger
                                // icon={<RiLogoutBoxRLine />}
                                onClick={handleLogout}
                            >
                                Đăng xuất
                            </Button>
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
            </Layout>
        </Layout>
    );
};

export default MainLayout;
