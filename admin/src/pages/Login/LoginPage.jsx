import React from "react";
import { Form, Input, Button, message, Alert, Checkbox } from "antd";
import { UserOutlined, LockOutlined } from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../services/supabaseClient.js";
import styles from "./LoginPage.module.scss";
import Logo from "../../components/Logo.jsx";

function LoginPage() {
    const [loading, setLoading] = React.useState(false);
    const [errorMsg, setErrorMsg] = React.useState("");
    const navigate = useNavigate();

    const onFinish = async (values) => {
        setLoading(true);
        setErrorMsg("");

        try {
            const { data: authData, error: authError } =
                await supabase.auth.signInWithPassword({
                    email: values.email,
                    password: values.password,
                });

            if (authError) throw authError;

            const user = authData.user;

            const { data: profile, error: profileError } = await supabase
                .from("profiles")
                .select("role")
                .eq("id", user.id)
                .single();

            if (profileError) {
                await supabase.auth.signOut();
                throw new Error("Không tìm thấy hồ sơ người dùng.");
            }

            if (profile.role !== "admin") {
                await supabase.auth.signOut();
                throw new Error("Bạn không có quyền truy cập trang quản trị.");
            }

            message.success("Đăng nhập thành công!");
            navigate("/dashboard");
        } catch (error) {
            setErrorMsg(
                error.message || "Đã xảy ra lỗi trong quá trình đăng nhập."
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={styles.loginContainer}>
            <section className={styles.loginCard}>
                <div className={styles.loginCard__header}>
                    <Logo />
                    <h1 className={styles.loginCard__heading}>Admin</h1>
                    <p className={styles.loginCard__desc}>
                        Đăng nhập để quản lý hệ thống
                    </p>
                </div>

                {errorMsg && (
                    <Alert
                        message="Lỗi"
                        description={errorMsg}
                        type="error"
                        showIcon
                        style={{ marginBottom: 24 }}
                    />
                )}

                <Form
                    name="login_form"
                    initialValues={{ remember: true }}
                    onFinish={onFinish}
                    size="large"
                    autoComplete="off"
                >
                    <Form.Item
                        label="Email"
                        name="email"
                        rules={[
                            { required: true, message: "Vui lòng nhập email!" },
                            { type: "email", message: "Email không hợp lệ!" },
                        ]}
                    >
                        <Input
                            prefix={
                                <UserOutlined className="site-form-item-icon" />
                            }
                            placeholder="Email..."
                        />
                    </Form.Item>

                    <Form.Item
                        label="Password"
                        name="password"
                        rules={[
                            {
                                required: true,
                                message: "Vui lòng nhập mật khẩu!",
                            },
                        ]}
                    >
                        <Input.Password
                            prefix={
                                <LockOutlined className="site-form-item-icon" />
                            }
                            type="password"
                            placeholder="Mật khẩu..."
                        />
                    </Form.Item>

                    <Form.Item
                        name="remember"
                        valuePropName="checked"
                        label="null"
                    >
                        <Checkbox>Remember me</Checkbox>
                    </Form.Item>

                    <Form.Item label="null">
                        <Button
                            type="primary"
                            htmlType="submit"
                            block
                            loading={loading}
                            className={styles.loginCard__button}
                        >
                            Đăng nhập
                        </Button>
                    </Form.Item>
                </Form>
            </section>
        </div>
    );
}

export default LoginPage;
