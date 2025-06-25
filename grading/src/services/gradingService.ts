import axios from 'axios';
import { logger } from '../utils/logger';

export interface GradingResult {
  score: number;
  totalScore: number;
  overallFeedback: string;
  strengths: string[];
  areasForImprovement: string[];
}

export class GradingService {
  private apiKey: string;

  constructor(apiKey: string) {
	this.apiKey = apiKey;
  }

  async gradeHomework(standardAnswer: string, studentAnswer: string): Promise<GradingResult> {
	try {
	  // Step 1: Get initial grading from AI
	  logger.info('Step 1: Calling AI for initial grading...');
	  const startTime = Date.now();
	  const rawGradingText = await this.getAIGrading(standardAnswer, studentAnswer);
	  const endTime = Date.now();
	  logger.info(`Step 1 completed in ${(endTime - startTime) / 1000} seconds`);
	  logger.info(`AI returned raw grading text: ${rawGradingText}`);

	  // Step 2: Parse the result into structured JSON
	  logger.info('Step 2: Parsing grading result to JSON...');
	  const startTime2 = Date.now();
	  const structuredResult = await this.parseGradingResultToJson(rawGradingText);
	  const endTime2 = Date.now();
	  logger.info(`Step 2 completed in ${(endTime2 - startTime2) / 1000} seconds`);

	  logger.info('Step 3: All processing completed, returning result');
	  return structuredResult;
	} catch (error) {
	  logger.error('Error in gradeHomework:', error);
	  throw error;
	}
  }

	private async getAIGrading(standardAnswer: string, studentAnswer: string): Promise<string> {
		const prompt = `
你是一位严格的阅卷老师。请根据以下「评分标准」对「学生答案」进行批改。
请注意，评语必须包含:1.题目满分;如果没有说明默认是100分.2.学生得分:一个整数.如果有小题，你要指出各项得分.3.总体评语.4.主要优点.5.待改进之处.

--- 评分标准 ---
${standardAnswer}
---

--- 学生答案 ---
${studentAnswer}
---

请现在开始批改并给出你的详细评语。
`;

	try {
	  const response = await axios.post(
		'https://api.siliconflow.cn/v1/chat/completions',
		{
		  model: 'Qwen/Qwen2.5-72B-Instruct',
		  messages: [
			{
			  role: 'user',
			  content: prompt
			}
		  ],
		  max_tokens: 2000,
		  temperature: 0.3
		},
		{
		  headers: {
			'Authorization': `Bearer ${this.apiKey}`,
			'Content-Type': 'application/json'
		  }
		}
	  );

	  return response.data.choices[0].message.content;    } catch (error: any) {
	  if (axios.isAxiosError(error)) {
		logger.error('AI API Error:', {
		  status: error.response?.status,
		  data: error.response?.data,
		  message: error.message
		});
		throw new Error(`AI 评分服务调用失败: ${error.response?.data?.error?.message || error.message}`);
	  }
	  throw new Error(`AI 评分服务调用失败: ${error instanceof Error ? error.message : 'Unknown error'}`);
	}
  }

    private async parseGradingResultToJson(resultText: string): Promise<GradingResult> {
		const prompt = `
请将以下作业批改结果文本，解析并转换成一个严格的JSON对象。
JSON对象必须包含以下五个字段：
1. "score": 数字类型，表示学生最终的"得分"。
2. "totalScore": 数字类型，表示这道题的"总分"或"满分"。请从文本中提取。如果文本未明确提及总分，请根据上下文进行估算，如果完全无法判断，则默认为100。
3. "overallFeedback": 字符串类型，表示总体评语。
4. "strengths": 字符串数组类型，表示优点列表。
5. "areasForImprovement": 字符串数组类型，表示待改进之处列表。

你的回复中禁止包含任何除了JSON对象以外的文字、解释或代码块标记。

待解析的文本如下：
---
${resultText}
---
`;

	try {
	  const response = await axios.post(
		'https://api.siliconflow.cn/v1/chat/completions',
		{
		  model: 'Qwen/Qwen2.5-72B-Instruct',
		  messages: [
			{
			  role: 'user',
			  content: prompt
			}
		  ],
		  max_tokens: 1000,
		  temperature: 0.1
		},
		{
		  headers: {
			'Authorization': `Bearer ${this.apiKey}`,
			'Content-Type': 'application/json'
		  }
		}
	  );

	  const content = response.data.choices[0].message.content;
	  const parsedJson = JSON.parse(content) as GradingResult;
	  
	  // Validate the parsed result
	  if (typeof parsedJson.score !== 'number' ||
		  typeof parsedJson.totalScore !== 'number' ||
		  typeof parsedJson.overallFeedback !== 'string' ||
		  !Array.isArray(parsedJson.strengths) ||
		  !Array.isArray(parsedJson.areasForImprovement)) {
		throw new Error('Invalid JSON structure from AI response');
	  }

	  return parsedJson;
	} catch (error) {
	  logger.error('Error parsing grading result to JSON:', error);
	  
	  // Return fallback result (matching original Python behavior)
	  return {
		score: 0,
		totalScore: 100,
		overallFeedback: 'AI返回的批改结果格式无法解析，原始文本：' + resultText,
		strengths: [],
		areasForImprovement: ['无法自动解析详细的扣分点。']
	  };
	}
  }
}
