import React, { useEffect, useState } from "react";
import {
    Table,
    Button,
    Input,
    Card,
    Select,
    Tag,
    Modal,
    Form,
    InputNumber,
    Upload,
    message,
    Popconfirm,
    Image,
    Space,
} from "antd";
import {
    PlusOutlined,
    SearchOutlined,
    EditOutlined,
    DeleteOutlined,
    InboxOutlined,
    UploadOutlined,
    MinusCircleOutlined,
} from "@ant-design/icons";
import { supabase } from "../../services/supabaseClient";
import styles from "./ProductsPage.module.scss";
import { formatCurrency } from "../../helpers/formatters"; // Helper format tiền bạn đã tạo

const { Option } = Select;
const { TextArea } = Input;

const ProductsPage = () => {
    // --- STATE QUẢN LÝ DỮ LIỆU ---
    const [products, setProducts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(false);

    // --- STATE BỘ LỌC ---
    const [searchText, setSearchText] = useState("");
    const [filterCategory, setFilterCategory] = useState(null);

    // --- STATE MODAL & FORM ---
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingProduct, setEditingProduct] = useState(null);
    const [form] = Form.useForm();
    const [fileList, setFileList] = useState([]); // Quản lý danh sách ảnh upload

    // 1. FETCH DỮ LIỆU (Sản phẩm + Danh mục)
    const fetchData = async () => {
        setLoading(true);
        try {
            // Lấy Products (Kèm tên Category)
            const { data: productsData, error: prodError } = await supabase
                .from("products")
                .select("*, categories(name, id)") // Join bảng categories
                .order("created_at", { ascending: false });

            if (prodError) throw prodError;

            // Lấy Categories (Để bỏ vào Dropdown lọc và Form)
            const { data: cateData, error: cateError } = await supabase
                .from("categories")
                .select("id, name");

            if (cateError) throw cateError;

            setProducts(productsData);
            setCategories(cateData);
        } catch (error) {
            message.error("Lỗi tải dữ liệu: " + error.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    // 2. XỬ LÝ LỌC CLIENT-SIDE
    const filteredProducts = products.filter((p) => {
        const matchSearch = p.title
            .toLowerCase()
            .includes(searchText.toLowerCase());
        const matchCategory = filterCategory
            ? p.category_id === filterCategory
            : true;
        return matchSearch && matchCategory;
    });

    // 3. XỬ LÝ UPLOAD ẢNH (Multi-upload)
    const handleUploadFiles = async () => {
        const finalImages = [];

        // Tách ra: Cái nào là ảnh cũ (đã có trên server), cái nào là ảnh mới (file từ máy tính)
        const oldImages = fileList.filter((file) => !file.originFileObj);
        const newFiles = fileList.filter((file) => file.originFileObj);

        // A. Xử lý ảnh cũ
        // (Giữ nguyên cấu trúc object cũ từ database để không mất dữ liệu variant)
        oldImages.forEach((file) => {
            if (file.originalObject) {
                finalImages.push(file.originalObject); // Giữ nguyên object { large:..., variant:... }
            } else {
                // Trường hợp fallback (nếu lỡ có dạng string)
                finalImages.push({
                    large: file.url,
                    variant: "OLD_UPLOAD",
                });
            }
        });

        // B. Xử lý ảnh mới (Upload lên Supabase)
        for (const file of newFiles) {
            const fileExt = file.name.split(".").pop();
            const fileName = `prod_${Date.now()}_${Math.random()}.${fileExt}`;
            const filePath = `products/${fileName}`;

            const { error } = await supabase.storage
                .from("images")
                .upload(filePath, file.originFileObj);

            if (error) {
                message.error(`Lỗi upload ${file.name}`);
                continue;
            }

            const { data } = supabase.storage
                .from("images")
                .getPublicUrl(filePath);

            // --- QUAN TRỌNG: LƯU DƯỚI DẠNG OBJECT ĐỂ ĐỒNG BỘ VỚI JSONB CŨ ---
            finalImages.push({
                large: data.publicUrl,
                thumb: data.publicUrl, // Tạm thời dùng chung link
                hi_res: data.publicUrl,
                variant: "NEW_UPLOAD", // Đánh dấu là ảnh mới up
            });
        }

        return finalImages;
    };

    // 4. XỬ LÝ LƯU (ADD / UPDATE)
    const handleSave = async (values) => {
        setLoading(true);
        try {
            // Bước 1: Upload ảnh
            const formattedImages = await handleUploadFiles();

            // Bước 2: Chuẩn bị dữ liệu
            // categories trong DB là jsonb (mảng string), nhưng category_id là quan hệ
            // Ở đây mình giả định bạn nhập features là mảng object hoặc string từ Form.List

            const payload = {
                title: values.title,
                price: values.price,
                stock: values.stock,
                category_id: values.category_id,
                description: values.description,
                images: formattedImages, // Lưu mảng URL ảnh
                features: values.features, // JSONB
                // categories: [categories.find(c => c.id === values.category_id)?.name], // Tùy chọn: lưu tên category vào mảng jsonb nếu schema yêu cầu
            };

            if (editingProduct) {
                // UPDATE
                const { error } = await supabase
                    .from("products")
                    .update(payload)
                    .eq("id", editingProduct.id);
                if (error) throw error;
                message.success("Cập nhật sản phẩm thành công!");
            } else {
                // INSERT
                const { error } = await supabase
                    .from("products")
                    .insert([payload]);
                if (error) throw error;
                message.success("Thêm sản phẩm thành công!");
            }

            setIsModalOpen(false);
            fetchData(); // Reload bảng
        } catch (error) {
            message.error("Lỗi lưu sản phẩm: " + error.message);
        } finally {
            setLoading(false);
        }
    };

    // 5. XỬ LÝ XÓA
    const handleDelete = async (id) => {
        try {
            const { error } = await supabase
                .from("products")
                .delete()
                .eq("id", id);
            if (error) throw error;
            message.success("Đã xóa sản phẩm");
            fetchData();
        } catch (error) {
            message.error("Lỗi xóa: " + error.message);
        }
    };

    // 6. MỞ MODAL (Setup dữ liệu form)
    const openModal = (product = null) => {
        setEditingProduct(product);
        if (product) {
            // Nếu là Sửa: Điền dữ liệu cũ
            form.setFieldsValue({
                ...product,
                category_id: product.category_id,
                features: product.features || [], // Đảm bảo features là mảng
            });

            // Setup hiển thị ảnh cũ trong Upload component
            if (product.images && Array.isArray(product.images)) {
                setFileList(
                    product.images
                        .map((img, index) => {
                            // Logic: Nếu là Object (Amazon) -> Lấy .large, Nếu là String (Upload tay) -> Lấy chính nó
                            const url =
                                typeof img === "object" && img !== null
                                    ? img.large
                                    : img;

                            return {
                                uid: `-${index}`,
                                name: `Image ${index + 1}`,
                                status: "done",
                                url: url, // Ant Design cần chuỗi URL ở đây
                                originalObject: img, // (Tùy chọn) Lưu lại object gốc nếu cần dùng sau này
                            };
                        })
                        .filter((item) => item.url)
                ); // Lọc bỏ những cái không có url
            } else {
                setFileList([]);
            }
        } else {
            // Nếu là Thêm mới: Reset
            form.resetFields();
            setFileList([]);
        }
        setIsModalOpen(true);
    };

    // --- CẤU HÌNH CỘT BẢNG ---
    const columns = [
        {
            title: "Sản phẩm",
            dataIndex: "title",
            key: "title",
            width: 250,
            render: (text, record) => {
                // --- LOGIC TÌM ẢNH MAIN ---
                let displayImage = "https://placehold.co/60x60?text=No+Image"; // Mặc định

                if (Array.isArray(record.images) && record.images.length > 0) {
                    // 1. Tìm object có variant = 'MAIN'
                    const mainItem = record.images.find(
                        (img) => img?.variant === "MAIN"
                    );

                    if (mainItem && mainItem.large) {
                        // Nếu tìm thấy MAIN -> Lấy link 'large'
                        displayImage = mainItem.large;
                    } else {
                        // Nếu không thấy MAIN -> Lấy phần tử đầu tiên (Fallback)
                        const firstItem = record.images[0];
                        // Kiểm tra xem nó là Object (cấu trúc mới) hay String (cấu trúc cũ/upload mới)
                        if (typeof firstItem === "string") {
                            displayImage = firstItem;
                        } else if (firstItem?.large) {
                            displayImage = firstItem.large;
                        }
                    }
                }

                return (
                    <div style={{ display: "flex", gap: 12 }}>
                        <Image
                            src={displayImage}
                            className={styles.productThumbnail}
                            fallback="https://placehold.co/60x60?text=Error"
                            width={60}
                        />
                        <div
                            style={{
                                display: "flex",
                                flexDirection: "column",
                                justifyContent: "center",
                            }}
                        >
                            <span className={styles.productName} title={text}>
                                {text}
                            </span>
                            <span style={{ fontSize: 12, color: "#999" }}>
                                ID: {record.id.slice(0, 5)}...
                            </span>
                        </div>
                    </div>
                );
            },
        },
        {
            title: "Danh mục",
            dataIndex: "categories", // Lấy từ bảng join
            key: "category",
            width: 150,
            render: (cate) => (
                <Tag color="blue">{cate?.name || "Chưa phân loại"}</Tag>
            ),
        },
        {
            title: "Giá",
            dataIndex: "price",
            key: "price",
            width: 120,
            sorter: (a, b) => a.price - b.price,
            render: (price) => (
                <span className={styles.price}>{formatCurrency(price)}</span>
            ),
        },
        {
            title: "Tồn kho",
            dataIndex: "stock",
            key: "stock",
            width: 100,
            align: "center",
            sorter: (a, b) => a.stock - b.stock,
            render: (stock) => {
                let color = stock > 10 ? "green" : stock > 0 ? "orange" : "red";
                let text = stock > 0 ? stock : "Hết hàng";
                return <Tag color={color}>{text}</Tag>;
            },
        },
        {
            title: "Hành động",
            key: "action",
            align: "center",
            width: 100,
            render: (_, record) => (
                <div>
                    <button
                        className={styles.actionBtn}
                        onClick={() => openModal(record)}
                    >
                        <EditOutlined />
                    </button>
                    <Popconfirm
                        title="Xóa sản phẩm này?"
                        onConfirm={() => handleDelete(record.id)}
                        okButtonProps={{ danger: true }}
                    >
                        <button
                            className={`${styles.actionBtn} ${styles.delete}`}
                        >
                            <DeleteOutlined />
                        </button>
                    </Popconfirm>
                </div>
            ),
        },
    ];

    return (
        <div style={{ padding: "0 24px" }}>
            {/* Header & Filter */}
            <div className={styles.pageHeader}>
                <Button
                    type="primary"
                    icon={<PlusOutlined />}
                    size="large"
                    onClick={() => openModal(null)}
                >
                    Thêm sản phẩm
                </Button>

                <div className={styles.filters}>
                    <Select
                        placeholder="Lọc theo danh mục"
                        allowClear
                        size="large"
                        className={styles.categorySelect}
                        onChange={setFilterCategory}
                    >
                        {categories.map((c) => (
                            <Option key={c.id} value={c.id}>
                                {c.name}
                            </Option>
                        ))}
                    </Select>

                    <Input
                        placeholder="Tìm tên sản phẩm..."
                        prefix={<SearchOutlined style={{ color: "#ccc" }} />}
                        size="large"
                        className={styles.searchBar}
                        onChange={(e) => setSearchText(e.target.value)}
                    />
                </div>
            </div>

            {/* Bảng dữ liệu */}
            <Card className={styles.tableCard}>
                <Table
                    columns={columns}
                    dataSource={filteredProducts}
                    rowKey="id"
                    loading={loading}
                    pagination={{ pageSize: 6 }}
                />
            </Card>

            {/* Modal Thêm/Sửa */}
            <Modal
                title={
                    editingProduct ? "Chỉnh sửa sản phẩm" : "Thêm sản phẩm mới"
                }
                open={isModalOpen}
                onCancel={() => setIsModalOpen(false)}
                onOk={() => form.submit()}
                width={800} // Modal to rộng rãi
                confirmLoading={loading}
            >
                <Form form={form} layout="vertical" onFinish={handleSave}>
                    {/* Dòng 1: Tên & Danh mục */}
                    <div
                        style={{
                            display: "grid",
                            gridTemplateColumns: "2fr 1fr",
                            gap: 16,
                        }}
                    >
                        <Form.Item
                            name="title"
                            label="Tên sản phẩm"
                            rules={[{ required: true }]}
                        >
                            <Input placeholder="Nhập tên sản phẩm..." />
                        </Form.Item>
                        <Form.Item
                            name="category_id"
                            label="Danh mục"
                            rules={[{ required: true }]}
                        >
                            <Select placeholder="Chọn danh mục">
                                {categories.map((c) => (
                                    <Option key={c.id} value={c.id}>
                                        {c.name}
                                    </Option>
                                ))}
                            </Select>
                        </Form.Item>
                    </div>

                    {/* Dòng 2: Giá & Kho */}
                    <div
                        style={{
                            display: "grid",
                            gridTemplateColumns: "1fr 1fr",
                            gap: 16,
                        }}
                    >
                        <Form.Item
                            name="price"
                            label="Giá (VNĐ)"
                            rules={[{ required: true }]}
                        >
                            <InputNumber
                                style={{ width: "100%" }}
                                formatter={(value) =>
                                    `${value}`.replace(
                                        /\B(?=(\d{3})+(?!\d))/g,
                                        ","
                                    )
                                }
                                parser={(value) =>
                                    value.replace(/\$\s?|(,*)/g, "")
                                }
                                min={0}
                            />
                        </Form.Item>
                        <Form.Item
                            name="stock"
                            label="Tồn kho"
                            rules={[{ required: true }]}
                        >
                            <InputNumber style={{ width: "100%" }} min={0} />
                        </Form.Item>
                    </div>

                    {/* Dòng 3: Mô tả */}
                    <Form.Item name="description" label="Mô tả chi tiết">
                        <TextArea rows={4} placeholder="Mô tả sản phẩm..." />
                    </Form.Item>

                    {/* Dòng 4: Hình ảnh (Upload) */}
                    <Form.Item label="Hình ảnh sản phẩm">
                        <Upload
                            listType="picture-card"
                            fileList={fileList}
                            onChange={({ fileList }) => setFileList(fileList)}
                            beforeUpload={() => false} // Tắt auto upload
                            multiple
                        >
                            <div>
                                <PlusOutlined />
                                <div style={{ marginTop: 8 }}>Upload</div>
                            </div>
                        </Upload>
                    </Form.Item>

                    {/* Dòng 5: Features (Dynamic List) */}
                    <Form.List name="features">
                        {(fields, { add, remove }) => (
                            <>
                                <div
                                    style={{ marginBottom: 8, fontWeight: 500 }}
                                >
                                    Tính năng nổi bật (Features)
                                </div>
                                {fields.map(({ key, name, ...restField }) => (
                                    <Space
                                        key={key}
                                        style={{
                                            display: "flex",
                                            marginBottom: 8,
                                        }}
                                        align="baseline"
                                    >
                                        <Form.Item
                                            {...restField}
                                            name={[name, "name"]} // Nếu features là mảng object {name, value}
                                            rules={[
                                                {
                                                    required: true,
                                                    message:
                                                        "Thiếu tên tính năng",
                                                },
                                            ]}
                                        >
                                            <Input placeholder="Tên tính năng (VD: Pin)" />
                                        </Form.Item>
                                        <Form.Item
                                            {...restField}
                                            name={[name, "value"]}
                                            rules={[
                                                {
                                                    required: true,
                                                    message: "Thiếu giá trị",
                                                },
                                            ]}
                                        >
                                            <Input placeholder="Giá trị (VD: 5000mAh)" />
                                        </Form.Item>
                                        <MinusCircleOutlined
                                            onClick={() => remove(name)}
                                        />
                                    </Space>
                                ))}
                                <Form.Item>
                                    <Button
                                        type="dashed"
                                        onClick={() => add()}
                                        block
                                        icon={<PlusOutlined />}
                                    >
                                        Thêm tính năng
                                    </Button>
                                </Form.Item>
                            </>
                        )}
                    </Form.List>
                </Form>
            </Modal>
        </div>
    );
};

export default ProductsPage;
