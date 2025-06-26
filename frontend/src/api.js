// frontend/src/api.js

// 动态确定API地址 - 始终基于当前访问的主机名
const getApiBaseUrl = () => {
    const baseUrl = `http://${window.location.hostname}:3000`;
    console.log(`API Base: ${baseUrl}`);
    return baseUrl;
};

const getConversionApiUrl = () => {
    const conversionUrl = `http://${window.location.hostname}:5001`;
    console.log(`Conversion API: ${conversionUrl}`);
    return conversionUrl;
};

const GRADING_SERVICE_URL = getApiBaseUrl();      // AI批改服务
const CONVERSION_SERVICE_URL = getConversionApiUrl();  // AI多模态转换服务

console.log('API配置:', {
    GRADING_SERVICE_URL,
    CONVERSION_SERVICE_URL,
    hostname: window.location.hostname
});

/**
 * 获取可用的AI模型列表
 */
export async function fetchModels(token) {
    console.log("正在向AI批改服务请求模型列表...");
    const headers = {};
    if (token && token.trim()) {
        headers['Authorization'] = `Bearer ${token.trim()}`;
    }

    try {
        const res = await fetch(`${GRADING_SERVICE_URL}/api/models`, { headers });

        if (!res.ok) {
            // 如果服务器响应失败 (比如 404, 500错误)
            const errorData = await res.json().catch(() => ({ message: res.statusText }));
            throw new Error(errorData.message || `获取模型列表失败 (状态 ${res.status})`);
        }

        const data = await res.json();

        // 检查业务逻辑是否成功
        if (!data.success) {
            throw new Error(data.error || '该服务返回获取模型列表失败');
        }

        return data; // 成功时返回 { success: true, models: [...] }

    } catch (error) {
        console.error("获取模型列表API调用出错:", error);
        // 重新抛出错误，让上层调用者（如HomeworkGrading.jsx）能捕获到
        throw error;
    }
}

/**
 * 服务 AI一: 将多模态文件转换为文本
 */
export async function convertMultimodalToText(file, token, apiKey) {
    console.log("正在调用AI一进行文件转换:", file.name);
    const formData = new FormData();
    formData.append('file', file);
    // 新修改: 将apiKey添加到请求体中
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
        console.error("文件转换API调用出错:", error);
        return { success: false, error: error.message };
    }
}

/**
 * 服务 AI二: 对文本进行处理 (标准答案或学生作业)
 */
export async function processHomeworkSubmission(textForProcessing, modelId, submissionType, token, apiKey) {
    console.log("正在调用AI二进行处理:", { submissionType });
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
        console.error("作业处理API调用出错:", error);
        return { success: false, error: error.message };
    }
}