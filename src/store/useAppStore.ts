import { create } from 'zustand';
import { invoke } from '@tauri-apps/api/core';
import { v4 as uuidv4 } from 'uuid';

// ============================================================================
// 类型定义
// ============================================================================

/**
 * 单张图片的数据结构
 */
export interface ImageFile {
  id: string; // 使用UUID作为唯一标识
  path: string; // 文件的绝对路径
  originalName: string; // 原始文件名
  newName: string; // AI生成的新文件名
  status: 'pending' | 'processing' | 'completed' | 'error'; // 处理状态
  error?: string; // 错误信息（如果有）
  processingTime?: number; // 处理用时（毫秒）
}

/**
 * 提示词模板结构
 */
export interface PromptTemplate {
  id: string; // 模板唯一标识
  name: string; // 模板名称
  content: string; // 模板内容
  createdAt: string; // 创建时间（ISO格式）
}

/**
 * Ollama模型信息
 */
export interface OllamaModel {
  name: string; // 模型名称
  size: number; // 模型大小（字节）
  digest: string; // 模型摘要
  details: {
    format: string; // 模型格式
    family: string; // 模型系列
    parameter_size: string; // 参数大小
    quantization_level: string; // 量化级别
    context_length?: number; // 上下文窗口大小
  };
  enabled?: boolean; // 是否启用
  customContextLength?: number; // 自定义上下文窗口大小
  isDefault?: boolean; // 是否为默认模型
}

/**
 * 应用配置
 */
interface AppConfig {
  apiUrl: string; // Ollama API地址
  model: string; // 当前使用的模型
  connectionState: 'idle' | 'testing' | 'success' | 'failed'; // 连接状态
  connectionMessage?: string; // 连接消息
  availableModels: OllamaModel[]; // 可用模型列表
  modelsLoading: boolean; // 是否正在加载模型
}

/**
 * 全局应用状态
 */
export interface AppState {
  // 数据状态
  images: ImageFile[]; // 图片列表
  config: AppConfig; // 应用配置
  prompt: string; // 当前提示词
  promptTemplates: PromptTemplate[]; // 提示词模板列表
  currentTemplateId: string | null; // 当前选中的模板ID
  processingStatus: 'idle' | 'processing' | 'done'; // 处理状态
  totalProcessingTime: number; // 总处理时间（毫秒）

  // 图片管理操作
  addImages: (files: { path: string; name: string }[]) => void;
  updateImage: (id: string, updates: Partial<ImageFile>) => void;
  removeImage: (id: string) => void;
  clearImages: () => void;

  // 提示词管理操作
  setPrompt: (prompt: string) => void;
  addPromptTemplate: (name: string, content: string) => void;
  updatePromptTemplate: (id: string, updates: Partial<PromptTemplate>) => void;
  deletePromptTemplate: (id: string) => void;
  setCurrentTemplate: (templateId: string | null) => void;

  // 配置管理操作
  updateConfig: (config: Partial<AppConfig>) => void;
  testConnection: () => Promise<void>;

  // 模型管理操作
  loadAvailableModels: () => Promise<void>;
  toggleModelEnabled: (modelName: string) => void;
  setModelContextLength: (modelName: string, contextLength: number) => void;
  setDefaultModel: (modelName: string) => void;

  // 处理操作
  startProcessing: () => Promise<void>;
  applyRenames: () => Promise<void>;

  // 设置管理操作
  resetAllSettings: () => void;
  saveSettings: () => void;
  loadSettings: () => void;
}

// ============================================================================
// 默认配置
// ============================================================================

const DEFAULT_CONFIG: AppConfig = {
  apiUrl: 'http://localhost:11434',
  model: 'qwen2.5vl:3b-32k',
  connectionState: 'idle',
  availableModels: [],
  modelsLoading: false,
};

const DEFAULT_PROMPT = '请用简洁的中文描述图片内容，格式为"场景_主体_动作"，例如："草地_金毛犬_接飞盘"。';

const DEFAULT_TEMPLATE: PromptTemplate = {
  id: 'default',
  name: '默认模板',
  content: DEFAULT_PROMPT,
  createdAt: new Date().toISOString(),
};

// ============================================================================
// 工具函数
// ============================================================================

/**
 * 自动保存设置的延迟函数
 */
const autoSave = (saveFunction: () => void) => {
  setTimeout(saveFunction, 100);
};

/**
 * 格式化时间显示
 */
const formatTime = (milliseconds: number): string => {
  if (milliseconds < 1000) {
    return `${milliseconds}ms`;
  } else if (milliseconds < 60000) {
    return `${(milliseconds / 1000).toFixed(1)}s`;
  } else {
    const minutes = Math.floor(milliseconds / 60000);
    const seconds = ((milliseconds % 60000) / 1000).toFixed(1);
    return `${minutes}m ${seconds}s`;
  }
};

