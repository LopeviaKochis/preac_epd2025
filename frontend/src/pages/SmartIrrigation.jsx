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
  Tooltip,
  Chip
} from '@mui/material';
import {
  Opacity as WaterIcon,
  Calculate as CalculateIcon,
  Water as DropIcon,
  //Eco as EcoIcon,
  Info as InfoIcon,
  MonetizationOn as MoneyIcon
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

const SmartIrrigation = () => {
  const { isOnline } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    area: 100,
    systemType: '',
    cropType: 'maiz',
    soilType: 'arcilloso'
  });
  const [results, setResults] = useState(null);
  const [error, setError] = useState('');

  // Tipos de sistemas de riego con imágenes
  const irrigationSystems = {
    goteo: {
      label: 'Riego por Goteo',
      efficiency: 0.95,
      costPerM2: 25,
      waterSaving: 0.4,
      src: '/src/assets/images/riego-goteo.jpg',
      alt: 'Sistema de Riego por Goteo',
      description: 'Máxima eficiencia, ideal para cultivos en hileras'
    },
    aspersion: {
      label: 'Riego por Aspersión',
      efficiency: 0.75,
      costPerM2: 20,
      waterSaving: 0.25,
      src: '/src/assets/images/riego-aspersion.jpg',
      alt: 'Sistema de Riego por Aspersión',
      description: 'Buena cobertura, ideal para cultivos extensivos'
    },
    microaspersion: {
      label: 'Micro Aspersión',
      efficiency: 0.85,
      costPerM2: 30,
      waterSaving: 0.35,
      src: '/src/assets/images/riego-microaspersion.jpg',
      alt: 'Sistema de Micro Aspersión',
      description: 'Equilibrio entre eficiencia y cobertura'
    },
    surcos: {
      label: 'Riego por Surcos Tecnificado',
      efficiency: 0.65,
      costPerM2: 12,
      waterSaving: 0.15,
      src: '/src/assets/images/riego-surcos.jpg',
      alt: 'Riego por Surcos Tecnificado',
      description: 'Económico, mejorado con tecnología'
    }
  };

  const cropTypes = {
    maiz: { label: 'Maíz', waterNeed: 600 }, // litros/m²/mes
    papa: { label: 'Papa', waterNeed: 450 },
    cebada: { label: 'Cebada', waterNeed: 400 },
    quinua: { label: 'Quinua', waterNeed: 350 }
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

  const calculateIrrigation = async () => {
    if (!formData.systemType) {
      setError('Por favor selecciona un tipo de sistema de riego');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Simular llamada a API
      await new Promise(resolve => setTimeout(resolve, 1500));

      const systemInfo = irrigationSystems[formData.systemType];
      const cropInfo = cropTypes[formData.cropType];
      const waterRate = 3.5; // S/ por m³ en Perú

      // Cálculos de riego tradicional vs inteligente
      const traditionalWaterUse = formData.area * cropInfo.waterNeed; // litros/mes
      const smartWaterUse = traditionalWaterUse * systemInfo.efficiency;
      const waterSaved = traditionalWaterUse - smartWaterUse;
      
      const traditionalCost = (traditionalWaterUse / 1000) * waterRate; // S/ por mes
      const smartCost = (smartWaterUse / 1000) * waterRate;
      const monthlySavings = traditionalCost - smartCost;
      
      const systemCost = formData.area * systemInfo.costPerM2;
      const annualSavings = monthlySavings * 12;
      const paybackPeriod = Math.ceil(systemCost / annualSavings);

      // Cálculo de energía (si tiene bomba solar)
      const pumpPower = Math.max(1, formData.area / 100); // kW estimado
      const monthlyEnergyUse = pumpPower * 4 * 30; // 4 horas/día
      const energyGenerated = pumpPower * 6 * 30; // 6 horas sol/día
      const energySavings = (energyGenerated - monthlyEnergyUse) * 0.6; // S/kWh

      const calculatedResults = {
        area: formData.area,
        systemType: systemInfo.label,
        cropType: cropInfo.label,
        traditionalWaterUse: traditionalWaterUse / 1000, // m³
        smartWaterUse: smartWaterUse / 1000,
        waterSaved: waterSaved / 1000,
        waterSavingPercent: ((waterSaved / traditionalWaterUse) * 100),
        monthlySavings,
        annualSavings,
        systemCost,
        paybackPeriod,
        efficiency: systemInfo.efficiency * 100,
        energyGenerated: energyGenerated / 1000, // MWh
        energySavings
      };

      setResults(calculatedResults);

      // Guardar en localStorage para uso offline
      const savedCalculations = JSON.parse(localStorage.getItem('irrigationCalculations') || '[]');
      savedCalculations.push({
        ...calculatedResults,
        timestamp: new Date().toISOString()
      });
      localStorage.setItem('irrigationCalculations', JSON.stringify(savedCalculations.slice(-10)));

    } catch (error) {
      setError('Error al calcular. Intenta nuevamente.');
      console.error('Error en cálculo de riego:', error);
    } finally {
      setLoading(false);
    }
  };

  // Datos para gráfico de barras (uso de agua)
  const waterBarData = results ? {
    labels: ['Riego Tradicional', 'Riego Inteligente'],
    datasets: [
      {
        label: 'Uso de Agua (m³/mes)',
        data: [results.traditionalWaterUse, results.smartWaterUse],
        backgroundColor: ['#f44336', '#2196f3'],
        borderColor: ['#d32f2f', '#1976d2'],
        borderWidth: 1,
      },
    ],
  } : null;

  // Datos para gráfico de pastel (distribución de ahorros)
  const savingsPieData = results ? {
    labels: ['Ahorro en Agua', 'Ahorro en Energía', 'Otros Beneficios'],
    datasets: [
      {
        data: [results.monthlySavings, results.energySavings, results.monthlySavings * 0.2],
        backgroundColor: ['#2196f3', '#ff9800', '#4caf50'],
        borderColor: ['#1976d2', '#f57c00', '#388e3c'],
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
        text: 'Análisis de Eficiencia de Riego',
      },
    },
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4, ml: { md: '250px' }, pl: { md: 3 } }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <WaterIcon sx={{ fontSize: 32, color: 'primary.main', mr: 2 }} />
          <Typography variant="h4" gutterBottom>
            Riego Inteligente
          </Typography>
        </Box>
        <Typography variant="subtitle1" color="text.secondary">
          Optimiza el uso del agua y reduce costos con sistemas de riego eficientes
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
                Configuración del Sistema
              </Typography>

              {/* Área del cultivo */}
              <Box sx={{ mb: 3 }}>
                <Typography variant="body1" gutterBottom>
                  Área de cultivo (m²)
                  <Tooltip title="Área total que necesita ser irrigada">
                    <InfoIcon sx={{ fontSize: 16, ml: 1, color: 'grey.500' }} />
                  </Tooltip>
                </Typography>
                <Slider
                  value={formData.area}
                  onChange={handleAreaChange}
                  min={50}
                  max={2000}
                  step={50}
                  marks={[
                    { value: 50, label: '50m²' },
                    { value: 500, label: '500m²' },
                    { value: 1000, label: '1000m²' },
                    { value: 2000, label: '2000m²' }
                  ]}
                  valueLabelDisplay="on"
                  sx={{ mt: 2 }}
                />
              </Box>

              {/* Tipo de cultivo */}
              <FormControl fullWidth sx={{ mb: 3 }}>
                <InputLabel>Tipo de Cultivo</InputLabel>
                <Select
                  value={formData.cropType}
                  onChange={handleInputChange('cropType')}
                  label="Tipo de Cultivo"
                >
                  {Object.entries(cropTypes).map(([key, crop]) => (
                    <MenuItem key={key} value={key}>
                      {crop.label} ({crop.waterNeed}L/m²/mes)
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              {/* Tipo de sistema de riego */}
              <FormControl fullWidth sx={{ mb: 3 }}>
                <InputLabel>Sistema de Riego</InputLabel>
                <Select
                  value={formData.systemType}
                  onChange={handleInputChange('systemType')}
                  label="Sistema de Riego"
                >
                  {Object.entries(irrigationSystems).map(([key, system]) => (
                    <MenuItem key={key} value={key}>
                      {system.label} - S/{system.costPerM2}/m² (Eficiencia: {(system.efficiency * 100).toFixed(0)}%)
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              {/* Tipo de suelo */}
              <FormControl fullWidth sx={{ mb: 3 }}>
                <InputLabel>Tipo de Suelo</InputLabel>
                <Select
                  value={formData.soilType}
                  onChange={handleInputChange('soilType')}
                  label="Tipo de Suelo"
                >
                  <MenuItem value="arenoso">Arenoso (Drenaje rápido)</MenuItem>
                  <MenuItem value="arcilloso">Arcilloso (Retención alta)</MenuItem>
                  <MenuItem value="limoso">Limoso (Equilibrado)</MenuItem>
                  <MenuItem value="franco">Franco (Ideal)</MenuItem>
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
                onClick={calculateIrrigation}
                disabled={loading || !formData.systemType}
                startIcon={loading ? <CircularProgress size={20} /> : <CalculateIcon />}
                sx={{ py: 1.5 }}
              >
                {loading ? 'Calculando...' : 'Calcular Eficiencia de Riego'}
              </Button>
            </CardContent>
          </Card>
        </Grid>

        {/* Imagen de guía */}
        <Grid item xs={12} md={6}>
          <ImageGuide
            selectedType={formData.systemType}
            imageMapping={irrigationSystems}
            title="Sistema de Riego Seleccionado"
            width="100%"
            height={250}
          />
          
          {formData.systemType && (
            <Card sx={{ mt: 2 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom color="primary">
                  Beneficios del Sistema
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  <Chip
                    icon={<DropIcon />}
                    label={`${(irrigationSystems[formData.systemType]?.efficiency * 100).toFixed(0)}% Eficiencia`}
                    color="primary"
                    variant="outlined"
                  />
                  <Chip
                    //icon={<EcoIcon />}
                    label={`${(irrigationSystems[formData.systemType]?.waterSaving * 100).toFixed(0)}% Menos Agua`}
                    color="success"
                    variant="outlined"
                  />
                  <Chip
                    icon={<MoneyIcon />}
                    label="Reducción de Costos"
                    color="warning"
                    variant="outlined"
                  />
                </Box>
              </CardContent>
            </Card>
          )}
        </Grid>

        {/* Resultados */}
        {results && (
          <>
            <Grid item xs={12}>
              <Typography variant="h5" gutterBottom sx={{ mt: 2 }}>
                Análisis de Eficiencia
              </Typography>
            </Grid>

            {/* Tarjetas de resultados */}
            <Grid item xs={12} sm={6} md={3}>
              <Paper sx={{ p: 2, textAlign: 'center', bgcolor: 'primary.light' }}>
                <DropIcon sx={{ fontSize: 32, mb: 1, color: 'white' }} />
                <Typography variant="h6" color="white">
                  {results.waterSaved.toFixed(1)} m³
                </Typography>
                <Typography variant="body2" color="white">
                  Agua Ahorrada/Mes
                </Typography>
              </Paper>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <Paper sx={{ p: 2, textAlign: 'center', bgcolor: 'success.light' }}>
                <Typography variant="h6" color="white">
                  {results.waterSavingPercent.toFixed(0)}%
                </Typography>
                <Typography variant="body2" color="white">
                  Reducción de Agua
                </Typography>
              </Paper>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <Paper sx={{ p: 2, textAlign: 'center', bgcolor: 'warning.light' }}>
                <MoneyIcon sx={{ fontSize: 32, mb: 1, color: 'white' }} />
                <Typography variant="h6" color="white">
                  S/ {results.monthlySavings.toFixed(0)}
                </Typography>
                <Typography variant="body2" color="white">
                  Ahorro Mensual
                </Typography>
              </Paper>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <Paper sx={{ p: 2, textAlign: 'center', bgcolor: 'info.light' }}>
                <Typography variant="h6" color="white">
                  {results.paybackPeriod} años
                </Typography>
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
                    Comparación de Uso de Agua
                  </Typography>
                  <Box sx={{ height: 300 }}>
                    {waterBarData && <Bar data={waterBarData} options={chartOptions} />}
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Distribución de Ahorros Mensuales
                  </Typography>
                  <Box sx={{ height: 300 }}>
                    {savingsPieData && <Pie data={savingsPieData} options={chartOptions} />}
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            {/* Detalles del sistema */}
            <Grid item xs={12}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Detalles del Sistema de Riego
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="body1">
                        <strong>Área de cultivo:</strong> {results.area} m²
                      </Typography>
                      <Typography variant="body1">
                        <strong>Cultivo:</strong> {results.cropType}
                      </Typography>
                      <Typography variant="body1">
                        <strong>Sistema:</strong> {results.systemType}
                      </Typography>
                      <Typography variant="body1">
                        <strong>Eficiencia:</strong> {results.efficiency.toFixed(0)}%
                      </Typography>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="body1">
                        <strong>Costo de instalación:</strong> S/ {results.systemCost.toLocaleString()}
                      </Typography>
                      <Typography variant="body1">
                        <strong>Ahorro anual:</strong> S/ {results.annualSavings.toFixed(0)}
                      </Typography>
                      <Typography variant="body1">
                        <strong>Energía generada:</strong> {results.energyGenerated.toFixed(1)} MWh/mes
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

export default SmartIrrigation;