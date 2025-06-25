import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { AppDataSource } from '../config/database';
import { User } from '../entities/User';
import { createError } from './errorHandler';

export interface AuthenticatedRequest extends Request {
	user?: User;
	body: any;
	file?: any;
}

export const authenticateToken = async (
	req: AuthenticatedRequest,
	res: Response,
	next: NextFunction
): Promise<void> => {  try {
		const authHeader = req.headers['authorization'];
		const token = authHeader && authHeader.split(' ')[1];

		if (!token) {
			throw createError('Token is missing!', 401);
		}

		const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY!) as { user_id: number };
		const userRepository = AppDataSource.getRepository(User);
		const user = await userRepository.findOne({ where: { id: decoded.user_id } });

		if (!user) {
			throw createError('User not found!', 401);
		}

		req.user = user;
		next();
	} catch (error) {
		if (error instanceof jwt.JsonWebTokenError) {
			next(createError('Token is invalid!', 401));
		} else {
			next(error);
		}
	}
};
