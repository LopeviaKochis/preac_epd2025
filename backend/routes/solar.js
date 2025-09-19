import express from 'express';

const router = express.Router();

// Rutas públicas, no requieren autenticación

// Datos de ejemplo para el cálculo solar
const SOLAR_DATA = {
  locations: {
    'lima': { irradiation: 4.5, efficiency: 0.85 },
    'arequipa': { irradiation: 5.2, efficiency: 0.88 },
    'cusco': { irradiation: 4.8, efficiency: 0.82 },
    'trujillo': { irradiation: 4.3, efficiency: 0.86 },
    'piura': { irradiation: 4.9, efficiency: 0.87 },
    'ica': { irradiation: 5.1, efficiency: 0.89 },
    'tacna': { irradiation: 5.3, efficiency: 0.90 },
    'default': { irradiation: 4.6, efficiency: 0.85 }
  },
  systemTypes: {
    'monocristalino': { efficiency: 0.20, costPerWatt: 1.2, lifespan: 25 },
    'policristalino': { efficiency: 0.16, costPerWatt: 1.0, lifespan: 22 },
    'amorfo': { efficiency: 0.10, costPerWatt: 0.8, lifespan: 20 }
  },
  electricityRates: {
    'residential': 0.22, // S/ por kWh
    'commercial': 0.28,
    'industrial': 0.18
  }
};

