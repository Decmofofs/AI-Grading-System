import express from 'express';
import multer from 'multer';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { asyncHandler } from '../middleware/errorHandler';
import { DocumentExtractor } from '../services/documentExtractor';
import { validateConversionRequest } from '../middleware/validation';
import { logger } from '../utils/logger';

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
	destination: (req: any, file: any, cb: any) => {
		cb(null, path.join(__dirname, '../../uploads'));
	},
	filename: (req: any, file: any, cb: any) => {
		const uniquePrefix = uuidv4();
		cb(null, `${uniquePrefix}_${file.originalname}`);
	}
});

const upload = multer({
	storage,
	limits: {
		fileSize: 50 * 1024 * 1024, // 50MB limit
	},  fileFilter: (req: any, file: any, cb: any) => {
		// Allow common document and image formats
		const allowedMimes = [
			'image/jpeg', 'image/png', 'image/gif', 'image/bmp', 'image/tiff',
			'application/pdf',
			'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
			'application/vnd.openxmlformats-officedocument.presentationml.presentation',
			'text/plain',
			'text/x-python', 'application/x-python-code',
			'text/x-java-source', 'text/x-c', 'text/x-c++',
			'application/javascript', 'text/javascript',
			'text/html', 'text/css', 'application/json', 'text/xml'
		];
		
		const isAllowed = allowedMimes.includes(file.mimetype) || 
										 file.originalname.match(/\.(txt|py|java|c|cpp|h|hpp|js|ts|html|css|json|xml|md|log)$/i);
		
		if (isAllowed) {
			cb(null, true);
		} else {
			cb(new Error(`File type ${file.mimetype} is not allowed`));
		}
	}
});

// POST /api/convert-to-text
router.post('/convert-to-text', 
	upload.single('file'),
	validateConversionRequest,
	asyncHandler(async (req: express.Request, res: express.Response) => {
		const { apiKey } = req.body;
		const file = req.file;

		if (!file) {
			return res.status(400).json({
				success: false,
				error: '请求中未找到文件部分'
			});
		}

		if (!apiKey) {
			return res.status(400).json({
				success: false,
				error: '请先在"API设置"中提供有效的转换服务API Key。'
			});
		}

		logger.info(`Processing file: ${file.originalname}`, {
			filename: file.filename,
			size: file.size,
			mimetype: file.mimetype
		});

		try {
			const extractor = new DocumentExtractor(apiKey);
			const extractedText = await extractor.extractContent(file.path);

			logger.info(`File processed successfully: ${file.originalname}`);

			res.json({
				success: true,
				text: extractedText
			});
		} catch (error) {
			logger.error(`Error processing file ${file.originalname}:`, error);
			
			res.status(500).json({
				success: false,
				error: `服务器处理文件失败: ${error instanceof Error ? error.message : 'Unknown error'}`
			});
		}
	})
);

export default router;
