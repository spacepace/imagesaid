import React, { useState } from 'react';
import {
  Box,
  TextField,
  Button,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import { PlayArrow, Edit, Add } from '@mui/icons-material';
import { useAppStore } from '../store/useAppStore';

const PromptEditor: React.FC = () => {
  const {
    prompt,
    setPrompt,
    startProcessing,
    processingStatus,
    images,
    promptTemplates,
    currentTemplateId,
    addPromptTemplate,
    updatePromptTemplate,
    setCurrentTemplate,
  } = useAppStore();

  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [newTemplateName, setNewTemplateName] = useState('');

  const handlePromptChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    setPrompt(event.target.value);
  };

  const handleStartProcessing = async () => {
    await startProcessing();
  };

  const handleTemplateChange = (event: any) => {
    const templateId = event.target.value;
    setCurrentTemplate(templateId);
  };

  const handleSaveToCurrentTemplate = () => {
    if (currentTemplateId && prompt.trim()) {
      updatePromptTemplate(currentTemplateId, { content: prompt });
    }
  };

  const handleSaveAsNewTemplate = () => {
    setNewTemplateName('');
    setSaveDialogOpen(true);
  };

  const handleSaveNewTemplate = () => {
    if (newTemplateName.trim() && prompt.trim()) {
      addPromptTemplate(newTemplateName.trim(), prompt);
      setSaveDialogOpen(false);
      setNewTemplateName('');
    }
  };

  const handleCloseSaveDialog = () => {
    setSaveDialogOpen(false);
    setNewTemplateName('');
  };

  const pendingImages = images.filter(img => img.status === 'pending');
  const canProcess = pendingImages.length > 0 && processingStatus !== 'processing';

  return (
    <>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {/* 模板选择区域 */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <FormControl size="small" sx={{ minWidth: 200 }}>
            <InputLabel>选择提示词模板</InputLabel>
            <Select
              value={currentTemplateId || ''}
              onChange={handleTemplateChange}
              label="选择提示词模板"
            >
              {promptTemplates.map((template) => (
                <MenuItem key={template.id} value={template.id}>
                  {template.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          
          <Button
            variant="outlined"
            size="small"
            startIcon={<Edit />}
            onClick={handleSaveToCurrentTemplate}
            disabled={!prompt.trim() || !currentTemplateId}
            title="覆盖当前选中的模板内容"
          >
            保存到当前模板
          </Button>
          
          <Button
            variant="outlined"
            size="small"
            startIcon={<Add />}
            onClick={handleSaveAsNewTemplate}
            disabled={!prompt.trim()}
            title="创建新的提示词模板"
          >
            保存为新模板
          </Button>
        </Box>

        {/* 提示词编辑和操作区域 */}
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-end' }}>
          <TextField
            multiline
            rows={3}
            value={prompt}
            onChange={handlePromptChange}
            variant="outlined"
            placeholder="请输入您的提示词，描述您希望如何为图片命名..."
            sx={{ flex: 1 }}
          />
          
          <Button
            variant="contained"
            size="large"
            startIcon={<PlayArrow />}
            onClick={handleStartProcessing}
            disabled={!canProcess}
            sx={{ minWidth: 120, height: 56 }}
          >
            {processingStatus === 'processing' ? '生成中...' : '生成文件名'}
          </Button>
        </Box>
        
        {/* 状态提示 */}
        {!canProcess && images.length === 0 && (
          <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center' }}>
            请先拖拽图片文件到上方区域
          </Typography>
        )}
        
        {!canProcess && images.length > 0 && pendingImages.length === 0 && (
          <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center' }}>
            所有图片已处理完成
          </Typography>
        )}
        
        {images.length > 0 && images.some(img => img.path.startsWith('dev-') || img.path.startsWith('browser-')) && (
          <Typography variant="body2" color="warning.main" sx={{ textAlign: 'center' }}>
            ⚠️ 请使用文件拖拽功能而不是"选择文件"按钮，以获得完整的AI命名功能
          </Typography>
        )}
      </Box>

      {/* 保存模板对话框 */}
      <Dialog open={saveDialogOpen} onClose={handleCloseSaveDialog} maxWidth="sm" fullWidth>
        <DialogTitle>保存为提示词模板</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="模板名称"
            fullWidth
            variant="outlined"
            value={newTemplateName}
            onChange={(e) => setNewTemplateName(e.target.value)}
            placeholder="为您的提示词模板起一个名字"
            sx={{ mt: 1 }}
          />
          <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
            当前提示词内容：
          </Typography>
          <Box sx={{ 
            p: 2, 
            bgcolor: 'grey.50', 
            borderRadius: 1, 
            mt: 1,
            maxHeight: 150,
            overflow: 'auto'
          }}>
            <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
              {prompt}
            </Typography>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseSaveDialog}>取消</Button>
                             <Button 
                     onClick={handleSaveNewTemplate}
                     variant="contained"
                     disabled={!newTemplateName.trim()}
                   >
                     保存
                   </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default PromptEditor;
