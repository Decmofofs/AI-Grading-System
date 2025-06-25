export interface IProcessor {
	process(filePath: string): Promise<string>;
}

export abstract class BaseProcessor implements IProcessor {
	abstract process(filePath: string): Promise<string>;
	
	protected formatAsMarkdown(content: string, title?: string): string {
		if (title) {
			return `# ${title}\n\n${content}`;
		}
		return content;
	}
}
