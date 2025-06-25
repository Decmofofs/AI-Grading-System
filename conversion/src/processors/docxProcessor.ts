import fs from 'fs';
import path from 'path';
import mammoth from 'mammoth';
import { BaseProcessor } from './baseProcessor';
import { logger } from '../utils/logger';

export class DOCXProcessor extends BaseProcessor {
	async process(filePath: string): Promise<string> {
		try {
			const fileName = path.basename(filePath);
			logger.info(`Processing DOCX: ${fileName}`);

			const buffer = fs.readFileSync(filePath);      const result = await mammoth.convertToHtml(buffer);
			
			let content = result.value.trim();
			
			// Convert HTML to basic markdown
			content = content
				.replace(/<p>/g, '\n')
				.replace(/<\/p>/g, '\n')
				.replace(/<br\/?>/g, '\n')
				.replace(/<strong>(.*?)<\/strong>/g, '**$1**')
				.replace(/<b>(.*?)<\/b>/g, '**$1**')
				.replace(/<em>(.*?)<\/em>/g, '*$1*')
				.replace(/<i>(.*?)<\/i>/g, '*$1*')
				.replace(/<h([1-6])>(.*?)<\/h[1-6]>/g, (match: string, level: string, text: string) => '#'.repeat(parseInt(level)) + ' ' + text + '\n')
				.replace(/<[^>]*>/g, '') // Remove remaining HTML tags
				.replace(/\n{3,}/g, '\n\n') // Replace multiple newlines
				.trim();
			
			if (content.length === 0) {
				content = '该Word文档中没有可提取的文本内容。';
			}      // Handle conversion messages/warnings
			if (result.messages && result.messages.length > 0) {
				const warnings = result.messages
					.filter((msg: any) => msg.type === 'warning')
					.map((msg: any) => msg.message)
					.slice(0, 5); // Limit to first 5 warnings

				if (warnings.length > 0) {
					content += `\n\n## 转换提示\n\n`;
					warnings.forEach((warning: string) => {
						content += `- ${warning}\n`;
					});
				}
			}

			return this.formatAsMarkdown(content, `Word文档: ${fileName}`);
		} catch (error) {
			logger.error(`Error processing DOCX: ${filePath}`, error);
			throw new Error(`处理Word文档失败: ${error instanceof Error ? error.message : 'Unknown error'}`);
		}
	}
}
