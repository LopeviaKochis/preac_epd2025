import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Box,
  useTheme,
  useMediaQuery
} from '@mui/material';
import {
  Menu as MenuIcon,
  Dashboard as DashboardIcon,
  WbSunny as SolarIcon,
  Opacity as WaterIcon,
  Cloud as WeatherIcon,
  Agriculture as CropIcon,
  BugReport as PestIcon
} from '@mui/icons-material';
import PhoneOptIn from './PhoneOptIn';
import { useEffect } from 'react';
import FrostIcon from '@mui/icons-material/AcUnit'; // Add this import for FrostIcon

const Navbar = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const navigate = useNavigate();
  const location = useLocation();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [isOnline, setIsOnline] = useState(window.navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const menuItems = [
    { text: 'Dashboard', icon: <DashboardIcon />, path: '/dashboard' },
    { text: 'Energía Solar', icon: <SolarIcon />, path: '/energia-solar' },
    { text: 'Riego Inteligente', icon: <WaterIcon />, path: '/riego-inteligente' },
    { text: 'Asistencia Agroclimática', icon: <WeatherIcon />, path: '/asistencia-agroclimatica' },
    { text: 'Recomendación de Producción', icon: <CropIcon />, path: '/recomendacion-produccion' },
    { text: 'Prevención de Plagas', icon: <PestIcon />, path: '/prevencion-plagas' },
    { text: 'Predicción de Heladas', icon: <FrostIcon />, path: '/frost' }
  ];

  const handleDrawerToggle = () => setDrawerOpen(o => !o);

  const handleNavigation = (path) => {
    navigate(path);
    if (isMobile) setDrawerOpen(false);
  };

  const drawer = (
    <Box sx={{ width: 250, height: '100%', position: 'relative' }}>
      <Toolbar>
        <Typography variant="h6" noWrap sx={{ color: 'primary.main' }}>
          PREAC
        </Typography>
      </Toolbar>
      <List>
        {menuItems.map(item => (
          <ListItem
            key={item.text}
            button
            onClick={() => handleNavigation(item.path)}
            selected={location.pathname === item.path}
            sx={{
              '&.Mui-selected': {
                backgroundColor: 'primary.light',
                '& .MuiListItemIcon-root': { color: 'primary.main' }
              }
            }}
          >
            <ListItemIcon>{item.icon}</ListItemIcon>
            <ListItemText primary={item.text} />
          </ListItem>
        ))}
      </List>

      <Box sx={{ position: 'absolute', bottom: 16, left: 16, right: 16 }}>
        <Box sx={{ mb: 2, p: 1, bgcolor: 'grey.100', borderRadius: 1 }}>
          <Typography variant="caption" color="textSecondary">
            Usuario: Invitado
          </Typography>
          <br />
          <Typography
            variant="caption"
            color={isOnline ? 'success.main' : 'error.main'}
          >
            Estado: {isOnline ? 'En línea' : 'Sin conexión'}
          </Typography>
        </Box>
        <PhoneOptIn />
      </Box>
    </Box>
  );

  return (
    <>
      <AppBar position="fixed" sx={{ zIndex: theme.zIndex.drawer + 1 }}>
        <Toolbar>
          <IconButton
            color="inherit"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2, display: { md: 'none' } }}
          >
            <MenuIcon />
          </IconButton>

          <Typography variant="h6" noWrap sx={{ flexGrow: 1 }}>
            PREAC - Agricultura Inteligente
          </Typography>

          {!isOnline && (
            <Typography variant="body2" sx={{ mr: 2, color: 'warning.light' }}>
              Modo sin conexión
            </Typography>
          )}
        </Toolbar>
      </AppBar>

      <Drawer
        variant="temporary"
        open={drawerOpen}
        onClose={handleDrawerToggle}
        ModalProps={{ keepMounted: true }}
        sx={{
          display: { xs: 'block', md: 'none' },
          '& .MuiDrawer-paper': { boxSizing: 'border-box', width: 250 }
        }}
      >
        {drawer}
      </Drawer>

      <Drawer
        variant="permanent"
        open
        sx={{
          display: { xs: 'none', md: 'block' },
          '& .MuiDrawer-paper': { boxSizing: 'border-box', width: 250 }
        }}
      >
        {drawer}
      </Drawer>
    </>
  );
};

export default Navbar;