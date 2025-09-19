import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import App from './App.jsx';
import serviceWorkerManager from './services/serviceWorkerManager';
import './index.css';

// Configuración del tema Material-UI
const theme = createTheme({
  palette: {
    primary: {
      main: '#4CAF50', // Verde para agricultura
    },
    secondary: {
      main: '#FF9800', // Naranja para alertas
    },
    background: {
      default: '#f5f5f5',
    },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    h4: {
      fontWeight: 600,
    },
    h5: {
      fontWeight: 500,
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          borderRadius: 8,
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        },
      },
    },
  },
});

// Configuración de eventos PWA
let deferredPrompt;

window.addEventListener('beforeinstallprompt', (e) => {
  console.log('💾 PWA installation prompt disponible');
  e.preventDefault();
  deferredPrompt = e;
});

window.addEventListener('pwa-install-prompt', (e) => {
  if (deferredPrompt) {
    deferredPrompt.prompt();
    deferredPrompt.userChoice.then((choiceResult) => {
      if (choiceResult.outcome === 'accepted') {
        console.log('✅ Usuario aceptó instalar PWA');
      } else {
        console.log('❌ Usuario rechazó instalar PWA');
      }
      deferredPrompt = null;
      e.detail.resolve(choiceResult.outcome === 'accepted');
    });
  } else {
    e.detail.resolve(false);
  }
});

// Listeners para Service Worker
serviceWorkerManager.on('update', (data) => {
  if (data.available) {
    console.log('🔄 Nueva versión disponible');
    // Aquí podrías mostrar una notificación al usuario
    if (confirm('Nueva versión disponible. ¿Desea actualizar?')) {
      serviceWorkerManager.activateUpdate();
    }
  }
});

serviceWorkerManager.on('offline', () => {
  console.log('📵 Aplicación en modo offline');
  document.body.classList.add('offline');
});

serviceWorkerManager.on('online', () => {
  console.log('🌐 Conexión restaurada');
  document.body.classList.remove('offline');
});

serviceWorkerManager.on('install', (data) => {
  if (data.success) {
    console.log('✅ Service Worker instalado correctamente');
  } else {
    console.error('❌ Error instalando Service Worker:', data.error);
  }
});

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <ThemeProvider theme={theme}>
        <CssBaseline />
          <App />
      </ThemeProvider>
    </BrowserRouter>
  </React.StrictMode>,
);