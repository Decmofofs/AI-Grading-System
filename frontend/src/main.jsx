// src/main.jsx

// Ant Design 兼容与样式
import '@ant-design/v5-patch-for-react-19';
import 'antd/dist/reset.css';
// 导入我们包含主题变量的全局CSS文件
import './index.css'; 

// React 与路由核心
import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

// 导入全局主题提供者
import { ThemeProvider } from './context/ThemeContext';

// 导入页面组件
import Home from './pages/home';
import Login from './pages/login';
import Register from './pages/register';
import HomeworkGrading from './pages/HomeworkGrading';
import ProtectedRoute from './components/ProtectedRoute'; // 假设此保护路由组件存在

const container = document.getElementById('root');
const root = createRoot(container);

// 渲染整个应用
root.render(
  <React.StrictMode>
    {/* 使用 ThemeProvider 包裹整个应用，使其所有子组件都能访问主题状态 */}
    <ThemeProvider>
      <BrowserRouter>
        <Routes>
          {/* 首页，通常用于未登录用户 */}
          <Route path="/" element={<Home />} />

          {/* 注册与登录 */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* 作业批改页，作为主要的受保护路由 */}
          <Route
            path="/grade-homework"
            element={
              <ProtectedRoute>
                <HomeworkGrading />
              </ProtectedRoute>
            }
          />

          {/* 其他所有未匹配路径重定向到合适的位置 */}
          <Route 
            path="*" 
            element={<Navigate to={localStorage.getItem('token') ? "/grade-homework" : "/"} replace />} 
          />
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  </React.StrictMode>
);
