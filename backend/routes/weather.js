import express from 'express';
import { body, validationResult } from 'express-validator';
import { buildFrostFeatures } from '../services/frostFeatureBuilder.js';
import { inferFrost } from '../services/frostInferenceService.js';
import { smsService } from '../services/smsService.js';
import { subscribersService } from '../services/subscribersService.js';

const router = express.Router();

// Rutas públicas, no requieren autenticación

// Datos simulados de clima para diferentes regiones de Perú
const WEATHER_DATA = {
  regions: {
    'costa': {
      name: 'Costa',
      climate: 'árido',
      avgTemp: 22,
      humidity: 0.75,
      precipitation: 150, // mm anuales
      riskFactors: ['sequía', 'niño', 'vientos fuertes']
    },
    'sierra': {
      name: 'Sierra',
      climate: 'templado',
      avgTemp: 15,
      humidity: 0.65,
      precipitation: 800,
      riskFactors: ['heladas', 'granizo', 'sequía estacional']
    },
    'selva': {
      name: 'Selva',
      climate: 'tropical',
      avgTemp: 26,
      humidity: 0.85,
      precipitation: 2500,
      riskFactors: ['lluvias intensas', 'inundaciones', 'plagas']
    }
  },
  alertTypes: {
    'helada': {
      name: 'Helada',
      severity: 'high',
      description: 'Temperaturas bajo 0°C que pueden dañar cultivos',
      prevention: ['Riego por aspersión', 'Cubiertas protectoras', 'Quema controlada']
    },
    'sequía': {
      name: 'Sequía',
      severity: 'medium',
      description: 'Déficit hídrico prolongado',
      prevention: ['Riego eficiente', 'Mulching', 'Cultivos resistentes']
    },
    'lluvias_intensas': {
      name: 'Lluvias Intensas',
      severity: 'high',
      description: 'Precipitaciones excesivas que pueden causar inundaciones',
      prevention: ['Drenaje adecuado', 'Cultivos en camas elevadas', 'Protección de semillas']
    },
    'granizo': {
      name: 'Granizo',
      severity: 'critical',
      description: 'Precipitación sólida que puede destruir cultivos',
      prevention: ['Mallas antigranizo', 'Seguros agrícolas', 'Refugios temporales']
    },
    'vientos_fuertes': {
      name: 'Vientos Fuertes',
      severity: 'medium',
      description: 'Vientos que pueden dañar plantas y estructuras',
      prevention: ['Barreras cortaviento', 'Tutores para plantas', 'Estructuras reforzadas']
    }
  }
};

// Función para generar alertas de heladas basadas en el pronóstico
router.post(
  '/frost/predict',
  body('lat').isFloat({ min: -90, max: 90 }),
  body('lon').isFloat({ min: -180, max: 180 }),
  body('phone').optional().isString(),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }
    const { lat, lon, phone } = req.body;
    const THRESHOLD = 0.90;

    try {
      const built = await buildFrostFeatures(lat, lon);
      const prediction = await inferFrost(built.featureVector, THRESHOLD);
      let smsResult = null;

      // Si se proporciona un teléfono, se suscribe y se envía un SMS de bienvenida/alerta.
      if (phone) {
        await subscribersService.subscribe(phone, 'Usuario de App');
        const riskLevel = prediction.risk_level.toUpperCase();
        const riskPercent = Math.round(prediction.risk * 100);
        const welcomeMsg = `Bienvenido a las alertas de heladas. Riesgo actual en tu zona: ${riskLevel} (${riskPercent}%). Te avisaremos si el riesgo es alto.`;
        smsResult = await smsService.sendSMS(phone, welcomeMsg, 'frost_welcome');
      }
      
      return res.json({
        success: true,
        prediction,
        features_ordered: built.orderedFeatures,
        meta: built.meta,
        smsSent: !!smsResult
      });
    } catch (e) {
      console.error('Frost predict error:', e);
      return res.status(500).json({
        success: false,
        message: 'Fallo en predicción',
        error: e.message
      });
    }
  }
);

