import express from 'express';

const router = express.Router();

// Rutas públicas, no requieren autenticación

// Base de datos de plagas comunes en Perú
const PEST_DATA = {
  pests: {
    'gusano_cogollero': {
      name: 'Gusano Cogollero',
      scientificName: 'Spodoptera frugiperda',
      category: 'lepidoptero',
      severity: 'high',
      affectedCrops: ['maiz', 'arroz', 'sorgo'],
      symptoms: [
        'Perforaciones en hojas jóvenes',
        'Presencia de excremento en cogollos',
        'Plantas con crecimiento retardado'
      ],
      lifecycle: {
        eggDays: 3,
        larvaDays: 18,
        pupaDays: 10,
        adultDays: 12
      },
      favorableConditions: {
        temperature: { min: 20, max: 30 },
        humidity: { min: 0.6, max: 0.9 },
        season: 'lluviosa'
      }
    },
    'polilla_papa': {
      name: 'Polilla de la Papa',
      scientificName: 'Phthorimaea operculella',
      category: 'lepidoptero',
      severity: 'critical',
      affectedCrops: ['papa', 'tomate'],
      symptoms: [
        'Galerías en tubérculos',
        'Perforaciones en tallos',
        'Presencia de larvas en almacén'
      ],
      lifecycle: {
        eggDays: 5,
        larvaDays: 20,
        pupaDays: 8,
        adultDays: 15
      },
      favorableConditions: {
        temperature: { min: 15, max: 25 },
        humidity: { min: 0.5, max: 0.8 },
        season: 'seca'
      }
    },
    'pulgon_verde': {
      name: 'Pulgón Verde',
      scientificName: 'Myzus persicae',
      category: 'hemiptero',
      severity: 'medium',
      affectedCrops: ['papa', 'tomate', 'aji', 'cebada'],
      symptoms: [
        'Hojas amarillentas y enrolladas',
        'Melaza pegajosa en plantas',
        'Transmisión de virus'
      ],
      lifecycle: {
        eggDays: 7,
        nymphDays: 10,
        adultDays: 30
      },
      favorableConditions: {
        temperature: { min: 18, max: 25 },
        humidity: { min: 0.4, max: 0.7 },
        season: 'todo_año'
      }
    },
    'trips': {
      name: 'Trips',
      scientificName: 'Thrips tabaci',
      category: 'thysanoptera',
      severity: 'medium',
      affectedCrops: ['cebolla', 'ajo', 'papa'],
      symptoms: [
        'Manchas plateadas en hojas',
        'Deformación de hojas',
        'Reducción del crecimiento'
      ],
      lifecycle: {
        eggDays: 4,
        larvaDays: 8,
        pupaDays: 2,
        adultDays: 20
      },
      favorableConditions: {
        temperature: { min: 20, max: 28 },
        humidity: { min: 0.3, max: 0.6 },
        season: 'seca'
      }
    }
  },
  treatments: {
    'biologico': {
      name: 'Control Biológico',
      methods: [
        'Parasitoides naturales',
        'Hongos entomopatógenos',
        'Nematodos beneficiosos',
        'Feromonas'
      ],
      effectiveness: 0.75,
      cost: 'bajo',
      environmental: 'amigable'
    },
    'cultural': {
      name: 'Control Cultural',
      methods: [
        'Rotación de cultivos',
        'Eliminación de residuos',
        'Fechas de siembra',
        'Variedades resistentes'
      ],
      effectiveness: 0.60,
      cost: 'muy_bajo',
      environmental: 'amigable'
    },
    'quimico': {
      name: 'Control Químico',
      methods: [
        'Insecticidas selectivos',
        'Aplicación dirigida',
        'Rotación de ingredientes activos',
        'Monitoreo de resistencia'
      ],
      effectiveness: 0.90,
      cost: 'alto',
      environmental: 'moderado'
    },
    'integrado': {
      name: 'Manejo Integrado (MIP)',
      methods: [
        'Combinación de métodos',
        'Monitoreo constante',
        'Umbrales económicos',
        'Toma de decisiones informada'
      ],
      effectiveness: 0.85,
      cost: 'medio',
      environmental: 'amigable'
    }
  }
};