// POST /api/solar/calculate - Calcular sistema solar
router.post('/calculate', async (req, res) => {
  try {
    const {
      area,
      systemType = 'monocristalino',
      location = 'default',
      electricityRate = 'residential',
      monthlyConsumption
    } = req.body;

    if (!area || area <= 0) {
      return res.status(400).json({
        success: false,
        message: 'El área debe ser un número positivo'
      });
    }

    // Obtener datos de ubicación
    const locationData = SOLAR_DATA.locations[location.toLowerCase()] || SOLAR_DATA.locations.default;
    
    // Obtener datos del tipo de sistema
    const systemData = SOLAR_DATA.systemTypes[systemType] || SOLAR_DATA.systemTypes.monocristalino;
    
    // Obtener tarifa eléctrica
    const tariff = SOLAR_DATA.electricityRates[electricityRate] || SOLAR_DATA.electricityRates.residential;

    // Cálculos básicos
    const panelPower = area * 200; // Watts por m²
    const systemPower = panelPower * systemData.efficiency;
    const dailyGeneration = systemPower * locationData.irradiation * locationData.efficiency / 1000; // kWh/día
    const monthlyGeneration = dailyGeneration * 30; // kWh/mes
    const annualGeneration = dailyGeneration * 365; // kWh/año

    // Cálculos económicos
    const systemCost = panelPower * systemData.costPerWatt;
    const monthlySavings = monthlyGeneration * tariff;
    const annualSavings = annualGeneration * tariff;
    const paybackPeriod = systemCost / annualSavings; // años
    const totalSavings = annualSavings * systemData.lifespan;
    const roi = ((totalSavings - systemCost) / systemCost) * 100;

    // Datos para gráficos
    const chartData = {
      monthlyProduction: Array.from({ length: 12 }, (_, i) => ({
        month: ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'][i],
        production: monthlyGeneration * (0.8 + Math.random() * 0.4) // Variación estacional simulada
      })),
      savingsBreakdown: [
        { category: 'Ahorro Mensual', value: monthlySavings },
        { category: 'Ahorro Anual', value: annualSavings },
        { category: 'Ahorro Total (25 años)', value: totalSavings }
      ],
      roiComparison: [
        { system: 'Monocristalino', roi: roi + 2 },
        { system: 'Policristalino', roi: roi },
        { system: 'Amorfo', roi: roi - 3 }
      ]
    };

    const result = {
      input: {
        area,
        systemType,
        location,
        electricityRate,
        monthlyConsumption
      },
      calculations: {
        panelPower: Math.round(panelPower),
        systemPower: Math.round(systemPower),
        dailyGeneration: Math.round(dailyGeneration * 100) / 100,
        monthlyGeneration: Math.round(monthlyGeneration * 100) / 100,
        annualGeneration: Math.round(annualGeneration * 100) / 100
      },
      economics: {
        systemCost: Math.round(systemCost * 100) / 100,
        monthlySavings: Math.round(monthlySavings * 100) / 100,
        annualSavings: Math.round(annualSavings * 100) / 100,
        paybackPeriod: Math.round(paybackPeriod * 100) / 100,
        totalSavings: Math.round(totalSavings * 100) / 100,
        roi: Math.round(roi * 100) / 100
      },
      charts: chartData,
      recommendations: generateSolarRecommendations({
        area,
        systemType,
        paybackPeriod,
        roi,
        monthlyGeneration,
        monthlyConsumption
      })
    };

    res.json({
      success: true,
      message: 'Cálculo solar completado',
      data: result
    });
  } catch (error) {
    console.error('Error en cálculo solar:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// GET /api/solar/locations - Obtener ubicaciones disponibles
router.get('/locations', async (req, res) => {
  try {
    const locations = Object.keys(SOLAR_DATA.locations)
      .filter(key => key !== 'default')
      .map(key => ({
        id: key,
        name: key.charAt(0).toUpperCase() + key.slice(1),
        irradiation: SOLAR_DATA.locations[key].irradiation,
        efficiency: SOLAR_DATA.locations[key].efficiency
      }));

    res.json({
      success: true,
      data: locations
    });
  } catch (error) {
    console.error('Error obteniendo ubicaciones:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// GET /api/solar/system-types - Obtener tipos de sistema disponibles
router.get('/system-types', async (req, res) => {
  try {
    const systemTypes = Object.keys(SOLAR_DATA.systemTypes).map(key => ({
      id: key,
      name: key.charAt(0).toUpperCase() + key.slice(1),
      efficiency: SOLAR_DATA.systemTypes[key].efficiency,
      costPerWatt: SOLAR_DATA.systemTypes[key].costPerWatt,
      lifespan: SOLAR_DATA.systemTypes[key].lifespan
    }));

    res.json({
      success: true,
      data: systemTypes
    });
  } catch (error) {
    console.error('Error obteniendo tipos de sistema:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// Función para generar recomendaciones
function generateSolarRecommendations({ area, systemType, paybackPeriod, roi, monthlyGeneration, monthlyConsumption }) {
  const recommendations = [];

  if (paybackPeriod < 5) {
    recommendations.push({
      type: 'excellent',
      title: 'Excelente inversión',
      message: `Con un período de retorno de ${paybackPeriod} años, esta es una excelente inversión solar.`
    });
  } else if (paybackPeriod < 8) {
    recommendations.push({
      type: 'good',
      title: 'Buena inversión',
      message: `El período de retorno de ${paybackPeriod} años es razonable para energía solar.`
    });
  } else {
    recommendations.push({
      type: 'warning',
      title: 'Considerar optimización',
      message: `El período de retorno de ${paybackPeriod} años es algo alto. Considera optimizar el sistema.`
    });
  }

  if (roi > 200) {
    recommendations.push({
      type: 'excellent',
      title: 'ROI excepcional',
      message: `Un ROI de ${roi}% indica ganancias excelentes a largo plazo.`
    });
  }

  if (area < 10) {
    recommendations.push({
      type: 'info',
      title: 'Considera expandir',
      message: 'Con más área disponible podrías aumentar significativamente la generación.'
    });
  }

  if (monthlyConsumption && monthlyGeneration > monthlyConsumption * 1.2) {
    recommendations.push({
      type: 'info',
      title: 'Exceso de generación',
      message: 'Tu sistema generará más energía de la que consumes. Considera vender el exceso.'
    });
  }

  if (systemType === 'amorfo') {
    recommendations.push({
      type: 'suggestion',
      title: 'Considera actualizar',
      message: 'Los paneles monocristalinos ofrecen mejor eficiencia a largo plazo.'
    });
  }

  return recommendations;
}

export default router;