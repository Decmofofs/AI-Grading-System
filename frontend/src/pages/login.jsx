// src/pages/Login.jsx
import React, { useState } from 'react';
import { Form, Input, Button, Typography, Alert } from 'antd';
import { login } from '../apiAuth';
import { useNavigate, Link } from 'react-router-dom';
import AuthLayout from '../components/AuthLayout'; // 导入新布局

const { Text } = Typography;

export default function Login() {
  const [loading, setLoading] = useState(false);
  const [loginError, setLoginError] = useState('');
  const navigate = useNavigate();

  const onFinish = async ({ username, password }) => {
    setLoading(true);
    setLoginError('');
    try {
      const res = await login({ username, password });
      const { token } = res.data;
      localStorage.setItem('token', token);
      navigate('/grade-homework', { replace: true });
    } catch (e) {
      const errMsg = e.response?.data?.error || '登录失败，请重试';
      setLoginError(errMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout title="欢迎回来">
      <Form
        name="loginForm"
        onFinish={onFinish}
        layout="vertical"
        size="large"
      >
        <Form.Item
          name="username"
          label="用户名"
          rules={[{ required: true, message: '请输入用户名' }]}
        >
          <Input />
        </Form.Item>
        <Form.Item
          name="password"
          label="密码"
          rules={[{ required: true, message: '请输入密码' }]}
        >
          <Input.Password />
        </Form.Item>

        {loginError && (
          <Alert
            message={loginError}
            type="error"
            showIcon
            style={{ marginBottom: 24 }}
          />
        )}

        <Form.Item>
          <Button
            type="primary"
            block
            loading={loading}
            htmlType="submit"
          >
            登录
          </Button>
        </Form.Item>
        <div style={{ textAlign: 'center' }}>
          <Text type="secondary">还没有账号？ </Text>
          <Link to="/register">立即注册</Link>
        </div>
      </Form>
    </AuthLayout>
  );
}
