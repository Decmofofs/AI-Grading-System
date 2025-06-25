// frontend/src/context/ThemeContext.jsx

import React, { createContext, useState, useEffect, useContext } from 'react';

// 1. 创建 Context
const ThemeContext = createContext();

// 2. 创建 Provider 组件
export const ThemeProvider = ({ children }) => {
  // 从 localStorage 读取主题，如果没有则默认为 'light'
  const [theme, setTheme] = useState(localStorage.getItem('app-theme') || 'light');

  useEffect(() => {
    // 当 theme 状态改变时，执行以下操作
    const body = document.body;
    // 移除旧的主题class
    body.classList.remove('light-mode', 'dark-mode', 'eyecare-mode');
    // 添加新的主题class
    body.classList.add(`${theme}-mode`);
    // 将新的主题保存到 localStorage
    localStorage.setItem('app-theme', theme);
  }, [theme]); // 依赖项是 theme，所以只在 theme 改变时运行

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

// 3. 创建一个自定义 Hook，方便其他组件使用
export const useTheme = () => useContext(ThemeContext);