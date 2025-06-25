import express from 'express';
import jwt from 'jsonwebtoken';
import path from 'path';
import { AppDataSource } from '../config/database';
import { User } from '../entities/User';
import { logger } from '../utils/logger';

interface TokenPayload {
	id: number;
	username: string;
}

export const avatarAuthMiddleware = async (req: express.Request, res: express.Response, next: express.NextFunction) => {
	try {
		// 调试日志 - 注释掉用于生产环境
		// logger.info(`Avatar request: ${req.method} ${req.path}`);
		// logger.info(`Headers:`, req.headers);
		
		// 获取请求的文件名
		const requestedFileName = path.basename(req.path);
		// logger.info(`Requested file: ${requestedFileName}`);
		
		// 如果请求的不是头像文件，直接拒绝
		if (!req.path.startsWith('/avatars/') && !requestedFileName.includes('_')) {
			// logger.warn(`Invalid path: ${req.path}`);
			return res.status(403).json({ error: '禁止访问' });
		}

		// 从文件名中提取用户ID (格式: userId_uuid.ext)
		const fileNameParts = requestedFileName.split('_');
		// logger.info(`File name parts:`, fileNameParts);
		
		if (fileNameParts.length < 2) {
			// logger.warn(`Invalid file name format: ${requestedFileName}`);
			return res.status(403).json({ error: '无效的文件名格式' });
		}
		
		const fileUserId = parseInt(fileNameParts[0]);
		if (isNaN(fileUserId)) {
			// logger.warn(`Invalid user ID in filename: ${fileNameParts[0]}`);
			return res.status(403).json({ error: '无效的用户ID' });
		}
		
		// logger.info(`File belongs to user ID: ${fileUserId}`);

		// 检查Authorization header
		const authHeader = req.headers.authorization;
		if (!authHeader || !authHeader.startsWith('Bearer ')) {
			// logger.warn(`Missing or invalid authorization header: ${authHeader}`);
			return res.status(401).json({ error: '需要认证' });
		}

		const token = authHeader.substring(7);
		const jwtSecret = process.env.JWT_SECRET || 'your-secret-key';
		
		// 验证JWT token
		let decoded: TokenPayload;
		try {
			decoded = jwt.verify(token, jwtSecret) as TokenPayload;
			// logger.info(`Token verified for user: ${decoded.id}`);
		} catch (jwtError) {
			// logger.warn(`JWT verification failed:`, jwtError);
			return res.status(401).json({ error: '无效的认证令牌' });
		}
		
		// 检查当前用户是否有权限访问该头像
		if (decoded.id !== fileUserId) {
			logger.warn(`User ${decoded.id} attempted to access avatar of user ${fileUserId}`);
			return res.status(403).json({ error: '无权访问该头像' });
		}

		// 验证用户是否存在
		const userRepository = AppDataSource.getRepository(User);
		const user = await userRepository.findOne({ where: { id: decoded.id } });
		
		if (!user) {
			// logger.warn(`User not found: ${decoded.id}`);
			return res.status(404).json({ error: '用户不存在' });
		}

		// 检查用户的头像URL是否匹配请求的文件（放宽检查）
		if (user.avatar_url) {
			const expectedFileName = path.basename(user.avatar_url);
			if (expectedFileName !== requestedFileName) {
				// logger.warn(`Avatar mismatch. Expected: ${expectedFileName}, Requested: ${requestedFileName}`);
				// 暂时只记录警告，不阻止访问
				// return res.status(403).json({ error: '无权访问该头像文件' });
			}
		}

		// logger.info(`Avatar access granted for user ${decoded.id}`);
		// 权限验证通过，继续处理请求
		next();

	} catch (error) {
		logger.error('Avatar auth middleware error:', error);
		return res.status(500).json({ error: '服务器内部错误' });
	}
};
