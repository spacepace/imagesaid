import React, { useRef, useState } from 'react';
import {
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Box,
  Button,
} from '@mui/material';
import { Clear, CloudUpload, FolderOpen } from '@mui/icons-material';
import { useAppStore } from '../store/useAppStore';
import ImageRow from './ImageRow';
import { open } from '@tauri-apps/plugin-dialog';

const ImageList: React.FC = () => {
  const { images, clearImages, addImages } = useAppStore();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const handleClearImages = () => {
    clearImages();
  };

  // 文件选择处理 - 使用Tauri文件对话框
  const handleFileSelect = async () => {
    if (isDialogOpen) {
      console.log('Dialog is already open, skipping...');
      return;
    }
    
    setIsDialogOpen(true);
    
    try {
      console.log('Opening Tauri file dialog...');
      const files = await open({
        multiple: true,
        filters: [{
          name: '图片文件',
          extensions: ['jpg', 'jpeg', 'png', 'webp', 'avif']
        }]
      }) as string[] | string | null;
      
      console.log('Files selected via Tauri dialog:', files);
      
      if (files && Array.isArray(files) && files.length > 0) {
        const fileObjects = files.map((filePath: string) => {
          const fileName = filePath.split(/[\\\/]/).pop() || 'unknown';
          return {
            path: filePath,
            name: fileName
          };
        });
        
        console.log('Adding files from Tauri dialog:', fileObjects);
        addImages(fileObjects);
      } else if (files && typeof files === 'string') {
        // 单个文件
        const fileName = files.split(/[\\\/]/).pop() || 'unknown';
        addImages([{
          path: files,
          name: fileName
        }]);
      }
    } catch (error) {
      console.error('Failed to open Tauri file dialog:', error);
      // 回退到HTML5文件选择
      console.log('Falling back to HTML5 file selection...');
      fileInputRef.current?.click();
    } finally {
      setIsDialogOpen(false);
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    processFiles(files);
    // 清空input的值，允许选择相同的文件
    if (event.target) {
      event.target.value = '';
    }
  };

  const processFiles = (files: File[]) => {
    console.log('Processing files:', files);
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.webp', '.avif'];
    
    const imageFiles = files.filter(file => {
      const ext = file.name.toLowerCase().split('.').pop();
      return ext && imageExtensions.includes(`.${ext}`);
    });

    console.log('Filtered image files:', imageFiles);

    if (imageFiles.length > 0) {
      const fileObjects = imageFiles.map(file => {
        // 在Tauri环境中，尝试获取真实路径
        // 检查是否有path属性（Tauri环境）
        let filePath = (file as any).path;
        
        if (!filePath) {
          // 如果没有path属性，创建blob URL用于缩略图显示
          // 注意：这种情况下AI功能将受限，但缩略图可以正常显示
          filePath = URL.createObjectURL(file);
        }
        
        console.log('File path for', file.name, ':', filePath);
        
        return {
          path: filePath,
          name: file.name
        };
      });
      
      console.log('Adding images to store:', fileObjects);
      addImages(fileObjects);
    } else {
      console.log('No valid image files found');
    }
  };

  // HTML5 拖拽支持
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    console.log('📋 HTML5 Drag over event');
  };

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    console.log('📥 HTML5 Drag enter event');
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    console.log('📤 HTML5 Drag leave event');
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    console.log('🎯 HTML5 Drop event received:', e.dataTransfer.files);
    console.log('File count:', e.dataTransfer.files.length);
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      console.log('Processing files via HTML5 drag and drop...');
      processFiles(files);
    } else {
      console.log('No files in drop event');
    }
  };

  if (images.length === 0) {
    return (
      <Box sx={{ 
        height: '100%', 
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'center', 
        justifyContent: 'center',
        textAlign: 'center',
        p: 4
      }}>

        
        <Box 
          sx={{ 
            border: '2px dashed #ccc',
            borderRadius: 2,
            p: 6,
            backgroundColor: '#fafafa',
            cursor: 'pointer',
            maxWidth: 400,
            width: '100%',
            transition: 'all 0.2s ease',
            '&:hover': {
              borderColor: 'primary.main',
              backgroundColor: 'primary.50',
            }
          }}
          onDragOver={handleDragOver}
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={handleFileSelect}
        >
          <CloudUpload sx={{ fontSize: 64, color: 'text.secondary', mb: 3 }} />
          <Typography variant="h6" color="text.secondary" gutterBottom>
            拖拽图片文件到此处
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            支持 JPG, PNG, JPEG, WEBP, AVIF 格式
          </Typography>
          
          <Button
            variant="contained"
            startIcon={<FolderOpen />}
            onClick={(e) => {
              e.stopPropagation();
              handleFileSelect();
            }}
            size="large"
          >
            选择文件
          </Button>
          
          {/* 隐藏的文件输入 */}
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept=".jpg,.jpeg,.png,.webp,.avif"
            style={{ display: 'none' }}
            onChange={handleFileChange}
          />
        </Box>
      </Box>
    );
  }

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {/* 标题栏 */}
      <Box sx={{ 
        p: 2, 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        borderBottom: 1,
        borderColor: 'divider',
        bgcolor: 'background.paper',
        flexShrink: 0
      }}>
        <Typography variant="h6">
          图片列表 ({images.length} 张图片)
        </Typography>
        <Button
          variant="outlined"
          size="small"
          startIcon={<Clear />}
          onClick={handleClearImages}
        >
          清空列表
        </Button>
      </Box>
      
      {/* 图片列表 */}
      <Box sx={{ flex: 1, overflow: 'auto', minHeight: 0 }}>
        <TableContainer sx={{ height: '100%' }}>
          <Table stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell sx={{ minWidth: 120 }}>状态</TableCell>
                <TableCell sx={{ minWidth: 80 }}>缩略图</TableCell>
                <TableCell sx={{ minWidth: 200 }}>原文件名</TableCell>
                <TableCell sx={{ minWidth: 250 }}>新文件名 (可编辑)</TableCell>
                <TableCell sx={{ minWidth: 80 }}>操作</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {images.map((image) => (
                <ImageRow key={image.id} image={image} />
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>
    </Box>
  );
};

export default ImageList;
