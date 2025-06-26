// vite.config.js
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import os from 'os';

// 获取本机IP地址
const getLocalIpAddress = () => {
	const interfaces = os.networkInterfaces();
	for (const devName in interfaces) {
		const iface = interfaces[devName];
		if (iface) {
			for (let i = 0; i < iface.length; i++) {
				const alias = iface[i];
				if (alias.family === 'IPv4' && alias.address !== '127.0.0.1' && !alias.internal) {
					return alias.address;
				}
			}
		}
	}
	return 'localhost';
};

const backendHost = process.env.BACKEND_HOST || getLocalIpAddress();

export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 5173,
    // 开发环境下的代理配置（可选）
    proxy: {
      '/api': {
        target: `http://${backendHost}:3000`,
        changeOrigin: true,
        secure: false
      }
    }
  }
});
