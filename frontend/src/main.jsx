// src/main.jsx

// Ant Design ��������ʽ
import '@ant-design/v5-patch-for-react-19';
import 'antd/dist/reset.css';
// �������ǰ������������ȫ��CSS�ļ�
import './index.css'; 

// React ��·�ɺ���
import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

// ����ȫ�������ṩ��
import { ThemeProvider } from './context/ThemeContext';

// ����ҳ�����
import Home from './pages/home';
import Login from './pages/login';
import Register from './pages/register';
import HomeworkGrading from './pages/HomeworkGrading';
import ProtectedRoute from './components/ProtectedRoute'; // ����˱���·���������

const container = document.getElementById('root');
const root = createRoot(container);

// ��Ⱦ����Ӧ��
root.render(
  <React.StrictMode>
    {/* ʹ�� ThemeProvider ��������Ӧ�ã�ʹ��������������ܷ�������״̬ */}
    <ThemeProvider>
      <BrowserRouter>
        <Routes>
          {/* ��ҳ��ͨ������δ��¼�û� */}
          <Route path="/" element={<Home />} />

          {/* ע�����¼ */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* ��ҵ����ҳ����Ϊ��Ҫ���ܱ���·�� */}
          <Route
            path="/grade-homework"
            element={
              <ProtectedRoute>
                <HomeworkGrading />
              </ProtectedRoute>
            }
          />

          {/* ��������δƥ��·���ض��򵽺��ʵ�λ�� */}
          <Route 
            path="*" 
            element={<Navigate to={localStorage.getItem('token') ? "/grade-homework" : "/"} replace />} 
          />
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  </React.StrictMode>
);
