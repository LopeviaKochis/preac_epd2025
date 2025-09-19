import React, { useState, useEffect } from 'react';
import {
  Container,
  Grid,
  Card,
  CardContent,
  CardActionArea,
  Typography,
  Box,
  Chip,
  Paper,
  Alert
} from '@mui/material';
import {
  WbSunny as SolarIcon,
  Opacity as WaterIcon,
  Cloud as WeatherIcon,
  Agriculture as CropIcon,
  BugReport as PestIcon,
  TrendingUp as TrendingUpIcon,
  Warning as WarningIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

const Dashboard = () => {
  const navigate = useNavigate();
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [dashboardData, setDashboardData] = useState({
    alerts: [],
    recentActivity: [],
    summary: {}
  });

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    loadDashboardData();
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOnline]);

  const loadDashboardData = async () => {
    try {
      if (isOnline) {
        const mockData = getMockDashboardData();
        setDashboardData(mockData);
        localStorage.setItem('dashboardData', JSON.stringify(mockData));
      } else {
        const cachedData = localStorage.getItem('dashboardData');
        if (cachedData) {
          setDashboardData(JSON.parse(cachedData));
        } else {
          setDashboardData(getMockDashboardData());
        }
      }
    } catch (error) {
      console.error('Error cargando datos del dashboard:', error);
      setDashboardData(getMockDashboardData());
    }
  };

  const getMockDashboardData = () => ({
    alerts: [
      {
        id: 1,
        type: 'warning',
        message: 'Posible helada en los próximos 2 días',
        module: 'climate',
        severity: 'medium'
      },
      {
        id: 2,
        type: 'info',
        message: 'Tiempo óptimo para siembra de maíz',
        module: 'production',
        severity: 'low'
      }
    ],
    recentActivity: [
      'Cálculo de energía solar realizado',
      'Recomendación de riego actualizada',
      'Nueva alerta climática disponible'
    ],
    summary: {
      totalSavings: 1250,
      energyGenerated: 45.5,
      waterSaved: 2300,
      alerts: 2
    }
  });

  const modules = [
    {
      title: 'Energía Solar',
      description: 'Calcular potencial de energía solar y ahorros económicos',
      icon: <SolarIcon sx={{ fontSize: 48, color: '#FF9800' }} />,
      path: '/energia-solar',
      color: '#FFF3E0',
      available: true
    },
    {
      title: 'Riego Inteligente',
      description: 'Optimizar sistemas de riego y ahorro de agua',
      icon: <WaterIcon sx={{ fontSize: 48, color: '#2196F3' }} />,
      path: '/riego-inteligente',
      color: '#E3F2FD',
      available: true
    },
    {
      title: 'Asistencia Agroclimática',
      description: 'Alertas de heladas, sequías y condiciones climáticas',
      icon: <WeatherIcon sx={{ fontSize: 48, color: '#9C27B0' }} />,
      path: '/asistencia-agroclimatica',
      color: '#F3E5F5',
      available: true
    },
    {
      title: 'Recomendación de Producción',
      description: 'Optimizar fechas de siembra y estimación de rendimiento',
      icon: <CropIcon sx={{ fontSize: 48, color: '#4CAF50' }} />,
      path: '/recomendacion-produccion',
      color: '#E8F5E8',
      available: true
    },
    {
      title: 'Prevención de Plagas',
      description: 'Detección temprana y prevención de plagas',
      icon: <PestIcon sx={{ fontSize: 48, color: '#F44336' }} />,
      path: '/prevencion-plagas',
      color: '#FFEBEE',
      available: true
    }
  ];

  const handleModuleClick = (module) => {
    if (module.available) {
      navigate(module.path);
    }
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4, ml: { md: '250px' }, pl: { md: 3 } }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" gutterBottom>
          Bienvenido, Usuario
        </Typography>
        <Typography variant="subtitle1" color="text.secondary">
          Panel de control - Agricultura Inteligente
        </Typography>

        {!isOnline && (
          <Alert severity="info" sx={{ mt: 2 }}>
            Modo offline. Los datos pueden no estar actualizados.
          </Alert>
        )}
      </Box>

      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Paper sx={{ p: 2, textAlign: 'center' }}>
            <TrendingUpIcon color="primary" sx={{ fontSize: 32, mb: 1 }} />
            <Typography variant="h6">S/ {dashboardData.summary.totalSavings}</Typography>
            <Typography variant="body2" color="text.secondary">
              Ahorros Totales
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Paper sx={{ p: 2, textAlign: 'center' }}>
            <SolarIcon color="warning" sx={{ fontSize: 32, mb: 1 }} />
            <Typography variant="h6">{dashboardData.summary.energyGenerated} kWh</Typography>
            <Typography variant="body2" color="text.secondary">
              Energía Generada
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Paper sx={{ p: 2, textAlign: 'center' }}>
            <WaterIcon color="primary" sx={{ fontSize: 32, mb: 1 }} />
            <Typography variant="h6">{dashboardData.summary.waterSaved} L</Typography>
            <Typography variant="body2" color="text.secondary">
              Agua Ahorrada
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Paper sx={{ p: 2, textAlign: 'center' }}>
            <WarningIcon color="secondary" sx={{ fontSize: 32, mb: 1 }} />
            <Typography variant="h6">{dashboardData.summary.alerts}</Typography>
            <Typography variant="body2" color="text.secondary">
              Alertas Activas
            </Typography>
          </Paper>
        </Grid>
      </Grid>

      {dashboardData.alerts.length > 0 && (
        <Box sx={{ mb: 4 }}>
          <Typography variant="h6" gutterBottom>
            Alertas Recientes
          </Typography>
            {dashboardData.alerts.map((alert) => (
            <Alert
              key={alert.id}
              severity={alert.type}
              sx={{ mb: 1 }}
            >
              {alert.message}
            </Alert>
          ))}
        </Box>
      )}

      <Typography variant="h5" gutterBottom sx={{ mb: 3 }}>
        Módulos Disponibles
      </Typography>

      <Grid container spacing={3}>
        {modules.map((module, index) => (
          <Grid item xs={12} sm={6} md={4} key={index}>
            <Card
              sx={{
                height: '100%',
                bgcolor: module.color,
                transition: 'transform 0.2s',
                '&:hover': {
                  transform: 'translateY(-4px)'
                },
                cursor: module.available ? 'pointer' : 'not-allowed',
                opacity: module.available ? 1 : 0.6
              }}
            >
              <CardActionArea
                onClick={() => handleModuleClick(module)}
                disabled={!module.available}
                sx={{ height: '100%', p: 2 }}
              >
                <CardContent sx={{ textAlign: 'center', height: '100%' }}>
                  <Box sx={{ mb: 2 }}>
                    {module.icon}
                  </Box>
                  <Typography variant="h6" gutterBottom>
                    {module.title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    {module.description}
                  </Typography>
                  <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                    <Chip
                      label={module.available ? 'Disponible' : 'Próximamente'}
                      color={module.available ? 'success' : 'default'}
                      size="small"
                    />
                  </Box>
                </CardContent>
              </CardActionArea>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Box sx={{ mt: 4 }}>
        <Typography variant="h6" gutterBottom>
          Actividad Reciente
        </Typography>
        <Paper sx={{ p: 2 }}>
          {dashboardData.recentActivity.length > 0 ? (
            dashboardData.recentActivity.map((activity, index) => (
              <Typography key={index} variant="body2" sx={{ mb: 1 }}>
                • {activity}
              </Typography>
            ))
          ) : (
            <Typography variant="body2" color="text.secondary">
              No hay actividad reciente
            </Typography>
          )}
        </Paper>
      </Box>
    </Container>
  );
};

export default Dashboard;