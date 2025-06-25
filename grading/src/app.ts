import 'reflect-metadata';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { AppDataSource } from './config/database';
import authRoutes from './routes/authRoutes';
import userRoutes from './routes/userRoutes';
import gradingRoutes from './routes/gradingRoutes';
import { errorHandler } from './middleware/errorHandler';
import { avatarAuthMiddleware } from './middleware/avatarAuth';
import { logger } from './utils/logger';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Security middleware with proper CORS policy
app.use(helmet({
	crossOriginResourcePolicy: { policy: "cross-origin" }, // 允许跨域资源访问，但受其他控制约束
	contentSecurityPolicy: {
		directives: {
			defaultSrc: ["'self'"],
			imgSrc: ["'self'", "data:", "http://localhost:3000", "http://localhost:5173"],
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

// CORS configuration - allow all origins for static files
app.use(cors({
	origin: function(origin, callback) {
		// Allow all origins for static files, restrict API calls
		if (!origin || origin.includes('localhost')) {
			callback(null, true);
		} else {
			callback(null, process.env.NODE_ENV !== 'production');
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
		
		app.listen(PORT, () => {
			logger.info(`Grading service running on port ${PORT}`);
			logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
		});
	} catch (error) {
		logger.error('Failed to start server:', error);
		process.exit(1);
	}
};

startServer();

export default app;
