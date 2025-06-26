import express from 'express';
import os from 'os';

/**
 * 获取服务器的动态基础URL
 * @param req Express请求对象
 * @param port 端口号（可选，默认从环境变量或请求中获取）
 * @returns 完整的服务器基础URL
 */
export const getServerBaseUrl = (req: express.Request, port?: string | number): string => {
	const protocol = req.get('x-forwarded-proto') || req.protocol || 'http';
	let host = req.get('host');
	
	// 如果没有host或者host是localhost，尝试获取真实IP
	if (!host || host.includes('localhost') || host.includes('127.0.0.1')) {
		const realIp = getRealServerIp();
		const portStr = port || process.env.PORT || '3000';
		host = `${realIp}:${portStr}`;
	}
	
	return `${protocol}://${host}`;
};

/**
 * 获取服务器的真实IP地址
 * @returns IP地址字符串
 */
export const getRealServerIp = (): string => {
	const interfaces = os.networkInterfaces();
	
	// 优先返回非回环的IPv4地址
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

/**
 * 获取所有允许的origins列表
 * @param additionalPorts 额外的端口列表
 * @returns origins数组
 */
export const getAllowedOrigins = (additionalPorts: string[] = []): string[] => {
	const interfaces = os.networkInterfaces();
	const localIPs = Object.values(interfaces)
		.flat()
		.filter(Boolean)
		.map(i => i!.address)
		.filter(Boolean);
	
	const defaultPorts = ['3000', '5001', '5173'];
	const allPorts = [...defaultPorts, ...additionalPorts];
	
	const origins: string[] = [];
	
	// 添加localhost和127.0.0.1
	allPorts.forEach(port => {
		origins.push(`http://localhost:${port}`);
		origins.push(`http://127.0.0.1:${port}`);
	});
	
	// 添加本机所有IP
	localIPs.forEach(ip => {
		allPorts.forEach(port => {
			origins.push(`http://${ip}:${port}`);
		});
	});
	
	return origins;
};
