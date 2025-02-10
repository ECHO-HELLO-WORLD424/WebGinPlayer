import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  IconButton,
  Switch,
  Slider,
  Typography,
  Box
} from '@mui/material';
import SettingsIcon from '@mui/icons-material/Settings';

declare global {
  interface Window {
    backgroundManager: {
      isAnimationEnabled: boolean;
      scale: number;
    };
  }
}

const SettingsMenu = () => {
  const [isAnimationEnabled, setIsAnimationEnabled] = React.useState(true);
  const [backgroundScale, setBackgroundScale] = React.useState(110);
  const [isOpen, setIsOpen] = React.useState(false);

  React.useEffect(() => {
    if (window.backgroundManager) {
      window.backgroundManager.isAnimationEnabled = isAnimationEnabled;
      window.backgroundManager.scale = backgroundScale / 100;
      document.body.style.backgroundSize = `${backgroundScale}%`;
    }
  }, [isAnimationEnabled, backgroundScale]);

  const handleScaleChange = (_event: Event, value: number | number[]) => {
    setBackgroundScale(Array.isArray(value) ? value[0] : value);
  };

  const handleClose = () => {
    setIsOpen(false);
  };

  return (
      <>
        <IconButton
            onClick={() => setIsOpen(true)}
            className="toolbar-btn setting-btn"
            aria-label="Settings"
            size="large"
        >
          <SettingsIcon />
        </IconButton>

        <Dialog
            open={isOpen}
            onClose={handleClose}
            PaperProps={{
              style: {
                backgroundColor: 'rgba(255, 255, 255, 0.95)',
                backdropFilter: 'blur(8px)',
              },
            }}
        >
          <DialogTitle sx={{ fontSize: '1.125rem', fontWeight: 600 }}>
            Settings
          </DialogTitle>

          <DialogContent>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, pt: 1 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="body2" sx={{ fontWeight: 500 }}>
                  Background Animation
                </Typography>
                <Switch
                    checked={isAnimationEnabled}
                    onChange={(e) => setIsAnimationEnabled(e.target.checked)}
                />
              </Box>

              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                <Typography variant="body2" sx={{ fontWeight: 500 }}>
                  Background Scale: {backgroundScale}%
                </Typography>
                <Slider
                    value={backgroundScale}
                    onChange={handleScaleChange}
                    min={100}
                    max={150}
                    step={5}
                    sx={{ width: '100%' }}
                />
              </Box>
            </Box>
          </DialogContent>
        </Dialog>
      </>
  );
};

export default SettingsMenu;