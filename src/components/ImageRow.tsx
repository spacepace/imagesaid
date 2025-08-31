import React, { useState, useEffect } from 'react';
import {
  TableRow,
  TableCell,
  TextField,
  IconButton,
  Box,
  Typography,
} from '@mui/material';
import { Delete, CheckCircle, Error, HourglassEmpty, Image } from '@mui/icons-material';
import { invoke } from '@tauri-apps/api/core';
import { useAppStore, ImageFile, formatTime } from '../store/useAppStore';

interface ImageRowProps {
  image: ImageFile;
}

const ImageRow: React.FC<ImageRowProps> = ({ image }) => {
  const { updateImage, removeImage } = useAppStore();
  const [imageError, setImageError] = useState(false);
  const [imageSrc, setImageSrc] = useState<string>('');

  // 加载图片数据
  useEffect(() => {
    const loadImage = async () => {
      try {
        // 如果是 blob URL 或开发环境的临时路径，直接使用
        if (image.path.startsWith('blob:') || 
            image.path.startsWith('dev-') || 
            image.path.startsWith('temp-') ||
            image.path.startsWith('http') ||
            image.path.startsWith('data:')) {
          setImageSrc(image.path);
          return;
        }
        
        // 对于本地文件路径，使用新的 read_image_file 命令
        try {
          console.log('Loading image via read_image_file:', image.path);
          const dataUrl = await invoke<string>('read_image_file', {
            imagePath: image.path
          });
          console.log('Successfully loaded image:', image.path);
          setImageSrc(dataUrl);
        } catch (error) {
          console.error('Failed to load image with read_image_file:', error);
          setImageError(true);
        }
      } catch (error) {
        console.error('Failed to load image:', error);
        setImageError(true);
      }
    };

    loadImage();
  }, [image.path]);

  const handleNewNameChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    updateImage(image.id, { newName: event.target.value });
  };

  const handleDelete = () => {
    removeImage(image.id);
  };

  const handleImageError = () => {
    console.log('Image load error for:', image.path);
    setImageError(true);
  };

  const getStatusIcon = () => {
    switch (image.status) {
      case 'completed':
        return <CheckCircle color="success" />;
      case 'error':
        return <Error color="error" />;
      case 'processing':
        return <HourglassEmpty color="primary" />;
      default:
        return <HourglassEmpty color="disabled" />;
    }
  };

  const getStatusText = () => {
    switch (image.status) {
      case 'completed':
        return '完成';
      case 'error':
        return '错误';
      case 'processing':
        return '处理中';
      default:
        return '等待中';
    }
  };

  const getStatusColor = () => {
    switch (image.status) {
      case 'completed':
        return 'success';
      case 'error':
        return 'error';
      case 'processing':
        return 'primary';
      default:
        return 'default';
    }
  };

  const renderThumbnail = () => {
    if (imageError || !imageSrc) {
      // 图片加载失败时显示占位符
      return (
        <Box
          sx={{
            width: 60,
            height: 60,
            backgroundColor: '#f5f5f5',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: 1,
            border: '1px solid #e0e0e0'
          }}
        >
          <Image sx={{ fontSize: 24, color: '#999' }} />
        </Box>
      );
    }

    return (
      <Box
        component="img"
        src={imageSrc}
        alt={image.originalName}
        onError={handleImageError}
        sx={{
          width: 60,
          height: 60,
          objectFit: 'cover',
          borderRadius: 1,
          border: '1px solid #e0e0e0',
          backgroundColor: '#f5f5f5'
        }}
      />
    );
  };

  return (
    <TableRow>
      {/* 状态列 */}
      <TableCell>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {getStatusIcon()}
          <Box>
            <Typography variant="body2" color={`${getStatusColor()}.main`}>
              {getStatusText()}
            </Typography>
            {image.processingTime && image.status === 'completed' && (
              <Typography variant="caption" color="text.secondary">
                {formatTime(image.processingTime)}
              </Typography>
            )}
          </Box>
        </Box>
      </TableCell>

      {/* 缩略图列 */}
      <TableCell>
        {renderThumbnail()}
      </TableCell>

      {/* 原文件名列 */}
      <TableCell>
        <Typography variant="body2" noWrap>
          {image.originalName}
        </Typography>
      </TableCell>

      {/* 新文件名列 */}
      <TableCell>
        <TextField
          value={image.newName}
          onChange={handleNewNameChange}
          variant="outlined"
          size="small"
          fullWidth
          disabled={image.status === 'processing'}
          error={image.status === 'error'}
          helperText={image.error}
        />
      </TableCell>

      {/* 操作列 */}
      <TableCell>
        <IconButton onClick={handleDelete} color="error" size="small">
          <Delete />
        </IconButton>
      </TableCell>
    </TableRow>
  );
};

export default ImageRow;
