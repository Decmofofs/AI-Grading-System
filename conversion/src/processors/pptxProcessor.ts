import fs from 'fs';
import path from 'path';
import { BaseProcessor } from './baseProcessor';
import { logger } from '../utils/logger';

// Note: For PPTX processing, we'd typically use a library like 'node-pptx'
// but it's not as mature as other document processors. For now, we'll implement
// a basic version that extracts what it can.

export class PPTXProcessor extends BaseProcessor {
	async process(filePath: string): Promise<string> {
		try {
			const fileName = path.basename(filePath);
			logger.info(`Processing PPTX: ${fileName}`);

			// For now, we'll return a placeholder message
			// In a production environment, you might want to use a library like:
			// - officegen
			// - node-pptx-parser
			// - or convert to other formats first
			
			const content = `PowerPoint文件 "${fileName}" 已上传。
			
由于PowerPoint文件的复杂性，当前版本暂不支持完整的内容提取。
建议：
1. 将PowerPoint导出为PDF格式后重新上传
2. 将文本内容复制粘贴到文本框中
3. 如果包含重要图片，可以截图后单独上传

文件大小: ${this.getFileSize(filePath)}
`;

			return this.formatAsMarkdown(content, `PowerPoint文件: ${fileName}`);
		} catch (error) {
			logger.error(`Error processing PPTX: ${filePath}`, error);
			throw new Error(`处理PowerPoint失败: ${error instanceof Error ? error.message : 'Unknown error'}`);
		}
	}

	private getFileSize(filePath: string): string {
		try {
			const stats = fs.statSync(filePath);
			const fileSizeInBytes = stats.size;
			const fileSizeInKB = (fileSizeInBytes / 1024).toFixed(2);
			const fileSizeInMB = (fileSizeInBytes / (1024 * 1024)).toFixed(2);
			
			if (fileSizeInBytes < 1024) {
				return `${fileSizeInBytes} bytes`;
			} else if (fileSizeInBytes < 1024 * 1024) {
				return `${fileSizeInKB} KB`;
			} else {
				return `${fileSizeInMB} MB`;
			}
		} catch (error) {
			return '未知大小';
		}
	}
}
