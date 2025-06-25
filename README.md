# AI 智能作业处理系统 (JavaScript-Course-Project)

![Node.js](https://img.shields.io/badge/Node.js-18%2B-green?logo=node.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue?logo=typescript)
![Express](https://img.shields.io/badge/Express-4.x-black?logo=express)
![React](https://img.shields.io/badge/React-19.x-blue?logo=react)
![Ant Design](https://img.shields.io/badge/Ant%20Design-5.x-blue?logo=ant-design)
![License](https://img.shields.io/badge/License-MIT-green)

本项目是一个功能完善的全栈Web应用，旨在提供一个智能、高效的作业批改与处理平台。系统前端采用 React 构建，后端服务使用 TypeScript 和 Express 框架，实现了用户管理、多模态文件处理、AI 自动评分与反馈等一系列现代化功能。

## 🚀 快速开始

```bash
# 1. 克隆仓库
git clone https://github.com/zjzj1206/AI-Grading-System.git
cd AI-Grading-System

# 2. 根据您的操作系统运行启动脚本
# Windows:
.\start-en.ps1

# macOS/Linux:
chmod +x start.sh && ./start.sh

# 3. 访问应用
# 前端: http://localhost:5173
```

> **注意**: 首次运行前请确保已安装 [Node.js 18+](https://nodejs.org/) 和 [Tesseract OCR](https://github.com/UB-Mannheim/tesseract/wiki)（用于图片文字识别）

##  核心功能

- **用户认证系统**:
  - [x] 用户注册与登录
  - [x] 基于 JWT (JSON Web Token) 的会话管理
- **个性化用户中心**:
  - [x] **修改昵称**: 用户可以随时更新自己的显示昵称。
  - [x] **修改头像**: 支持图片上传和更换个人头像。
  - [x] **API Key 管理**: 用户可以在前端安全地输入并管理自己的第三方服务 API Key。
  - [x] **数据关联**: 所有作业处理记录、个人资料和 API Key 都与特定用户账户关联。
- **智能作业处理**:
  - [x] **多模态内容提交**: 支持直接粘贴文本、上传图片、音频、视频及各类文档（`.txt`, `.pdf`, `.docx`等）。
  - [x] **内容自动转换**: 后端服务能将上传的非文本文件内容（如图片、音频）智能转换为文本。
  - [x] **图片文字识别**: 集成 Tesseract OCR 引擎，支持中英文图片文字识别，当OCR失败时自动切换到AI视觉分析。
  - [x] **AI 自动批改**: 用户提交学生作业后，系统会调用大语言模型，根据预设的标准答案进行智能评分，并给出详细评语、优点和改进建议。
- **现代化用户体验**:
  - [x] **主题切换**: 支持亮色、暗色、护眼三种主题模式，并能记住用户的选择。
  - [x] **响应式设计**: 界面在桌面和移动设备上均有良好表现。
  - [x] **实时反馈**: 通过消息提示、加载状态、进度条等方式，为用户提供清晰的操作反馈。

##  技术栈

- **前端 (Frontend)**:
  - **框架**: React 19
  - **构建工具**: Vite
  - **UI 组件库**: Ant Design 5.x
  - **路由**: React Router 7.x
  - **状态管理**: React Context
- **后端 (Backend - `grading`)**:
  - **运行时**: Node.js 18+
  - **语言**: TypeScript 5.x
  - **框架**: Express 4.x
  - **数据库**: SQLite (TypeORM)
  - **用户认证**: bcryptjs (密码哈希), jsonwebtoken (Token生成与验证)
  - **中间件**: CORS, Helmet, Compression, Rate Limiting
- **后端 (Backend - `conversion`)**:
  - **运行时**: Node.js 18+
  - **语言**: TypeScript 5.x
  - **框架**: Express 4.x
  - **OCR引擎**: Tesseract OCR (node-tesseract-ocr)
  - **图像处理**: Sharp
  - **文档处理**: PDF-parse, Mammoth (DOCX), 等
  - **功能**: 独立的文档转换服务，支持多模态文件转文本

##  项目结构

```
AI-Grading-System/
├── conversion/             # 负责多模态文件转文本的TypeScript服务
├── grading/               # 核心后端服务（用户、评分、API等）- TypeScript
├── frontend/              # 所有前端React代码
├── logs/                  # 系统日志目录
├── start-en.ps1          # Windows PowerShell启动脚本
├── start.sh              # macOS/Linux Bash启动脚本
├── stop.sh               # macOS/Linux 停止脚本
└── README.md             # 你正在阅读的文件
```

##  安装与运行

### 1. 克隆仓库

首先克隆项目到本地：

```bash
git clone https://github.com/zjzj1206/AI-Grading-System.git
cd AI-Grading-System
```

### 2. 环境依赖

在开始之前，请确保您的系统已安装以下软件：

1. **Node.js 18+** 和 **npm**
2. **Tesseract OCR** (用于图片文字识别)

#### 安装 Tesseract OCR

**Windows 系统:**

1. 下载 Tesseract 安装程序：
   - 访问 [GitHub Tesseract Release 页面](https://github.com/UB-Mannheim/tesseract/releases/)
   - 下载适合您系统的安装程序（推荐：`tesseract-ocr-w64-setup-v5.3.0.20221214.exe`）

2. 安装 Tesseract：
   - 运行下载的安装程序
   - 安装时**务必勾选"Additional language data"**
   - 或手动选择 `Chinese - Simplified` 和 `Chinese - Traditional` 语言包

3. 配置环境变量：
   - 将 Tesseract 安装目录添加到系统 PATH 环境变量中
   - 默认安装路径：`C:\Program Files\Tesseract-OCR`

4. 验证安装：
   ```powershell
   tesseract --version
   tesseract --list-langs
   ```
   应该能看到 `chi_sim`（简体中文）和 `eng`（英文）在语言列表中

**macOS 系统:**

1. 使用 Homebrew 安装：
   ```bash
   # 安装 Tesseract
   brew install tesseract
   
   # 安装中文语言包
   brew install tesseract-lang
   ```

2. 验证安装：
   ```bash
   tesseract --version
   tesseract --list-langs
   ```
   确认输出中包含 `chi_sim` 和 `eng`

**Ubuntu/Debian 系统:**

```bash
# 安装 Tesseract 和中文语言包
sudo apt update
sudo apt install tesseract-ocr tesseract-ocr-chi-sim tesseract-ocr-chi-tra

# 验证安装
tesseract --version
tesseract --list-langs
```

**注意事项:**
- 如果 `tesseract --list-langs` 中没有显示 `chi_sim`，说明中文语言包未正确安装
- Windows 用户如果遇到环境变量问题，可能需要重启系统或命令行工具
- 确保 Tesseract 版本为 4.0+ 以获得最佳识别效果

### 3. 启动系统

#### 方式一：使用自动启动脚本 (推荐)

根据您的操作系统选择对应的启动脚本：

**Windows 系统:**
```powershell
# 使用 PowerShell 运行
.\start-en.ps1
```

**macOS/Linux 系统:**
```bash
# 添加执行权限
chmod +x start.sh

# 运行启动脚本
./start.sh
```

启动脚本会自动：
- 检查系统环境和依赖
- 安装所有必要的 npm 依赖
- 构建 TypeScript 项目
- 启动所有服务（后端 grading、conversion 和前端）
- 检查服务健康状态
- 在 macOS 上自动打开浏览器

#### 停止服务

**Windows 系统:**
- 可以直接关闭 PowerShell 启动的命令行窗口

**macOS/Linux 系统:**
```bash
# 停止所有服务
./stop.sh
```

停止脚本会：
- 关闭所有相关进程
- 清理 PID 文件
- 可选择清理日志文件

#### 方式二：手动启动各个服务

如果您更喜欢手动控制每个服务，可以分别启动后端服务和前端开发服务器：

#### 启动后端服务 (`grading`)

> 确保你的系统中已安装 Node.js 18+ 和 npm。

```bash
# 进入后端服务目录
cd grading

# 安装依赖
npm install

# 在 grading 目录下创建 .env 文件
# 并填入以下内容（请替换为你自己的密钥）
```

**`.env` 文件内容:**
```env
# 服务端口
PORT=3000

# 用于生成和验证 JWT 的密钥，请修改为一个复杂的随机字符串
JWT_SECRET_KEY=a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6

# 用户需要在前端自行输入，这里可以留空，或作为备用
QWEN_API_KEY=
SILICONFLOW_API_KEY=

# 数据库配置
DB_TYPE=sqlite
DB_NAME=database.db
```

```bash
# 编译TypeScript
npm run build

# 运行后端服务
npm start

# 或者开发模式（自动重启）
npm run dev
```

#### 启动转换服务 (`conversion`)

在新开一个终端窗口中执行以下操作：

```bash
# 进入转换服务目录
cd conversion

# 安装依赖
npm install

# 在 conversion 目录下创建 .env 文件（可选）
# 如果不创建，服务将使用默认端口 5001
```

**conversion 服务 `.env` 文件内容（可选）:**
```env
# 转换服务端口（默认：5001）
PORT=5001

# 日志级别（默认：info）
LOG_LEVEL=info

# Node 环境（默认：development）
NODE_ENV=development
```

```bash
# 编译TypeScript
npm run build

# 运行转换服务
npm start

# 或者开发模式（自动重启）
npm run dev
```

#### 启动前端应用 (`frontend`)

在新开一个终端窗口中执行以下操作：

```bash
# 进入前端目录
cd frontend

# 安装依赖
npm install

# 启动开发服务器
npm run dev
```

### 4. 访问项目

服务启动后，您可以通过以下地址访问：

- **前端界面**: http://localhost:5173
- **后端 grading 服务**: http://localhost:3000
- **后端 conversion 服务**: http://localhost:5001

在浏览器中打开前端地址，即可看到项目界面并开始使用。



---

##  开发说明

### 配置

项目使用JavaScript和TypeScript进行开发，两个后端服务都配置了：
- **编译**: `npm run build` 
- **开发模式**: `npm run dev` 
- **代码检查**: `npm run lint` 
- **代码格式化**: `npm run format` 

### 数据库

grading服务使用TypeORM管理SQLite数据库，实体定义在 `src/entities/` 目录下。

---

##  API 接口说明 (简要)

后端 `grading` 服务提供了以下主要接口：

- `POST /api/auth/register`: 用户注册
- `POST /api/auth/login`: 用户登录
- `GET /api/user/profile`: 获取当前用户信息
- `PUT /api/user/profile`: 更新用户信息（昵称、API Keys）
- `POST /api/user/avatar`: 上传头像
- `POST /api/grading/standard-answer`: 提交标准答案
- `POST /api/grading/grade-homework`: 提交学生作业进行批改
- `GET /api/grading/models`: 获取可用的AI模型列表

后端 `conversion` 服务提供文档转换接口：

- `POST /api/convert-to-text`: 统一文件转文本接口
  - 支持图片格式：`.png`, `.jpg`, `.jpeg`, `.gif`, `.bmp`, `.tiff`
  - 支持文档格式：`.pdf`, `.docx`, `.pptx`
  - 支持文本格式：`.txt`, `.py`, `.java`, `.c`, `.cpp`, `.js`, `.ts`, `.html`, `.css`, `.json`, `.xml`, `.md`, `.log`
  - 图片处理：先尝试 Tesseract OCR，失败时自动切换到 AI 视觉分析
  - 需要提供有效的 API Key 用于 AI 服务调用

##  故障排除

### 启动脚本相关问题

**问题：macOS/Linux 上提示 "Permission denied" 错误**

解决方案：
```bash
# 为脚本添加执行权限
chmod +x start.sh stop.sh

# 然后重新运行
./start.sh
```

**问题：Windows PowerShell 提示执行策略错误**

解决方案：
```powershell
# 临时允许脚本执行
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser

# 然后运行脚本
.\start-en.ps1
```

**问题：服务启动后无法停止（macOS/Linux）**

解决方案：
```bash
# 使用停止脚本
./stop.sh

# 或者手动查找并结束进程
ps aux | grep node
kill -9 <PID>

# 或者按端口查找进程
lsof -i :3000
lsof -i :5001
lsof -i :5173
```

### Tesseract OCR 相关问题

**问题：图片上传后提示 "OCR失败" 或无法识别中文**

解决方案：
1. 确认 Tesseract 已正确安装：
   ```bash
   tesseract --version
   ```

2. 检查中文语言包：
   ```bash
   tesseract --list-langs
   ```
   确保输出中包含 `chi_sim` 和 `eng`

3. Windows 用户检查环境变量：
   - 确保 Tesseract 安装目录已添加到 PATH
   - 重启命令行工具或系统

4. 如果问题持续存在，系统会自动切换到 AI 视觉分析模式

### 端口占用问题

**问题：启动时提示端口被占用**

解决方案：
1. 检查端口占用情况：
   ```bash
   # Windows
   netstat -an | findstr :3000
   netstat -an | findstr :5001
   netstat -an | findstr :5173
   
   # macOS/Linux
   lsof -i :3000
   lsof -i :5001
   lsof -i :5173
   ```

2. 结束占用端口的进程或修改配置文件中的端口设置

### 依赖安装问题

**问题：npm install 失败**

解决方案：
1. 清理 npm 缓存：
   ```bash
   npm cache clean --force
   ```

2. 删除 node_modules 并重新安装：
   ```bash
   rm -rf node_modules package-lock.json
   npm install
   ```

3. 使用国内镜像源：
   ```bash
   npm config set registry https://registry.npmmirror.com
   ```

**问题：上传的临时文件没有被清理**

这通常是由于：
- 文件被其他进程锁定（如杀毒软件扫描）
- 磁盘权限问题
- OCR 处理过程中的异常

系统已经实现了自动清理机制，如果发现 `uploads` 目录中有残留文件，可以手动删除。

##  贡献指南

欢迎对本项目进行贡献！你可以通过以下方式参与：
1.  提出 Issue 来报告 Bug 或建议新功能。
2.  Fork 本仓库，创建你自己的分支，然后提交 Pull Request。

##  许可证

本项目采用 [MIT License](LICENSE) 开源许可证。
