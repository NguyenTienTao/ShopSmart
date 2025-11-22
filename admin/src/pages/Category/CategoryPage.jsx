import React, { useEffect, useState } from "react";
import {
    Table,
    Button,
    Input,
    Card,
    Modal,
    Form,
    message,
    Popconfirm,
    Tooltip,
    Image,
} from "antd";
import {
    FaPlus,
    FaSearch,
    FaEdit,
    FaTrash,
    FaLayerGroup,
} from "react-icons/fa";
import { supabase } from "../../services/supabaseClient";
import styles from "./CategoryPage.module.scss";

const CategoryPage = () => {
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searchText, setSearchText] = useState("");

    // State cho Modal (Thêm/Sửa)
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingCategory, setEditingCategory] = useState(null); // Nếu null là Thêm mới, có dữ liệu là Sửa
    const [form] = Form.useForm(); // Hook của Antd Form

    // 1. Lấy dữ liệu từ Supabase
    const fetchCategories = async () => {
        setLoading(true);
        try {
            // Kỹ thuật: Lấy tất cả categories VÀ đếm số sản phẩm trong đó
            // Yêu cầu: Trong DB bạn phải có Foreign Key từ products.category_id -> categories.id
            const { data, error } = await supabase
                .from("categories")
                .select("*, products(count)");

            if (error) throw error;

            // Map lại dữ liệu một chút (vì products(count) trả về mảng object)
            const formattedData = data.map((cat) => ({
                ...cat,
                product_count: cat.products?.[0]?.count || 0, // Lấy số lượng
            }));

            setCategories(formattedData);
        } catch (error) {
            message.error("Lỗi tải danh mục: " + error.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCategories();
    }, []);

    // 2. Xử lý Tìm kiếm (Search Client-side cho nhanh)
    const filteredCategories = categories.filter((cat) =>
        cat.name.toLowerCase().includes(searchText.toLowerCase())
    );

    // 3. Xử lý Mở Modal
    const handleOpenModal = (category = null) => {
        setEditingCategory(category);
        if (category) {
            form.setFieldsValue(category); // Điền dữ liệu cũ nếu là sửa
        } else {
            form.resetFields(); // Xóa trắng nếu là thêm mới
        }
        setIsModalOpen(true);
    };

    // 4. Xử lý Lưu (Thêm hoặc Sửa)
    const handleSave = async (values) => {
        try {
            let error;
            if (editingCategory) {
                // --- LOGIC SỬA ---
                const { error: updateError } = await supabase
                    .from("categories")
                    .update(values)
                    .eq("id", editingCategory.id);
                error = updateError;
            } else {
                // --- LOGIC THÊM MỚI ---
                const { error: insertError } = await supabase
                    .from("categories")
                    .insert([values]);
                error = insertError;
            }

            if (error) throw error;

            message.success(
                editingCategory
                    ? "Cập nhật thành công!"
                    : "Thêm mới thành công!"
            );
            setIsModalOpen(false);
            fetchCategories(); // Tải lại bảng
        } catch (err) {
            message.error("Có lỗi xảy ra: " + err.message);
        }
    };

    // 5. Xử lý Xóa
    const handleDelete = async (id) => {
        try {
            const { error } = await supabase
                .from("categories")
                .delete()
                .eq("id", id);
            if (error) throw error;
            message.success("Đã xóa danh mục");
            fetchCategories();
        } catch (err) {
            message.error("Không thể xóa: " + err.message);
        }
    };

    // --- CẤU HÌNH CỘT CHO BẢNG ---
    const columns = [
        {
            title: "Hình ảnh",
            dataIndex: "image_url",
            key: "image_url",
            width: 100,
            render: (url) =>
                url ? (
                    <Image
                        src={url}
                        width={50}
                        height={50}
                        style={{ objectFit: "cover", borderRadius: 4 }}
                    />
                ) : (
                    <div
                        style={{
                            width: 50,
                            height: 50,
                            background: "#f0f0f0",
                            borderRadius: 4,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                        }}
                    >
                        <FaLayerGroup color="#ccc" />
                    </div>
                ),
        },
        {
            title: "Tên danh mục",
            dataIndex: "name",
            key: "name",
            render: (text) => <strong>{text}</strong>,
            sorter: (a, b) => a.name.localeCompare(b.name),
        },
        {
            title: "Mô tả",
            dataIndex: "description",
            key: "description",
            responsive: ["md"], // Ẩn trên mobile
            render: (text) => (
                <span style={{ color: "#888" }}>{text || "---"}</span>
            ),
        },
        {
            title: "Số sản phẩm",
            dataIndex: "product_count",
            key: "product_count",
            align: "center",
            width: 150,
            render: (count) => (
                <span
                    style={{
                        fontWeight: "bold",
                        color: count > 0 ? "#1890ff" : "#ccc",
                    }}
                >
                    {count}
                </span>
            ),
            sorter: (a, b) => a.product_count - b.product_count,
        },
        {
            title: "Hành động",
            key: "action",
            align: "center",
            width: 120,
            render: (_, record) => (
                <div>
                    <Tooltip title="Chỉnh sửa">
                        <FaEdit
                            className={styles.actionBtn}
                            onClick={() => handleOpenModal(record)}
                        />
                    </Tooltip>

                    <Popconfirm
                        title="Xóa danh mục?"
                        description="Hành động này không thể hoàn tác."
                        onConfirm={() => handleDelete(record.id)}
                        okText="Xóa"
                        cancelText="Hủy"
                        okButtonProps={{ danger: true }}
                    >
                        <Tooltip title="Xóa">
                            {/* Dùng span bọc icon để tránh lỗi tooltip */}
                            <span
                                className={`${styles.actionBtn} ${styles.delete}`}
                            >
                                <FaTrash />
                            </span>
                        </Tooltip>
                    </Popconfirm>
                </div>
            ),
        },
    ];

    return (
        <div style={{ padding: "0 24px" }}>
            {" "}
            {/* Padding nhẹ cho thoáng */}
            {/* --- PHẦN HEADER --- */}
            <div className={styles.pageHeader}>
                <Button
                    type="primary"
                    icon={<FaPlus />}
                    size="large"
                    onClick={() => handleOpenModal(null)}
                >
                    Thêm mới Category
                </Button>

                <Input
                    placeholder="Tìm kiếm category..."
                    prefix={<FaSearch style={{ color: "#bfbfbf" }} />}
                    size="large"
                    className={styles.searchBar}
                    onChange={(e) => setSearchText(e.target.value)}
                    allowClear
                />
            </div>
            {/* --- PHẦN BẢNG --- */}
            <Card className={styles.tableCard} variant={false}>
                <Table
                    columns={columns}
                    dataSource={filteredCategories}
                    rowKey="id"
                    loading={loading}
                    pagination={{ pageSize: 8 }} // Phân trang 8 dòng
                />
            </Card>
            {/* --- MODAL THÊM / SỬA --- */}
            <Modal
                title={
                    editingCategory ? "Chỉnh sửa Danh mục" : "Thêm Danh mục mới"
                }
                open={isModalOpen}
                onOk={() => form.submit()} // Nút OK sẽ kích hoạt form submit
                onCancel={() => setIsModalOpen(false)}
                okText="Lưu"
                cancelText="Hủy"
            >
                <Form form={form} layout="vertical" onFinish={handleSave}>
                    <Form.Item
                        name="name"
                        label="Tên Category"
                        rules={[
                            { required: true, message: "Vui lòng nhập tên!" },
                        ]}
                    >
                        <Input placeholder="Ví dụ: Điện thoại, Laptop..." />
                    </Form.Item>

                    <Form.Item
                        name="image_url"
                        label="Link Hình ảnh (URL)"
                        rules={[{ type: "url", message: "Link không hợp lệ" }]}
                    >
                        {/* Tạm thời dùng input text, sau này nâng cấp lên Upload sau */}
                        <Input placeholder="https://..." />
                    </Form.Item>

                    <Form.Item name="description" label="Mô tả (Tùy chọn)">
                        <Input.TextArea
                            rows={3}
                            placeholder="Mô tả ngắn về danh mục này..."
                        />
                    </Form.Item>
                </Form>
            </Modal>
        </div>
    );
};

export default CategoryPage;
