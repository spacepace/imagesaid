import React, { useEffect } from 'react';
import {
  ThemeProvider, 
  createTheme, 
  CssBaseline, 
  Container, 
  Box,
  GlobalStyles
} from '@mui/material';
import { listen } from '@tauri-apps/api/event';
import { useAppStore } from './store/useAppStore';
import NavigationBar from './components/NavigationBar';
import PromptEditor from './components/PromptEditor';
import ImageList from './components/ImageList';
import StatusBar from './components/StatusBar';

// 创建Material-UI主题
const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
  },
  typography: {
    h4: {
      fontWeight: 600,
    },
    h6: {
      fontWeight: 500,
    },
  },
});

// 全局样式
const globalStyles = (
  <GlobalStyles
    styles={{
      '@keyframes spin': {
        '0%': {
          transform: 'rotate(0deg)',
        },
        '100%': {
          transform: 'rotate(360deg)',
        },
      },
      html: {
        height: '100%',
        overflow: 'hidden',
      },
      body: {
        margin: 0,
        height: '100%',
        overflow: 'hidden',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", "Oxygen", "Ubuntu", "Cantarell", "Fira Sans", "Droid Sans", "Helvetica Neue", sans-serif',
      },
      '#root': {
        height: '100%',
        overflow: 'hidden',
      },
    }}
  />
);

function App() {
  const { addImages, loadSettings } = useAppStore();

  // 应用启动时加载设置
  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  useEffect(() => {
    let unlistenFileDrop: (() => void) | null = null;

    // 监听文件拖拽事件 - 尝试多种可能的事件名称
    const setupFileDropListener = async () => {
      try {
        console.log('Setting up Tauri file drop listener...');
        
        // 尝试不同的事件名称
        const eventNames = [
          'tauri://file-drop',
          'tauri://drag-drop', 
          'tauri://drop',
          'drag-drop',
          'file-drop'
        ];
        
        for (const eventName of eventNames) {
          try {
            console.log(`Trying to listen to event: ${eventName}`);
            const unlisten = await listen<string[]>(eventName, (event) => {
              console.log(`🎯 Tauri event received from ${eventName}!`, event.payload);
              const files = event.payload;
              
              // 过滤出图片文件
              const imageExtensions = ['.jpg', '.jpeg', '.png', '.webp', '.avif'];
              const imageFiles = files.filter(filePath => {
                const ext = filePath.toLowerCase().split('.').pop();
                return ext && imageExtensions.includes(`.${ext}`);
              });

              console.log('Filtered image files:', imageFiles);

              // 转换为所需格式并添加到状态
              const fileObjects = imageFiles.map(filePath => {
                // 确保路径格式正确，处理Windows路径
                const normalizedPath = filePath.replace(/\\/g, '/');
                const fileName = normalizedPath.split('/').pop() || 'unknown';
                
                return {
                  path: filePath, // 保持原始路径给后端使用
                  name: fileName
                };
              });

              if (fileObjects.length > 0) {
                addImages(fileObjects);
              }
            });
            
            if (unlistenFileDrop) unlistenFileDrop();
            unlistenFileDrop = unlisten;
            console.log(`✅ Successfully set up listener for: ${eventName}`);
          } catch (err) {
            console.log(`❌ Failed to set up listener for ${eventName}:`, err);
          }
        }
        
        console.log('✅ Tauri file drop listener setup complete');
      } catch (error) {
        console.error('❌ Failed to setup file drop listener:', error);
      }
    };

    setupFileDropListener();

    return () => {
      if (unlistenFileDrop) {
        unlistenFileDrop();
      }
    };
  }, [addImages]);

  // 全局拖拽处理
  const handleGlobalDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleGlobalDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    console.log('Global drop event (HTML5):', e.dataTransfer.files);
    // 注意：这个是HTML5的拖拽，在Tauri中应该优先使用tauri://file-drop事件
    // 这里只是作为备选方案
    console.log('提示：请使用文件拖拽而非选择文件按钮以获得完整功能');
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      {globalStyles}
      
      <Box sx={{ height: '100vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {/* 导航栏 */}
        <NavigationBar />
        
        {/* 主内容区域 */}
        <Box 
          sx={{ 
            display: 'flex', 
            flexDirection: 'column', 
            flex: 1,
            overflow: 'hidden',
            minHeight: 0
          }}
          onDragOver={handleGlobalDragOver}
          onDrop={handleGlobalDrop}
        >
          {/* 中央图片列表展示区 */}
          <Box sx={{ 
            flex: 1, 
            overflow: 'hidden', 
            p: 2,
            minHeight: 0
          }}>
            <ImageList />
          </Box>
          
          {/* 底部命名操作区 */}
          <Box sx={{ 
            borderTop: 1, 
            borderColor: 'divider', 
            bgcolor: 'background.paper',
            p: 2,
            flexShrink: 0
          }}>
            <Container maxWidth="lg" sx={{ p: 0 }}>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <PromptEditor />
                <StatusBar />
              </Box>
            </Container>
          </Box>
        </Box>
      </Box>
    </ThemeProvider>
  );
}

export default App;