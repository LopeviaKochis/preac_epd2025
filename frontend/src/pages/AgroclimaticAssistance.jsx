import React, { useState, useEffect } from 'react';
import {
  Container,
  Grid,
  Card,
  CardContent,
  Typography,
  Box,
  Alert,
  Paper,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Chip,
  Avatar,
  LinearProgress
} from '@mui/material';
import {
  Cloud as WeatherIcon,
  AcUnit as FrostIcon,
  WbSunny as DroughtIcon,
  Thermostat as TempIcon,
  Opacity as HumidityIcon,
  Air as WindIcon,
  Refresh as RefreshIcon,
  Warning as WarningIcon,
  CheckCircle as SafeIcon
} from '@mui/icons-material';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip as ChartTooltip,
  Legend,
  TimeScale
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import PhoneOptIn from '../components/PhoneOptIn';

// Registrar componentes de Chart.js
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  ChartTooltip,
  Legend,
  TimeScale
);

const AgroclimaticAssistance = () => {
  const { isOnline } = useAuth();
  const [loading, setLoading] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState('lima');
  const [weatherData, setWeatherData] = useState(null);
  const [alerts, setAlerts] = useState([]);
  const [lastUpdate, setLastUpdate] = useState(null);

  const locations = {
    lima: { label: 'Lima', region: 'Costa' },
    cusco: { label: 'Cusco', region: 'Sierra' },
    iquitos: { label: 'Iquitos', region: 'Selva' },
    arequipa: { label: 'Arequipa', region: 'Costa Sur' },
    huancayo: { label: 'Huancayo', region: 'Sierra Central' },
    trujillo: { label: 'Trujillo', region: 'Costa Norte' }
  };

  useEffect(() => {
    loadWeatherData();
  }, [selectedLocation, isOnline]);

  const loadWeatherData = async () => {
    setLoading(true);
    
    try {
      if (isOnline) {
        // En modo online: simular llamada a API meteorológica
        const mockData = generateMockWeatherData();
        setWeatherData(mockData);
        setAlerts(generateWeatherAlerts(mockData));
        setLastUpdate(new Date());
        
        // Guardar en localStorage para uso offline
        localStorage.setItem('weatherData', JSON.stringify({
          data: mockData,
          alerts: generateWeatherAlerts(mockData),
          location: selectedLocation,
          timestamp: new Date().toISOString()
        }));
      } else {
        // En modo offline: cargar datos del localStorage
        const cachedData = localStorage.getItem('weatherData');
        if (cachedData) {
          const parsed = JSON.parse(cachedData);
          if (parsed.location === selectedLocation) {
            setWeatherData(parsed.data);
            setAlerts(parsed.alerts);
            setLastUpdate(new Date(parsed.timestamp));
          } else {
            // Si no hay datos para la ubicación seleccionada, usar datos genéricos
            const mockData = generateMockWeatherData();
            setWeatherData(mockData);
            setAlerts(generateWeatherAlerts(mockData));
          }
        } else {
          const mockData = generateMockWeatherData();
          setWeatherData(mockData);
          setAlerts(generateWeatherAlerts(mockData));
        }
      }
    } catch (error) {
      console.error('Error cargando datos meteorológicos:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateMockWeatherData = () => {
    const now = new Date();
    const forecast = [];
    
    for (let i = 0; i < 7; i++) {
      const date = new Date(now);
      date.setDate(date.getDate() + i);
      
      // Simular datos variables según la ubicación
      const baseTemp = selectedLocation === 'lima' ? 18 : 
                      selectedLocation === 'cusco' ? 12 : 
                      selectedLocation === 'iquitos' ? 28 : 16;
      
      forecast.push({
        date: date.toISOString().split('T')[0],
        tempMin: baseTemp + Math.random() * 4 - 2,
        tempMax: baseTemp + 8 + Math.random() * 6,
        humidity: 60 + Math.random() * 30,
        windSpeed: 10 + Math.random() * 15,
        precipitation: Math.random() * 20,
        uvIndex: 6 + Math.random() * 6,
        frostRisk: baseTemp < 5 ? Math.random() * 0.8 + 0.2 : Math.random() * 0.3,
        droughtRisk: Math.random() * 0.6
      });
    }

    return {
      current: {
        temperature: forecast[0].tempMax - 2,
        humidity: forecast[0].humidity,
        windSpeed: forecast[0].windSpeed,
        pressure: 1013 + Math.random() * 20 - 10,
        visibility: 8 + Math.random() * 7,
        condition: 'Parcialmente nublado'
      },
      forecast
    };
  };

  const generateWeatherAlerts = (data) => {
    const alerts = [];
    
    data.forecast.slice(0, 3).forEach((day, index) => {
      if (day.frostRisk > 0.6) {
        alerts.push({
          id: `frost-${index}`,
          type: 'error',
          title: 'Alerta de Helada',
          message: `Alto riesgo de helada el ${new Date(day.date).toLocaleDateString('es-PE')}. Temperatura mínima: ${day.tempMin.toFixed(1)}°C`,
          icon: <FrostIcon />,
          priority: 'high',
          recommendations: [
            'Cubrir cultivos sensibles',
            'Activar sistemas de protección contra heladas',
            'Regar antes del amanecer para proteger las raíces'
          ]
        });
      }
      
      if (day.droughtRisk > 0.5 && day.precipitation < 2) {
        alerts.push({
          id: `drought-${index}`,
          type: 'warning',
          title: 'Riesgo de Sequía',
          message: `Condiciones secas previstas. Precipitación esperada: ${day.precipitation.toFixed(1)}mm`,
          icon: <DroughtIcon />,
          priority: 'medium',
          recommendations: [
            'Aumentar frecuencia de riego',
            'Implementar mulching para conservar humedad',
            'Monitorear nivel de agua en reservorios'
          ]
        });
      }
    });

    return alerts;
  };

  const handleLocationChange = (event) => {
    setSelectedLocation(event.target.value);
  };

  const handleRefresh = () => {
    loadWeatherData();
  };

  // Datos para gráfico de tendencias
  const chartData = weatherData ? {
    labels: weatherData.forecast.map(day => new Date(day.date).toLocaleDateString('es-PE', { weekday: 'short', day: 'numeric' })),
    datasets: [
      {
        label: 'Temperatura Máxima (°C)',
        data: weatherData.forecast.map(day => day.tempMax),
        borderColor: '#f44336',
        backgroundColor: 'rgba(244, 67, 54, 0.1)',
        tension: 0.4,
      },
      {
        label: 'Temperatura Mínima (°C)',
        data: weatherData.forecast.map(day => day.tempMin),
        borderColor: '#2196f3',
        backgroundColor: 'rgba(33, 150, 243, 0.1)',
        tension: 0.4,
      },
      {
        label: 'Humedad (%)',
        data: weatherData.forecast.map(day => day.humidity),
        borderColor: '#4caf50',
        backgroundColor: 'rgba(76, 175, 80, 0.1)',
        tension: 0.4,
        yAxisID: 'y1',
      }
    ],
  } : null;

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'index',
      intersect: false,
    },
    scales: {
      x: {
        display: true,
        title: {
          display: true,
          text: 'Días'
        }
      },
      y: {
        type: 'linear',
        display: true,
        position: 'left',
        title: {
          display: true,
          text: 'Temperatura (°C)'
        }
      },
      y1: {
        type: 'linear',
        display: true,
        position: 'right',
        title: {
          display: true,
          text: 'Humedad (%)'
        },
        grid: {
          drawOnChartArea: false,
        },
      },
    },
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: 'Tendencias Meteorológicas - 7 Días',
      },
    },
  };

  const getRiskLevel = (risk) => {
    if (risk > 0.7) return { level: 'Alto', color: 'error' };
    if (risk > 0.4) return { level: 'Medio', color: 'warning' };
    return { level: 'Bajo', color: 'success' };
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4, ml: { md: '250px' }, pl: { md: 3 } }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <WeatherIcon sx={{ fontSize: 32, color: 'primary.main', mr: 2 }} />
            <Typography variant="h4" gutterBottom>
              Asistencia Agroclimática
            </Typography>
          </Box>
          
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={handleRefresh}
            disabled={loading}
          >
            Actualizar
          </Button>
        </Box>
        
        <Typography variant="subtitle1" color="text.secondary">
          Monitoreo meteorológico y alertas para proteger tus cultivos
        </Typography>
        
        {lastUpdate && (
          <Typography variant="caption" color="text.secondary">
            Última actualización: {lastUpdate.toLocaleString('es-PE')}
          </Typography>
        )}
      </Box>

      {!isOnline && (
        <Alert severity="info" sx={{ mb: 3 }}>
          Modo offline: Mostrando datos meteorológicos almacenados localmente
        </Alert>
      )}

      {/* Selector de ubicación */}
      <Box sx={{ mb: 3 }}>
        <FormControl sx={{ minWidth: 200 }}>
          <InputLabel>Ubicación</InputLabel>
          <Select
            value={selectedLocation}
            onChange={handleLocationChange}
            label="Ubicación"
          >
            {Object.entries(locations).map(([key, location]) => (
              <MenuItem key={key} value={key}>
                {location.label} ({location.region})
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>

      {loading && <LinearProgress sx={{ mb: 3 }} />}

      {/* CTA: Suscripción SMS */}
      <Card sx={{ mb: 4 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Recibe alertas agroclimáticas por SMS
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Introduce tu número (+51) para avisarte si se detectan heladas o sequías.
          </Typography>
          <PhoneOptIn />
        </CardContent>
      </Card>

      {/* Alertas críticas */}
      {alerts.length > 0 && (
        <Box sx={{ mb: 4 }}>
          <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
            <WarningIcon sx={{ mr: 1, color: 'warning.main' }} />
            Alertas Meteorológicas
          </Typography>
          
          <Grid container spacing={2}>
            {alerts.map((alert) => (
              <Grid item xs={12} md={6} key={alert.id}>
                <Alert 
                  severity={alert.type}
                  icon={alert.icon}
                  sx={{ 
                    '& .MuiAlert-message': { width: '100%' } 
                  }}
                >
                  <Typography variant="subtitle2" gutterBottom>
                    {alert.title}
                  </Typography>
                  <Typography variant="body2" sx={{ mb: 1 }}>
                    {alert.message}
                  </Typography>
                  
                  <Box sx={{ mt: 2 }}>
                    <Typography variant="caption" fontWeight="bold">
                      Recomendaciones:
                    </Typography>
                    {alert.recommendations.map((rec, index) => (
                      <Typography key={index} variant="caption" display="block">
                        • {rec}
                      </Typography>
                    ))}
                  </Box>
                </Alert>
              </Grid>
            ))}
          </Grid>
        </Box>
      )}

      {weatherData && (
        <>
          {/* Condiciones actuales */}
          <Typography variant="h6" gutterBottom>
            Condiciones Actuales - {locations[selectedLocation].label}
          </Typography>
          
          <Grid container spacing={3} sx={{ mb: 4 }}>
            <Grid item xs={6} sm={3}>
              <Paper sx={{ p: 2, textAlign: 'center' }}>
                <TempIcon color="primary" sx={{ fontSize: 32, mb: 1 }} />
                <Typography variant="h6">{weatherData.current.temperature.toFixed(1)}°C</Typography>
                <Typography variant="body2" color="text.secondary">
                  Temperatura
                </Typography>
              </Paper>
            </Grid>
            
            <Grid item xs={6} sm={3}>
              <Paper sx={{ p: 2, textAlign: 'center' }}>
                <HumidityIcon color="primary" sx={{ fontSize: 32, mb: 1 }} />
                <Typography variant="h6">{weatherData.current.humidity.toFixed(0)}%</Typography>
                <Typography variant="body2" color="text.secondary">
                  Humedad
                </Typography>
              </Paper>
            </Grid>
            
            <Grid item xs={6} sm={3}>
              <Paper sx={{ p: 2, textAlign: 'center' }}>
                <WindIcon color="primary" sx={{ fontSize: 32, mb: 1 }} />
                <Typography variant="h6">{weatherData.current.windSpeed.toFixed(1)} km/h</Typography>
                <Typography variant="body2" color="text.secondary">
                  Viento
                </Typography>
              </Paper>
            </Grid>
            
            <Grid item xs={6} sm={3}>
              <Paper sx={{ p: 2, textAlign: 'center' }}>
                <Typography variant="h6">{weatherData.current.pressure.toFixed(0)} hPa</Typography>
                <Typography variant="body2" color="text.secondary">
                  Presión
                </Typography>
              </Paper>
            </Grid>
          </Grid>

          {/* Gráfico de tendencias */}
          <Card sx={{ mb: 4 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Pronóstico Extendido
              </Typography>
              <Box sx={{ height: 400 }}>
                {chartData && <Line data={chartData} options={chartOptions} />}
              </Box>
            </CardContent>
          </Card>

          {/* Evaluación de riesgos */}
          <Typography variant="h6" gutterBottom>
            Evaluación de Riesgos por Día
          </Typography>
          
          <Grid container spacing={2}>
            {weatherData.forecast.slice(0, 5).map((day, index) => {
              const frostRisk = getRiskLevel(day.frostRisk);
              const droughtRisk = getRiskLevel(day.droughtRisk);
              
              return (
                <Grid item xs={12} sm={6} md={4} key={index}>
                  <Card>
                    <CardContent>
                      <Typography variant="subtitle1" gutterBottom>
                        {new Date(day.date).toLocaleDateString('es-PE', { 
                          weekday: 'long', 
                          day: 'numeric', 
                          month: 'short' 
                        })}
                      </Typography>
                      
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                        <Typography variant="body2">
                          {day.tempMin.toFixed(1)}°C - {day.tempMax.toFixed(1)}°C
                        </Typography>
                        <Typography variant="body2">
                          {day.precipitation.toFixed(1)}mm
                        </Typography>
                      </Box>

                      <Box sx={{ mb: 1 }}>
                        <Typography variant="caption" sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                          <FrostIcon sx={{ fontSize: 16, mr: 1 }} />
                          Riesgo de Helada:
                        </Typography>
                        <Chip 
                          label={frostRisk.level} 
                          color={frostRisk.color} 
                          size="small"
                          sx={{ mr: 1 }}
                        />
                      </Box>

                      <Box>
                        <Typography variant="caption" sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                          <DroughtIcon sx={{ fontSize: 16, mr: 1 }} />
                          Riesgo de Sequía:
                        </Typography>
                        <Chip 
                          label={droughtRisk.level} 
                          color={droughtRisk.color} 
                          size="small"
                        />
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              );
            })}
          </Grid>
        </>
      )}
    </Container>
  );
};

export default AgroclimaticAssistance;