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
const PORT = process.env.PORT || 5001;

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

// CORS configuration
app.use(cors({
	origin: process.env.NODE_ENV === 'production' 
		? ['http://localhost:5173', 'http://localhost:3000']
		: ['http://localhost:5173', 'http://localhost:3000'],
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
app.listen(PORT, () => {
	logger.info(`Conversion service running on port ${PORT}`);
	logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
});

export default app;
