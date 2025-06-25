import fs from 'fs';
import path from 'path';
import pdfParse from 'pdf-parse';
import { BaseProcessor } from './baseProcessor';
import { logger } from '../utils/logger';

export class PDFProcessor extends BaseProcessor {
	async process(filePath: string): Promise<string> {
		try {
			const fileName = path.basename(filePath);
			logger.info(`Processing PDF: ${fileName}`);

			const dataBuffer = fs.readFileSync(filePath);
			const data = await pdfParse(dataBuffer);
			
			let content = data.text.trim();
			
			if (content.length === 0) {
				content = '该PDF文件中没有可提取的文本内容，可能包含图片或扫描内容。';
			}

			// Basic formatting improvements
			content = content
				.replace(/\n{3,}/g, '\n\n') // Replace multiple newlines with double newlines
				.replace(/\s+/g, ' ') // Replace multiple spaces with single space
				.trim();

			const metadata = data.info ? {
				页数: data.numpages,
				标题: data.info.Title || '未知',
				作者: data.info.Author || '未知',
				创建日期: data.info.CreationDate || '未知'
			} : { 页数: data.numpages };

			let result = `## PDF文档信息\n\n`;
			Object.entries(metadata).forEach(([key, value]) => {
				result += `- **${key}**: ${value}\n`;
			});
			result += `\n## 文档内容\n\n${content}`;

			return this.formatAsMarkdown(result, `PDF文件: ${fileName}`);
		} catch (error) {
			logger.error(`Error processing PDF: ${filePath}`, error);
			throw new Error(`处理PDF失败: ${error instanceof Error ? error.message : 'Unknown error'}`);
		}
	}
}
