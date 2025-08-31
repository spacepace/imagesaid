import React from 'react';
import {
  Box,
  Typography,
  LinearProgress,
  Button,
  Alert,
} from '@mui/material';
import { useAppStore, formatTime } from '../store/useAppStore';

const StatusBar: React.FC = () => {
  const { images, processingStatus, applyRenames } = useAppStore();

  const completedImages = images.filter(img => img.status === 'completed');
  const errorImages = images.filter(img => img.status === 'error');
  const totalImages = images.length;
  const progress = totalImages > 0 ? (completedImages.length / totalImages) * 100 : 0;

  const handleApplyRenames = async () => {
    try {
      await applyRenames();
      // 成功提示会在应用重命名后显示
    } catch (error) {
      console.error('重命名失败:', error);
    }
  };

  const getStatusMessage = () => {
    if (processingStatus === 'processing') {
      return '正在处理图片...';
    } else if (processingStatus === 'done') {
      if (errorImages.length > 0) {
        return `处理完成，但有 ${errorImages.length} 张图片处理失败`;
      } else {
        return '所有图片已处理完成';
      }
    } else {
      if (totalImages === 0) {
        return '请先拖拽图片文件到上方区域';
      } else {
        return '准备就绪，点击"生成文件名"开始处理';
      }
    }
  };

  const getProgressText = () => {
    if (totalImages === 0) return '';
    return `总计:${totalImages} 已完成:${completedImages.length} ${Math.round(progress)}%`;
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      {/* 状态消息 */}
      <Typography variant="body2" color="text.secondary">
        {getStatusMessage()}
      </Typography>

      {/* 进度条和统计信息 */}
      {totalImages > 0 && (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <LinearProgress
            variant="determinate"
            value={progress}
            sx={{ flex: 1, height: 8, borderRadius: 4 }}
          />
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, minWidth: 'fit-content' }}>
            <Typography variant="body2" color="text.secondary">
              {getProgressText()}
            </Typography>
            {processingStatus === 'done' && useAppStore.getState().totalProcessingTime > 0 && (
              <Typography variant="body2" color="text.secondary">
                总用时: {formatTime(useAppStore.getState().totalProcessingTime)}
              </Typography>
            )}
          </Box>
        </Box>
      )}

      {/* 错误提示 */}
      {errorImages.length > 0 && (
        <Alert severity="warning" sx={{ mt: 1 }}>
          有 {errorImages.length} 张图片处理失败，请检查网络连接或模型设置
        </Alert>
      )}

      {/* 应用重命名按钮 */}
      {completedImages.length > 0 && processingStatus === 'done' && (
        <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
          <Button
            variant="contained"
            color="primary"
            size="large"
            onClick={handleApplyRenames}
            disabled={completedImages.length === 0}
            sx={{ minWidth: 120 }}
          >
            应用重命名 ({completedImages.length})
          </Button>
        </Box>
      )}
    </Box>
  );
};

export default StatusBar;
