import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Layout,
  Select,
  Typography,
  Input,
  Button,
  Spin,
  Alert,
  Card,
  Upload,
  message,
  Row,
  Col,
  Divider,
  Progress,
  Tag,
  Steps,
  Avatar,
  Radio,
  Modal,
  Tabs,
  Form // <--- 引入 Radio
} from 'antd';
import {
  UploadOutlined,
  RobotOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  MessageOutlined,
  ExperimentOutlined,
  FileTextOutlined,
  AudioOutlined,
  VideoCameraOutlined,
  PictureOutlined,
  LoadingOutlined,
  SyncOutlined,
  UserOutlined,
  LogoutOutlined,
  BookOutlined, // 新增图标用于标准答案
  SolutionOutlined, // 新增图标用于学生答案
  SunOutlined,
  MoonOutlined,
  EyeOutlined,
  PaperClipOutlined,
  KeyOutlined,
  InfoCircleOutlined
} from '@ant-design/icons';
import { fetchModels, convertMultimodalToText, processHomeworkSubmission } from '../api';
import { getProfileData, updateProfileData, uploadAvatar } from '../apiAuth';
import AuthenticatedAvatar from '../components/AuthenticatedAvatar';
import './HomeworkGrading.css';
import { useTheme } from '../context/ThemeContext';

const { Header, Content, Footer } = Layout;
const { Title, Text, Paragraph } = Typography;
const { Option } = Select;
const { TextArea } = Input;
const { Step } = Steps;

// 模拟调用转换伙伴的API
const callPartnerForMultimodalToTextAPI = async (file, token) => {
  console.log("向转换伙伴发送文件进行文本转换:", file.name, token);
  const formData = new FormData();
  formData.append('file', file);
  await new Promise(resolve => setTimeout(resolve, 1500 + Math.random() * 2000));
  const success = Math.random() > 0.1;
  if (success) {
    let extractedText = `这是从文件 "${file.name}" 中提取的文本内容。\n`;
    if (file.type.startsWith('image/')) {
      extractedText += "图像描述：示例图片内容。\n";
    } else if (file.type.startsWith('audio/')) {
      extractedText += "音频转录：示例音频内容。\n";
    } else {
      extractedText += "文件内容：示例文件文本。\n";
    }
    extractedText += "转换伙伴处理完成。";
    return { success: true, text: extractedText };
  } else {
    return { success: false, error: `文件 "${file.name}" 转换为文本失败。` };
  }
};

// AI 批改或处理标准答案的 API 调用
const callGradeOrStandardAnswerAPI = async (text, model, submissionType, token) => {
  console.log("调用后端处理:", { text, model, submissionType, token });
  await new Promise(resolve => setTimeout(resolve, 2000 + Math.random() * 3000));

  if (submissionType === 'standardAnswer') {
    // 模拟后端成功处理标准答案
    const success = Math.random() > 0.2; // 80% 成功率
    if (success) {
      return { success: true, message: "标准答案更新成功！" };
    } else {
      return { success: false, error: "标准答案更新失败，请重试。" };
    }
  } else { // studentAnswer
    const prompt = `请根据以下提交的作业文本进行批改：\n\n${text}\n\n请给出评分（0-100），详细评语，指出主要的优点和需要改进的地方。以JSON格式返回，包含字段：score, overallFeedback, strengths, areasForImprovement。`;
    try {
      let chatHistory = [];
      chatHistory.push({ role: "user", parts: [{ text: prompt }] });
      const payload = { 
          contents: chatHistory,
          generationConfig: {
              responseMimeType: "application/json",
              responseSchema: {
                  type: "OBJECT",
                  properties: {
                      "score": { "type": "NUMBER" },
                      "overallFeedback": { "type": "STRING" },
                      "strengths": { "type": "ARRAY", "items": { "type": "STRING" } },
                      "areasForImprovement": { "type": "ARRAY", "items": { "type": "STRING" } }
                  },
                  required: ["score", "overallFeedback", "strengths", "areasForImprovement"]
              }
          }
      };
      const apiKey = "";
      const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;
      const apiResponse = await fetch(apiUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
      });
      if (!apiResponse.ok) {
          const errorText = await apiResponse.text();
          throw new Error(`批改AI服务出错: ${apiResponse.status} ${errorText}`);
      }
      const result = await apiResponse.json();
      if (result.candidates && result.candidates[0]?.content?.parts?.[0]?.text) {
        const rawJsonText = result.candidates[0].content.parts[0].text;
        try {
          const parsedResult = JSON.parse(rawJsonText);
          return { success: true, data: parsedResult, type: 'gradingResult' };
        } catch (e) {
          return { success: false, error: "批改AI返回的格式无法解析，原始文本：" + rawJsonText };
        }
      } else {
        return { success: false, error: "批改AI未返回有效的批改结果。" };
      }
    } catch (error) {
      return { success: false, error: error.message || "连接批改AI服务失败。" };
    }
  }
};