// POST /api/pest/assess - Evaluar riesgo de plagas
router.post('/assess', async (req, res) => {
  try {
    const {
      cropType,
      region = 'sierra',
      currentMonth,
      temperature,
      humidity,
      previousInfestation = false
    } = req.body;

    if (!cropType) {
      return res.status(400).json({
        success: false,
        message: 'Tipo de cultivo es requerido'
      });
    }

    // Obtener plagas relevantes para el cultivo
    const relevantPests = Object.keys(PEST_DATA.pests)
      .filter(pestKey => PEST_DATA.pests[pestKey].affectedCrops.includes(cropType))
      .map(pestKey => {
        const pest = PEST_DATA.pests[pestKey];
        
        // Calcular probabilidad basada en condiciones
        let probability = 0.3; // probabilidad base
        
        // Ajustar por temperatura
        if (temperature >= pest.favorableConditions.temperature.min && 
            temperature <= pest.favorableConditions.temperature.max) {
          probability += 0.3;
        }
        
        // Ajustar por humedad
        if (humidity >= pest.favorableConditions.humidity.min && 
            humidity <= pest.favorableConditions.humidity.max) {
          probability += 0.2;
        }
        
        // Ajustar por historial
        if (previousInfestation) {
          probability += 0.15;
        }
        
        // Ajustar por región (simulado)
        if (region === 'costa' && pest.favorableConditions.season === 'seca') {
          probability += 0.1;
        } else if (region === 'selva' && pest.favorableConditions.season === 'lluviosa') {
          probability += 0.1;
        }
        
        probability = Math.min(0.95, probability); // Máximo 95%
        
        return {
          ...pest,
          id: pestKey,
          probability: Math.round(probability * 100),
          riskLevel: probability > 0.7 ? 'alto' : probability > 0.4 ? 'medio' : 'bajo'
        };
      });

    // Ordenar por probabilidad descendente
    relevantPests.sort((a, b) => b.probability - a.probability);

    // Generar recomendaciones
    const recommendations = generatePestRecommendations(relevantPests, cropType);

    res.json({
      success: true,
      message: 'Evaluación de riesgo completada',
      data: {
        cropType,
        region,
        assessmentDate: new Date().toISOString(),
        pestsFound: relevantPests.length,
        pests: relevantPests,
        recommendations,
        alertLevel: getOverallAlertLevel(relevantPests)
      }
    });
  } catch (error) {
    console.error('Error en evaluación de plagas:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// GET /api/pest/identify - Identificar plaga por síntomas
router.post('/identify', async (req, res) => {
  try {
    const { symptoms, cropType, imageDescription } = req.body;

    if (!symptoms || symptoms.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Lista de síntomas es requerida'
      });
    }

    // Buscar plagas que coincidan con los síntomas
    const matches = [];
    
    Object.keys(PEST_DATA.pests).forEach(pestKey => {
      const pest = PEST_DATA.pests[pestKey];
      
      // Si se especifica cultivo, filtrar por cultivos afectados
      if (cropType && !pest.affectedCrops.includes(cropType)) {
        return;
      }
      
      // Calcular coincidencia de síntomas
      const symptomMatches = symptoms.filter(symptom => 
        pest.symptoms.some(pestSymptom => 
          pestSymptom.toLowerCase().includes(symptom.toLowerCase()) ||
          symptom.toLowerCase().includes(pestSymptom.toLowerCase())
        )
      );
      
      if (symptomMatches.length > 0) {
        const confidence = (symptomMatches.length / Math.max(symptoms.length, pest.symptoms.length)) * 100;
        
        matches.push({
          ...pest,
          id: pestKey,
          confidence: Math.round(confidence),
          matchedSymptoms: symptomMatches,
          treatments: getTreatmentOptions(pestKey)
        });
      }
    });

    // Ordenar por confianza descendente
    matches.sort((a, b) => b.confidence - a.confidence);

    res.json({
      success: true,
      message: matches.length > 0 ? 'Plagas identificadas' : 'No se encontraron coincidencias',
      data: {
        query: { symptoms, cropType, imageDescription },
        matches: matches.slice(0, 5), // Top 5 coincidencias
        generalRecommendations: getGeneralTreatmentRecommendations()
      }
    });
  } catch (error) {
    console.error('Error identificando plaga:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// GET /api/pest/treatments - Obtener opciones de tratamiento
router.get('/treatments/:pestId', async (req, res) => {
  try {
    const { pestId } = req.params;
    const { method, budget } = req.query;

    const pest = PEST_DATA.pests[pestId];
    if (!pest) {
      return res.status(404).json({
        success: false,
        message: 'Plaga no encontrada'
      });
    }

    // Obtener todos los tratamientos disponibles
    let treatments = Object.keys(PEST_DATA.treatments).map(key => ({
      id: key,
      ...PEST_DATA.treatments[key]
    }));

    // Filtrar por método si se especifica
    if (method) {
      treatments = treatments.filter(t => t.id === method);
    }

    // Filtrar por presupuesto
    if (budget === 'bajo') {
      treatments = treatments.filter(t => ['bajo', 'muy_bajo'].includes(t.cost));
    } else if (budget === 'medio') {
      treatments = treatments.filter(t => ['bajo', 'medio', 'muy_bajo'].includes(t.cost));
    }

    // Agregar información específica para esta plaga
    const detailedTreatments = treatments.map(treatment => ({
      ...treatment,
      specificMethods: getSpecificMethods(pestId, treatment.id),
      timeline: getTreatmentTimeline(pestId, treatment.id),
      expectedResults: getExpectedResults(treatment.effectiveness, pest.severity)
    }));

    res.json({
      success: true,
      data: {
        pest: {
          id: pestId,
          name: pest.name,
          severity: pest.severity
        },
        treatments: detailedTreatments,
        integrated: generateIntegratedPlan(pestId, detailedTreatments)
      }
    });
  } catch (error) {
    console.error('Error obteniendo tratamientos:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// GET /api/pest/monitoring - Obtener plan de monitoreo
router.post('/monitoring', async (req, res) => {
  try {
    const { cropType, area, pestHistory = [] } = req.body;

    const monitoringPlan = {
      frequency: getMonitoringFrequency(cropType, pestHistory),
      methods: [
        'Inspección visual semanal',
        'Trampas pegajosas amarillas',
        'Muestreo de plantas',
        'Registro fotográfico'
      ],
      keyPoints: [
        'Revisar envés de hojas',
        'Buscar excremento de larvas',
        'Verificar puntos de crecimiento',
        'Documentar ubicaciones afectadas'
      ],
      schedule: generateMonitoringSchedule(cropType),
      thresholds: getActionThresholds(cropType),
      reportingTemplate: getReportingTemplate()
    };

    res.json({
      success: true,
      data: {
        cropType,
        area,
        monitoringPlan
      }
    });
  } catch (error) {
    console.error('Error generando plan de monitoreo:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// Funciones auxiliares

function generatePestRecommendations(pests, cropType) {
  const recommendations = [];
  
  const highRiskPests = pests.filter(p => p.riskLevel === 'alto');
  
  if (highRiskPests.length > 0) {
    recommendations.push({
      type: 'urgent',
      title: 'Acción Inmediata Requerida',
      message: `Alto riesgo de ${highRiskPests.map(p => p.name).join(', ')}. Implementar monitoreo intensivo.`
    });
  }
  
  recommendations.push({
    type: 'preventive',
    title: 'Medidas Preventivas',
    message: 'Mantener cultivo libre de malezas y residuos. Usar variedades resistentes cuando sea posible.'
  });
  
  return recommendations;
}

function getOverallAlertLevel(pests) {
  if (pests.some(p => p.riskLevel === 'alto')) return 'alto';
  if (pests.some(p => p.riskLevel === 'medio')) return 'medio';
  return 'bajo';
}

function getTreatmentOptions(pestId) {
  return Object.keys(PEST_DATA.treatments).map(key => ({
    id: key,
    name: PEST_DATA.treatments[key].name,
    effectiveness: PEST_DATA.treatments[key].effectiveness * 100
  }));
}

function getGeneralTreatmentRecommendations() {
  return [
    'Confirmar identificación antes del tratamiento',
    'Considerar métodos biológicos primero',
    'Rotar ingredientes activos para evitar resistencia',
    'Monitorear efectividad del tratamiento aplicado'
  ];
}

function getSpecificMethods(pestId, treatmentId) {
  const combinations = {
    'gusano_cogollero': {
      'biologico': ['Trichogramma pretiosum', 'Bt (Bacillus thuringiensis)'],
      'cultural': ['Rotación con leguminosas', 'Destrucción de rastrojos'],
      'quimico': ['Emamectina benzoato', 'Clorantraniliprol']
    },
    'polilla_papa': {
      'biologico': ['Copidosoma koehleri', 'Feromonas sexuales'],
      'cultural': ['Aporque alto', 'Cosecha oportuna'],
      'quimico': ['Cartap hidrocloruro', 'Indoxacarb']
    }
  };
  
  return combinations[pestId]?.[treatmentId] || PEST_DATA.treatments[treatmentId].methods;
}

function getTreatmentTimeline(pestId, treatmentId) {
  return {
    preparation: '1-2 días',
    application: '1 día',
    evaluation: '7-14 días',
    reapplication: '14-21 días si es necesario'
  };
}

function getExpectedResults(effectiveness, severity) {
  const effectivenessPercent = effectiveness * 100;
  return {
    effectiveness: `${effectivenessPercent}%`,
    timeToResults: severity === 'critical' ? '3-5 días' : '7-10 días',
    duration: '2-4 semanas'
  };
}

function generateIntegratedPlan(pestId, treatments) {
  return {
    phase1: 'Monitoreo y detección temprana',
    phase2: 'Control cultural y biológico',
    phase3: 'Intervención química si es necesario',
    phase4: 'Evaluación y prevención futura'
  };
}

function getMonitoringFrequency(cropType, pestHistory) {
  if (pestHistory.length > 2) return 'diaria';
  if (cropType === 'papa') return '2 veces por semana';
  return 'semanal';
}

function generateMonitoringSchedule(cropType) {
  const schedule = [];
  const startDate = new Date();
  
  for (let week = 1; week <= 12; week++) {
    const date = new Date(startDate);
    date.setDate(date.getDate() + (week * 7));
    
    schedule.push({
      week,
      date: date.toISOString().split('T')[0],
      activities: [
        'Inspección visual general',
        'Conteo de individuos por planta',
        'Evaluación de daños',
        'Registro fotográfico'
      ]
    });
  }
  
  return schedule;
}

function getActionThresholds(cropType) {
  const thresholds = {
    'maiz': {
      'gusano_cogollero': '2 larvas por 10 plantas',
      'pulgon_verde': '10 pulgones por hoja'
    },
    'papa': {
      'polilla_papa': '1 adulto por trampa por semana',
      'pulgon_verde': '5 pulgones por hoja'
    }
  };
  
  return thresholds[cropType] || {};
}

function getReportingTemplate() {
  return {
    fields: [
      'Fecha y hora',
      'Ubicación del cultivo',
      'Condiciones climáticas',
      'Plaga identificada',
      'Nivel de infestación',
      'Acciones tomadas',
      'Observaciones adicionales'
    ],
    format: 'Llenar semanalmente o cuando se detecten cambios significativos'
  };
}

export default router;