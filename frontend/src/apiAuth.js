// frontend/src/apiAuth.js

// 定义认证服务的地址（现在它和批改服务是同一个）
const AUTH_SERVICE_URL = 'http://localhost:3000';

/**
 * 注册新用户
 * @param {object} credentials - { username, password }
 */
export async function register({ username, password }) {
  const response = await fetch(`${AUTH_SERVICE_URL}/api/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  });
  
  const data = await response.json();

  if (!data.success) {
    // 将后端返回的错误信息抛出，方便UI层捕获
    const error = new Error(data.error || '注册失败，未知错误');
    error.response = { data }; // 保持与axios类似的错误结构
    throw error;
  }
  
  return data;
}

/**
 * 用户登录
 * @param {object} credentials - { username, password }
 */
export async function login({ username, password }) {
  const response = await fetch(`${AUTH_SERVICE_URL}/api/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  });

  const data = await response.json();

  if (!data.success) {
    const error = new Error(data.error || '登录失败，未知错误');
    error.response = { data };
    throw error;
  }
  
  // 登录成功，后端会返回一个包含 token 的对象
  return { data };
}

// 注意：setTokenHeaderForAuthClient 函数已不再需要，因为我们不再使用单独的axios实例。
// Token的传递由具体API调用时在Header中添加。

// --- 【修改】: 统一的用户资料管理函数 ---
export const getProfileData = async (token) => {
    const res = await fetch(`${AUTH_SERVICE_URL}/api/profile`, {
        headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!res.ok) throw new Error('无法获取用户资料。');
    return res.json();
};

export const updateProfileData = async (token, data) => {
    const res = await fetch(`${AUTH_SERVICE_URL}/api/profile`, {
        method: 'PATCH', 
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(data)
    });
    // 增加了更详细的错误处理，方便未来调试
    if (!res.ok) {
        // 尝试解析后端可能返回的错误信息
        try {
            const errorData = await res.json();
            throw new Error(errorData.error || '更新资料失败。');
        } catch (e) {
            // 如果后端没有返回JSON格式的错误，则抛出通用错误
            throw new Error(`更新资料失败，服务器状态码: ${res.status}`);
        }
    }
    return res.json();
};

export const uploadAvatar = async (token, file) => {
    const formData = new FormData();
    formData.append('avatar', file);
    const res = await fetch(`${AUTH_SERVICE_URL}/api/avatar/upload`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
    });
    if (!res.ok) throw new Error('头像上传失败。');
    return res.json();
};