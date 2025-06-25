declare module 'node-tesseract-ocr' {
	interface Config {
		lang?: string;
		oem?: number;
		psm?: number;
	}
	
	export function recognize(imagePath: string, config?: Config): Promise<string>;
}

declare module 'mammoth' {
	interface ConvertResult {
		value: string;
		messages: Array<{
			type: string;
			message: string;
		}>;
	}
	
	export function convertToHtml(buffer: Buffer): Promise<ConvertResult>;
	export function convertToMarkdown(buffer: Buffer): Promise<ConvertResult>;
}
