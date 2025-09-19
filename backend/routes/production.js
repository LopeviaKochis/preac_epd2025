import express from 'express';

const router = express.Router();

// Rutas públicas, no requieren autenticación

// Base de datos de cultivos y recomendaciones para Perú
const PRODUCTION_DATA = {
  crops: {
    'maiz': {
      name: 'Maíz',
      scientificName: 'Zea mays',
      varieties: [
        {
          name: 'Marginal 28T',
          type: 'hibrido',
          cycle: 120, // días
          yield: 8500, // kg/ha
          altitude: { min: 0, max: 3200 },
          resistance: ['roya', 'carbon']
        },
        {
          name: 'PM-213',
          type: 'variedad',
          cycle: 140,
          yield: 7000,
          altitude: { min: 1500, max: 3500 },
          resistance: ['heladas', 'sequia']
        },
        {
          name: 'Cusco Gigante',
          type: 'nativo',
          cycle: 180,
          yield: 4500,
          altitude: { min: 2800, max: 3800 },
          resistance: ['heladas', 'granizo', 'plagas']
        }
      ],
      plantingCalendar: {
        'costa': [
          { month: 'marzo', season: 'otoño' },
          { month: 'agosto', season: 'invierno' }
        ],
        'sierra': [
          { month: 'octubre', season: 'lluvias' },
          { month: 'diciembre', season: 'lluvias' }
        ],
        'selva': [
          { month: 'abril', season: 'lluvias' },
          { month: 'septiembre', season: 'seca' }
        ]
      },
      requirements: {
        temperature: { min: 18, max: 35, optimal: 25 },
        precipitation: { min: 400, max: 800 }, // mm por ciclo
        ph: { min: 6.0, max: 7.5 },
        spacing: { plants: 0.25, rows: 0.80 } // metros
      }
    },
    'papa': {
      name: 'Papa',
      scientificName: 'Solanum tuberosum',
      varieties: [
        {
          name: 'Canchán',
          type: 'comercial',
          cycle: 120,
          yield: 25000,
          altitude: { min: 2500, max: 3500 },
          resistance: ['rancha', 'virus']
        },
        {
          name: 'Huayro',
          type: 'nativa',
          cycle: 150,
          yield: 18000,
          altitude: { min: 3000, max: 4000 },
          resistance: ['heladas', 'sequia', 'granizo']
        },
        {
          name: 'Única',
          type: 'comercial',
          cycle: 100,
          yield: 22000,
          altitude: { min: 2000, max: 3200 },
          resistance: ['virus', 'nematodos']
        }
      ],
      plantingCalendar: {
        'costa': [
          { month: 'marzo', season: 'otoño' },
          { month: 'julio', season: 'invierno' }
        ],
        'sierra': [
          { month: 'septiembre', season: 'lluvias' },
          { month: 'diciembre', season: 'lluvias' }
        ],
        'selva': [
          { month: 'mayo', season: 'seca' },
          { month: 'octubre', season: 'lluvias' }
        ]
      },
      requirements: {
        temperature: { min: 12, max: 20, optimal: 16 },
        precipitation: { min: 500, max: 700 },
        ph: { min: 5.5, max: 7.0 },
        spacing: { plants: 0.30, rows: 1.00 }
      }
    },
    'cebada': {
      name: 'Cebada',
      scientificName: 'Hordeum vulgare',
      varieties: [
        {
          name: 'UNA-80',
          type: 'mejorada',
          cycle: 140,
          yield: 3500,
          altitude: { min: 3200, max: 4200 },
          resistance: ['heladas', 'roya']
        },
        {
          name: 'Centenario',
          type: 'comercial',
          cycle: 120,
          yield: 4200,
          altitude: { min: 2800, max: 3800 },
          resistance: ['sequia', 'vientos']
        }
      ],
      plantingCalendar: {
        'sierra': [
          { month: 'noviembre', season: 'lluvias' },
          { month: 'diciembre', season: 'lluvias' }
        ]
      },
      requirements: {
        temperature: { min: 8, max: 18, optimal: 13 },
        precipitation: { min: 300, max: 500 },
        ph: { min: 6.0, max: 8.0 },
        spacing: { plants: 0.15, rows: 0.25 }
      }
    }
  },
  managementPractices: {
    'preparacion_suelo': {
      name: 'Preparación del Suelo',
      activities: [
        'Análisis de suelo',
        'Arado profundo',
        'Nivelación',
        'Incorporación de materia orgánica'
      ],
      timing: '30-45 días antes de siembra'
    },
    'siembra': {
      name: 'Siembra',
      activities: [
        'Selección de semilla',
        'Tratamiento de semilla',
        'Siembra a profundidad adecuada',
        'Riego inicial'
      ],
      timing: 'Según calendario regional'
    },
    'fertilizacion': {
      name: 'Fertilización',
      activities: [
        'Fertilización de fondo',
        'Primera fertilización complementaria',
        'Segunda fertilización complementaria',
        'Fertilización foliar'
      ],
      timing: 'Siembra, 30 días, 60 días, floración'
    },
    'control_plagas': {
      name: 'Control de Plagas',
      activities: [
        'Monitoreo semanal',
        'Control biológico',
        'Control cultural',
        'Control químico selectivo'
      ],
      timing: 'Durante todo el ciclo'
    }
  }
};

