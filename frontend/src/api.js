// frontend/src/api.js (最终正确版)

const GRADING_SERVICE_URL = 'http://localhost:3000';      // AI二 (作业批改服务)
const CONVERSION_SERVICE_URL = 'http://localhost:5001';   // AI一 (多模态转文字服务)

/**
 * 【【**这里是补全的函数**】】
 * 获取可用的AI模型列表
 */
export async function fetchModels(token) {
    console.log("正在向AI二（批改服务）请求模型列表...");
    const headers = {};
    if (token && token.trim()) {
        headers['Authorization'] = `Bearer ${token.trim()}`;
    }

    try {
        const res = await fetch(`${GRADING_SERVICE_URL}/api/models`, { headers });

        if (!res.ok) {
            // 如果网络层面请求失败 (例如 404, 500错误)
            const errorData = await res.json().catch(() => ({ message: res.statusText }));
            throw new Error(errorData.message || `获取模型列表失败 (状态 ${res.status})`);
        }

        const data = await res.json();

        // 检查业务逻辑是否成功
        if (!data.success) {
            throw new Error(data.error || '后端返回获取模型列表失败');
        }

        return data; // 成功时，返回 { success: true, models: [...] }

    } catch (error) {
        console.error("获取模型列表API调用错误:", error);
        // 将错误向上抛出，让调用它的组件（HomeworkGrading.jsx）能捕捉到
        throw error;
    }
}

/**
 * 调用 AI一: 将多模态文件转换为文字
 */
export async function convertMultimodalToText(file, token, apiKey) {
    console.log("正在调用AI一（转换服务）:", file.name);
    const formData = new FormData();
    formData.append('file', file);
    // 【修改】: 将apiKey添加到表单数据中
    formData.append('apiKey', apiKey); 

    const apiUrl = `${CONVERSION_SERVICE_URL}/api/convert-to-text`; 
    const headers = {};
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    try {
        const res = await fetch(apiUrl, {
            method: 'POST',
            headers, 
            body: formData,
        });
        const result = await res.json();

        if (!res.ok || !result.success) {
            throw new Error(result.error || `文件转换失败 (状态 ${res.status})`);
        }
        return result;
    } catch (error) {
        console.error("文件转换API调用错误:", error);
        return { success: false, error: error.message };
    }
}

/**
 * 调用 AI二: 提交文本进行处理 (标准答案或学生作业)
 */
export async function processHomeworkSubmission(textForProcessing, modelId, submissionType, token, apiKey) {
    console.log("正在调用AI二（批改服务）:", { submissionType });
    const headers = { 'Content-Type': 'application/json' };
    if (token) {
        headers['Authorization'] = `Bearer ${token.trim()}`;
    }

    let endpoint = '';
    let bodyPayload = {};

    if (submissionType === 'standardAnswer') {
        endpoint = `${GRADING_SERVICE_URL}/api/standard-answer`; 
        bodyPayload = { standardAnswer: textForProcessing };
    } else {
        endpoint = `${GRADING_SERVICE_URL}/api/grade-homework`;
        bodyPayload = { studentAnswer: textForProcessing, modelId: modelId, apiKey: apiKey };
    }

    try {
        const res = await fetch(endpoint, {
            method: 'POST',
            headers,
            body: JSON.stringify(bodyPayload),
        });
        const result = await res.json();

        if (!res.ok || !result.success) {
            throw new Error(result.error || `处理请求失败 (状态 ${res.status})`);
        }
        return result;
    } catch (error) {
        console.error("作业处理API调用错误:", error);
        return { success: false, error: error.message };
    }
}