// 【新增】: 统一的个人资料设置对话框
const ProfileModal = ({ open, onCancel, onUpdate, initialData, loading }) => {
    const [nicknameForm] = Form.useForm();
    const [apiKeyForm] = Form.useForm();
    const [fileList, setFileList] = useState([]);
    const [activeTab, setActiveTab] = useState('nickname');

    useEffect(() => {
        if(open) {
            nicknameForm.setFieldsValue({ nickname: initialData.nickname });
            apiKeyForm.setFieldsValue({
                qwen_api_key: initialData.qwen_api_key,
                siliconflow_api_key: initialData.siliconflow_api_key,
            });
            setFileList([]);
        }
    }, [open, initialData, nicknameForm, apiKeyForm]);
    
    const handleAvatarUpload = () => {
        if (fileList.length > 0 && fileList[0]) {
            // 直接传递文件对象本身
            onUpdate('avatar', fileList[0]);
        } else {
            message.warning("请先选择一张图片。");
        }
    };

    const items = [
        {
            key: 'nickname', label: '修改昵称',
            children: (
                <Form form={nicknameForm} layout="vertical" onFinish={(values) => onUpdate('nickname', values)}>
                    <Form.Item name="nickname" label="新昵称"><Input placeholder="请输入您的新昵称" /></Form.Item>
                    <Form.Item><Button type="primary" htmlType="submit" loading={loading}>保存昵称</Button></Form.Item>
                </Form>
            )
        },
        {
            key: 'avatar', label: '修改头像',
            children: (
                <>
                    <Upload listType="picture-card" fileList={fileList} onRemove={() => setFileList([])} beforeUpload={file => {setFileList([file]); return false;}} maxCount={1} accept="image/*">
                        {fileList.length < 1 && <div><UploadOutlined /><div style={{ marginTop: 8 }}>选择图片</div></div>}
                    </Upload>
                    <Button onClick={handleAvatarUpload} disabled={fileList.length === 0} loading={loading} style={{marginTop: '16px'}}>上传新头像</Button>
                </>
            )
        },
        {
            key: 'keys', label: 'API Keys',
            children: (
                <Form form={apiKeyForm} layout="vertical" onFinish={(values) => onUpdate('keys', values)}>
                    <Form.Item name="qwen_api_key" label="转换服务 (千问) API Key"><Input.Password placeholder="sk-..." /></Form.Item>
                    <Form.Item name="siliconflow_api_key" label="批改服务 (SiliconFlow) API Key"><Input.Password placeholder="sk-..." /></Form.Item>
                    <Form.Item><Button type="primary" htmlType="submit" loading={loading}>保存Keys</Button></Form.Item>
                </Form>
            )
        }
    ];

    return <Modal title="个人资料设置" open={open} onCancel={onCancel} footer={null}><Tabs defaultActiveKey="nickname" items={items} onChange={setActiveTab} /></Modal>;
};



