import React, { useState, useEffect } from 'react';
import { Avatar } from 'antd';
import { UserOutlined } from '@ant-design/icons';

const AuthenticatedAvatar = ({ 
  src, 
  icon = <UserOutlined />, 
  onLoad, 
  onError, 
  ...props 
}) => {
  const [authenticatedSrc, setAuthenticatedSrc] = useState(undefined);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!src) {
      setAuthenticatedSrc(undefined);
      setError(false);
      return;
    }

    // 如果src不是我们的头像URL，直接使用
    if (!src.includes('/static/avatars/')) {
      setAuthenticatedSrc(src);
      setError(false);
      return;
    }

    const loadAuthenticatedImage = async () => {
      setLoading(true);
      setError(false);
      
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          throw new Error('No token available');
        }

        // console.log('🔐 认证头像请求:', { src, token: token ? 'exists' : 'missing' });

        const response = await fetch(src, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        // console.log('📡 头像请求响应:', response.status, response.statusText);

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const blob = await response.blob();
        const objectUrl = URL.createObjectURL(blob);
        
        // console.log('✅ 头像加载成功:', objectUrl);
        setAuthenticatedSrc(objectUrl);
        onLoad?.();

        // 清理函数将在组件卸载或src改变时调用
        return () => URL.revokeObjectURL(objectUrl);
        
      } catch (err) {
        // console.error('❌ 认证头像加载失败:', err);
        setError(true);
        setAuthenticatedSrc(undefined);
        onError?.();
      } finally {
        setLoading(false);
      }
    };

    const cleanup = loadAuthenticatedImage();
    
    // 返回清理函数
    return () => {
      cleanup?.then(cleanupFn => cleanupFn?.());
    };
  }, [src, onLoad, onError]);

  // 如果正在加载或出错，显示默认图标
  if (loading || error || !authenticatedSrc) {
    return <Avatar icon={icon} {...props} />;
  }

  return <Avatar src={authenticatedSrc} icon={icon} {...props} />;
};

export default AuthenticatedAvatar;
