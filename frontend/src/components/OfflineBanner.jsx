import React, { useState, useEffect } from 'react';
import { Box, Typography, Collapse, IconButton, Alert } from '@mui/material';
import { Close as CloseIcon, Wifi as WifiIcon, WifiOff as WifiOffIcon } from '@mui/icons-material';

const OfflineBanner = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [showBanner, setShowBanner] = useState(false);
  const [bannerType, setBannerType] = useState('offline');
  const [lastSyncTime, setLastSyncTime] = useState(null);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      if (showBanner) {
        setBannerType('online');
        setTimeout(() => setShowBanner(false), 3000);
      }
      localStorage.setItem('lastSyncTime', new Date().toISOString());
    };

    const handleOffline = () => {
      setIsOnline(false);
      setBannerType('offline');
      setShowBanner(true);
      const lastSync = localStorage.getItem('lastSyncTime');
      if (lastSync) {
        setLastSyncTime(new Date(lastSync).toLocaleString('es-PE'));
      }
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Estado inicial
    if (!navigator.onLine) {
      handleOffline();
    } else {
      localStorage.setItem('lastSyncTime', new Date().toISOString());
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [showBanner]);

  const handleClose = () => setShowBanner(false);

  const bannerContent =
    bannerType === 'offline'
      ? {
          severity: 'warning',
            icon: <WifiOffIcon />,
            message: `Modo sin conexión activo${lastSyncTime ? ` - Última sincronización: ${lastSyncTime}` : ''}`,
          showClose: true
        }
      : {
          severity: 'success',
          icon: <WifiIcon />,
          message: 'Conexión restablecida - Sincronizando datos...',
          showClose: false
        };

  return (
    <Collapse in={showBanner}>
      <Alert
        severity={bannerContent.severity}
        icon={bannerContent.icon}
        action={
          bannerContent.showClose && (
            <IconButton
              aria-label="close"
              color="inherit"
              size="small"
              onClick={handleClose}
            >
              <CloseIcon fontSize="inherit" />
            </IconButton>
          )
        }
        sx={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 1400,
          borderRadius: 0,
          '& .MuiAlert-message': { fontSize: '0.875rem' }
        }}
      >
        {bannerContent.message}
      </Alert>
    </Collapse>
  );
};

export default OfflineBanner;