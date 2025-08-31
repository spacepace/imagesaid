import React, { useEffect, useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
  Alert,
  CircularProgress,
  IconButton,
  Typography,
  Divider,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
} from '@mui/material';
import { Refresh, Close, Star, StarBorder, RestartAlt } from '@mui/icons-material';
import { useAppStore } from '../../store/useAppStore';

interface OllamaSettingsDialogProps {
  open: boolean;
  onClose: () => void;
}

const OllamaSettingsDialog: React.FC<OllamaSettingsDialogProps> = ({
  open,
  onClose,
}) => {
  const [resetDialogOpen, setResetDialogOpen] = useState(false);
  
  const {
    config,
    updateConfig,
    testConnection,
    loadAvailableModels,
    toggleModelEnabled,
    setModelContextLength,
    setDefaultModel,
    resetAllSettings,
  } = useAppStore();

  // 在对话框打开时自动加载模型列表
  useEffect(() => {
    if (open && config.connectionState === 'success' && config.availableModels.length === 0) {
      loadAvailableModels();
    }
  }, [open, config.connectionState, config.availableModels.length, loadAvailableModels]);

  const handleApiUrlChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    updateConfig({ apiUrl: event.target.value });
  };

  const handleTestConnection = async () => {
    await testConnection();
    // 连接成功后自动加载模型列表
    if (config.connectionState === 'success') {
      loadAvailableModels();
    }
  };

  const handleRefreshModels = () => {
    loadAvailableModels();
  };

  const handleResetSettings = () => {
    setResetDialogOpen(true);
  };

  const handleConfirmReset = () => {
    resetAllSettings();
    setResetDialogOpen(false);
  };

  const handleCancelReset = () => {
    setResetDialogOpen(false);
  };

  // 获取模型的上下文窗口大小
  const getModelContextLength = (model: any) => {
    return model.customContextLength || model.details.context_length || 4096;
  };

  const getConnectionColor = () => {
    switch (config.connectionState) {
      case 'success':
        return 'success';
      case 'failed':
        return 'error';
      case 'testing':
        return 'info';
      default:
        return 'info';
    }
  };

  const getConnectionMessage = () => {
    switch (config.connectionState) {
      case 'success':
        return config.connectionMessage || '连接成功！';
      case 'failed':
        return config.connectionMessage || '连接失败，请检查API地址和Ollama服务状态';
      case 'testing':
        return '正在测试连接...';
      default:
        return '';
    }
  };

  const enabledModels = config.availableModels.filter(model => model.enabled);

  return (
    <>
      <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            Ollama设置
            <IconButton onClick={onClose}>
              <Close />
            </IconButton>
          </Box>
        </DialogTitle>

        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            {/* API地址设置 */}
            <Box>
              <Typography variant="h6" gutterBottom>
                API连接配置
              </Typography>
              <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start' }}>
                <TextField
                  label="Ollama API地址"
                  value={config.apiUrl}
                  onChange={handleApiUrlChange}
                  variant="outlined"
                  size="small"
                  sx={{ flexGrow: 1 }}
                  placeholder="http://localhost:11434"
                />
                <Button
                  variant="contained"
                  onClick={handleTestConnection}
                  disabled={config.connectionState === 'testing'}
                  startIcon={config.connectionState === 'testing' ? <CircularProgress size={16} /> : null}
                  sx={{ minWidth: 100 }}
                >
                  {config.connectionState === 'testing' ? '测试中...' : '测试连接'}
                </Button>
              </Box>

              {config.connectionState !== 'idle' && (
                <Alert severity={getConnectionColor() as any} sx={{ mt: 2 }}>
                  {getConnectionMessage()}
                </Alert>
              )}
            </Box>

            <Divider />

            {/* 模型管理 */}
            <Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6">
                  模型管理
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Typography variant="body2" color="text.secondary">
                    已启用: {enabledModels.length}/{config.availableModels.length}
                  </Typography>
                  <Button
                    variant="outlined"
                    size="small"
                    startIcon={<Refresh />}
                    onClick={handleRefreshModels}
                    disabled={config.modelsLoading || config.connectionState !== 'success'}
                    title="刷新模型列表（保持现有设置）"
                  >
                    刷新
                  </Button>
                  <Button
                    variant="outlined"
                    size="small"
                    startIcon={<RestartAlt />}
                    onClick={handleResetSettings}
                    color="warning"
                    title="重置所有设置"
                  >
                    重置
                  </Button>
                </Box>
              </Box>

              {config.modelsLoading && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                  <CircularProgress size={16} />
                  <Typography variant="body2" color="text.secondary">
                    正在加载模型列表...
                  </Typography>
                </Box>
              )}

              {config.availableModels.length > 0 ? (
                <TableContainer component={Paper} variant="outlined">
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>模型名称</TableCell>
                        <TableCell align="center">上下文窗口 (tokens)</TableCell>
                        <TableCell align="center">启用</TableCell>
                        <TableCell align="center">默认模型</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {config.availableModels.map((model) => (
                        <TableRow 
                          key={model.name}
                          sx={{ 
                            backgroundColor: model.isDefault ? 'primary.50' : 'inherit',
                            '&:hover': { backgroundColor: 'action.hover' }
                          }}
                        >
                          <TableCell>
                            <Typography variant="body2" sx={{ fontWeight: model.isDefault ? 'medium' : 'normal' }}>
                              {model.name}
                            </Typography>
                          </TableCell>
                          <TableCell align="center">
                            <TextField
                              type="number"
                              size="small"
                              value={getModelContextLength(model)}
                              onChange={(e) => {
                                const value = parseInt(e.target.value);
                                if (value > 0) {
                                  setModelContextLength(model.name, value);
                                }
                              }}
                              sx={{ width: 120 }}
                              inputProps={{ min: 1, max: 1000000 }}
                              variant="outlined"
                            />
                          </TableCell>
                          <TableCell align="center">
                            <Switch
                              checked={model.enabled || false}
                              onChange={() => toggleModelEnabled(model.name)}
                              size="small"
                            />
                          </TableCell>
                          <TableCell align="center">
                            <Button
                              variant={model.isDefault ? "contained" : "outlined"}
                              size="small"
                              startIcon={model.isDefault ? <Star /> : <StarBorder />}
                              onClick={() => setDefaultModel(model.name)}
                              disabled={!model.enabled}
                            >
                              {model.isDefault ? '当前默认' : '设为默认'}
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              ) : (
                <Alert severity="info">
                  暂无可用模型，请先测试连接或刷新模型列表
                </Alert>
              )}
            </Box>
          </Box>
        </DialogContent>

        <DialogActions>
          <Button onClick={onClose} variant="contained">
            完成
          </Button>
        </DialogActions>
      </Dialog>

      {/* 重置确认对话框 */}
      <Dialog open={resetDialogOpen} onClose={handleCancelReset} maxWidth="sm" fullWidth>
        <DialogTitle>确认重置设置</DialogTitle>
        <DialogContent>
          <Typography variant="body1" sx={{ mb: 2 }}>
            确定要重置所有设置吗？这将清除：
          </Typography>
          <Box component="ul" sx={{ pl: 2 }}>
            <Typography component="li" variant="body2" sx={{ mb: 1 }}>
              所有Ollama模型的自定义设置（启用状态、上下文窗口大小、默认模型）
            </Typography>
            <Typography component="li" variant="body2" sx={{ mb: 1 }}>
              所有保存的提示词模板
            </Typography>
            <Typography component="li" variant="body2" sx={{ mb: 1 }}>
              Ollama API地址设置
            </Typography>
          </Box>
          <Alert severity="warning" sx={{ mt: 2 }}>
            此操作不可撤销，请谨慎操作！
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCancelReset}>取消</Button>
          <Button onClick={handleConfirmReset} variant="contained" color="warning">
            确认重置
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default OllamaSettingsDialog;
