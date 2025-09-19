import React, { useState, useEffect } from 'react';
import {
  Snackbar,
  Alert,
  Button,
  Box,
  IconButton,
  Typography,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  ListItemIcon
} from '@mui/material';
import {
  WifiOff,
  Wifi,
  CloudOff,
  Sync,
  Download,
  Info,
  CheckCircle,
  Pending,
  Error
} from '@mui/icons-material';
import serviceWorkerManager from '../services/serviceWorkerManager';

const OfflineManager = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [showOfflineAlert, setShowOfflineAlert] = useState(false);
  const [showOnlineAlert, setShowOnlineAlert] = useState(false);
  const [pendingSync, setPendingSync] = useState(0);
  const [showSyncDialog, setShowSyncDialog] = useState(false);
  const [installPromptAvailable, setInstallPromptAvailable] = useState(false);

  useEffect(() => {
    // Listeners para cambios de conectividad
    const handleOnline = () => {
      setIsOnline(true);
      setShowOnlineAlert(true);
      setShowOfflineAlert(false);
      updatePendingCount();
    };

    const handleOffline = () => {
      setIsOnline(false);
      setShowOfflineAlert(true);
      setShowOnlineAlert(false);
    };

    // Registrar listeners del service worker
    serviceWorkerManager.on('online', handleOnline);
    serviceWorkerManager.on('offline', handleOffline);

    // Listeners nativos como fallback
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Verificar estado inicial
    updatePendingCount();

    // Verificar disponibilidad de instalación PWA
    window.addEventListener('beforeinstallprompt', () => {
      setInstallPromptAvailable(true);
    });

    return () => {
      serviceWorkerManager.off('online', handleOnline);
      serviceWorkerManager.off('offline', handleOffline);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const updatePendingCount = () => {
    try {
      const pending = JSON.parse(localStorage.getItem('preac_pending_sync') || '[]');
      setPendingSync(pending.length);
    } catch (error) {
      console.error('Error obteniendo datos pendientes:', error);
      setPendingSync(0);
    }
  };

  const handleSyncNow = async () => {
    if (!isOnline) {
      return;
    }

    try {
      await serviceWorkerManager.syncPendingData();
      updatePendingCount();
      setShowSyncDialog(false);
    } catch (error) {
      console.error('Error sincronizando:', error);
    }
  };

  const handleInstallPWA = async () => {
    try {
      const installed = await serviceWorkerManager.promptInstall();
      if (installed) {
        setInstallPromptAvailable(false);
      }
    } catch (error) {
      console.error('Error instalando PWA:', error);
    }
  };

  const getPendingItems = () => {
    try {
      return JSON.parse(localStorage.getItem('preac_pending_sync') || '[]');
    } catch {
      return [];
    }
  };

  const formatItemType = (type) => {
    const types = {
      'notification': 'Notificación SMS',
      'calculation': 'Cálculo',
      'user_data': 'Datos de Usuario'
    };
    return types[type] || type;
  };

  const getItemIcon = (type) => {
    const icons = {
      'notification': <Pending color="warning" />,
      'calculation': <Sync color="info" />,
      'user_data': <CheckCircle color="success" />
    };
    return icons[type] || <Info />;
  };

  return (
    <>
      {/* Indicador de estado en la parte superior */}
      <Box 
        sx={{ 
          position: 'fixed', 
          top: 0, 
          left: 0, 
          right: 0, 
          zIndex: 9999,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '4px 16px',
          backgroundColor: isOnline ? 'success.light' : 'warning.light',
          color: isOnline ? 'success.contrastText' : 'warning.contrastText',
          transition: 'all 0.3s ease'
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {isOnline ? <Wifi fontSize="small" /> : <WifiOff fontSize="small" />}
          <Typography variant="caption">
            {isOnline ? 'En línea' : 'Sin conexión'}
          </Typography>
          
          {!isOnline && (
            <Chip 
              icon={<CloudOff />}
              label="Modo Offline"
              size="small"
              variant="outlined"
              sx={{ ml: 1 }}
            />
          )}
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {pendingSync > 0 && (
            <Chip
              icon={<Sync />}
              label={`${pendingSync} pendientes`}
              size="small"
              color="warning"
              onClick={() => setShowSyncDialog(true)}
              clickable
            />
          )}

          {installPromptAvailable && (
            <Button
              size="small"
              startIcon={<Download />}
              onClick={handleInstallPWA}
              sx={{ color: 'inherit' }}
            >
              Instalar App
            </Button>
          )}
        </Box>
      </Box>

      {/* Alert para conexión perdida */}
      <Snackbar
        open={showOfflineAlert}
        autoHideDuration={6000}
        onClose={() => setShowOfflineAlert(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert 
          onClose={() => setShowOfflineAlert(false)} 
          severity="warning"
          icon={<WifiOff />}
          action={
            <Button color="inherit" size="small">
              Más info
            </Button>
          }
        >
          Sin conexión a internet. Algunas funciones están limitadas.
        </Alert>
      </Snackbar>

      {/* Alert para conexión restaurada */}
      <Snackbar
        open={showOnlineAlert}
        autoHideDuration={4000}
        onClose={() => setShowOnlineAlert(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert 
          onClose={() => setShowOnlineAlert(false)} 
          severity="success"
          icon={<Wifi />}
          action={
            pendingSync > 0 ? (
              <Button 
                color="inherit" 
                size="small"
                onClick={handleSyncNow}
              >
                Sincronizar
              </Button>
            ) : null
          }
        >
          Conexión restaurada. {pendingSync > 0 && `${pendingSync} elementos listos para sincronizar.`}
        </Alert>
      </Snackbar>

      {/* Dialog para sincronización */}
      <Dialog
        open={showSyncDialog}
        onClose={() => setShowSyncDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Sync />
            Sincronización Pendiente
          </Box>
        </DialogTitle>
        
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Los siguientes elementos se sincronizarán cuando tengas conexión:
          </Typography>

          <List dense>
            {getPendingItems().map((item, index) => (
              <ListItem key={index}>
                <ListItemIcon>
                  {getItemIcon(item.type)}
                </ListItemIcon>
                <ListItemText
                  primary={formatItemType(item.type)}
                  secondary={`Creado: ${new Date(item.timestamp).toLocaleString()}`}
                />
              </ListItem>
            ))}
          </List>

          {pendingSync === 0 && (
            <Box sx={{ textAlign: 'center', py: 2 }}>
              <CheckCircle color="success" sx={{ fontSize: 48, mb: 1 }} />
              <Typography variant="body2" color="text.secondary">
                No hay elementos pendientes de sincronización
              </Typography>
            </Box>
          )}
        </DialogContent>

        <DialogActions>
          <Button onClick={() => setShowSyncDialog(false)}>
            Cerrar
          </Button>
          {isOnline && pendingSync > 0 && (
            <Button 
              onClick={handleSyncNow} 
              variant="contained"
              startIcon={<Sync />}
            >
              Sincronizar Ahora
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </>
  );
};

export default OfflineManager;