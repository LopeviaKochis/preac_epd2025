import express from 'express';

const router = express.Router();

// Rutas públicas, no requieren autenticación

// Datos de referencia para cálculos de riego
const IRRIGATION_DATA = {
  crops: {
    'maiz': {
      name: 'Maíz',
      waterNeed: 500, // mm por temporada
      growthStages: [
        { stage: 'Siembra', days: 15, waterFactor: 0.3 },
        { stage: 'Vegetativo', days: 35, waterFactor: 1.0 },
        { stage: 'Floración', days: 25, waterFactor: 1.2 },
        { stage: 'Llenado', days: 30, waterFactor: 0.8 },
        { stage: 'Maduración', days: 20, waterFactor: 0.4 }
      ]
    },
    'papa': {
      name: 'Papa',
      waterNeed: 450,
      growthStages: [
        { stage: 'Siembra', days: 20, waterFactor: 0.4 },
        { stage: 'Emergencia', days: 25, waterFactor: 0.6 },
        { stage: 'Tuberización', days: 40, waterFactor: 1.2 },
        { stage: 'Llenado', days: 30, waterFactor: 1.0 },
        { stage: 'Maduración', days: 15, waterFactor: 0.3 }
      ]
    },
    'cebada': {
      name: 'Cebada',
      waterNeed: 350,
      growthStages: [
        { stage: 'Siembra', days: 10, waterFactor: 0.3 },
        { stage: 'Macollaje', days: 30, waterFactor: 0.8 },
        { stage: 'Elongación', days: 25, waterFactor: 1.0 },
        { stage: 'Espigado', days: 15, waterFactor: 1.1 },
        { stage: 'Llenado', days: 25, waterFactor: 0.9 },
        { stage: 'Maduración', days: 15, waterFactor: 0.2 }
      ]
    }
  },
  systems: {
    'goteo': {
      name: 'Riego por Goteo',
      efficiency: 0.90,
      costPerHa: 3500,
      waterSavings: 0.40,
      laborReduction: 0.60
    },
    'aspersion': {
      name: 'Riego por Aspersión',
      efficiency: 0.75,
      costPerHa: 2500,
      waterSavings: 0.25,
      laborReduction: 0.40
    },
    'microaspersion': {
      name: 'Micro Aspersión',
      efficiency: 0.85,
      costPerHa: 2800,
      waterSavings: 0.35,
      laborReduction: 0.50
    },
    'gravedad': {
      name: 'Riego por Gravedad',
      efficiency: 0.45,
      costPerHa: 500,
      waterSavings: 0.00,
      laborReduction: 0.00
    }
  },
  soilTypes: {
    'arcilloso': { retention: 0.40, infiltration: 'baja' },
    'franco': { retention: 0.25, infiltration: 'media' },
    'arenoso': { retention: 0.15, infiltration: 'alta' },
    'limoso': { retention: 0.30, infiltration: 'media-baja' }
  }
};

