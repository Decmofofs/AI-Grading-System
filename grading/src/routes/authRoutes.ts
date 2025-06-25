import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import Joi from 'joi';
import { AppDataSource } from '../config/database';
import { User } from '../entities/User';
import { asyncHandler, createError } from '../middleware/errorHandler';
import { logger } from '../utils/logger';

const router = express.Router();

// Validation schemas
const registerSchema = Joi.object({
	username: Joi.string().min(3).max(30).required(),
	password: Joi.string().min(6).required()
});

const loginSchema = Joi.object({
	username: Joi.string().required(),
	password: Joi.string().required()
});

// POST /api/register
router.post('/register', asyncHandler(async (req: express.Request, res: express.Response) => {
	const { error } = registerSchema.validate(req.body);
	if (error) {
		throw createError(error.details[0].message, 400);
	}

	const { username, password } = req.body;
	const userRepository = AppDataSource.getRepository(User);

	// Check if user already exists
	const existingUser = await userRepository.findOne({ where: { username } });
	if (existingUser) {
		throw createError('该用户名已被注册', 409);
	}

	// Hash password
	const saltRounds = 12;
	const password_hash = await bcrypt.hash(password, saltRounds);

	// Create new user
	const newUser = userRepository.create({
		username,
		password_hash
	});

	await userRepository.save(newUser);

	logger.info(`New user registered: ${username}`);

	res.json({
		success: true,
		message: '注册成功！'
	});
}));

// POST /api/login
router.post('/login', asyncHandler(async (req: express.Request, res: express.Response) => {
	const { error } = loginSchema.validate(req.body);
	if (error) {
		throw createError(error.details[0].message, 400);
	}

	const { username, password } = req.body;
	const userRepository = AppDataSource.getRepository(User);

	// Find user
	const user = await userRepository.findOne({ where: { username } });
	if (!user) {
		throw createError('用户名或密码错误', 401);
	}

	// Verify password
	const isValidPassword = await bcrypt.compare(password, user.password_hash);
	if (!isValidPassword) {
		throw createError('用户名或密码错误', 401);
	}

	// Generate JWT token
	const token = jwt.sign(
		{ user_id: user.id },
		process.env.JWT_SECRET_KEY!,
		{ expiresIn: '24h' }
	);

	logger.info(`User logged in: ${username}`);

	res.json({
		success: true,
		token
	});
}));

export default router;
