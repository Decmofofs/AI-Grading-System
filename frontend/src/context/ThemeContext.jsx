// frontend/src/context/ThemeContext.jsx

import React, { createContext, useState, useEffect, useContext } from 'react';

// 1. ���� Context
const ThemeContext = createContext();

// 2. ���� Provider ���
export const ThemeProvider = ({ children }) => {
  // �� localStorage ��ȡ���⣬���û����Ĭ��Ϊ 'light'
  const [theme, setTheme] = useState(localStorage.getItem('app-theme') || 'light');

  useEffect(() => {
    // �� theme ״̬�ı�ʱ��ִ�����²���
    const body = document.body;
    // �Ƴ��ɵ�����class
    body.classList.remove('light-mode', 'dark-mode', 'eyecare-mode');
    // ����µ�����class
    body.classList.add(`${theme}-mode`);
    // ���µ����Ᵽ�浽 localStorage
    localStorage.setItem('app-theme', theme);
  }, [theme]); // �������� theme������ֻ�� theme �ı�ʱ����

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

// 3. ����һ���Զ��� Hook�������������ʹ��
export const useTheme = () => useContext(ThemeContext);