import winston from 'winston';
import path from 'path';

const logDir = 'logs';

const logger = winston.createLogger({
	level: process.env.LOG_LEVEL || 'info',
	format: winston.format.combine(
		winston.format.timestamp({
			format: 'YYYY-MM-DD HH:mm:ss'
		}),
		winston.format.errors({ stack: true }),
		winston.format.json()
	),
	defaultMeta: { service: 'grading-service' },
	transports: [
		new winston.transports.File({ 
			filename: path.join(logDir, 'error.log'), 
			level: 'error',
			format: winston.format.combine(
				winston.format.timestamp(),
				winston.format.json()
			)
		}),
		new winston.transports.File({ 
			filename: path.join(logDir, 'combined.log'),
			format: winston.format.combine(
				winston.format.timestamp(),
				winston.format.json()
			)
		}),
	],
});

if (process.env.NODE_ENV !== 'production') {
	logger.add(new winston.transports.Console({
		format: winston.format.combine(
			winston.format.colorize(),
			winston.format.simple(),
			winston.format.printf(({ timestamp, level, message, service, ...meta }) => {
				return `${timestamp} [${service}] ${level}: ${message} ${
					Object.keys(meta).length ? JSON.stringify(meta, null, 2) : ''
				}`;
			})
		)
	}));
}

export { logger };
