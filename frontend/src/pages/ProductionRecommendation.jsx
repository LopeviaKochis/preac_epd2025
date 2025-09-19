import React, { useState, useEffect } from 'react';
import {
  Container,
  Grid,
  Card,
  CardContent,
  Typography,
  Box,
  Alert,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Chip,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  CircularProgress
} from '@mui/material';
import {
  Agriculture as CropIcon,
  CalendarToday as CalendarIcon,
  TrendingUp as YieldIcon,
  WbSunny as SeasonIcon,
  Calculate as CalculateIcon,
  // Eco as EcoIcon
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip as ChartTooltip,
  Legend,
} from 'chart.js';
import { Line, Bar } from 'react-chartjs-2';
import ImageGuide from '../components/ImageGuide';

// Registrar componentes de Chart.js
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  ChartTooltip,
  Legend
);

const ProductionRecommendation = () => {
  const { isOnline } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    cropType: '',
    plantingDate: null,
    harvestDate: null,
    area: 100,
    region: 'costa'
  });
  const [recommendations, setRecommendations] = useState(null);
  const [error, setError] = useState('');

  // Información de cultivos con imágenes
  const cropTypes = {
    maiz_amilaceo: {
      label: 'Maíz Amiláceo',
      growthPeriod: 180, // días
      optimalTemp: [15, 25], // °C
      yieldPerHa: 3.5, // toneladas
      pricePerTon: 1800, // S/ por tonelada
      src: '/src/assets/images/maiz-amilaceo.jpg',
      alt: 'Cultivo de Maíz Amiláceo',
      description: 'Ideal para altitudes de 2800-3500 msnm, resistente al frío'
    },
    maiz_duro: {
      label: 'Maíz Duro',
      growthPeriod: 120,
      optimalTemp: [20, 30],
      yieldPerHa: 8.5,
      pricePerTon: 1200,
      src: '/src/assets/images/maiz-duro.jpg',
      alt: 'Cultivo de Maíz Duro',
      description: 'Mejor adaptado a costa y selva, alto rendimiento'
    },
    papa: {
      label: 'Papa',
      growthPeriod: 150,
      optimalTemp: [10, 20],
      yieldPerHa: 25,
      pricePerTon: 1500,
      src: '/src/assets/images/papa.jpg',
      alt: 'Cultivo de Papa',
      description: 'Versátil, adaptado a diversas altitudes'
    },
    cebada: {
      label: 'Cebada',
      growthPeriod: 120,
      optimalTemp: [12, 22],
      yieldPerHa: 4.2,
      pricePerTon: 1100,
      src: '/src/assets/images/cebada.jpg',
      alt: 'Cultivo de Cebada',
      description: 'Resistente a sequía, ideal para sierra'
    },
    quinua: {
      label: 'Quinua',
      growthPeriod: 160,
      optimalTemp: [8, 18],
      yieldPerHa: 2.8,
      pricePerTon: 4500,
      src: '/src/assets/images/quinua.jpg',
      alt: 'Cultivo de Quinua',
      description: 'Alto valor comercial, superalimento andino'
    }
  };

  const regions = {
    costa: { label: 'Costa', altitude: [0, 500] },
    sierra: { label: 'Sierra', altitude: [500, 4000] },
    selva: { label: 'Selva', altitude: [80, 1000] }
  };

  const handleInputChange = (field) => (event) => {
    setFormData(prev => ({
      ...prev,
      [field]: event.target.value
    }));
    setError('');
  };

  const handleDateChange = (field) => (date) => {
    setFormData(prev => ({
      ...prev,
      [field]: date
    }));
  };

  const calculateRecommendations = async () => {
    if (!formData.cropType) {
      setError('Por favor selecciona un tipo de cultivo');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Simular llamada a API ML
      await new Promise(resolve => setTimeout(resolve, 2000));

      const cropInfo = cropTypes[formData.cropType];
      const currentDate = new Date();
      
      // Determinar fechas óptimas de siembra basadas en región y cultivo
      const optimalPlantingPeriods = getOptimalPlantingPeriods(formData.cropType, formData.region);
      
      // Calcular estimaciones de producción
      const areaHa = formData.area / 10000; // convertir m² a hectáreas
      const estimatedYield = cropInfo.yieldPerHa * areaHa * getYieldModifier(formData.region, formData.cropType);
      const estimatedRevenue = estimatedYield * cropInfo.pricePerTon;
      
      // Calcular fechas sugeridas
      const suggestedPlanting = getSuggestedDate(optimalPlantingPeriods);
      const suggestedHarvest = new Date(suggestedPlanting);
      suggestedHarvest.setDate(suggestedHarvest.getDate() + cropInfo.growthPeriod);

      // Generar calendario de actividades
      const calendar = generateCropCalendar(suggestedPlanting, cropInfo.growthPeriod);
      
      const calculatedRecommendations = {
        cropType: cropInfo.label,
        region: regions[formData.region].label,
        area: formData.area,
        suggestedPlanting,
        suggestedHarvest,
        estimatedYield: estimatedYield.toFixed(1),
        estimatedRevenue: estimatedRevenue.toFixed(0),
        profitability: calculateProfitability(estimatedRevenue, areaHa),
        riskLevel: assessRiskLevel(formData.cropType, formData.region),
        calendar,
        optimalConditions: {
          temperature: cropInfo.optimalTemp,
          rainfall: getOptimalRainfall(formData.cropType),
          soilPH: getOptimalSoilPH(formData.cropType)
        }
      };

      setRecommendations(calculatedRecommendations);

      // Guardar en localStorage
      const savedRecommendations = JSON.parse(localStorage.getItem('productionRecommendations') || '[]');
      savedRecommendations.push({
        ...calculatedRecommendations,
        timestamp: new Date().toISOString()
      });
      localStorage.setItem('productionRecommendations', JSON.stringify(savedRecommendations.slice(-10)));

    } catch (error) {
      setError('Error al calcular recomendaciones. Intenta nuevamente.');
      console.error('Error en recomendación de producción:', error);
    } finally {
      setLoading(false);
    }
  };

  // Funciones auxiliares
  const getOptimalPlantingPeriods = (crop, region) => {
    const periods = {
      costa: { start: [3, 4], end: [5, 6] }, // Marzo-Junio
      sierra: { start: [10, 11], end: [1, 2] }, // Oct-Feb
      selva: { start: [4, 5], end: [7, 8] } // Abril-Agosto
    };
    return periods[region] || periods.costa;
  };

  const getYieldModifier = (region, crop) => {
    const modifiers = {
      costa: { maiz_duro: 1.2, papa: 0.9, cebada: 0.8 },
      sierra: { maiz_amilaceo: 1.1, papa: 1.3, cebada: 1.2, quinua: 1.1 },
      selva: { maiz_duro: 1.0, papa: 0.7 }
    };
    return modifiers[region]?.[crop] || 1.0;
  };

  const getSuggestedDate = (periods) => {
    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    
    // Encontrar el próximo período óptimo
    const startMonth = periods.start[0];
    const suggestedDate = new Date(now.getFullYear(), startMonth - 1, 15);
    
    if (currentMonth > startMonth) {
      suggestedDate.setFullYear(suggestedDate.getFullYear() + 1);
    }
    
    return suggestedDate;
  };

  const generateCropCalendar = (plantingDate, growthPeriod) => {
    const activities = [];
    const start = new Date(plantingDate);
    
    // Actividades por etapas
    const stages = [
      { name: 'Preparación del terreno', offset: -14, duration: 7 },
      { name: 'Siembra', offset: 0, duration: 3 },
      { name: 'Primera fertilización', offset: 15, duration: 2 },
      { name: 'Control de malezas', offset: 30, duration: 5 },
      { name: 'Segunda fertilización', offset: 45, duration: 2 },
      { name: 'Control fitosanitario', offset: 60, duration: 3 },
      { name: 'Riego intensivo', offset: Math.floor(growthPeriod * 0.5), duration: 7 },
      { name: 'Preparación para cosecha', offset: growthPeriod - 14, duration: 7 },
      { name: 'Cosecha', offset: growthPeriod, duration: 10 }
    ];

    stages.forEach(stage => {
      const activityDate = new Date(start);
      activityDate.setDate(activityDate.getDate() + stage.offset);
      
      activities.push({
        activity: stage.name,
        date: activityDate.toLocaleDateString('es-PE'),
        duration: stage.duration,
        priority: stage.name.includes('fertilización') || stage.name.includes('Cosecha') ? 'high' : 'medium'
      });
    });

    return activities;
  };

  const calculateProfitability = (revenue, areaHa) => {
    const costs = areaHa * 8000; // Costo estimado por hectárea
    const profit = revenue - costs;
    return {
      costs,
      profit,
      margin: ((profit / revenue) * 100).toFixed(1)
    };
  };

  const assessRiskLevel = (crop, region) => {
    const riskMatrix = {
      costa: { low: ['maiz_duro'], medium: ['papa'], high: ['quinua'] },
      sierra: { low: ['papa', 'cebada'], medium: ['maiz_amilaceo', 'quinua'], high: ['maiz_duro'] },
      selva: { low: ['maiz_duro'], medium: ['papa'], high: ['cebada', 'quinua'] }
    };
    
    for (const [level, crops] of Object.entries(riskMatrix[region] || {})) {
      if (crops.includes(crop)) {
        return { level, color: level === 'low' ? 'success' : level === 'medium' ? 'warning' : 'error' };
      }
    }
    return { level: 'medium', color: 'warning' };
  };

  const getOptimalRainfall = (crop) => {
    const rainfall = {
      maiz_amilaceo: [400, 600],
      maiz_duro: [500, 800],
      papa: [400, 800],
      cebada: [300, 500],
      quinua: [300, 600]
    };
    return rainfall[crop] || [400, 600];
  };

  const getOptimalSoilPH = (crop) => {
    const ph = {
      maiz_amilaceo: [6.0, 7.5],
      maiz_duro: [5.8, 7.2],
      papa: [5.5, 6.5],
      cebada: [6.0, 7.5],
      quinua: [6.0, 8.5]
    };
    return ph[crop] || [6.0, 7.0];
  };

  // Datos para gráficos
  const yieldProjectionData = recommendations ? {
    labels: ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'],
    datasets: [
      {
        label: 'Rendimiento Proyectado (ton/ha)',
        data: generateMonthlyYieldProjection(recommendations.cropType),
        borderColor: '#4caf50',
        backgroundColor: 'rgba(76, 175, 80, 0.1)',
        tension: 0.4,
      }
    ],
  } : null;

  const generateMonthlyYieldProjection = (cropType) => {
    const baseYield = cropTypes[Object.keys(cropTypes).find(key => cropTypes[key].label === cropType)]?.yieldPerHa || 5;
    return Array.from({ length: 12 }, (_, i) => {
      const seasonality = Math.sin((i * Math.PI) / 6) * 0.3 + 1;
      return (baseYield * seasonality).toFixed(1);
    });
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4, ml: { md: '250px' }, pl: { md: 3 } }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <CropIcon sx={{ fontSize: 32, color: 'success.main', mr: 2 }} />
          <Typography variant="h4" gutterBottom>
            Recomendación de Producción
          </Typography>
        </Box>
        <Typography variant="subtitle1" color="text.secondary">
          Optimiza fechas de siembra y estimación de rendimiento para tus cultivos
        </Typography>
      </Box>

      {!isOnline && (
        <Alert severity="info" sx={{ mb: 3 }}>
          Modo offline: Las recomendaciones se basan en modelos almacenados localmente
        </Alert>
      )}

      <Grid container spacing={3}>
        {/* Formulario de configuración */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Configuración del Cultivo
              </Typography>

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
                      {crop.label} - {crop.yieldPerHa} ton/ha
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              {/* Región */}
              <FormControl fullWidth sx={{ mb: 3 }}>
                <InputLabel>Región</InputLabel>
                <Select
                  value={formData.region}
                  onChange={handleInputChange('region')}
                  label="Región"
                >
                  {Object.entries(regions).map(([key, region]) => (
                    <MenuItem key={key} value={key}>
                      {region.label} ({region.altitude[0]}-{region.altitude[1]} msnm)
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              {/* Área */}
              <FormControl fullWidth sx={{ mb: 3 }}>
                <InputLabel>Área de Cultivo (m²)</InputLabel>
                <Select
                  value={formData.area}
                  onChange={handleInputChange('area')}
                  label="Área de Cultivo (m²)"
                >
                  <MenuItem value={100}>100 m² (0.01 ha)</MenuItem>
                  <MenuItem value={1000}>1,000 m² (0.1 ha)</MenuItem>
                  <MenuItem value={5000}>5,000 m² (0.5 ha)</MenuItem>
                  <MenuItem value={10000}>10,000 m² (1 ha)</MenuItem>
                  <MenuItem value={50000}>50,000 m² (5 ha)</MenuItem>
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
                onClick={calculateRecommendations}
                disabled={loading || !formData.cropType}
                startIcon={loading ? <CircularProgress size={20} /> : <CalculateIcon />}
                sx={{ py: 1.5 }}
              >
                {loading ? 'Generando Recomendaciones...' : 'Generar Recomendaciones'}
              </Button>
            </CardContent>
          </Card>
        </Grid>

        {/* Imagen de guía del cultivo */}
        <Grid item xs={12} md={6}>
          <ImageGuide
            selectedType={formData.cropType}
            imageMapping={cropTypes}
            title="Cultivo Seleccionado"
            width="100%"
            height={250}
          />
        </Grid>

        {/* Resultados de recomendaciones */}
        {recommendations && (
          <>
            <Grid item xs={12}>
              <Typography variant="h5" gutterBottom sx={{ mt: 2 }}>
                Recomendaciones de Producción
              </Typography>
            </Grid>

            {/* Resumen de recomendaciones */}
            <Grid item xs={12} sm={6} md={3}>
              <Paper sx={{ p: 2, textAlign: 'center', bgcolor: 'success.light' }}>
                <CalendarIcon sx={{ fontSize: 32, mb: 1, color: 'white' }} />
                <Typography variant="h6" color="white">
                  {recommendations.suggestedPlanting.toLocaleDateString('es-PE')}
                </Typography>
                <Typography variant="body2" color="white">
                  Siembra Sugerida
                </Typography>
              </Paper>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <Paper sx={{ p: 2, textAlign: 'center', bgcolor: 'warning.light' }}>
                <YieldIcon sx={{ fontSize: 32, mb: 1, color: 'white' }} />
                <Typography variant="h6" color="white">
                  {recommendations.estimatedYield} ton
                </Typography>
                <Typography variant="body2" color="white">
                  Rendimiento Estimado
                </Typography>
              </Paper>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <Paper sx={{ p: 2, textAlign: 'center', bgcolor: 'info.light' }}>
                <Typography variant="h6" color="white">
                  S/ {Number(recommendations.estimatedRevenue).toLocaleString()}
                </Typography>
                <Typography variant="body2" color="white">
                  Ingresos Estimados
                </Typography>
              </Paper>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <Paper sx={{ p: 2, textAlign: 'center' }}>
                <Chip 
                  label={`Riesgo ${recommendations.riskLevel.level.toUpperCase()}`}
                  color={recommendations.riskLevel.color}
                  sx={{ fontSize: '1rem', py: 2, px: 1 }}
                />
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                  Nivel de Riesgo
                </Typography>
              </Paper>
            </Grid>

            {/* Calendario de actividades */}
            <Grid item xs={12} md={8}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Calendario de Actividades
                  </Typography>
                  <TableContainer>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Actividad</TableCell>
                          <TableCell>Fecha</TableCell>
                          <TableCell>Duración</TableCell>
                          <TableCell>Prioridad</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {recommendations.calendar.map((activity, index) => (
                          <TableRow key={index}>
                            <TableCell>{activity.activity}</TableCell>
                            <TableCell>{activity.date}</TableCell>
                            <TableCell>{activity.duration} días</TableCell>
                            <TableCell>
                              <Chip 
                                label={activity.priority}
                                color={activity.priority === 'high' ? 'error' : 'warning'}
                                size="small"
                              />
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </CardContent>
              </Card>
            </Grid>

            {/* Condiciones óptimas */}
            <Grid item xs={12} md={4}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Condiciones Óptimas
                  </Typography>
                  
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" color="text.secondary">
                      Temperatura:
                    </Typography>
                    <Typography variant="body1">
                      {recommendations.optimalConditions.temperature[0]}°C - {recommendations.optimalConditions.temperature[1]}°C
                    </Typography>
                  </Box>

                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" color="text.secondary">
                      Precipitación anual:
                    </Typography>
                    <Typography variant="body1">
                      {recommendations.optimalConditions.rainfall[0]} - {recommendations.optimalConditions.rainfall[1]} mm
                    </Typography>
                  </Box>

                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" color="text.secondary">
                      pH del suelo:
                    </Typography>
                    <Typography variant="body1">
                      {recommendations.optimalConditions.soilPH[0]} - {recommendations.optimalConditions.soilPH[1]}
                    </Typography>
                  </Box>

                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      Rentabilidad:
                    </Typography>
                    <Typography variant="body1" color="success.main">
                      {recommendations.profitability.margin}% margen
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            {/* Gráfico de proyección */}
            {yieldProjectionData && (
              <Grid item xs={12}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Proyección de Rendimiento Anual
                    </Typography>
                    <Box sx={{ height: 300 }}>
                      <Line 
                        data={yieldProjectionData} 
                        options={{
                          responsive: true,
                          maintainAspectRatio: false,
                          plugins: {
                            legend: { position: 'top' },
                            title: { display: true, text: 'Variación estacional del rendimiento' }
                          }
                        }} 
                      />
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            )}
          </>
        )}
      </Grid>
    </Container>
  );
};

export default ProductionRecommendation;