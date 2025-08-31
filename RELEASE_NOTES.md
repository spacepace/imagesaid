# ImageSaid v1.0.0 发布说明

## 🎉 首次正式发布

ImageSaid 是一个基于本地 Vision Language Models (Ollama) 的智能批量图片重命名工具。

### ✨ 主要功能

- **AI 智能重命名**: 基于本地 Vision Language Models (Ollama) 的智能图片重命名
- **多格式支持**: 支持 JPG, PNG, JPEG, WEBP, AVIF 格式
- **拖拽操作**: 支持文件拖拽和文件选择器
- **批量处理**: 一次性处理多张图片
- **智能压缩**: 根据模型上下文窗口自动压缩图片
- **提示词模板管理**: 保存和复用提示词模板
- **模型管理**: 自动检测、配置和管理 Ollama 模型
- **数据持久化**: 自动保存用户配置和模板

### 🔧 技术特性

- **跨平台支持**: Windows, macOS, Linux
- **本地处理**: 所有图片处理在本地完成，保护隐私
- **高性能**: 基于 Rust 后端，React + TypeScript 前端
- **现代化 UI**: Material-UI 设计，响应式布局
- **状态管理**: Zustand 轻量级状态管理
- **错误处理**: 完善的错误处理和用户反馈

### 📦 系统要求

- **操作系统**: Windows 10+, macOS 10.15+, Linux
- **内存**: 4GB+ RAM (推荐 8GB+)
- **存储**: 2GB+ 可用磁盘空间
- **必需软件**: Ollama

### 🚀 推荐模型

- `qwen2.5vl:3b-32k` - 推荐，中文支持好
- `llava:7b` - 通用视觉模型
- `qwen2.5vl:7b-10k` - 高质量但较大
- `gemma3:4b-40k` - 轻量级选择

### 📥 下载

#### Windows
- **MSI 安装包**: `imagesaid_0.1.0_x64_en-US.msi` (4.96 MB)
- **NSIS 安装包**: `imagesaid_0.1.0_x64-setup.exe` (3.32 MB)

#### 安装说明
1. 下载对应的安装包
2. 运行安装程序
3. 按照提示完成安装
4. 启动 ImageSaid 应用

### 🔧 使用前准备

1. **安装 Ollama**: 访问 [ollama.ai](https://ollama.ai/) 下载并安装
2. **启动 Ollama 服务**: 运行 `ollama serve`
3. **下载模型**: 运行 `ollama pull qwen2.5vl:3b-32k`

### 🎯 快速开始

1. 启动 ImageSaid 应用
2. 点击 "Ollama设置" 配置连接
3. 拖拽图片文件到应用窗口
4. 设置提示词模板
5. 点击 "生成文件名" 开始处理
6. 确认后点击 "应用重命名"

### 🐛 已知问题

- 首次启动可能需要较长时间加载模型
- 大图片处理时可能需要等待

### 📞 支持

如有问题或建议，请通过以下方式联系：
- 提交 GitHub Issue
- 发送邮件至项目维护者

---

**ImageSaid** - 让 AI 为您的图片命名 🎨✨