// POST /api/weather/forecast - Obtener pronóstico climático
router.post('/forecast', async (req, res) => {
  try {
    const { region = 'sierra', days = 7, cropType } = req.body;

    const regionData = WEATHER_DATA.regions[region] || WEATHER_DATA.regions.sierra;
    
    // Generar pronóstico simulado
    const forecast = [];
    const today = new Date();
    
    for (let i = 0; i < days; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() + i);
      
      // Variaciones simuladas
      const tempVariation = (Math.random() - 0.5) * 8; // ±4°C
      const humidityVariation = (Math.random() - 0.5) * 0.2; // ±10%
      const precipitationChance = Math.random();
      
      forecast.push({
        date: date.toISOString().split('T')[0],
        temperature: {
          min: Math.round(regionData.avgTemp + tempVariation - 3),
          max: Math.round(regionData.avgTemp + tempVariation + 5),
          avg: Math.round(regionData.avgTemp + tempVariation)
        },
        humidity: Math.max(0.3, Math.min(1.0, regionData.humidity + humidityVariation)),
        precipitation: {
          probability: precipitationChance,
          amount: precipitationChance > 0.7 ? Math.random() * 20 : 0
        },
        windSpeed: Math.random() * 25 + 5, // 5-30 km/h
        conditions: precipitationChance > 0.7 ? 'lluvia' : 
                   precipitationChance > 0.4 ? 'nublado' : 'soleado'
      });
    }

    // Generar alertas basadas en las condiciones
    const alerts = generateWeatherAlerts(forecast, regionData, cropType);

    res.json({
      success: true,
      message: 'Pronóstico climático obtenido',
      data: {
        region: regionData.name,
        forecast,
        alerts,
        recommendations: generateRegionalRecommendations(regionData, forecast, cropType)
      }
    });
  } catch (error) {
    console.error('Error obteniendo pronóstico:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// GET /api/weather/alerts - Obtener alertas climáticas activas
router.get('/alerts', async (req, res) => {
  try {
    const { region = 'sierra', severity } = req.query;
    
    const regionData = WEATHER_DATA.regions[region] || WEATHER_DATA.regions.sierra;
    
    // Simular alertas activas
    const activeAlerts = [];
    
    regionData.riskFactors.forEach(risk => {
      const riskType = risk.replace(' ', '_');
      const alertInfo = WEATHER_DATA.alertTypes[riskType];
      
      if (alertInfo && (!severity || alertInfo.severity === severity)) {
        activeAlerts.push({
          id: `alert_${riskType}_${Date.now()}`,
          type: riskType,
          name: alertInfo.name,
          severity: alertInfo.severity,
          description: alertInfo.description,
          prevention: alertInfo.prevention,
          issuedAt: new Date().toISOString(),
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 horas
          affectedArea: regionData.name,
          probability: Math.random() * 100
        });
      }
    });

    res.json({
      success: true,
      data: {
        region: regionData.name,
        totalAlerts: activeAlerts.length,
        alerts: activeAlerts
      }
    });
  } catch (error) {
    console.error('Error obteniendo alertas:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// GET /api/weather/historical - Obtener datos históricos del clima
router.get('/historical', async (req, res) => {
  try {
    const { region = 'sierra', months = 12 } = req.query;
    
    const regionData = WEATHER_DATA.regions[region] || WEATHER_DATA.regions.sierra;
    
    // Generar datos históricos simulados
    const historical = [];
    const currentDate = new Date();
    
    for (let i = months - 1; i >= 0; i--) {
      const month = new Date(currentDate);
      month.setMonth(month.getMonth() - i);
      
      historical.push({
        month: month.toISOString().split('T')[0].substring(0, 7), // YYYY-MM
        temperature: {
          avg: regionData.avgTemp + (Math.random() - 0.5) * 6,
          min: regionData.avgTemp - 5 + (Math.random() - 0.5) * 4,
          max: regionData.avgTemp + 8 + (Math.random() - 0.5) * 4
        },
        precipitation: regionData.precipitation / 12 * (0.5 + Math.random()),
        humidity: regionData.humidity + (Math.random() - 0.5) * 0.2,
        eventsCount: Math.floor(Math.random() * 5)
      });
    }

    res.json({
      success: true,
      data: {
        region: regionData.name,
        period: `${months} meses`,
        historical,
        trends: generateClimateAnalysis(historical)
      }
    });
  } catch (error) {
    console.error('Error obteniendo datos históricos:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// GET /api/weather/regions - Obtener regiones disponibles
router.get('/regions', async (req, res) => {
  try {
    const regions = Object.keys(WEATHER_DATA.regions).map(key => ({
      id: key,
      name: WEATHER_DATA.regions[key].name,
      climate: WEATHER_DATA.regions[key].climate,
      avgTemp: WEATHER_DATA.regions[key].avgTemp,
      riskFactors: WEATHER_DATA.regions[key].riskFactors.length
    }));

    res.json({
      success: true,
      data: regions
    });
  } catch (error) {
    console.error('Error obteniendo regiones:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// Función para generar alertas basadas en condiciones
function generateWeatherAlerts(forecast, regionData, cropType) {
  const alerts = [];
  
  forecast.forEach((day, index) => {
    // Alerta de helada
    if (day.temperature.min <= 2) {
      alerts.push({
        type: 'helada',
        severity: 'critical',
        date: day.date,
        message: `Riesgo de helada: ${day.temperature.min}°C`,
        recommendations: WEATHER_DATA.alertTypes.helada.prevention
      });
    }
    
    // Alerta de lluvia intensa
    if (day.precipitation.amount > 15) {
      alerts.push({
        type: 'lluvias_intensas',
        severity: 'high',
        date: day.date,
        message: `Lluvias intensas esperadas: ${Math.round(day.precipitation.amount)}mm`,
        recommendations: WEATHER_DATA.alertTypes.lluvias_intensas.prevention
      });
    }
    
    // Alerta de vientos fuertes
    if (day.windSpeed > 20) {
      alerts.push({
        type: 'vientos_fuertes',
        severity: 'medium',
        date: day.date,
        message: `Vientos fuertes: ${Math.round(day.windSpeed)} km/h`,
        recommendations: WEATHER_DATA.alertTypes.vientos_fuertes.prevention
      });
    }
  });
  
  return alerts;
}

// Función para generar recomendaciones regionales
function generateRegionalRecommendations(regionData, forecast, cropType) {
  const recommendations = [];
  
  // Recomendaciones por región
  if (regionData.name === 'Sierra') {
    recommendations.push({
      type: 'regional',
      title: 'Recomendaciones para la Sierra',
      message: 'Protege tus cultivos de las heladas nocturnas y aprovecha las lluvias estacionales.'
    });
  } else if (regionData.name === 'Costa') {
    recommendations.push({
      type: 'regional',
      title: 'Recomendaciones para la Costa',
      message: 'Optimiza el riego debido a la baja precipitación y protege del viento.'
    });
  } else if (regionData.name === 'Selva') {
    recommendations.push({
      type: 'regional',
      title: 'Recomendaciones para la Selva',
      message: 'Maneja el exceso de humedad y prepárate para lluvias intensas.'
    });
  }
  
  // Recomendaciones por cultivo
  if (cropType) {
    if (cropType === 'papa') {
      recommendations.push({
        type: 'cultivo',
        title: 'Cuidado de Papa',
        message: 'La papa es sensible a heladas. Considera riego por aspersión como protección.'
      });
    } else if (cropType === 'maiz') {
      recommendations.push({
        type: 'cultivo',
        title: 'Cuidado de Maíz',
        message: 'El maíz necesita agua constante durante floración. Planifica el riego.'
      });
    }
  }
  
  return recommendations;
}

// Función para análisis de tendencias climáticas
function generateClimateAnalysis(historical) {
  if (historical.length < 3) return {};
  
  const recent = historical.slice(-3);
  const older = historical.slice(0, -3);
  
  const recentAvgTemp = recent.reduce((sum, month) => sum + month.temperature.avg, 0) / recent.length;
  const olderAvgTemp = older.length > 0 ? 
    older.reduce((sum, month) => sum + month.temperature.avg, 0) / older.length : recentAvgTemp;
  
  const recentPrecip = recent.reduce((sum, month) => sum + month.precipitation, 0) / recent.length;
  const olderPrecip = older.length > 0 ?
    older.reduce((sum, month) => sum + month.precipitation, 0) / older.length : recentPrecip;
  
  return {
    temperatureTrend: recentAvgTemp > olderAvgTemp ? 'increasing' : 'decreasing',
    precipitationTrend: recentPrecip > olderPrecip ? 'increasing' : 'decreasing',
    temperatureChange: Math.round((recentAvgTemp - olderAvgTemp) * 100) / 100,
    precipitationChange: Math.round((recentPrecip - olderPrecip) * 100) / 100
  };
}

export default router;