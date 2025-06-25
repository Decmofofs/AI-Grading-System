import { Request, Response, NextFunction } from 'express';
import Joi from 'joi';
import { createError } from './errorHandler';

const conversionSchema = Joi.object({
    	apiKey: Joi.string().required().min(10).messages({
    	'string.empty': 'API Key不能为空',
    	'string.min': 'API Key长度不能少于10个字符',
    	'any.required': '请提供API Key'
    })
});

export const validateConversionRequest = (
    req: Request,
    res: Response,
	next: NextFunction
): void => {
    const { error } = conversionSchema.validate(req.body);
  
    if (error) {
        const errorMessage = error.details[0].message;
    	throw createError(errorMessage, 400);
  	}
  
  	next();
};
