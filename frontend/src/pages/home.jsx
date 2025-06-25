import React, { useEffect } from 'react';
import { Button, Typography, Layout } from 'antd';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import './Home.css'; // 我们将为这个文件添加样式

const { Title, Paragraph } = Typography;
const { Content } = Layout;

export default function Home() {
  const navigate = useNavigate();
  // 从主题上下文中获取设置主题的函数
  const { setTheme } = useTheme();

  useEffect(() => {
    // --- 核心逻辑 ---
    // 1. 保存用户当前的主题偏好，以便离开页面时恢复
    const originalTheme = localStorage.getItem('app-theme') || 'light';

    // 2. 强制将本页面的主题设置为'light'
    setTheme('light');

    // 3. 返回一个“清理函数”，在组件卸载（即用户离开此页面）时执行
    return () => {
      // 恢复到用户原始的主题偏好
      setTheme(originalTheme);
    };
  }, [setTheme]); // 依赖项是 setTheme，确保它在组件生命周期中是稳定的

  return (
    // 这里的内联样式可以保留，作为JS未生效时的备用样式
    <Layout style={{ height: '100vh' }}>
      <Content
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100%'
        }}
      >
        <Title 
          level={2} 
          className="welcome-container" 
          style={{ textAlign: 'center' }}
        >
          欢迎使用 AI 智能作业批改系统
        </Title>

        <div style={{ marginTop: 24 }}>
          <Button
            type="primary"
            size="large"
            style={{ marginRight: 16 }}
            onClick={() => navigate('/login')}
          >
            登录
          </Button>
          <Button
            size="large"
            onClick={() => navigate('/register')}
          >
            注册
          </Button>
        </div>
      </Content>
    </Layout>
  );
}
