import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Typography,
  Box,
  IconButton,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
} from '@mui/material';
import { Close as CloseIcon, Add, Edit, Delete } from '@mui/icons-material';
import { useAppStore } from '../../store/useAppStore';

interface PromptManagementDialogProps {
  open: boolean;
  onClose: () => void;
}

const PromptManagementDialog: React.FC<PromptManagementDialogProps> = ({
  open,
  onClose,
}) => {
  const {
    promptTemplates,
    currentTemplateId,
    addPromptTemplate,
    updatePromptTemplate,
    deletePromptTemplate,
    setCurrentTemplate,
  } = useAppStore();

  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<{
    id?: string;
    name: string;
    content: string;
  }>({
    name: '',
    content: '',
  });

  const handleOpenEditDialog = (template?: any) => {
    if (template) {
      setEditingTemplate({
        id: template.id,
        name: template.name,
        content: template.content,
      });
    } else {
      setEditingTemplate({
        name: '',
        content: '',
      });
    }
    setEditDialogOpen(true);
  };

  const handleCloseEditDialog = () => {
    setEditDialogOpen(false);
    setEditingTemplate({ name: '', content: '' });
  };

  const handleSaveTemplate = () => {
    if (editingTemplate.name.trim() && editingTemplate.content.trim()) {
      if (editingTemplate.id) {
        // 更新现有模板
        updatePromptTemplate(editingTemplate.id, {
          name: editingTemplate.name,
          content: editingTemplate.content,
        });
      } else {
        // 创建新模板
        addPromptTemplate(editingTemplate.name, editingTemplate.content);
      }
      handleCloseEditDialog();
    }
  };

  const handleDeleteTemplate = (templateId: string) => {
    if (window.confirm('确定要删除这个提示词模板吗？')) {
      deletePromptTemplate(templateId);
    }
  };

  const handleSetAsDefault = (templateId: string) => {
    setCurrentTemplate(templateId);
  };

  return (
    <>
      <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            提示词模板管理
            <IconButton onClick={onClose}>
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>

        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            {/* 模板管理 */}
            <Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6">
                  所有模板 ({promptTemplates.length})
                </Typography>
                <Button
                  variant="contained"
                  startIcon={<Add />}
                  onClick={() => handleOpenEditDialog()}
                  size="small"
                >
                  新建模板
                </Button>
              </Box>

              <List dense sx={{ maxHeight: 400, overflow: 'auto' }}>
                {promptTemplates.map((template) => (
                  <ListItem key={template.id} divider>
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          {template.name}
                          {template.id === currentTemplateId && (
                            <Typography 
                              variant="caption" 
                              sx={{ 
                                color: 'primary.main', 
                                fontWeight: 'medium',
                                backgroundColor: 'primary.50',
                                px: 1,
                                py: 0.5,
                                borderRadius: 1,
                                fontSize: '0.75rem'
                              }}
                            >
                              当前使用
                            </Typography>
                          )}
                        </Box>
                      }
                      secondary={
                        <Box>
                          <Typography 
                            variant="body2" 
                            color="text.secondary"
                            sx={{ 
                              mt: 0.5,
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                              maxWidth: 400
                            }}
                          >
                            {template.content}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            创建时间: {new Date(template.createdAt).toLocaleString()}
                          </Typography>
                        </Box>
                      }
                    />
                    <ListItemSecondaryAction>
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        {template.id !== currentTemplateId && (
                          <Button
                            size="small"
                            variant="outlined"
                            onClick={() => handleSetAsDefault(template.id)}
                          >
                            使用
                          </Button>
                        )}
                        <IconButton
                          edge="end"
                          onClick={() => handleOpenEditDialog(template)}
                          size="small"
                        >
                          <Edit />
                        </IconButton>
                        <IconButton
                          edge="end"
                          onClick={() => handleDeleteTemplate(template.id)}
                          disabled={template.id === 'default'}
                          size="small"
                        >
                          <Delete />
                        </IconButton>
                      </Box>
                    </ListItemSecondaryAction>
                  </ListItem>
                ))}
              </List>
            </Box>
          </Box>
        </DialogContent>

        <DialogActions>
          <Button onClick={onClose} variant="contained">
            完成
          </Button>
        </DialogActions>
      </Dialog>

      {/* 编辑模板对话框 */}
      <Dialog open={editDialogOpen} onClose={handleCloseEditDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          {editingTemplate.id ? '编辑提示词模板' : '新建提示词模板'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <TextField
              autoFocus
              label="模板名称"
              fullWidth
              variant="outlined"
              value={editingTemplate.name}
              onChange={(e) => setEditingTemplate(prev => ({ ...prev, name: e.target.value }))}
              placeholder="为您的提示词模板起一个名字"
            />
            <TextField
              label="提示词内容"
              fullWidth
              multiline
              rows={8}
              variant="outlined"
              value={editingTemplate.content}
              onChange={(e) => setEditingTemplate(prev => ({ ...prev, content: e.target.value }))}
              placeholder="请输入提示词内容，例如：请用简洁的中文描述图片内容，格式为'场景_主体_动作'..."
            />
            <Typography variant="body2" color="text.secondary">
              提示：好的提示词应该明确说明您希望如何命名图片，包括格式、语言、风格等要求。
            </Typography>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseEditDialog}>取消</Button>
          <Button 
            onClick={handleSaveTemplate}
            variant="contained"
            disabled={!editingTemplate.name.trim() || !editingTemplate.content.trim()}
          >
            {editingTemplate.id ? '更新' : '创建'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default PromptManagementDialog;
