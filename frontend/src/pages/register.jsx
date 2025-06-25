// src/pages/Register.jsx
import React, { useState } from 'react';
import { Form, Input, Button, message, Typography, Alert } from 'antd';
import { register, login } from '../apiAuth';
import { useNavigate, Link } from 'react-router-dom';
import AuthLayout from '../components/AuthLayout'; // 导入新布局

const { Text } = Typography;

export default function Register() {
  const [loading, setLoading] = useState(false);
  const [regError, setRegError] = useState('');
  const navigate = useNavigate();

  const onFinish = async (values) => {
    const { username, password } = values;
    setLoading(true);
    setRegError('');
    try {
      await register({ username, password });
      message.success('注册成功！正在自动登录...');
      
      const loginRes = await login({ username, password });
      const { token } = loginRes.data;
      localStorage.setItem('token', token);
      navigate('/grade-homework', { replace: true });

    } catch (e) {
      const errMsg = e.response?.data?.error || '注册失败，请重试';
      setRegError(errMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout title="创建新账户">
      <Form onFinish={onFinish} layout="vertical" name="registerForm" size="large">
        <Form.Item
          name="username"
          label="用户名"
          rules={[{ required: true, message: '请输入您的用户名' }]}
        >
          <Input />
        </Form.Item>
        <Form.Item
          name="password"
          label="密码"
          rules={[{ required: true, message: '请输入您的密码' }]}
        >
          <Input.Password />
        </Form.Item>
        <Form.Item
          name="confirm"
          label="确认密码"
          dependencies={['password']}
          hasFeedback
          rules={[
            { required: true, message: '请确认您的密码!' },
            ({ getFieldValue }) => ({
              validator(_, value) {
                if (!value || getFieldValue('password') === value) {
                  return Promise.resolve();
                }
                return Promise.reject(new Error('两次输入的密码不匹配!'));
              },
            }),
          ]}
        >
          <Input.Password />
        </Form.Item>

        {regError && (
          <Alert
            message={regError}
            type="error"
            showIcon
            style={{ marginBottom: 24 }}
          />
        )}

        <Form.Item>
          <Button type="primary" block loading={loading} htmlType="submit">
            注册并登录
          </Button>
        </Form.Item>
        <div style={{ textAlign: 'center' }}>
          <Text type="secondary">已有账号？ </Text>
          <Link to="/login">返回登录</Link>
        </div>
      </Form>
    </AuthLayout>
  );
}
