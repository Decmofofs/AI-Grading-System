import fs from 'fs';
import path from 'path';
import { logger } from '../utils/logger';
import { ImageProcessor } from '../processors/imageProcessor';
import { PDFProcessor } from '../processors/pdfProcessor';
import { DOCXProcessor } from '../processors/docxProcessor';
import { PPTXProcessor } from '../processors/pptxProcessor';
import { TextProcessor } from '../processors/textProcessor';

export class DocumentExtractor {
	private apiKey: string;

	constructor(apiKey: string) {
		this.apiKey = apiKey;
	}

	async extractContent(filePath: string): Promise<string> {
		if (!fs.existsSync(filePath)) {
			throw new Error(`文件未找到: ${filePath}`);
		}

		const extension = path.extname(filePath).toLowerCase();
		const fileType = this.getFileType(extension);

		logger.info(`Processing file: ${filePath}, detected type: ${fileType}`);

		try {
			let result: string;

			switch (fileType) {
				case 'image':
					result = await new ImageProcessor(this.apiKey).process(filePath);
					break;
				case 'pdf':
					result = await new PDFProcessor().process(filePath);
					break;
				case 'docx':
					result = await new DOCXProcessor().process(filePath);
					break;
				case 'pptx':
					result = await new PPTXProcessor().process(filePath);
					break;
				case 'text':
					result = await new TextProcessor().process(filePath);
					break;
				default:
					throw new Error(`不支持的文件类型: ${extension}`);
			}

			return result;
		} finally {
			// Clean up temporary file
			try {
				fs.unlinkSync(filePath);
				logger.info(`Temporary file deleted: ${filePath}`);
			} catch (error) {
				logger.warn(`Failed to delete temporary file: ${filePath}`, error);
			}
		}
	}

	private getFileType(extension: string): string {
		const imageExtensions = ['.png', '.jpg', '.jpeg', '.gif', '.bmp', '.tiff'];
		const textExtensions = ['.txt', '.py', '.java', '.c', '.cpp', '.h', '.hpp', 
													 '.js', '.ts', '.html', '.css', '.json', '.xml', '.md', '.log'];

		if (imageExtensions.includes(extension)) {
			return 'image';
		} else if (extension === '.pdf') {
			return 'pdf';
		} else if (extension === '.docx') {
			return 'docx';
		} else if (extension === '.pptx') {
			return 'pptx';
		} else if (textExtensions.includes(extension)) {
			return 'text';
		} else {
			throw new Error(`Unsupported file extension: ${extension}`);
		}
	}
}
