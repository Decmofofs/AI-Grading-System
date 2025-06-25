// frontend/src/api.js (������ȷ��)

const GRADING_SERVICE_URL = 'http://localhost:3000';      // AI�� (��ҵ���ķ���)
const CONVERSION_SERVICE_URL = 'http://localhost:5001';   // AIһ (��ģ̬ת���ַ���)

/**
 * ����**�����ǲ�ȫ�ĺ���**����
 * ��ȡ���õ�AIģ���б�
 */
export async function fetchModels(token) {
    console.log("������AI�������ķ�������ģ���б�...");
    const headers = {};
    if (token && token.trim()) {
        headers['Authorization'] = `Bearer ${token.trim()}`;
    }

    try {
        const res = await fetch(`${GRADING_SERVICE_URL}/api/models`, { headers });

        if (!res.ok) {
            // ��������������ʧ�� (���� 404, 500����)
            const errorData = await res.json().catch(() => ({ message: res.statusText }));
            throw new Error(errorData.message || `��ȡģ���б�ʧ�� (״̬ ${res.status})`);
        }

        const data = await res.json();

        // ���ҵ���߼��Ƿ�ɹ�
        if (!data.success) {
            throw new Error(data.error || '��˷��ػ�ȡģ���б�ʧ��');
        }

        return data; // �ɹ�ʱ������ { success: true, models: [...] }

    } catch (error) {
        console.error("��ȡģ���б�API���ô���:", error);
        // �����������׳����õ������������HomeworkGrading.jsx���ܲ�׽��
        throw error;
    }
}

/**
 * ���� AIһ: ����ģ̬�ļ�ת��Ϊ����
 */
export async function convertMultimodalToText(file, token, apiKey) {
    console.log("���ڵ���AIһ��ת������:", file.name);
    const formData = new FormData();
    formData.append('file', file);
    // ���޸ġ�: ��apiKey��ӵ���������
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
            throw new Error(result.error || `�ļ�ת��ʧ�� (״̬ ${res.status})`);
        }
        return result;
    } catch (error) {
        console.error("�ļ�ת��API���ô���:", error);
        return { success: false, error: error.message };
    }
}

/**
 * ���� AI��: �ύ�ı����д��� (��׼�𰸻�ѧ����ҵ)
 */
export async function processHomeworkSubmission(textForProcessing, modelId, submissionType, token, apiKey) {
    console.log("���ڵ���AI�������ķ���:", { submissionType });
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
            throw new Error(result.error || `��������ʧ�� (״̬ ${res.status})`);
        }
        return result;
    } catch (error) {
        console.error("��ҵ����API���ô���:", error);
        return { success: false, error: error.message };
    }
}