// POST /api/irrigation/calculate - Calcular sistema de riego
router.post('/calculate', async (req, res) => {
  try {
    const {
      cropType,
      area,
      systemType,
      soilType = 'franco',
      climate = 'templado',
      currentSystem = 'gravedad'
    } = req.body;

    if (!cropType || !area || !systemType) {
      return res.status(400).json({
        success: false,
        message: 'Tipo de cultivo, área y sistema de riego son requeridos'
      });
    }

    if (area <= 0) {
      return res.status(400).json({
        success: false,
        message: 'El área debe ser un número positivo'
      });
    }

    // Obtener datos del cultivo
    const crop = IRRIGATION_DATA.crops[cropType];
    if (!crop) {
      return res.status(400).json({
        success: false,
        message: 'Tipo de cultivo no válido'
      });
    }

    // Obtener datos del sistema
    const system = IRRIGATION_DATA.systems[systemType];
    const currentSystemData = IRRIGATION_DATA.systems[currentSystem];
    const soil = IRRIGATION_DATA.soilTypes[soilType];

    if (!system || !currentSystemData || !soil) {
      return res.status(400).json({
        success: false,
        message: 'Tipo de sistema o suelo no válido'
      });
    }

    // Cálculos de agua
    const baseWaterNeed = crop.waterNeed * area; // litros por temporada
    const adjustedWaterNeed = baseWaterNeed * (1 + soil.retention); // ajuste por tipo de suelo
    
    // Agua necesaria con sistema actual vs nuevo
    const currentWaterUse = adjustedWaterNeed / currentSystemData.efficiency;
    const newWaterUse = adjustedWaterNeed / system.efficiency;
    const waterSaved = currentWaterUse - newWaterUse;
    const waterSavingsPercent = (waterSaved / currentWaterUse) * 100;

    // Cálculos económicos
    const systemCost = system.costPerHa * area;
    const waterCostPerLiter = 0.002; // S/ por litro (estimado)
    const annualWaterSavings = waterSaved * waterCostPerLiter;
    const laborCostReduction = system.laborReduction * 2000 * area; // S/ por ha al año
    const annualSavings = annualWaterSavings + laborCostReduction;
    const paybackPeriod = systemCost / annualSavings;

    // Datos para gráficos
    const chartData = {
      waterUsageComparison: [
        { system: 'Sistema Actual', usage: Math.round(currentWaterUse) },
        { system: 'Sistema Nuevo', usage: Math.round(newWaterUse) },
        { system: 'Ahorro', usage: Math.round(waterSaved) }
      ],
      efficiencyComparison: Object.keys(IRRIGATION_DATA.systems).map(key => ({
        system: IRRIGATION_DATA.systems[key].name,
        efficiency: IRRIGATION_DATA.systems[key].efficiency * 100
      })),
      monthlyWaterNeed: crop.growthStages.map(stage => ({
        stage: stage.stage,
        days: stage.days,
        waterNeed: Math.round((adjustedWaterNeed / 125) * stage.waterFactor * stage.days)
      }))
    };

    const result = {
      input: {
        cropType,
        area,
        systemType,
        soilType,
        climate,
        currentSystem
      },
      calculations: {
        baseWaterNeed: Math.round(baseWaterNeed),
        adjustedWaterNeed: Math.round(adjustedWaterNeed),
        currentWaterUse: Math.round(currentWaterUse),
        newWaterUse: Math.round(newWaterUse),
        waterSaved: Math.round(waterSaved),
        waterSavingsPercent: Math.round(waterSavingsPercent * 100) / 100,
        systemEfficiency: system.efficiency * 100
      },
      economics: {
        systemCost: Math.round(systemCost * 100) / 100,
        annualWaterSavings: Math.round(annualWaterSavings * 100) / 100,
        laborCostReduction: Math.round(laborCostReduction * 100) / 100,
        annualSavings: Math.round(annualSavings * 100) / 100,
        paybackPeriod: Math.round(paybackPeriod * 100) / 100
      },
      charts: chartData,
      recommendations: generateIrrigationRecommendations({
        cropType,
        systemType,
        waterSavingsPercent,
        paybackPeriod,
        soilType,
        area
      })
    };

    res.json({
      success: true,
      message: 'Cálculo de riego completado',
      data: result
    });
  } catch (error) {
    console.error('Error en cálculo de riego:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// GET /api/irrigation/crops - Obtener cultivos disponibles
router.get('/crops', async (req, res) => {
  try {
    const crops = Object.keys(IRRIGATION_DATA.crops).map(key => ({
      id: key,
      name: IRRIGATION_DATA.crops[key].name,
      waterNeed: IRRIGATION_DATA.crops[key].waterNeed,
      growthStages: IRRIGATION_DATA.crops[key].growthStages.length
    }));

    res.json({
      success: true,
      data: crops
    });
  } catch (error) {
    console.error('Error obteniendo cultivos:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// GET /api/irrigation/systems - Obtener sistemas de riego disponibles
router.get('/systems', async (req, res) => {
  try {
    const systems = Object.keys(IRRIGATION_DATA.systems).map(key => ({
      id: key,
      name: IRRIGATION_DATA.systems[key].name,
      efficiency: IRRIGATION_DATA.systems[key].efficiency,
      costPerHa: IRRIGATION_DATA.systems[key].costPerHa,
      waterSavings: IRRIGATION_DATA.systems[key].waterSavings,
      laborReduction: IRRIGATION_DATA.systems[key].laborReduction
    }));

    res.json({
      success: true,
      data: systems
    });
  } catch (error) {
    console.error('Error obteniendo sistemas:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// POST /api/irrigation/schedule - Generar cronograma de riego
router.post('/schedule', async (req, res) => {
  try {
    const { cropType, systemType, plantingDate, area } = req.body;

    if (!cropType || !systemType || !plantingDate) {
      return res.status(400).json({
        success: false,
        message: 'Cultivo, sistema de riego y fecha de siembra son requeridos'
      });
    }

    const crop = IRRIGATION_DATA.crops[cropType];
    const system = IRRIGATION_DATA.systems[systemType];

    if (!crop || !system) {
      return res.status(400).json({
        success: false,
        message: 'Tipo de cultivo o sistema no válido'
      });
    }

    const plantDate = new Date(plantingDate);
    const schedule = [];
    let currentDate = new Date(plantDate);

    for (const stage of crop.growthStages) {
      const stageEndDate = new Date(currentDate);
      stageEndDate.setDate(stageEndDate.getDate() + stage.days);

      const dailyWater = (crop.waterNeed * stage.waterFactor * area) / stage.days;
      const irrigationFrequency = system.efficiency > 0.8 ? 2 : 1; // días entre riegos

      schedule.push({
        stage: stage.stage,
        startDate: currentDate.toISOString().split('T')[0],
        endDate: stageEndDate.toISOString().split('T')[0],
        days: stage.days,
        waterFactor: stage.waterFactor,
        dailyWater: Math.round(dailyWater),
        irrigationFrequency,
        recommendations: getStageRecommendations(stage.stage, systemType)
      });

      currentDate = new Date(stageEndDate);
    }

    res.json({
      success: true,
      message: 'Cronograma de riego generado',
      data: {
        cropType,
        systemType,
        plantingDate,
        area,
        totalDuration: schedule.reduce((sum, stage) => sum + stage.days, 0),
        schedule
      }
    });
  } catch (error) {
    console.error('Error generando cronograma:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// Función para generar recomendaciones de riego
function generateIrrigationRecommendations({ cropType, systemType, waterSavingsPercent, paybackPeriod, soilType, area }) {
  const recommendations = [];

  if (waterSavingsPercent > 30) {
    recommendations.push({
      type: 'excellent',
      title: 'Excelente ahorro de agua',
      message: `Ahorrarás ${waterSavingsPercent}% de agua con este sistema de riego.`
    });
  } else if (waterSavingsPercent > 15) {
    recommendations.push({
      type: 'good',
      title: 'Buen ahorro de agua',
      message: `Un ahorro de ${waterSavingsPercent}% contribuye a la sostenibilidad.`
    });
  }

  if (paybackPeriod < 3) {
    recommendations.push({
      type: 'excellent',
      title: 'Retorno rápido',
      message: `La inversión se recuperará en ${paybackPeriod} años.`
    });
  } else if (paybackPeriod > 5) {
    recommendations.push({
      type: 'warning',
      title: 'Considerar financiamiento',
      message: `Con ${paybackPeriod} años de retorno, evalúa opciones de financiamiento.`
    });
  }

  if (systemType === 'goteo' && cropType === 'papa') {
    recommendations.push({
      type: 'excellent',
      title: 'Combinación ideal',
      message: 'El riego por goteo es perfecto para papa, mejorando calidad y rendimiento.'
    });
  }

  if (soilType === 'arenoso' && systemType !== 'goteo') {
    recommendations.push({
      type: 'suggestion',
      title: 'Considera riego por goteo',
      message: 'En suelos arenosos, el goteo minimiza pérdidas por infiltración.'
    });
  }

  if (area > 5) {
    recommendations.push({
      type: 'info',
      title: 'Implementación por fases',
      message: 'Para áreas grandes, considera implementar el sistema por etapas.'
    });
  }

  return recommendations;
}

// Función para obtener recomendaciones por etapa de crecimiento
function getStageRecommendations(stage, systemType) {
  const recommendations = {
    'Siembra': ['Mantener humedad constante', 'Riego ligero y frecuente'],
    'Emergencia': ['Evitar encharcamiento', 'Riego superficial'],
    'Vegetativo': ['Incrementar frecuencia', 'Monitorear desarrollo foliar'],
    'Floración': ['Riego crítico', 'No interrumpir suministro'],
    'Tuberización': ['Riego profundo', 'Mantener humedad en zona radicular'],
    'Llenado': ['Riego moderado', 'Evitar estrés hídrico'],
    'Maduración': ['Reducir riego', 'Preparar para cosecha']
  };

  return recommendations[stage] || ['Seguir protocolo estándar'];
}

export default router;