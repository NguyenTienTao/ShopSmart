import React, { useState } from "react";
import { Form, Input, Button, message, Alert, Checkbox } from "antd";
import { UserOutlined, LockOutlined } from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../services/supabaseClient.js";
import styles from "./LoginPage.module.scss";
import Logo from "../../components/Logo.jsx";
import { useDispatch } from "react-redux";
import { setSession } from "../../store/authSlice.js";
import { getUserRole, getUserProfile } from "../../helpers/authHelpers.js";

function LoginPage() {
    const [loading, setLoading] = useState(false);
    const [errorInput, setErrorInput] = useState(false);
    const [errorMsg, setErrorMsg] = useState("");
    const navigate = useNavigate();

    const dispatch = useDispatch();

    const onFinish = async (values) => {
        setLoading(true);
        setErrorMsg("");

        try {
            const { data: authData, error: authError } =
                await supabase.auth.signInWithPassword({
                    email: values.email,
                    password: values.password,
                });

            if (authError) {
                setErrorInput(true);
                throw authError;
            }

            const user = authData.user;

            const profile = await getUserProfile(user.id);

            if (!profile) {
                await supabase.auth.signOut();
                throw new Error("Không tìm thấy hồ sơ người dùng.");
            }

            const role = profile.role;

            if (!role) {
                await supabase.auth.signOut();
                throw new Error("Không tìm thấy vai trò người dùng.");
            }

            if (role !== "admin") {
                await supabase.auth.signOut();
                throw new Error("Bạn không có quyền truy cập trang quản trị.");
            }

            dispatch(
                setSession({ session: authData.session, profile, role: role })
            );

            message.success("Đăng nhập thành công!");
            navigate("/dashboard");
        } catch (error) {
            console.log(error);

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
                            style={{ marginLeft: "24px", width: "91%" }}
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

                    <Form.Item name="remember" valuePropName="checked">
                        <Checkbox>Remember me</Checkbox>
                    </Form.Item>

                    {errorInput && <p>Email hoặc mật khẩu sai</p>}

                    <Form.Item>
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
