import fs from 'fs';
import path from 'path';
import tesseract from 'node-tesseract-ocr';
import sharp from 'sharp';
import axios from 'axios';
import { BaseProcessor } from './baseProcessor';
import { logger } from '../utils/logger';

interface QwenVisionResponse {
	output: {
		choices: Array<{
			message: {
				content: string;
			};
		}>;
	};
}

export class ImageProcessor extends BaseProcessor {
	private apiKey: string;

	constructor(apiKey: string) {
		super();
		this.apiKey = apiKey;
	}

	async process(filePath: string): Promise<string> {
		try {
			const fileName = path.basename(filePath);
			logger.info(`Processing image: ${fileName}`);

			// First try OCR for text extraction
			let ocrText = ''; let isOCRSuccessful = false;
			try {
				ocrText = await this.extractTextWithOCR(filePath);
				logger.info(`OCR extraction completed for ${fileName}`);
				isOCRSuccessful = ocrText.trim().length > 0;
			} catch (ocrError) {
				logger.warn(`OCR failed for ${fileName}, will try AI vision`, ocrError);
			}

			// If OCR didn't produce good results, try AI vision
			let aiVisionText = ''; let isAIVisionSuccessful = false;
			if (!isOCRSuccessful) { // If OCR produced very little text
				try {
					aiVisionText = await this.extractTextWithAI(filePath);
					logger.info(`AI vision extraction completed for ${fileName}`);
					isAIVisionSuccessful = aiVisionText.trim().length > 0;
				} catch (aiError) {
					logger.warn(`AI vision failed for ${fileName}`, aiError);
				}
			}

			// Combine results
			let combinedText = '';
			if (isOCRSuccessful) {
				combinedText += `## OCR文本提取结果\n\n${ocrText.trim()}\n\n`;
			}
			else if (isAIVisionSuccessful) {
				combinedText += `## AI视觉分析结果\n\n${aiVisionText.trim()}\n\n`;
			}

			if (combinedText.trim().length === 0) {
				combinedText = '未能从图片中提取到文本内容。';
			}


			return this.formatAsMarkdown(combinedText, `图片文件: ${fileName}`);
		} catch (error) {
			logger.error(`Error processing image: ${filePath}`, error);
			throw new Error(`处理图片失败: ${error instanceof Error ? error.message : 'Unknown error'}`);
		}
	}

	private async extractTextWithOCR(filePath: string): Promise<string> {
		try {
			// Convert image to format suitable for OCR if needed
			// const processedImagePath = await this.preprocessImage(filePath);
			const processedImagePath = filePath; // Skip preprocessing for now
			
			const config = {
				lang: 'eng+chi_sim', // Chinese simplified + English
				// oem: 1,
				// psm: 3,
			};

			const text = await tesseract.recognize(processedImagePath, config);
			
			// Clean up processed image if it's different from original
			if (processedImagePath !== filePath) {
				fs.unlinkSync(processedImagePath);
			}
			
			return text.trim();
		} catch (error) {
			throw new Error(`OCR失败: ${error instanceof Error ? error.message : 'Unknown error'}`);
		}
	}



	private async extractTextWithAI(filePath: string): Promise<string> {
		try {
			// Convert image to base64
			const imageBuffer = fs.readFileSync(filePath);
			const base64Image = imageBuffer.toString('base64');
			const mimeType = this.getMimeType(filePath);

			const response = await axios.post(
				'https://dashscope.aliyuncs.com/api/v1/services/aigc/multimodal-generation/generation',
				{
					model: 'qwen-vl-plus',
					input: {
						messages: [
							{
								role: 'user',
								content: [
									{
										type: 'text',
										text: '请仔细分析这张图片，提取其中的所有文字内容，并描述图片中的主要内容。如果图片包含表格、图表或代码，请详细描述其结构和内容。'
									},
									{
										type: 'image_url',
										image_url: {
											url: `data:${mimeType};base64,${base64Image}`
										}
									}
								]
							}
						]
					},
					parameters: {
						max_tokens: 2000
					}
				},
				{
					headers: {
						'Authorization': `Bearer ${this.apiKey}`,
						'Content-Type': 'application/json'
					}
				}
			);

			const result = response.data as QwenVisionResponse;
			return result.output.choices[0].message.content;
		} catch (error) {
			throw new Error(`AI视觉分析失败: ${error instanceof Error ? error.message : 'Unknown error'}`);
		}
	}

	private getMimeType(filePath: string): string {
		const extension = path.extname(filePath).toLowerCase();
		const mimeTypes: { [key: string]: string } = {
			'.png': 'image/png',
			'.jpg': 'image/jpeg',
			'.jpeg': 'image/jpeg',
			'.gif': 'image/gif',
			'.bmp': 'image/bmp',
			'.tiff': 'image/tiff'
		};
		
		return mimeTypes[extension] || 'image/jpeg';
	}
}