// ============================================================================
// Zustand Store
// ============================================================================

export const useAppStore = create<AppState>((set, get) => ({
  // ========================================================================
  // 初始状态
  // ========================================================================
  images: [],
  config: DEFAULT_CONFIG,
  prompt: DEFAULT_PROMPT,
  promptTemplates: [DEFAULT_TEMPLATE],
  currentTemplateId: 'default',
  processingStatus: 'idle',
  totalProcessingTime: 0,

  // ========================================================================
  // 图片管理操作
  // ========================================================================

  /**
   * 添加图片到列表
   */
  addImages: (files) => {
    const newImages: ImageFile[] = files.map(file => ({
      id: uuidv4(),
      path: file.path,
      originalName: file.name,
      newName: '',
      status: 'pending' as const,
    }));
    
    set(state => ({
      images: [...state.images, ...newImages]
    }));
  },

  /**
   * 更新图片信息
   */
  updateImage: (id, updates) => {
    set(state => ({
      images: state.images.map(img => 
        img.id === id ? { ...img, ...updates } : img
      )
    }));
  },

  /**
   * 移除图片
   */
  removeImage: (id) => {
    set(state => ({
      images: state.images.filter(img => img.id !== id)
    }));
  },

  /**
   * 清空图片列表
   */
  clearImages: () => {
    set({ images: [], totalProcessingTime: 0 });
  },

  // ========================================================================
  // 提示词管理操作
  // ========================================================================

  /**
   * 设置当前提示词
   */
  setPrompt: (prompt) => {
    set({ prompt });
    autoSave(() => get().saveSettings());
  },

  /**
   * 添加提示词模板
   */
  addPromptTemplate: (name, content) => {
    const newTemplate: PromptTemplate = {
      id: uuidv4(),
      name,
      content,
      createdAt: new Date().toISOString(),
    };
    
    set(state => ({
      promptTemplates: [...state.promptTemplates, newTemplate]
    }));
    autoSave(() => get().saveSettings());
  },

  /**
   * 更新提示词模板
   */
  updatePromptTemplate: (id, updates) => {
    set(state => ({
      promptTemplates: state.promptTemplates.map(template => 
        template.id === id ? { ...template, ...updates } : template
      )
    }));
    autoSave(() => get().saveSettings());
  },

  /**
   * 删除提示词模板
   */
  deletePromptTemplate: (id) => {
    set(state => {
      const newTemplates = state.promptTemplates.filter(t => t.id !== id);
      const newCurrentId = state.currentTemplateId === id 
        ? (newTemplates.length > 0 ? newTemplates[0].id : null)
        : state.currentTemplateId;
      
      return {
        promptTemplates: newTemplates,
        currentTemplateId: newCurrentId,
        prompt: newCurrentId ? newTemplates.find(t => t.id === newCurrentId)?.content || '' : ''
      };
    });
    autoSave(() => get().saveSettings());
  },

  /**
   * 设置当前模板
   */
  setCurrentTemplate: (templateId) => {
    const { promptTemplates } = get();
    const template = templateId ? promptTemplates.find(t => t.id === templateId) : null;
    
    set({
      currentTemplateId: templateId,
      prompt: template ? template.content : ''
    });
    autoSave(() => get().saveSettings());
  },

  // ========================================================================
  // 配置管理操作
  // ========================================================================

  /**
   * 更新配置
   */
  updateConfig: (config) => {
    set(state => ({
      config: { ...state.config, ...config }
    }));
    autoSave(() => get().saveSettings());
  },

  /**
   * 测试Ollama连接
   */
  testConnection: async () => {
    const { config, updateConfig } = get();
    
    updateConfig({ connectionState: 'testing' });
    
    try {
      const result = await invoke<string>('test_connection', {
        apiUrl: config.apiUrl
      });
      
      updateConfig({ 
        connectionState: 'success',
        connectionMessage: result
      });
    } catch (error) {
      updateConfig({ 
        connectionState: 'failed',
        connectionMessage: error as string
      });
    }
  },

  // ========================================================================
  // 模型管理操作
  // ========================================================================

  /**
   * 加载可用模型列表
   */
  loadAvailableModels: async () => {
    const { config, updateConfig } = get();
    
    updateConfig({ modelsLoading: true });
    
    try {
      const models = await invoke<OllamaModel[]>('get_ollama_models', {
        apiUrl: config.apiUrl
      });
      
      // 获取现有模型设置
      const existingModels = config.availableModels;
      
      // 合并新模型和现有设置
      const modelsWithDefaults = models.map(model => {
        const existingModel = existingModels.find(em => em.name === model.name);
        return {
          ...model,
          enabled: existingModel?.enabled ?? true, // 保持现有设置或默认启用
          customContextLength: existingModel?.customContextLength ?? model.details.context_length ?? 4096,
          isDefault: existingModel?.isDefault ?? model.name === config.model
        };
      });
      
      updateConfig({ 
        availableModels: modelsWithDefaults,
        modelsLoading: false
      });
    } catch (error) {
      console.error('Failed to load models:', error);
      updateConfig({ 
        availableModels: [],
        modelsLoading: false
      });
    }
  },

  /**
   * 切换模型启用状态
   */
  toggleModelEnabled: (modelName: string) => {
    set(state => ({
      config: {
        ...state.config,
        availableModels: state.config.availableModels.map(model =>
          model.name === modelName 
            ? { ...model, enabled: !model.enabled }
            : model
        )
      }
    }));
    autoSave(() => get().saveSettings());
  },

  /**
   * 设置模型上下文窗口大小
   */
  setModelContextLength: (modelName: string, contextLength: number) => {
    set(state => ({
      config: {
        ...state.config,
        availableModels: state.config.availableModels.map(model =>
          model.name === modelName 
            ? { ...model, customContextLength: contextLength }
            : model
        )
      }
    }));
    autoSave(() => get().saveSettings());
  },

  /**
   * 设置默认模型
   */
  setDefaultModel: (modelName: string) => {
    set(state => ({
      config: {
        ...state.config,
        model: modelName,
        availableModels: state.config.availableModels.map(model =>
          ({ ...model, isDefault: model.name === modelName })
        )
      }
    }));
    autoSave(() => get().saveSettings());
  },

  // ========================================================================
  // 处理操作
  // ========================================================================

  /**
   * 开始处理图片
   */
  startProcessing: async () => {
    const { images, config, prompt, updateImage } = get();
    
    set({ processingStatus: 'processing', totalProcessingTime: 0 });
    
    const pendingImages = images.filter(img => img.status === 'pending');
    
    // 获取当前默认模型的上下文长度
    const defaultModel = config.availableModels.find(m => m.isDefault);
    const contextLength = defaultModel?.customContextLength || 4096;
    
    let totalTime = 0;
    
    for (const image of pendingImages) {
      updateImage(image.id, { status: 'processing' });
      
      try {
        const result = await invoke<{
          new_name: string;
          processing_time: number;
        }>('generate_single_name', {
          imagePath: image.path,
          prompt,
          apiUrl: config.apiUrl,
          model: config.model,
          contextLength: contextLength
        });
        
        totalTime += result.processing_time;
        
        updateImage(image.id, { 
          status: 'completed',
          newName: result.new_name.trim(),
          processingTime: result.processing_time
        });
      } catch (error) {
        updateImage(image.id, { 
          status: 'error',
          error: error as string
        });
      }
    }
    
    set({ 
      processingStatus: 'done',
      totalProcessingTime: totalTime
    });
  },

  /**
   * 应用重命名操作
   */
  applyRenames: async () => {
    const { images } = get();
    
    const completedImages = images.filter(img => 
      img.status === 'completed' && img.newName.trim() !== ''
    );
    
    const renames = completedImages.map(img => ({
      old_path: img.path,
      new_name: img.newName
    }));
    
    try {
      await invoke('apply_renames', { renames });
      
      // 重命名成功后清空图片列表
      set({ images: [], processingStatus: 'idle', totalProcessingTime: 0 });
      
      return Promise.resolve();
    } catch (error) {
      return Promise.reject(error);
    }
  },

  // ========================================================================
  // 设置管理操作
  // ========================================================================

  /**
   * 重置所有设置
   */
  resetAllSettings: () => {
    set({
      config: DEFAULT_CONFIG,
      prompt: DEFAULT_PROMPT,
      promptTemplates: [DEFAULT_TEMPLATE],
      currentTemplateId: 'default',
      processingStatus: 'idle',
      totalProcessingTime: 0,
    });
  },

  /**
   * 保存设置到本地存储
   */
  saveSettings: async () => {
    try {
      const state = get();
      const settings = {
        config: state.config,
        prompt: state.prompt,
        promptTemplates: state.promptTemplates,
        currentTemplateId: state.currentTemplateId,
      };
      
      // 使用localStorage作为存储方案
      localStorage.setItem('imagesaid-settings', JSON.stringify(settings));
    } catch (error) {
      console.error('Failed to save settings:', error);
    }
  },

  /**
   * 从本地存储加载设置
   */
  loadSettings: async () => {
    try {
      const savedSettings = localStorage.getItem('imagesaid-settings');
      if (savedSettings) {
        const settings = JSON.parse(savedSettings);
        set({
          config: { ...get().config, ...settings.config },
          prompt: settings.prompt || get().prompt,
          promptTemplates: settings.promptTemplates || get().promptTemplates,
          currentTemplateId: settings.currentTemplateId || get().currentTemplateId,
        });
      }
    } catch (error) {
      console.error('Failed to load settings:', error);
    }
  },
}));

// 导出格式化时间函数供组件使用
export { formatTime };
