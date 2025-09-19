import React, { useState, useEffect } from 'react';
import {
  Container,
  Grid,
  Card,
  CardContent,
  Typography,
  TextField,
  Slider,
  Button,
  Box,
  Alert,
  Paper,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  Tooltip
} from '@mui/material';
import {
  WbSunny as SolarIcon,
  Calculate as CalculateIcon,
  TrendingUp as TrendingUpIcon,
  Info as InfoIcon
} from '@mui/icons-material';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Title,
  Tooltip as ChartTooltip,
  Legend,
} from 'chart.js';
import { Bar, Pie } from 'react-chartjs-2';
import { solarService } from '../services/apiService';
import ImageGuide from '../components/ImageGuide';

// Registrar componentes de Chart.js
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Title,
  ChartTooltip,
  Legend
);

const SolarEnergy = () => {
  const { isOnline } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    area: 50,
    systemType: '',
    location: 'lima'
  });
  const [results, setResults] = useState(null);
  const [error, setError] = useState('');

  // Tipos de sistemas solares con imágenes
  const systemTypes = {
    monocristalino: {
      label: 'Monocristalino',
      efficiency: 0.2,
      costPerM2: 800,
      src: '/src/assets/images/panel-monocristalino.jpg',
      alt: 'Panel Solar Monocristalino',
      description: 'Mayor eficiencia, ideal para espacios limitados'
    },
    policristalino: {
      label: 'Policristalino',
      efficiency: 0.16,
      costPerM2: 650,
      src: '/src/assets/images/panel-policristalino.jpg',
      alt: 'Panel Solar Policristalino',
      description: 'Buena relación costo-beneficio'
    },
    pelicula_delgada: {
      label: 'Película Delgada',
      efficiency: 0.12,
      costPerM2: 500,
      src: '/src/assets/images/panel-pelicula-delgada.jpg',
      alt: 'Panel Solar de Película Delgada',
      description: 'Más económico, flexible en instalación'
    }
  };

  const handleInputChange = (field) => (event) => {
    const value = event.target.value;
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    setError('');
  };

  const handleAreaChange = (event, newValue) => {
    setFormData(prev => ({
      ...prev,
      area: newValue
    }));
  };

  const calculateSolarEnergy = async () => {
    if (!formData.systemType) {
      setError('Por favor selecciona un tipo de sistema solar');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Llamar al servicio real del backend
      const response = await solarService.calculate({
        area: formData.area,
        systemType: formData.systemType,
        location: formData.location,
        electricityRate: 'residential'
      });

      // Mapear la respuesta del backend al formato del frontend
      const calculatedResults = {
        area: formData.area,
        systemType: formData.systemType,
        totalPower: response.calculations.systemPower / 1000, // kW
        monthlyGeneration: response.calculations.monthlyGeneration,
        monthlySavings: response.economics.monthlySavings,
        annualSavings: response.economics.annualSavings,
        systemCost: response.economics.systemCost,
        paybackPeriod: response.economics.paybackPeriod,
        co2Reduction: response.calculations.monthlyGeneration * 0.5, // kg CO2 por kWh
        charts: response.charts,
        recommendations: response.recommendations
      };

      setResults(calculatedResults);

      // Guardar en localStorage para uso offline
      const savedCalculations = JSON.parse(localStorage.getItem('solarCalculations') || '[]');
      savedCalculations.push({
        ...calculatedResults,
        timestamp: new Date().toISOString()
      });
      localStorage.setItem('solarCalculations', JSON.stringify(savedCalculations.slice(-10)));

    } catch (error) {
      console.error('Error calculando energía solar:', error);
      setError(isOnline ? 
        `Error: ${error.message}` : 
        'Sin conexión. Usando datos offline...');
      
      // En caso de error offline, usar datos guardados o fallback
      if (!isOnline) {
        const savedCalculations = JSON.parse(localStorage.getItem('solarCalculations') || '[]');
        if (savedCalculations.length > 0) {
          setResults(savedCalculations[savedCalculations.length - 1]);
        }
      }
    } finally {
      setLoading(false);
    }
  };

  // Datos para gráfico de barras (comparación antes/después)
  const barChartData = results ? {
    labels: ['Sin Panel Solar', 'Con Panel Solar'],
    datasets: [
      {
        label: 'Costo Mensual (S/)',
        data: [results.monthlySavings + 50, 50], // Asumiendo un costo base de S/50
        backgroundColor: ['#f44336', '#4caf50'],
        borderColor: ['#d32f2f', '#388e3c'],
        borderWidth: 1,
      },
    ],
  } : null;

  // Datos para gráfico de pastel (distribución de ahorros)
  const pieChartData = results ? {
    labels: ['Ahorro Energía', 'Costo Base'],
    datasets: [
      {
        data: [results.monthlySavings, 50],
        backgroundColor: ['#4caf50', '#ff9800'],
        borderColor: ['#388e3c', '#f57c00'],
        borderWidth: 2,
      },
    ],
  } : null;

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: 'Análisis de Ahorro Energético',
      },
    },
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4, ml: { md: '250px' }, pl: { md: 3 } }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <SolarIcon sx={{ fontSize: 32, color: 'warning.main', mr: 2 }} />
          <Typography variant="h4" gutterBottom>
            Cálculo de Energía Solar
          </Typography>
        </Box>
        <Typography variant="subtitle1" color="text.secondary">
          Estima el potencial de ahorro con paneles solares para tu terreno
        </Typography>
      </Box>

      {!isOnline && (
        <Alert severity="info" sx={{ mb: 3 }}>
          Modo offline: Los cálculos se basan en datos almacenados localmente
        </Alert>
      )}

      <Grid container spacing={3}>
        {/* Formulario de entrada */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Datos de tu Terreno
              </Typography>

              {/* Área del terreno */}
              <Box sx={{ mb: 3 }}>
                <Typography variant="body1" gutterBottom>
                  Área disponible (m²)
                  <Tooltip title="Área total donde se pueden instalar los paneles solares">
                    <InfoIcon sx={{ fontSize: 16, ml: 1, color: 'grey.500' }} />
                  </Tooltip>
                </Typography>
                <Slider
                  value={formData.area}
                  onChange={handleAreaChange}
                  min={10}
                  max={500}
                  step={10}
                  marks={[
                    { value: 10, label: '10m²' },
                    { value: 100, label: '100m²' },
                    { value: 250, label: '250m²' },
                    { value: 500, label: '500m²' }
                  ]}
                  valueLabelDisplay="on"
                  sx={{ mt: 2 }}
                />
                <TextField
                  type="number"
                  variant="outlined"
                  size="small"
                  value={formData.area}
                  onChange={(e) => setFormData(prev => ({ ...prev, area: parseInt(e.target.value) || 0 }))}
                  inputProps={{ min: 10, max: 500 }}
                  sx={{ mt: 2, width: 120 }}
                />
              </Box>

              {/* Tipo de sistema */}
              <FormControl fullWidth sx={{ mb: 3 }}>
                <InputLabel>Tipo de Sistema Solar</InputLabel>
                <Select
                  value={formData.systemType}
                  onChange={handleInputChange('systemType')}
                  label="Tipo de Sistema Solar"
                >
                  {Object.entries(systemTypes).map(([key, system]) => (
                    <MenuItem key={key} value={key}>
                      {system.label} - S/{system.costPerM2}/m² (Eficiencia: {(system.efficiency * 100).toFixed(0)}%)
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              {/* Ubicación */}
              <FormControl fullWidth sx={{ mb: 3 }}>
                <InputLabel>Ubicación</InputLabel>
                <Select
                  value={formData.location}
                  onChange={handleInputChange('location')}
                  label="Ubicación"
                >
                  <MenuItem value="lima">Lima</MenuItem>
                  <MenuItem value="arequipa">Arequipa</MenuItem>
                  <MenuItem value="cusco">Cusco</MenuItem>
                  <MenuItem value="trujillo">Trujillo</MenuItem>
                </Select>
              </FormControl>

              {error && (
                <Alert severity="error" sx={{ mb: 2 }}>
                  {error}
                </Alert>
              )}

              <Button
                fullWidth
                variant="contained"
                onClick={calculateSolarEnergy}
                disabled={loading || !formData.systemType}
                startIcon={loading ? <CircularProgress size={20} /> : <CalculateIcon />}
                sx={{ py: 1.5 }}
              >
                {loading ? 'Calculando...' : 'Calcular Potencial Solar'}
              </Button>
            </CardContent>
          </Card>
        </Grid>

        {/* Imagen de guía */}
        <Grid item xs={12} md={6}>
          <ImageGuide
            selectedType={formData.systemType}
            imageMapping={systemTypes}
            title="Panel Solar Seleccionado"
            width="100%"
            height={200}
          />
        </Grid>

        {/* Resultados */}
        {results && (
          <>
            <Grid item xs={12}>
              <Typography variant="h5" gutterBottom sx={{ mt: 2 }}>
                Resultados del Análisis
              </Typography>
            </Grid>

            {/* Tarjetas de resultados */}
            <Grid item xs={12} sm={6} md={3}>
              <Paper sx={{ p: 2, textAlign: 'center' }}>
                <TrendingUpIcon color="primary" sx={{ fontSize: 32, mb: 1 }} />
                <Typography variant="h6">{results.totalPower.toFixed(1)} kW</Typography>
                <Typography variant="body2" color="text.secondary">
                  Capacidad Instalada
                </Typography>
              </Paper>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <Paper sx={{ p: 2, textAlign: 'center' }}>
                <SolarIcon color="warning" sx={{ fontSize: 32, mb: 1 }} />
                <Typography variant="h6">{results.monthlyGeneration.toFixed(0)} kWh</Typography>
                <Typography variant="body2" color="text.secondary">
                  Generación Mensual
                </Typography>
              </Paper>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <Paper sx={{ p: 2, textAlign: 'center', bgcolor: 'success.light' }}>
                <Typography variant="h6" color="white">S/ {results.monthlySavings.toFixed(0)}</Typography>
                <Typography variant="body2" color="white">
                  Ahorro Mensual
                </Typography>
              </Paper>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <Paper sx={{ p: 2, textAlign: 'center', bgcolor: 'info.light' }}>
                <Typography variant="h6" color="white">{results.paybackPeriod} años</Typography>
                <Typography variant="body2" color="white">
                  Tiempo de Retorno
                </Typography>
              </Paper>
            </Grid>

            {/* Gráficos */}
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Comparación de Costos Mensuales
                  </Typography>
                  <Box sx={{ height: 300 }}>
                    {barChartData && <Bar data={barChartData} options={chartOptions} />}
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Distribución de Ahorros
                  </Typography>
                  <Box sx={{ height: 300 }}>
                    {pieChartData && <Pie data={pieChartData} options={chartOptions} />}
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            {/* Detalles adicionales */}
            <Grid item xs={12}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Detalles del Sistema
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="body1">
                        <strong>Área utilizada:</strong> {results.area} m²
                      </Typography>
                      <Typography variant="body1">
                        <strong>Tipo de panel:</strong> {results.systemType}
                      </Typography>
                      <Typography variant="body1">
                        <strong>Costo del sistema:</strong> S/ {results.systemCost.toLocaleString()}
                      </Typography>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="body1">
                        <strong>Ahorro anual:</strong> S/ {results.annualSavings.toFixed(0)}
                      </Typography>
                      <Typography variant="body1">
                        <strong>Reducción CO2:</strong> {results.co2Reduction.toFixed(0)} kg/mes
                      </Typography>
                      <Typography variant="body1" color="success.main">
                        <strong>ROI:</strong> {(100 / results.paybackPeriod).toFixed(1)}% anual
                      </Typography>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </Grid>
          </>
        )}
      </Grid>
    </Container>
  );
};

export default SolarEnergy;