// POST /api/production/recommend - Obtener recomendaciones de producción
router.post('/recommend', async (req, res) => {
  try {
    const {
      cropType,
      region = 'sierra',
      area,
      altitude,
      soilType,
      experience = 'intermedio',
      budget = 'medio',
      season
    } = req.body;

    if (!cropType || !area) {
      return res.status(400).json({
        success: false,
        message: 'Tipo de cultivo y área son requeridos'
      });
    }

    const crop = PRODUCTION_DATA.crops[cropType];
    if (!crop) {
      return res.status(400).json({
        success: false,
        message: 'Tipo de cultivo no válido'
      });
    }

    // Seleccionar variedades apropiadas
    const suitableVarieties = crop.varieties.filter(variety => {
      if (altitude) {
        return altitude >= variety.altitude.min && altitude <= variety.altitude.max;
      }
      return true;
    });

    // Determinar mejor época de siembra
    const plantingCalendar = crop.plantingCalendar[region] || crop.plantingCalendar['sierra'];
    
    // Calcular proyecciones
    const projections = calculateProjections(crop, suitableVarieties, area, budget);
    
    // Generar plan de manejo
    const managementPlan = generateManagementPlan(cropType, region, experience);
    
    // Calcular costos estimados
    const costAnalysis = calculateCosts(cropType, area, budget);
    
    // Generar cronograma
    const schedule = generateCropSchedule(crop, region, season);

    res.json({
      success: true,
      message: 'Recomendaciones generadas exitosamente',
      data: {
        crop: {
          name: crop.name,
          scientificName: crop.scientificName
        },
        region,
        area,
        suitableVarieties: suitableVarieties.slice(0, 3), // Top 3
        plantingCalendar,
        projections,
        managementPlan,
        costAnalysis,
        schedule,
        riskAssessment: assessRisks(cropType, region, season),
        recommendations: generateSpecificRecommendations(cropType, region, experience, budget)
      }
    });
  } catch (error) {
    console.error('Error generando recomendaciones:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// GET /api/production/calendar - Obtener calendario de siembra
router.get('/calendar', async (req, res) => {
  try {
    const { region = 'sierra', year } = req.query;
    
    const calendar = {};
    
    Object.keys(PRODUCTION_DATA.crops).forEach(cropKey => {
      const crop = PRODUCTION_DATA.crops[cropKey];
      const plantingTimes = crop.plantingCalendar[region] || crop.plantingCalendar['sierra'];
      
      if (plantingTimes) {
        calendar[cropKey] = {
          name: crop.name,
          plantingTimes,
          cycle: crop.varieties[0]?.cycle || 120
        };
      }
    });

    res.json({
      success: true,
      data: {
        region,
        year: year || new Date().getFullYear(),
        calendar
      }
    });
  } catch (error) {
    console.error('Error obteniendo calendario:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// POST /api/production/optimize - Optimizar plan de producción
router.post('/optimize', async (req, res) => {
  try {
    const {
      totalArea,
      crops,
      objectives = ['rendimiento', 'ganancia'],
      constraints = {}
    } = req.body;

    if (!totalArea || !crops || crops.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Área total y lista de cultivos son requeridos'
      });
    }

    // Optimización simple basada en rendimiento y ganancia
    const optimizedPlan = optimizeCropMix(totalArea, crops, objectives, constraints);
    
    res.json({
      success: true,
      message: 'Plan optimizado generado',
      data: {
        totalArea,
        objectives,
        optimizedPlan,
        projectedResults: calculateOptimizedResults(optimizedPlan),
        alternatives: generateAlternatives(totalArea, crops, objectives)
      }
    });
  } catch (error) {
    console.error('Error optimizando plan:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// GET /api/production/varieties/:cropType - Obtener variedades disponibles
router.get('/varieties/:cropType', async (req, res) => {
  try {
    const { cropType } = req.params;
    const { altitude, region } = req.query;
    
    const crop = PRODUCTION_DATA.crops[cropType];
    if (!crop) {
      return res.status(404).json({
        success: false,
        message: 'Cultivo no encontrado'
      });
    }

    let varieties = crop.varieties;
    
    // Filtrar por altitud si se proporciona
    if (altitude) {
      const alt = parseInt(altitude);
      varieties = varieties.filter(v => 
        alt >= v.altitude.min && alt <= v.altitude.max
      );
    }

    // Agregar información adicional
    const detailedVarieties = varieties.map(variety => ({
      ...variety,
      performance: calculateVarietyPerformance(variety, altitude, region),
      suitability: assessVarietySuitability(variety, region)
    }));

    res.json({
      success: true,
      data: {
        crop: crop.name,
        totalVarieties: detailedVarieties.length,
        varieties: detailedVarieties
      }
    });
  } catch (error) {
    console.error('Error obteniendo variedades:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// Funciones auxiliares

function calculateProjections(crop, varieties, area, budget) {
  const avgYield = varieties.reduce((sum, v) => sum + v.yield, 0) / varieties.length;
  const budgetMultiplier = budget === 'alto' ? 1.2 : budget === 'bajo' ? 0.8 : 1.0;
  
  const projectedYield = avgYield * budgetMultiplier;
  const totalProduction = (projectedYield * area) / 1000; // toneladas
  
  // Precios estimados (S/ por kg)
  const prices = { 'maiz': 1.2, 'papa': 0.8, 'cebada': 1.5 };
  const pricePerKg = prices[crop.name.toLowerCase()] || 1.0;
  
  return {
    yieldPerHa: Math.round(projectedYield),
    totalProduction: Math.round(totalProduction * 100) / 100,
    estimatedRevenue: Math.round(totalProduction * 1000 * pricePerKg),
    breakEvenPoint: Math.round(area * 2000 / pricePerKg), // kg
    profitMargin: 25 // porcentaje estimado
  };
}

function generateManagementPlan(cropType, region, experience) {
  const practices = Object.keys(PRODUCTION_DATA.managementPractices).map(key => ({
    id: key,
    ...PRODUCTION_DATA.managementPractices[key],
    complexity: experience === 'principiante' ? 'simplificado' : 'completo'
  }));
  
  return {
    level: experience,
    practices,
    criticalPoints: getCriticalPoints(cropType),
    technicalSupport: experience === 'principiante' ? 'requerido' : 'opcional'
  };
}

function calculateCosts(cropType, area, budget) {
  // Costos estimados por hectárea (S/)
  const baseCosts = {
    'maiz': { semilla: 800, fertilizantes: 1200, pesticidas: 600, labor: 1500 },
    'papa': { semilla: 3000, fertilizantes: 2000, pesticidas: 800, labor: 2500 },
    'cebada': { semilla: 600, fertilizantes: 800, pesticidas: 400, labor: 1200 }
  };
  
  const costs = baseCosts[cropType] || baseCosts['maiz'];
  const budgetMultiplier = budget === 'alto' ? 1.3 : budget === 'bajo' ? 0.7 : 1.0;
  
  const totalCostPerHa = Object.values(costs).reduce((sum, cost) => sum + cost, 0) * budgetMultiplier;
  
  return {
    perHa: Math.round(totalCostPerHa),
    total: Math.round(totalCostPerHa * area),
    breakdown: {
      semilla: Math.round(costs.semilla * budgetMultiplier),
      fertilizantes: Math.round(costs.fertilizantes * budgetMultiplier),
      pesticidas: Math.round(costs.pesticidas * budgetMultiplier),
      labor: Math.round(costs.labor * budgetMultiplier)
    },
    financing: generateFinancingOptions(totalCostPerHa * area)
  };
}

function generateCropSchedule(crop, region, season) {
  const activities = [
    { week: 1, activity: 'Preparación del terreno', critical: true },
    { week: 2, activity: 'Siembra', critical: true },
    { week: 4, activity: 'Primera fertilización', critical: false },
    { week: 8, activity: 'Control de malezas', critical: false },
    { week: 12, activity: 'Segunda fertilización', critical: false },
    { week: 16, activity: 'Control de plagas', critical: false },
    { week: 18, activity: 'Evaluación pre-cosecha', critical: false },
    { week: 20, activity: 'Cosecha', critical: true }
  ];
  
  return {
    totalWeeks: crop.varieties[0]?.cycle / 7 || 17,
    activities: activities.map(act => ({
      ...act,
      month: getMonthFromWeek(act.week),
      notes: getActivityNotes(act.activity, region)
    }))
  };
}

function assessRisks(cropType, region, season) {
  const risks = {
    'maiz': ['sequía', 'gusano cogollero', 'roya'],
    'papa': ['rancha', 'heladas', 'polilla'],
    'cebada': ['roya', 'pulgones', 'granizo']
  };
  
  return {
    high: risks[cropType]?.slice(0, 1) || [],
    medium: risks[cropType]?.slice(1, 2) || [],
    low: risks[cropType]?.slice(2) || [],
    mitigation: getRiskMitigation(cropType)
  };
}

function generateSpecificRecommendations(cropType, region, experience, budget) {
  const recommendations = [];
  
  if (experience === 'principiante') {
    recommendations.push({
      type: 'training',
      title: 'Capacitación Recomendada',
      message: 'Considera tomar un curso básico de agricultura antes de iniciar.'
    });
  }
  
  if (budget === 'bajo') {
    recommendations.push({
      type: 'budget',
      title: 'Optimización de Costos',
      message: 'Enfócate en prácticas de bajo costo como el compostaje y control biológico.'
    });
  }
  
  recommendations.push({
    type: 'general',
    title: 'Monitoreo Constante',
    message: 'Lleva un registro diario de las actividades y observaciones del cultivo.'
  });
  
  return recommendations;
}

function optimizeCropMix(totalArea, crops, objectives, constraints) {
  // Algoritmo simple de optimización
  const plan = crops.map(cropType => {
    const crop = PRODUCTION_DATA.crops[cropType];
    if (!crop) return null;
    
    const avgYield = crop.varieties.reduce((sum, v) => sum + v.yield, 0) / crop.varieties.length;
    const score = avgYield; // Simplificado
    
    return {
      crop: cropType,
      name: crop.name,
      score,
      recommendedArea: 0
    };
  }).filter(Boolean);
  
  // Distribuir área basada en puntajes
  const totalScore = plan.reduce((sum, p) => sum + p.score, 0);
  plan.forEach(p => {
    p.recommendedArea = Math.round((p.score / totalScore) * totalArea * 100) / 100;
  });
  
  return plan;
}

function calculateOptimizedResults(plan) {
  return {
    totalRevenue: plan.reduce((sum, p) => {
      const crop = PRODUCTION_DATA.crops[p.crop];
      const avgYield = crop.varieties[0]?.yield || 0;
      return sum + (p.recommendedArea * avgYield * 0.001 * 1000); // Simplificado
    }, 0),
    riskLevel: 'medio',
    diversification: plan.length > 1 ? 'alta' : 'baja'
  };
}

function generateAlternatives(totalArea, crops, objectives) {
  return [
    { name: 'Conservador', description: 'Menor riesgo, menor ganancia' },
    { name: 'Balanceado', description: 'Equilibrio entre riesgo y ganancia' },
    { name: 'Agresivo', description: 'Mayor riesgo, mayor ganancia potencial' }
  ];
}

function calculateVarietyPerformance(variety, altitude, region) {
  let score = variety.yield / 1000; // Base score
  
  if (altitude && altitude >= variety.altitude.min && altitude <= variety.altitude.max) {
    score *= 1.2;
  }
  
  return Math.round(score * 10) / 10;
}

function assessVarietySuitability(variety, region) {
  // Simplificado
  return variety.resistance.length > 2 ? 'alta' : 'media';
}

function getCriticalPoints(cropType) {
  const points = {
    'maiz': ['Siembra uniforme', 'Control de malezas temprano', 'Polinización'],
    'papa': ['Calidad de semilla', 'Aporque oportuno', 'Control de rancha'],
    'cebada': ['Densidad de siembra', 'Fertilización nitrogenada', 'Control de roya']
  };
  
  return points[cropType] || ['Monitoreo constante'];
}

function generateFinancingOptions(totalCost) {
  return [
    { type: 'Propio', amount: totalCost, interest: 0 },
    { type: 'Banco Agrario', amount: totalCost * 0.7, interest: 12 },
    { type: 'Cooperativa', amount: totalCost * 0.8, interest: 8 }
  ];
}

function getMonthFromWeek(week) {
  const months = ['Mes 1', 'Mes 2', 'Mes 3', 'Mes 4', 'Mes 5'];
  return months[Math.floor((week - 1) / 4)] || 'Mes 5+';
}

function getActivityNotes(activity, region) {
  const notes = {
    'Siembra': `Considerar época recomendada para ${region}`,
    'Cosecha': 'Verificar humedad del grano antes de almacenar'
  };
  
  return notes[activity] || 'Seguir buenas prácticas agrícolas';
}

function getRiskMitigation(cropType) {
  return [
    'Usar variedades resistentes',
    'Implementar sistema de riego',
    'Diversificar cultivos',
    'Contratar seguro agrícola'
  ];
}

export default router;