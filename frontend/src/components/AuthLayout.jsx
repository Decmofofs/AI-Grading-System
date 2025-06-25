// frontend/src/components/AuthLayout.jsx

import React from 'react';
import { Layout, Radio, Button, Typography } from 'antd';
import { useTheme } from '../context/ThemeContext';
import { SunOutlined, MoonOutlined, EyeOutlined, RobotOutlined } from '@ant-design/icons';
import { Link } from 'react-router-dom';

const { Header, Content } = Layout;
const { Title } = Typography;

export default function AuthLayout({ children, title }) {
  const { theme, setTheme } = useTheme();

  return (
    <Layout className="auth-layout">
      <Header className="auth-header">
        <Link to="/">
          <Title level={3} className="header-title">
            <RobotOutlined style={{ marginRight: '10px' }} />
            AI 智能作业处理系统
          </Title>
        </Link>
        <Radio.Group
          value={theme}
          onChange={(e) => setTheme(e.target.value)}
          buttonStyle="solid"
        >
          <Radio.Button value="light"><SunOutlined /></Radio.Button>
          <Radio.Button value="dark"><MoonOutlined /></Radio.Button>
          <Radio.Button value="eyecare"><EyeOutlined /></Radio.Button>
        </Radio.Group>
      </Header>
      <Content className="auth-content">
        <div className="auth-form-container">
          <Title level={2} style={{ textAlign: 'center', marginBottom: '24px' }}>{title}</Title>
          {children}
        </div>
      </Content>
    </Layout>
  );
}
