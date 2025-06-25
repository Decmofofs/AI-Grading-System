import fs from 'fs';
import path from 'path';
import { BaseProcessor } from './baseProcessor';
import { logger } from '../utils/logger';

export class TextProcessor extends BaseProcessor {
	async process(filePath: string): Promise<string> {
		try {
			const content = fs.readFileSync(filePath, 'utf-8');
			const fileName = path.basename(filePath);
			
			logger.info(`Processed text file: ${fileName}`);
			
			// Format as markdown with appropriate code block if it's a code file
			const extension = path.extname(filePath).toLowerCase();
			const codeExtensions = ['.py', '.java', '.c', '.cpp', '.js', '.ts', '.html', '.css', '.json', '.xml'];
			
			if (codeExtensions.includes(extension)) {
				const language = this.getLanguageFromExtension(extension);
				return this.formatAsMarkdown(`\`\`\`${language}\n${content}\n\`\`\``, `代码文件: ${fileName}`);
			} else {
				return this.formatAsMarkdown(content, `文本文件: ${fileName}`);
			}
		} catch (error) {
			logger.error(`Error processing text file: ${filePath}`, error);
			throw new Error(`处理文本文件失败: ${error instanceof Error ? error.message : 'Unknown error'}`);
		}
	}

	private getLanguageFromExtension(extension: string): string {
		const languageMap: { [key: string]: string } = {
			'.py': 'python',
			'.java': 'java',
			'.c': 'c',
			'.cpp': 'cpp',
			'.h': 'c',
			'.hpp': 'cpp',
			'.js': 'javascript',
			'.ts': 'typescript',
			'.html': 'html',
			'.css': 'css',
			'.json': 'json',
			'.xml': 'xml',
			'.md': 'markdown'
		};
		
		return languageMap[extension] || 'text';
	}
}
