import 'reflect-metadata';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import os from 'os';
import { AppDataSource } from './config/database';
import authRoutes from './routes/authRoutes';
import userRoutes from './routes/userRoutes';
import gradingRoutes from './routes/gradingRoutes';
import { errorHandler } from './middleware/errorHandler';
import { avatarAuthMiddleware } from './middleware/avatarAuth';
import { logger } from './utils/logger';
import { getAllowedOrigins } from './utils/dynamicUrl';

// Load environment variables
dotenv.config();

const app = express();
const PORT = parseInt(process.env.PORT || '3000', 10);

// Security middleware with proper CORS policy
app.use(helmet({
	crossOriginResourcePolicy: { policy: "cross-origin" }, // 允许跨域资源访问，但受其他控制约束
	contentSecurityPolicy: {
		directives: {
			defaultSrc: ["'self'"],
			imgSrc: ["'self'", "data:", ...getAllowedOrigins()],
			styleSrc: ["'self'", "'unsafe-inline'"],
			scriptSrc: ["'self'"],
		},
	},
}));
app.use(compression());

// Rate limiting
const limiter = rateLimit({
	windowMs: 15 * 60 * 1000, // 15 minutes
	max: 1000, // limit each IP to 1000 requests per windowMs
	message: 'Too many requests from this IP, please try again later.'
});
app.use('/api/', limiter);

// CORS configuration - allow external access
app.use(cors({
	origin: function(origin, callback) {
		if (process.env.NODE_ENV !== 'production') {
			callback(null, true);
			return;
		}
		if (!origin) {
			callback(null, true);
			return;
		}
		try {
			const url = new URL(origin);
			const hostname = url.hostname;
			if (
				hostname === 'localhost' ||
				hostname === '127.0.0.1' ||
				hostname.startsWith('10.') ||
				hostname.startsWith('192.168.') ||
				hostname.startsWith('172.')
			) {
				callback(null, true);
				return;
			}
			// 允许服务器自身的所有IP
			const interfaces = os.networkInterfaces();
			const localIPs = Object.values(interfaces).flat().map(i => i && i.address).filter(Boolean);
			if (localIPs.includes(hostname)) {
				callback(null, true);
				return;
			}
			// 允许自定义生产域名
			const allowedDomains: string[] = [
				// 'yourdomain.com',
				// 'www.yourdomain.com'
			];
			if (allowedDomains.includes(hostname)) {
				callback(null, true);
				return;
			}
			callback(new Error('Not allowed by CORS'));
		} catch (e) {
			callback(new Error('Not allowed by CORS'));
		}
	},
	credentials: true,
	optionsSuccessStatus: 200
}));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Ensure static directories exist
const staticDir = path.join(__dirname, '..', 'static');
const avatarsDir = path.join(staticDir, 'avatars');
if (!fs.existsSync(staticDir)) {
	fs.mkdirSync(staticDir, { recursive: true });
}
if (!fs.existsSync(avatarsDir)) {
	fs.mkdirSync(avatarsDir, { recursive: true });
}

// 临时简化的头像认证中间件
const simpleAvatarAuth = (req: express.Request, res: express.Response, next: express.NextFunction) => {
	// 暂时只检查是否有token，不检查具体权限
	const authHeader = req.headers.authorization;
	if (!authHeader || !authHeader.startsWith('Bearer ')) {
		// logger.warn('Avatar access without token');
		return res.status(401).json({ error: '需要认证' });
	}
	
	// logger.info(`Avatar access granted for: ${req.path}`);
	next();
};

// Serve avatar files with simplified authentication
app.use('/static/avatars', simpleAvatarAuth, (req, res, next) => {
	res.header('Access-Control-Allow-Origin', '*');
	res.header('Access-Control-Allow-Methods', 'GET');
	res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
	next();
}, express.static(avatarsDir));

// Serve other static files without authentication (if any)
app.use('/static', (req, res, next) => {
	// 阻止直接访问avatars目录
	if (req.path.startsWith('/avatars/')) {
		return res.status(403).json({ error: '请使用认证路由访问头像' });
	}
	res.header('Access-Control-Allow-Origin', '*');
	res.header('Access-Control-Allow-Methods', 'GET');
	res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
	next();
}, express.static(staticDir));

// Routes
app.use('/api', authRoutes);
app.use('/api', userRoutes);
app.use('/api', gradingRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
	res.json({ 
		status: 'ok', 
		service: 'grading-service',
		timestamp: new Date().toISOString()
	});
});

// Error handling middleware (must be last)
app.use(errorHandler);

// Initialize database and start server
const startServer = async () => {
	try {
		await AppDataSource.initialize();
		logger.info('Database connection established');
		
		app.listen(PORT, '0.0.0.0', () => {
			logger.info(`Grading service running on 0.0.0.0:${PORT}`);
			logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
		});
	} catch (error) {
		logger.error('Failed to start server:', error);
		process.exit(1);
	}
};

startServer();

export default app;
