# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2025-01-31

### 🎉 首次正式发布

#### ✨ 新增功能
- **AI 智能重命名**: 基于本地 Vision Language Models (Ollama) 的智能图片重命名
- **多格式支持**: 支持 JPG, PNG, JPEG, WEBP, AVIF 格式
- **拖拽操作**: 支持文件拖拽和文件选择器
- **批量处理**: 一次性处理多张图片
- **智能压缩**: 根据模型上下文窗口自动压缩图片
- **提示词模板管理**: 保存和复用提示词模板
- **模型管理**: 自动检测、配置和管理 Ollama 模型
- **数据持久化**: 自动保存用户配置和模板

#### 🔧 技术特性
- **跨平台支持**: Windows, macOS, Linux
- **本地处理**: 所有图片处理在本地完成，保护隐私
- **高性能**: 基于 Rust 后端，React + TypeScript 前端
- **现代化 UI**: Material-UI 设计，响应式布局
- **状态管理**: Zustand 轻量级状态管理
- **错误处理**: 完善的错误处理和用户反馈

#### 🎨 用户界面
- **导航栏**: 顶部导航栏，包含 Ollama 设置和提示词管理
- **图片列表**: 表格形式显示图片，支持缩略图预览
- **处理状态**: 实时显示处理进度和用时
- **设置对话框**: 独立的 Ollama 设置和提示词管理对话框
- **进度反馈**: 进度条和状态信息显示

#### 🛠️ 核心功能
- **Ollama 集成**: 支持本地 Ollama 服务
- **模型配置**: 自定义上下文窗口大小，启用/禁用模型
- **图片压缩**: 智能压缩算法，适应模型能力
- **文件重命名**: 安全的批量文件重命名操作
- **设置持久化**: 使用 localStorage 保存用户设置

#### 📦 系统要求
- **操作系统**: Windows 10+, macOS 10.15+, Linux
- **内存**: 4GB+ RAM (推荐 8GB+)
- **存储**: 2GB+ 可用磁盘空间
- **必需软件**: Ollama, Node.js 18+, Rust

#### 🚀 推荐模型
- `qwen2.5vl:3b-32k` - 推荐，中文支持好
- `llava:7b` - 通用视觉模型
- `qwen2.5vl:7b-10k` - 高质量但较大
- `gemma3:4b-40k` - 轻量级选择

---

## [0.1.0] - 开发版本

### 🚧 开发阶段
- 初始项目搭建
- 基础功能实现
- UI 界面设计
- 功能测试和优化
