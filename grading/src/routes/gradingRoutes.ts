import express from 'express';
import Joi from 'joi';
import { asyncHandler, createError } from '../middleware/errorHandler';
import { authenticateToken, AuthenticatedRequest } from '../middleware/auth';
import { GradingService } from '../services/gradingService';
import { logger } from '../utils/logger';

const router = express.Router();

// In-memory storage for standard answers (matching original Python implementation)
const standardAnswerStore: { text: string } = { text: '' };

// Validation schemas
const standardAnswerSchema = Joi.object({
	standardAnswer: Joi.string().required().min(1)
});

const gradeHomeworkSchema = Joi.object({
	studentAnswer: Joi.string().required().min(1),
	apiKey: Joi.string().required().min(10),
	modelId: Joi.string().optional() // 前端发送但后端暂不使用
});

// GET /api/models
router.get('/models', 
	asyncHandler(async (req: express.Request, res: express.Response) => {
		const models = [
			{ id: 'Qwen/Qwen2.5-72B-Instruct' },
			{ id: 'deepseek-ai/DeepSeek-V3' }
		];

		res.json({
			success: true,
			models
		});
	})
);

// POST /api/standard-answer
router.post('/standard-answer',
	asyncHandler(async (req: express.Request, res: express.Response) => {
		const { error } = standardAnswerSchema.validate(req.body);
		if (error) {
			logger.error('Validation error in standard-answer:', {
				error: error.details[0].message,
				body: req.body
			});
			throw createError(error.details[0].message, 400);
		}

		const { standardAnswer } = req.body;
		
		// Input validation (from original Python code)
		const validationResult = validateInput(standardAnswer);
		if (!validationResult.isValid) {
			throw createError(validationResult.error!, 400);
		}

		standardAnswerStore.text = standardAnswer;
		
		logger.info(`Standard answer received: ${standardAnswer.substring(0, 100)}...`);

		res.json({
			success: true,
			message: '标准答案已成功接收并更新！'
		});
	})
);

// POST /api/grade-homework
router.post('/grade-homework',
	asyncHandler(async (req: express.Request, res: express.Response) => {
		const { error } = gradeHomeworkSchema.validate(req.body);
		if (error) {
			logger.error('Validation error in grade-homework:', {
				error: error.details[0].message,
				body: req.body
			});
			throw createError(error.details[0].message, 400);
		}

		const { studentAnswer, apiKey, modelId } = req.body;

		// Input validation
		const validationResult = validateInput(studentAnswer);
		if (!validationResult.isValid) {
			throw createError(validationResult.error!, 400);
		}

		const standardText = standardAnswerStore.text;
		if (!standardText) {
			throw createError('评分前请先提交标准答案', 400);
		}

		try {
			logger.info('Starting homework grading process');
			logger.info(`Student answer (first 100 chars): ${studentAnswer.substring(0, 100)}...`);

			const gradingService = new GradingService(apiKey);
			const result = await gradingService.gradeHomework(standardText, studentAnswer);

			logger.info('Homework grading completed successfully');

			res.json({
				success: true,
				data: result,
				type: 'gradingResult'
			});
		} catch (error) {
			logger.error('Error during grading process:', error);
			throw createError(`服务器内部错误: ${error instanceof Error ? error.message : 'Unknown error'}`, 500);
		}
	})
);

// Input validation function (from original Python code)
function validateInput(textInput: string): { isValid: boolean; error?: string } {
	const SENSITIVE_WORDS = ['暴力', '色情', '政治敏感词'];
	const INJECTION_KEYWORDS = ['ignore', 'override', 'system', 'execute', 'delete', 'sudo', 'rm -rf'];

	// Check for sensitive words
	for (const word of SENSITIVE_WORDS) {
		if (textInput.includes(word)) {
			return { isValid: false, error: `输入包含敏感词: ${word}` };
		}
	}

	// Note: Injection keyword check is commented out in original Python code
	// for (const keyword of INJECTION_KEYWORDS) {
	//   if (textInput.toLowerCase().includes(keyword)) {
	//     return { isValid: false, error: `输入包含潜在危险指令: ${keyword}` };
	//   }
	// }

	return { isValid: true };
}

export default router;
