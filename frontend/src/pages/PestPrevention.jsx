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
  LinearProgress,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider
} from '@mui/material';
import {
  BugReport as PestIcon,
  ExpandMore as ExpandMoreIcon,
  Warning as WarningIcon,
  CheckCircle as SafeIcon,
  LocalPharmacy as TreatmentIcon,
  Schedule as TimingIcon,
  // Eco as OrganicIcon,
  Science as ChemicalIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';
//import { Eco as EcoIcon, Spa as OrganicIcon } from '@mui/icons-material';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip as ChartTooltip,
  Legend,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';
import ImageGuide from '../components/ImageGuide';
import PhoneOptIn from '../components/PhoneOptIn';

// Registrar componentes de Chart.js
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  ChartTooltip,
  Legend
);

const PestPrevention = () => {
  const { isOnline } = useAuth();
  const [loading, setLoading] = useState(false);
  const [selectedCrop, setSelectedCrop] = useState('maiz');
  const [selectedSeason, setSelectedSeason] = useState('verano');
  const [pestAlerts, setPestAlerts] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [lastUpdate, setLastUpdate] = useState(null);

  // Información de cultivos y plagas asociadas
  const cropPestMapping = {
    maiz: {
      label: 'Maíz',
      commonPests: ['cogollero', 'gusano_elote', 'pulgon']
    },
    papa: {
      label: 'Papa',
      commonPests: ['polilla_papa', 'gorgojo_andes', 'mosca_blanca']
    },
    cebada: {
      label: 'Cebada',
      commonPests: ['pulgon_cereal', 'gusano_alambre', 'trips']
    },
    quinua: {
      label: 'Quinua',
      commonPests: ['polilla_quinua', 'pulgon', 'gusano_cortador']
    }
  };

  // Base de datos de plagas con imágenes
  const pestDatabase = {
    cogollero: {
      name: 'Gusano Cogollero',
      scientificName: 'Spodoptera frugiperda',
      severity: 'high',
      affectedCrops: ['maiz'],
      symptoms: ['Hojas perforadas', 'Excremento en el cogollo', 'Plantas marchitas'],
      src: '/src/assets/images/gusano-cogollero.jpg',
      alt: 'Gusano Cogollero del Maíz',
      description: 'Plaga principal del maíz, ataca principalmente el cogollo'
    },
    gusano_elote: {
      name: 'Gusano del Elote',
      scientificName: 'Helicoverpa zea',
      severity: 'medium',
      affectedCrops: ['maiz'],
      symptoms: ['Mazorcas dañadas', 'Granos perforados', 'Presencia de larvas'],
      src: '/src/assets/images/gusano-elote.jpg',
      alt: 'Gusano del Elote',
      description: 'Ataca las mazorcas durante la formación del grano'
    },
    polilla_papa: {
      name: 'Polilla de la Papa',
      scientificName: 'Phthorimaea operculella',
      severity: 'high',
      affectedCrops: ['papa'],
      symptoms: ['Tubérculos perforados', 'Galerías en hojas', 'Pérdida de peso'],
      src: '/src/assets/images/polilla-papa.jpg',
      alt: 'Polilla de la Papa',
      description: 'Principal plaga de la papa en almacén y campo'
    },
    pulgon: {
      name: 'Pulgón',
      scientificName: 'Aphis spp.',
      severity: 'medium',
      affectedCrops: ['maiz', 'papa', 'quinua'],
      symptoms: ['Hojas amarillentas', 'Melaza pegajosa', 'Deformación de brotes'],
      src: '/src/assets/images/pulgon.jpg',
      alt: 'Pulgón Verde',
      description: 'Insecto chupador que transmite virus'
    },
    gorgojo_andes: {
      name: 'Gorgojo de los Andes',
      scientificName: 'Premnotrypes spp.',
      severity: 'high',
      affectedCrops: ['papa'],
      symptoms: ['Tubérculos perforados', 'Larvas en tubérculos', 'Reducción del rendimiento'],
      src: '/src/assets/images/gorgojo-andes.jpg',
      alt: 'Gorgojo de los Andes',
      description: 'Plaga específica de zonas altoandinas'
    },
    polilla_quinua: {
      name: 'Polilla de la Quinua',
      scientificName: 'Eurysacca melanocampta',
      severity: 'medium',
      affectedCrops: ['quinua'],
      symptoms: ['Panojas dañadas', 'Granos perforados', 'Telas de araña'],
      src: '/src/assets/images/polilla-quinua.jpg',
      alt: 'Polilla de la Quinua',
      description: 'Afecta la panoja durante la formación del grano'
    }
  };

  // Tratamientos recomendados
  const treatmentDatabase = {
    organic: {
      cogollero: [
        'Bacillus thuringiensis (Bt)',
        'Neem (Azadirachta indica)',
        'Trichogramma (control biológico)',
        'Rotación de cultivos'
      ],
      polilla_papa: [
        'Feromonas para trampeo',
        'Beauveria bassiana',
        'Almacenamiento hermético',
        'Limpieza de tubérculos'
      ],
      pulgon: [
        'Jabón potásico',
        'Aceite de neem',
        'Coccinélidos (mariquitas)',
        'Pulgones parasitados'
      ]
    },
    chemical: {
      cogollero: [
        'Clorantraniliprole',
        'Espinosad',
        'Flubendiamida',
        'Alternancia de productos'
      ],
      polilla_papa: [
        'Piretroides',
        'Ciromazina',
        'Imidacloprid',
        'Fumigación de almacenes'
      ],
      pulgon: [
        'Imidacloprid',
        'Tiametoxam',
        'Pirimicarb',
        'Aplicación foliar'
      ]
    }
  };

  useEffect(() => {
    loadPestData();
  }, [selectedCrop, selectedSeason, isOnline]);

  const loadPestData = async () => {
    setLoading(true);

    try {
      if (isOnline) {
        // Simular llamada a API de ML para predicción de plagas
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        const pestData = generatePestPredictions();
        setPestAlerts(pestData.alerts);
        setRecommendations(pestData.recommendations);
        setLastUpdate(new Date());

        // Guardar en localStorage
        localStorage.setItem('pestData', JSON.stringify({
          alerts: pestData.alerts,
          recommendations: pestData.recommendations,
          crop: selectedCrop,
          season: selectedSeason,
          timestamp: new Date().toISOString()
        }));
      } else {
        // Modo offline
        const cachedData = localStorage.getItem('pestData');
        if (cachedData) {
          const parsed = JSON.parse(cachedData);
          setPestAlerts(parsed.alerts);
          setRecommendations(parsed.recommendations);
          setLastUpdate(new Date(parsed.timestamp));
        } else {
          const pestData = generatePestPredictions();
          setPestAlerts(pestData.alerts);
          setRecommendations(pestData.recommendations);
        }
      }
    } catch (error) {
      console.error('Error cargando datos de plagas:', error);
    } finally {
      setLoading(false);
    }
  };

  const generatePestPredictions = () => {
    const cropPests = cropPestMapping[selectedCrop]?.commonPests || [];
    const alerts = [];
    const recommendations = [];

    cropPests.forEach(pestKey => {
      const pest = pestDatabase[pestKey];
      if (!pest) return;

      // Generar probabilidad basada en temporada y condiciones
      const probability = generatePestProbability(pestKey, selectedSeason);
      
      if (probability > 0.3) {
        alerts.push({
          id: pestKey,
          pest: pest.name,
          scientificName: pest.scientificName,
          probability: probability,
          severity: pest.severity,
          riskLevel: probability > 0.7 ? 'high' : probability > 0.5 ? 'medium' : 'low',
          symptoms: pest.symptoms,
          affectedCrops: pest.affectedCrops
        });

        // Generar recomendaciones específicas
        recommendations.push({
          pestId: pestKey,
          pestName: pest.name,
          organic: treatmentDatabase.organic[pestKey] || [],
          chemical: treatmentDatabase.chemical[pestKey] || [],
          preventive: generatePreventiveMeasures(pestKey),
          timing: generateOptimalTiming(pestKey, selectedSeason)
        });
      }
    });

    return { alerts, recommendations };
  };

  const generatePestProbability = (pestKey, season) => {
    // Factores que afectan la probabilidad de plagas
    const seasonalFactors = {
      verano: { cogollero: 0.8, polilla_papa: 0.6, pulgon: 0.7 },
      invierno: { cogollero: 0.3, polilla_papa: 0.8, pulgon: 0.4 },
      primavera: { cogollero: 0.6, polilla_papa: 0.5, pulgon: 0.8 },
      otono: { cogollero: 0.5, polilla_papa: 0.7, pulgon: 0.6 }
    };

    const baseProbability = seasonalFactors[season]?.[pestKey] || 0.5;
    const randomVariation = (Math.random() - 0.5) * 0.3;
    
    return Math.max(0, Math.min(1, baseProbability + randomVariation));
  };

  const generatePreventiveMeasures = (pestKey) => {
    const preventiveMeasures = {
      cogollero: [
        'Monitoreo semanal de trampas de feromonas',
        'Eliminación de malezas hospederas',
        'Siembra escalonada para romper ciclo',
        'Mantener cultivos libres de rastrojos'
      ],
      polilla_papa: [
        'Aporque alto para proteger tubérculos',
        'Cosecha oportuna',
        'Selección de semilla certificada',
        'Almacenamiento en lugares frescos'
      ],
      pulgon: [
        'Plantas repelentes en bordes',
        'Control de hormigas',
        'Riego por aspersión',
        'Eliminación de plantas enfermas'
      ]
    };

    return preventiveMeasures[pestKey] || [];
  };

  const generateOptimalTiming = (pestKey, season) => {
    const timingMap = {
      cogollero: {
        verano: 'Aplicar control entre 15-30 días después de siembra',
        invierno: 'Monitoreo intensivo durante emergencia'
      },
      polilla_papa: {
        verano: 'Control antes de floración y después de cosecha',
        invierno: 'Fumigación de almacenes cada 2 meses'
      },
      pulgon: {
        verano: 'Control preventivo al inicio de brotación',
        invierno: 'Aplicaciones cada 15 días si hay presencia'
      }
    };

    return timingMap[pestKey]?.[season] || 'Monitoreo continuo recomendado';
  };

  const handleCropChange = (event) => {
    setSelectedCrop(event.target.value);
  };

  const handleSeasonChange = (event) => {
    setSelectedSeason(event.target.value);
  };

  const handleRefresh = () => {
    loadPestData();
  };

  // Datos para gráfico de probabilidades
  const probabilityChartData = {
    labels: pestAlerts.map(alert => alert.pest),
    datasets: [
      {
        label: 'Probabilidad de Aparición (%)',
        data: pestAlerts.map(alert => (alert.probability * 100).toFixed(1)),
        backgroundColor: pestAlerts.map(alert => {
          if (alert.riskLevel === 'high') return '#f44336';
          if (alert.riskLevel === 'medium') return '#ff9800';
          return '#4caf50';
        }),
        borderColor: '#333',
        borderWidth: 1,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: 'Probabilidad de Aparición de Plagas',
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        max: 100,
        title: {
          display: true,
          text: 'Probabilidad (%)'
        }
      }
    },
  };

  const getRiskColor = (riskLevel) => {
    switch (riskLevel) {
      case 'high': return 'error';
      case 'medium': return 'warning';
      default: return 'success';
    }
  };

  const getSeverityIcon = (severity) => {
    switch (severity) {
      case 'high': return <WarningIcon color="error" />;
      case 'medium': return <WarningIcon color="warning" />;
      default: return <SafeIcon color="success" />;
    }
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4, ml: { md: '250px' }, pl: { md: 3 } }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <PestIcon sx={{ fontSize: 32, color: 'error.main', mr: 2 }} />
            <Typography variant="h4" gutterBottom>
              Prevención de Plagas
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
          Detección temprana y prevención de plagas mediante inteligencia artificial
        </Typography>
        
        {lastUpdate && (
          <Typography variant="caption" color="text.secondary">
            Última actualización: {lastUpdate.toLocaleString('es-PE')}
          </Typography>
        )}
      </Box>

      {!isOnline && (
        <Alert severity="info" sx={{ mb: 3 }}>
          Modo offline: Predicciones basadas en modelos almacenados localmente
        </Alert>
      )}

      {/* Configuración */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={6}>
          <FormControl fullWidth>
            <InputLabel>Cultivo</InputLabel>
            <Select
              value={selectedCrop}
              onChange={handleCropChange}
              label="Cultivo"
            >
              {Object.entries(cropPestMapping).map(([key, crop]) => (
                <MenuItem key={key} value={key}>
                  {crop.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>
        
        <Grid item xs={12} md={6}>
          <FormControl fullWidth>
            <InputLabel>Temporada</InputLabel>
            <Select
              value={selectedSeason}
              onChange={handleSeasonChange}
              label="Temporada"
            >
              <MenuItem value="verano">Verano (Dic-Mar)</MenuItem>
              <MenuItem value="otono">Otoño (Mar-Jun)</MenuItem>
              <MenuItem value="invierno">Invierno (Jun-Sep)</MenuItem>
              <MenuItem value="primavera">Primavera (Sep-Dic)</MenuItem>
            </Select>
          </FormControl>
        </Grid>
      </Grid>

      {/* CTA: Suscripción SMS */}
      <Card sx={{ mb: 4 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            ¿Quieres recibir alertas de plagas por SMS?
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Suscríbete con tu número (+51) para recibir notificaciones cuando el riesgo aumente.
          </Typography>
          <PhoneOptIn />
        </CardContent>
      </Card>

      {loading && <LinearProgress sx={{ mb: 3 }} />}

      {/* Alertas de plagas */}
      {pestAlerts.length > 0 && (
        <>
          <Typography variant="h6" gutterBottom>
            Alertas de Plagas Detectadas
          </Typography>
          
          <Grid container spacing={2} sx={{ mb: 4 }}>
            {pestAlerts.map((alert) => (
              <Grid item xs={12} md={6} key={alert.id}>
                <Card sx={{ height: '100%' }}>
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      {getSeverityIcon(alert.severity)}
                      <Typography variant="h6" sx={{ ml: 1, flexGrow: 1 }}>
                        {alert.pest}
                      </Typography>
                      <Chip 
                        label={`${(alert.probability * 100).toFixed(0)}%`}
                        color={getRiskColor(alert.riskLevel)}
                        size="small"
                      />
                    </Box>
                    
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                      <em>{alert.scientificName}</em>
                    </Typography>
                    
                    <Typography variant="body2" sx={{ mb: 2 }}>
                      <strong>Síntomas a observar:</strong>
                    </Typography>
                    
                    <List dense>
                      {alert.symptoms.map((symptom, index) => (
                        <ListItem key={index} sx={{ py: 0 }}>
                          <ListItemIcon sx={{ minWidth: 20 }}>
                            <Box sx={{ width: 4, height: 4, bgcolor: 'text.secondary', borderRadius: '50%' }} />
                          </ListItemIcon>
                          <ListItemText primary={symptom} />
                        </ListItem>
                      ))}
                    </List>

                    <Box sx={{ mt: 2 }}>
                      <ImageGuide
                        selectedType={alert.id}
                        imageMapping={pestDatabase}
                        title=""
                        width="100%"
                        height={120}
                        showDescription={false}
                      />
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>

          {/* Gráfico de probabilidades */}
          <Card sx={{ mb: 4 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Análisis de Riesgo por Plaga
              </Typography>
              <Box sx={{ height: 300 }}>
                <Bar data={probabilityChartData} options={chartOptions} />
              </Box>
            </CardContent>
          </Card>
        </>
      )}

      {/* Recomendaciones de tratamiento */}
      {recommendations.length > 0 && (
        <Box>
          <Typography variant="h6" gutterBottom>
            Recomendaciones de Tratamiento
          </Typography>
          
          {recommendations.map((rec, index) => (
            <Accordion key={index} sx={{ mb: 2 }}>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                  <PestIcon sx={{ mr: 2, color: 'error.main' }} />
                  <Typography variant="subtitle1" sx={{ flexGrow: 1 }}>
                    {rec.pestName}
                  </Typography>
                  <Chip label="Ver tratamientos" size="small" />
                </Box>
              </AccordionSummary>
              
              <AccordionDetails>
                <Grid container spacing={3}>
                {/* Tratamientos orgánicos */}
                {/*<OrganicIcon sx={{ mr: 1 }} />*/}
                <Grid item xs={12} md={6}>
                    <Paper sx={{ p: 2, bgcolor: 'success.light', color: 'white' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                            {/*<OrganicIcon sx={{ mr: 1 }} />*/}
                            <Typography variant="h6">Tratamientos Orgánicos</Typography>
                        </Box>
                        
                        <List dense>
                            {rec.organic.map((treatment, idx) => (
                                <ListItem key={idx}>
                                    <ListItemIcon sx={{ minWidth: 30 }}>
                                        <EcoIcon sx={{ color: 'white', fontSize: 20 }} />
                                    </ListItemIcon>
                                    <ListItemText primary={treatment} />
                                </ListItem>
                            ))}
                        </List>
                    </Paper>
                </Grid>

                {/* Tratamientos químicos */}
                  <Grid item xs={12} md={6}>
                    <Paper sx={{ p: 2, bgcolor: 'warning.light', color: 'white' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                        <ChemicalIcon sx={{ mr: 1 }} />
                        <Typography variant="h6">Tratamientos Químicos</Typography>
                      </Box>
                      
                      <List dense>
                        {rec.chemical.map((treatment, idx) => (
                          <ListItem key={idx}>
                            <ListItemIcon sx={{ minWidth: 30 }}>
                              <TreatmentIcon sx={{ color: 'white', fontSize: 20 }} />
                            </ListItemIcon>
                            <ListItemText primary={treatment} />
                          </ListItem>
                        ))}
                      </List>
                    </Paper>
                  </Grid>

                  {/* Medidas preventivas */}
                  <Grid item xs={12} md={6}>
                    <Paper sx={{ p: 2, bgcolor: 'info.light', color: 'white' }}>
                      <Typography variant="h6" gutterBottom>
                        Medidas Preventivas
                      </Typography>
                      
                      <List dense>
                        {rec.preventive.map((measure, idx) => (
                          <ListItem key={idx}>
                            <ListItemIcon sx={{ minWidth: 30 }}>
                              <SafeIcon sx={{ color: 'white', fontSize: 20 }} />
                            </ListItemIcon>
                            <ListItemText primary={measure} />
                          </ListItem>
                        ))}
                      </List>
                    </Paper>
                  </Grid>

                  {/* Momento óptimo */}
                  <Grid item xs={12} md={6}>
                    <Paper sx={{ p: 2, bgcolor: 'secondary.light', color: 'white' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                        <TimingIcon sx={{ mr: 1 }} />
                        <Typography variant="h6">Momento Óptimo</Typography>
                      </Box>
                      
                      <Typography variant="body1">
                        {rec.timing}
                      </Typography>
                    </Paper>
                  </Grid>
                </Grid>
              </AccordionDetails>
            </Accordion>
          ))}
        </Box>
      )}

      {pestAlerts.length === 0 && !loading && (
        <Alert severity="success" sx={{ mt: 4 }}>
          <Typography variant="h6" gutterBottom>
            ¡Excelente! No se detectaron riesgos altos de plagas
          </Typography>
          <Typography variant="body2">
            Continúa con el monitoreo regular y las prácticas preventivas para mantener tus cultivos saludables.
          </Typography>
        </Alert>
      )}
    </Container>
  );
};

export default PestPrevention;