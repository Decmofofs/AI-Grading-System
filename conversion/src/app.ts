import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import conversionRoutes from './routes/conversionRoutes';
import { errorHandler } from './middleware/errorHandler';
import { logger } from './utils/logger';

// Load environment variables
dotenv.config();

const app = express();
const PORT = parseInt(process.env.PORT || '5001', 10);

// Security middleware
app.use(helmet());
app.use(compression());

// Rate limiting
const limiter = rateLimit({
	windowMs: 15 * 60 * 1000, // 15 minutes
	max: 100, // limit each IP to 100 requests per windowMs
	message: 'Too many requests from this IP, please try again later.'
});
app.use('/api/', limiter);

// CORS configuration - allow external access
app.use(cors({
	origin: function(origin, callback) {
		// In development, allow all origins
		// In production, you should specify your domain(s)
		if (process.env.NODE_ENV === 'production') {
			// For production, add your actual domain(s) here
			const allowedOrigins = [
				'http://localhost:5173',
				'http://localhost:3000',
				// Add your production domain here
				// 'https://yourdomain.com'
			];
			if (!origin || allowedOrigins.includes(origin)) {
				callback(null, true);
			} else {
				callback(new Error('Not allowed by CORS'));
			}
		} else {
			// Development: allow all origins
			callback(null, true);
		}
	},
	credentials: true
}));

// Body parsing middleware
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadsDir)) {
	fs.mkdirSync(uploadsDir, { recursive: true });
}

// Routes
app.use('/api', conversionRoutes);

// Health check endpoint
app.get('/health', (req: express.Request, res: express.Response) => {
	res.json({ 
		status: 'ok', 
		service: 'conversion-service',
		timestamp: new Date().toISOString()
	});
});

// Error handling middleware (must be last)
app.use(errorHandler);

// Start server
app.listen(PORT, '0.0.0.0', () => {
	logger.info(`Conversion service running on 0.0.0.0:${PORT}`);
	logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
});

export default app;