export default function HomeworkGrading() {
  const navigate = useNavigate();
  const [models, setModels] = useState([]);
  const [currentGradingModel, setCurrentGradingModel] = useState('');
  const [homeworkText, setHomeworkText] = useState('');
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [processedTextForGrading, setProcessedTextForGrading] = useState('');
  const [apiResponse, setApiResponse] = useState(null); // 用于存储标准答案成功消息或学生答案批改结果
  const [isLoading, setIsLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [stepStatus, setStepStatus] = useState('process');
  const [error, setError] = useState('');
  const [authToken, setAuthToken] = useState(localStorage.getItem('token')); 
  const isLoggedIn = Boolean(authToken);
  const [submissionType, setSubmissionType] = useState('studentAnswer'); // 'studentAnswer' or 'standardAnswer'
  const [isTextExpanded, setIsTextExpanded] = useState(false);
  const { theme, setTheme } = useTheme();
  const [userApiKeys, setUserApiKeys] = useState({ qwen_api_key: '', siliconflow_api_key: '' }); // 新增
  const [isModalOpen, setIsModalOpen] = useState(false); // 新增
  const [isKeySaving, setIsKeySaving] = useState(false); // 新增
  const [isStandardAnswerSet, setIsStandardAnswerSet] = useState(false);
  // 移除重复的 avatarUrl 状态，统一使用 userInfo.avatar_url
  const [userInfo, setUserInfo] = useState({ username: '', nickname: '', avatar_url: null, qwen_api_key: '', siliconflow_api_key: '' });
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  const handlePaste = useCallback((event) => {
    const items = event.clipboardData.items;
    let foundFile = false;
    for (let i = 0; i < items.length; i++) {
      if (items[i].kind === 'file' && items[i].type.startsWith('image/')) {
        const file = items[i].getAsFile();
        if (file) {
          // 为文件添加唯一的uid以在Upload组件中正确显示
          file.uid = `pasted-${Date.now()}`;
          // 将粘贴的文件添加到现有文件列表
          setUploadedFiles(prevFiles => [...prevFiles, file]);
          message.success(`已通过粘贴上传图片: ${file.name || 'clipboard_image.png'}`);
          foundFile = true;
          // 清空文本输入框，因为我们现在以文件为主
          setHomeworkText('');
        }
      }
    }
    if (foundFile) {
      // 阻止默认的粘贴行为（例如，在文本框中显示图片路径）
      event.preventDefault();
    }
  }, []);

  useEffect(() => {
    window.addEventListener('paste', handlePaste);
    return () => {
      window.removeEventListener('paste', handlePaste);
    };
  }, [handlePaste]);

  useEffect(() => {
    const fetchInitialData = async () => {
        const token = localStorage.getItem('token');
        if (token) {
            try {
                const [profileRes, modelsRes] = await Promise.all([ getProfileData(token), fetchModels(token) ]);
                if (profileRes.success) {
                    // 只提取需要的用户信息字段，排除 success 字段
                    const { username, nickname, avatar_url, qwen_api_key, siliconflow_api_key } = profileRes;
                    setUserInfo({ username, nickname, avatar_url, qwen_api_key, siliconflow_api_key });
                }
                if (modelsRes.models?.length > 0) {
                  setModels(modelsRes.models);
                  setCurrentGradingModel(modelsRes.models[0].id);
                }
            } catch (err) { setError('获取初始数据失败。'); console.error(err); }
        }
    };
    fetchInitialData();
  }, [authToken]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    setAuthToken(null);
    navigate('/login', { replace: true });
  };

  const handleTextChange = (e) => {
    setHomeworkText(e.target.value);
    setUploadedFiles([]);
    setProcessedTextForGrading('');
  };

  const handleFileChange = (info) => {
    // info.fileList 包含了所有已选择文件的信息
    // 我们只关心原始文件对象
    const newFiles = info.fileList.map(f => f.originFileObj || f);
    setUploadedFiles(newFiles);
    setHomeworkText(''); // 选择文件时，清空文本输入
    message.success(`${info.file.name} 等${info.fileList.length}个文件已添加。`);
  };

  // 【【核心修复】】: 修改此函数，使其在切换时只重置必要的状态
  const handleSubmissionTypeChange = (e) => {
    // 只重置输入框和当前提交的UI状态
    setHomeworkText('');
    setUploadedFiles([]);
    setProcessedTextForGrading('');
    setApiResponse(null);
    setError('');
    setIsLoading(false);
    setCurrentStep(0);
    setStepStatus('process');
    // isStandardAnswerSet 状态在这里被保留，不会被重置
    
    // 设置新的提交类型
    setSubmissionType(e.target.value);
  };

  const handleProfileUpdate = async (type, values) => {
    const token = localStorage.getItem('token');
    if (!token) return;

    // 1. 开始时，设置加载状态
    setIsSaving(true);

    try {
        let result; // 先声明 result 变量

        // 2. 根据类型调用不同的 API，并将结果存入 result
        if (type === 'avatar') {
            // 修复点：直接使用 values 作为文件对象
            if (!values) {
                message.error("请选择一个文件。");
                setIsSaving(false);
                return;
            }
            result = await uploadAvatar(token, values);
        } else { // 'nickname' or 'keys'
            result = await updateProfileData(token, values);
        }

        // 3. 检查 API 调用结果
        if (result && result.success) {
            // 4. 根据类型更新状态
            if (type === 'avatar') {
                // 使用后端返回的 avatar_url 更新状态
                // console.log('🔍 头像上传调试信息:');
                // console.log('后端返回的 avatar_url:', result.avatar_url);
                setUserInfo(prev => {
                    const newUserInfo = { ...prev, avatar_url: result.avatar_url };
                    // console.log('更新前的 userInfo.avatar_url:', prev.avatar_url);
                    // console.log('更新后的 userInfo.avatar_url:', newUserInfo.avatar_url);
                    // console.log('完整的新 userInfo:', newUserInfo);
                    return newUserInfo;
                });
            } else {
                // 使用表单提交的值更新状态
                setUserInfo(prev => ({ ...prev, ...values }));
            }
            
            // 5. 统一处理成功后的操作
            message.success("更新成功！");
            setIsProfileModalOpen(false);

        } else {
            // 如果 API 调用成功但业务失败 (e.g., result.success === false)
            message.error(result.error || "更新失败，请稍后重试。");
        }

    } catch (err) {
        // 网络错误或其他意外错误
        message.error("更新失败: " + err.message);
    } finally {
        // 6. 无论成功失败，最后都取消加载状态
        setIsSaving(false);
    }
  };

  const handleSubmit = async () => {
    setIsLoading(true);
    setError('');
    setApiResponse(null);
    let textToProcess = homeworkText;

    if (uploadedFiles.length > 0) {
      setCurrentStep(1);
      setStepStatus('process');
      const fileNames = uploadedFiles.map(f => f.name).join(', ');
      message.loading({ content: `正在转换 ${uploadedFiles.length} 个文件...`, key: 'converting', duration: 0 });
      const conversionPromises = uploadedFiles.map(file => 
        convertMultimodalToText(file, authToken, userInfo.qwen_api_key)
      );
      try {
        const conversionResults = await Promise.all(conversionPromises);
        
        // 检查是否有任何一个文件转换失败
        const failedConversion = conversionResults.find(r => !r.success);
        if (failedConversion) {
          throw new Error(failedConversion.error || '部分文件转换失败。');
        }

        // 将所有成功转换的文本内容合并
        const combinedText = conversionResults
          .map((r, index) => `--- [文件 ${index + 1}: ${uploadedFiles[index].name}] ---\n\n${r.text}`)
          .join('\n\n\n');
        
        textToProcess = combinedText;
        setProcessedTextForGrading(textToProcess);
        message.destroy('converting');
        message.success(`${uploadedFiles.length} 个文件已全部成功转换为文本。`);

      } catch (err) {
        setError(err.message);
        message.error(err.message);
        setIsLoading(false);
        setCurrentStep(0);
        setStepStatus('error');
        message.destroy('converting');
        return;
      }
    } else {
        setProcessedTextForGrading(textToProcess);
    }

    setCurrentStep(submissionType === 'studentAnswer' ? 2 : 1);
    setStepStatus('process');
    const loadingMessage = submissionType === 'studentAnswer' ? 'AI正在努力批改作业...' : '正在提交标准答案...';
    message.loading({ content: loadingMessage, key: 'processing', duration: 0 });
    
    const backendResponse = await processHomeworkSubmission(
      textToProcess, 
      currentGradingModel, 
      submissionType, 
      authToken, 
      userInfo.siliconflow_api_key
    );
    
    message.destroy('processing');
    
    setIsLoading(false);
    if (backendResponse.success) {
      setApiResponse(backendResponse);
      const successMsg = (submissionType === 'studentAnswer') 
                        ? '作业批改完成！' 
                        : (apiResponse?.message || '标准答案已成功接收！'); // 使用 apiResponse 而不是 backendResponse
      message.success(successMsg);
      if (submissionType === 'standardAnswer') {
        setIsStandardAnswerSet(true);
      }
      // 直接将步骤设置为最后一步的索引 3
      setCurrentStep(3); 

      setStepStatus('finish');
    }else {
      setError(backendResponse.error || '处理失败，未知错误。');
      message.error(backendResponse.error || '处理失败，未知错误。');
      setCurrentStep(submissionType === 'studentAnswer' ? 3 : 2);
      setStepStatus('error');
    }
  };
  
  const getFileIcon = () => {
    if (!uploadedFile) return <FileTextOutlined />;
    if (uploadedFile.type.startsWith('image/')) return <PictureOutlined />;
    if (uploadedFile.type.startsWith('audio/')) return <AudioOutlined />;
    if (uploadedFile.type.startsWith('video/')) return <VideoCameraOutlined />;
    return <FileTextOutlined />;
  };

  const resetProcess = () => {
    setHomeworkText('');
    setUploadedFiles([]); // 修改为清空文件数组
    setProcessedTextForGrading('');
    setApiResponse(null);
    setError('');
    setIsLoading(false);
    setCurrentStep(0);
    setStepStatus('process');
    setIsStandardAnswerSet(false);
  };
  
  const getScoreTagColor = (score, totalScore) => {
      if (score === undefined || score === null) return "default";
      // 如果 totalScore 不存在或为0，则默认按100分制处理，避免除零错误
      const total = totalScore || 100;
      const percentage = (score / total) * 100;

      if (percentage >= 90) return "green";
      if (percentage >= 75) return "blue";
      if (percentage >= 60) return "orange";
      return "red";
  };

  const gradingResult = apiResponse && apiResponse.type === 'gradingResult' ? apiResponse.data : null;
  const standardAnswerMessage = apiResponse && apiResponse.message && submissionType === 'standardAnswer' ? apiResponse.message : null;

  const stepsItems = [
    { title: "提交内容", description: "输入文本或上传文件", icon: currentStep === 0 && isLoading ? <LoadingOutlined /> : <UploadOutlined /> },
    { title: "转换为文本", description: "多模态内容处理", icon: currentStep === 1 && isLoading ? <LoadingOutlined /> : <SyncOutlined spin={currentStep === 1 && isLoading} /> },
  ];

  if (submissionType === 'studentAnswer') {
    stepsItems.push({ title: "AI批改", description: "智能分析与评分", icon: currentStep === 2 && isLoading ? <LoadingOutlined /> : <ExperimentOutlined /> });
    stepsItems.push({ title: "完成批改", description: "查看批改结果", icon: gradingResult ? <CheckCircleOutlined /> : (error && currentStep ===3 ? <CloseCircleOutlined /> : <FileTextOutlined />) });
  } else { // standardAnswer
    stepsItems.push({ title: "处理答案", description: "更新标准答案", icon: currentStep === 2 && isLoading ? <LoadingOutlined /> : <ExperimentOutlined /> }); // 复用图标或换一个
    stepsItems.push({ title: "完成提交", description: "查看提交状态", icon: standardAnswerMessage ? <CheckCircleOutlined /> : (error && currentStep ===2 ? <CloseCircleOutlined /> : <FileTextOutlined />) });
  }

  const getButtonText = () => {
      // 最高优先级：判断流程是否已结束
      const isFinished = currentStep >= (submissionType === 'studentAnswer' ? 3 : 2) && (apiResponse || error);
      if (isFinished) {
          return '重新提交';
      }

      // 其次：判断是否正在处理中
      if (isLoading) {
          if (currentStep === 1) return '正在转换为文本...';
          if (currentStep === 2) {
              return submissionType === 'studentAnswer' ? 'AI正在批改...' : '正在提交标准答案...';
          }
      }

      // 默认状态：流程尚未开始
      return `开始处理与${submissionType === 'studentAnswer' ? '批改' : '提交标准答案'}`;
  };

  const getDisabledReason = () => {
    if (isLoading) return ''; // 正在加载中，不显示原因

    if (!homeworkText.trim() && uploadedFiles.length === 0) {
        return '请先输入内容或上传文件。';
    }

    // 【关键检查】：确保从正确的 userInfo 状态中读取 API key
    if (uploadedFiles.length > 0 && !userInfo.qwen_api_key) {
        return '请在“个人资料设置”中提供转换服务的API Key。';
    }

    // 【关键检查】：确保从正确的 userInfo 状态中读取 API key
    if (submissionType === 'studentAnswer' && !userInfo.siliconflow_api_key) { 
        return '请在“个人资料设置”中提供批改服务的API Key。'; 
    }

    if (submissionType === 'studentAnswer' && !isStandardAnswerSet) {
      return '请您先提交评分标准，然后再提交学生答案。';
    }
    if (submissionType === 'studentAnswer' && !currentGradingModel) {
      return '请选择一个批改模型。';
    }

    // 所有检查通过，返回空字符串，按钮将启用
    return ''; 
  };

  const disabledReason = getDisabledReason();
  const isSubmitDisabled = !!disabledReason;

  // console.log("Component is rendering with userInfo:", userInfo);
  // console.log("🎭 当前头像URL用于显示:", userInfo.avatar_url);
  
  return (
    <Layout className="homework-grading-page">
      <Header className="grading-header">
        <Title level={3} className="header-title">
          <RobotOutlined style={{ marginRight: '10px' }} />
          AI 智能作业处理系统
        </Title>
        <div className="header-right-controls">
          <Radio.Group value={theme} onChange={(e) => setTheme(e.target.value)} buttonStyle="solid">
            <Radio.Button value="light"><SunOutlined /> 亮色</Radio.Button>
            <Radio.Button value="dark"><MoonOutlined /> 暗色</Radio.Button>
            <Radio.Button value="eyecare"><EyeOutlined /> 护眼</Radio.Button>
          </Radio.Group>
          {/* 【新增】: API设置按钮 */}
          {/*<Button icon={<KeyOutlined />} onClick={() => setIsModalOpen(true)}>
              API设置
          </Button>*/}
          <div className="user-controls">
            {isLoggedIn ? (
              <>
                <Text className="header-welcome-text">欢迎你, {userInfo.nickname || userInfo.username}</Text>
                <Button type="text" shape="circle" style={{padding:0, border:0, height: 'auto'}} onClick={() => setIsProfileModalOpen(true)}>
                    <AuthenticatedAvatar 
                        src={userInfo.avatar_url} 
                        icon={<UserOutlined />} 
                        // onLoad={() => console.log('🖼️ Avatar 加载成功，当前 src:', userInfo.avatar_url)}
                        // onError={() => console.log('❌ Avatar 加载失败，当前 src:', userInfo.avatar_url)}
                    />
                </Button>
                <Button type="text" icon={<LogoutOutlined />} onClick={handleLogout} className="header-button">登出</Button>
              </>
            ) : (
              <Button type="primary" onClick={() => navigate('/login')}>登录/注册</Button>
            )}
          </div>
        </div>
      </Header>
      
      <Content className="main-content">
        <Steps current={currentStep} status={stepStatus} style={{ marginBottom: 24 }}>
          {stepsItems.map(item => <Step key={item.title} title={item.title} description={item.description} icon={item.icon} />)}
        </Steps>
        <Row gutter={24}>
          <Col xs={24} md={12}>
            <Card title="1. 提交作业" variant="outlined">
              <Form layout="vertical">
                <Form.Item label="提交类型">
                  <Radio.Group onChange={handleSubmissionTypeChange} value={submissionType} disabled={isLoading}>
                    <Radio.Button value="studentAnswer"><SolutionOutlined /> 学生答案</Radio.Button>
                    <Radio.Button value="standardAnswer"><BookOutlined /> 标准答案</Radio.Button>
                  </Radio.Group>
                </Form.Item>
                {submissionType === 'studentAnswer' && (
                  <Form.Item label="选择批改AI模型">
                    <Select value={currentGradingModel} onChange={setCurrentGradingModel} placeholder="选择批改AI" loading={models.length === 0 && !error} disabled={models.length === 0 || isLoading}>
                      {models.map((model) => (<Option key={model.id} value={model.id}>{model.id}</Option>))}
                    </Select>
                  </Form.Item>
                )}
                <Form.Item label={submissionType === 'studentAnswer' ? "学生作业内容" : "标准答案内容"}>
                  <TextArea rows={8} value={homeworkText} onChange={handleTextChange} placeholder={`在此处输入文本，或通过下方按钮/直接粘贴图片上传文件...`} disabled={isLoading || uploadedFiles.length > 0} />
                </Form.Item>
                <Text type="secondary" style={{display: 'block', textAlign: 'center', margin: '10px 0'}}>或者</Text>
                <Form.Item label={`上传${submissionType === 'studentAnswer' ? '学生作业' : '标准答案'}文件`}>
                  <Upload fileList={uploadedFiles.map((file, index) => ({ uid: file.uid || `file-${index}`, name: file.name, status: 'done', originFileObj: file }))} onChange={handleFileChange} beforeUpload={() => false} multiple={true} accept="image/*,audio/*,video/*,.txt,.md,.pdf,.doc,.docx" disabled={isLoading || !!homeworkText.trim()}>
                    <Button icon={<PaperClipOutlined />} disabled={isLoading || !!homeworkText.trim()}>选择文件 (可多选)</Button>
                  </Upload>
                </Form.Item>
                <Form.Item>
                  <Button
                    type="primary"
                    onClick={handleSubmit}
                    loading={isLoading && currentStep > 0 && currentStep < 3}
                    icon={isLoading ? <LoadingOutlined /> : <ExperimentOutlined />}
                    block
                    size="large"
                    disabled={isSubmitDisabled} // 使用新的禁用逻辑
                  >
                    {getButtonText()}
                  </Button>
                </Form.Item>
                {/* 【【核心修改二】：在按钮下方显示禁用原因】 */}
                {isSubmitDisabled && !isLoading && (
                    <Text type="secondary" style={{ display: 'block', marginTop: '8px', textAlign: 'center' }}>
                        <InfoCircleOutlined style={{marginRight: '6px'}} />
                        {disabledReason}
                    </Text>
                )}
                {currentStep >= 3 && (apiResponse || error) && (
                  <Button onClick={resetProcess} block style={{marginTop: 10}}>清空并开始新的处理</Button>
                )}
                {error && !isLoading && <Alert message={error} type="error" showIcon style={{ marginTop: 16 }} />}
              </Form>
            </Card>
          </Col>

          <Col xs={24} md={12}>
            <Card title="2. 处理结果" variant="outlined">
              {isLoading && currentStep === 1 && (
                <div style={{ textAlign: 'center', padding: '50px 0' }}>
                  <Spin size="large" tip={uploadedFiles.length > 1 ? `正在将 ${uploadedFiles.length} 个文件转换为文本...` : `正在将 "${uploadedFiles[0]?.name || '文件'}" 转换为文本...`} />
                  <Progress percent={30} status="active" showInfo={false} style={{marginTop: 20}}/>
                </div>
              )}
              {isLoading && currentStep === 2 && (
                 <div style={{ textAlign: 'center', padding: '50px 0' }}>
                  <Spin size="large" tip={submissionType === 'studentAnswer' ? "AI 努力批改中，请稍候..." : "正在提交标准答案..."} />
                  <Progress percent={70} status="active" showInfo={false} style={{marginTop: 20}}/>
                </div>
              )}
              {!isLoading && !apiResponse && currentStep === 0 && (
                <div style={{ textAlign: 'center', padding: '50px 0'}}>
                  <FileTextOutlined className="empty-icon" />
                  <Paragraph type="secondary">处理结果将在此处显示。</Paragraph>
                </div>
              )}
              {processedTextForGrading && currentStep > 0 && (
                <Card type="inner" title="从多模态转换的文本内容预览（部分）" style={{marginBottom: 20}}>
                  <Paragraph ellipsis={isTextExpanded ? false : { rows: 5, expandable: true, onExpand: () => setIsTextExpanded(true), symbol: '展开' }}>
                    {processedTextForGrading}
                  </Paragraph>
                  {isTextExpanded && (<Button type="link" onClick={() => setIsTextExpanded(false)} style={{ padding: 0, marginTop: '-10px' }}>收起</Button>)}
                </Card>
              )}
              {!isLoading && standardAnswerMessage && (
                <Alert message={standardAnswerMessage} type="success" showIcon />
              )}
              {!isLoading && gradingResult && (
                <div className="grading-result-display">
                  <Title level={4} style={{textAlign: 'center', marginBottom: 20}}>
                    综合评分: 
                    <Tag color={getScoreTagColor(gradingResult.score, gradingResult.totalScore)} style={{fontSize: '1.2em', padding: '5px 10px', marginLeft: '8px'}}>
                      {gradingResult.score !== undefined ? `${gradingResult.score} / ${gradingResult.totalScore || '??'}` : 'N/A'}
                    </Tag>
                  </Title>
                  <Divider orientation="left"><MessageOutlined /> 总体评语</Divider>
                  <div className="feedback-section">
                    <Paragraph>{gradingResult.overallFeedback || "暂无总体评语。"}</Paragraph>
                  </div>
                  <Divider orientation="left"><CheckCircleOutlined className="icon-success"/> 主要优点</Divider>
                  <div className="feedback-section">
                    {gradingResult.strengths?.length > 0 ? (
                      <ul>{gradingResult.strengths.map((item, index) => <li key={`s-${index}`}>{item}</li>)}</ul>
                    ) : <Paragraph>暂无优点反馈。</Paragraph>}
                  </div>
                  <Divider orientation="left"><CloseCircleOutlined className="icon-error"/> 待改进之处</Divider>
                  <div className="feedback-section">
                    {gradingResult.areasForImprovement?.length > 0 ? (
                      <ul>{gradingResult.areasForImprovement.map((item, index) => <li key={`i-${index}`}>{item}</li>)}</ul>
                    ) : <Paragraph>暂无改进建议。</Paragraph>}
                  </div>
                </div>
              )}
            </Card>
          </Col>
        </Row>
      </Content>
      <Footer style={{ textAlign: 'center' }}>
        AI 智能作业处理系统 ©{new Date().getFullYear()}
      </Footer>
      <ProfileModal open={isProfileModalOpen} onCancel={() => setIsProfileModalOpen(false)} onUpdate={handleProfileUpdate} initialData={userInfo} loading={isSaving} />
    </Layout>
  );
}