import React, { useState } from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Box,
} from '@mui/material';
import { Settings, List } from '@mui/icons-material';
import OllamaSettingsDialog from './dialogs/OllamaSettingsDialog';
import PromptManagementDialog from './dialogs/PromptManagementDialog';

const NavigationBar: React.FC = () => {
  const [ollamaSettingsOpen, setOllamaSettingsOpen] = useState(false);
  const [promptManagementOpen, setPromptManagementOpen] = useState(false);

  return (
    <>
      <AppBar position="static" elevation={1} sx={{ mb: 3 }}>
        <Toolbar>
          <Box sx={{ display: 'flex', alignItems: 'center', flexGrow: 1 }}>
            <Typography variant="h5" component="h1" sx={{ fontWeight: 'bold' }}>
              ImageSaid
            </Typography>
            <Typography variant="body2" sx={{ ml: 2, opacity: 0.8 }}>
              AI看图重命名
            </Typography>
          </Box>
          
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              color="inherit"
              startIcon={<Settings />}
              onClick={() => setOllamaSettingsOpen(true)}
              sx={{ textTransform: 'none' }}
            >
              Ollama设置
            </Button>
            <Button
              color="inherit"
              startIcon={<List />}
              onClick={() => setPromptManagementOpen(true)}
              sx={{ textTransform: 'none' }}
            >
              提示词管理
            </Button>
          </Box>
        </Toolbar>
      </AppBar>

      {/* Ollama设置对话框 */}
      <OllamaSettingsDialog
        open={ollamaSettingsOpen}
        onClose={() => setOllamaSettingsOpen(false)}
      />

      {/* 提示词管理对话框 */}
      <PromptManagementDialog
        open={promptManagementOpen}
        onClose={() => setPromptManagementOpen(false)}
      />
    </>
  );
};

export default NavigationBar;
