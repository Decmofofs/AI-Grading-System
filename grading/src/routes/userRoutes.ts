import express from 'express';
import multer from 'multer';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import Joi from 'joi';
import { AppDataSource } from '../config/database';
import { User } from '../entities/User';
import { authenticateToken, AuthenticatedRequest } from '../middleware/auth';
import { asyncHandler, createError } from '../middleware/errorHandler';
import { logger } from '../utils/logger';

const router = express.Router();

// Configure multer for avatar uploads
const storage = multer.diskStorage({
	destination: (req: any, file: any, cb: any) => {
		cb(null, path.join(__dirname, '../../static/avatars'));
	},
	filename: (req: any, file: any, cb: any) => {
		const user = (req as AuthenticatedRequest).user;
		const uniquePrefix = uuidv4();
		const fileExtension = path.extname(file.originalname);
		cb(null, `${user?.id}_${uniquePrefix}${fileExtension}`);
	}
});

const upload = multer({
	storage,
	limits: {
		fileSize: 5 * 1024 * 1024, // 5MB limit
	},  fileFilter: (req: any, file: any, cb: any) => {
		const allowedMimes = ['image/jpeg', 'image/png', 'image/gif', 'image/bmp'];
		if (allowedMimes.includes(file.mimetype)) {
			cb(null, true);
		} else {
			cb(new Error('Only image files are allowed'));
		}
	}
});

// Validation schemas
const updateProfileSchema = Joi.object({
	nickname: Joi.string().max(50).allow(''),
	qwen_api_key: Joi.string().allow(''),
	siliconflow_api_key: Joi.string().allow('')
});

// GET /api/profile
router.get('/profile', 
	authenticateToken,
	asyncHandler(async (req: AuthenticatedRequest, res: express.Response) => {
		const user = req.user!;
		const avatar_full_url = user.avatar_url 
			? `http://localhost:3000/${user.avatar_url}` 
			: null;

		res.json({
			success: true,
			username: user.username,
			nickname: user.nickname || '',
			avatar_url: avatar_full_url,
			qwen_api_key: user.qwen_api_key || '',
			siliconflow_api_key: user.siliconflow_api_key || ''
		});
	})
);

// PATCH /api/profile
router.patch('/profile',
	authenticateToken,
	asyncHandler(async (req: AuthenticatedRequest, res: express.Response) => {
		const { error } = updateProfileSchema.validate(req.body);
		if (error) {
			throw createError(error.details[0].message, 400);
		}

		const user = req.user!;
		const userRepository = AppDataSource.getRepository(User);
		const { nickname, qwen_api_key, siliconflow_api_key } = req.body;

		let updated = false;

		if (nickname !== undefined) {
			user.nickname = nickname;
			updated = true;
		}

		if (qwen_api_key !== undefined) {
			user.qwen_api_key = qwen_api_key;
			updated = true;
		}

		if (siliconflow_api_key !== undefined) {
			user.siliconflow_api_key = siliconflow_api_key;
			updated = true;
		}

		if (updated) {
			await userRepository.save(user);
			logger.info(`User profile updated: ${user.username}`);

			res.json({
				success: true,
				message: '资料更新成功！'
			});
		} else {
			throw createError('没有提供要更新的资料', 400);
		}
	})
);

// POST /api/avatar/upload
router.post('/avatar/upload',
	authenticateToken,
	upload.single('avatar'),
	asyncHandler(async (req: AuthenticatedRequest, res: express.Response) => {
		const user = req.user!;
		const file = req.file;

		if (!file) {
			throw createError('未找到上传的头像文件', 400);
		}

		const userRepository = AppDataSource.getRepository(User);
		
		// Update user's avatar URL
		user.avatar_url = `static/avatars/${file.filename}`;
		await userRepository.save(user);

		const avatar_full_url = `http://localhost:3000/${user.avatar_url}`;

		logger.info(`Avatar uploaded for user: ${user.username}`);

		res.json({
			success: true,
			message: '头像上传成功！',
			avatar_url: avatar_full_url
		});
	})
);

export default router;
