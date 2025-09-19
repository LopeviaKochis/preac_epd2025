import axios from 'axios';

const API_URL = 'https://api.open-meteo.com/v1/forecast';

/**
 * Obtiene el pronóstico meteorológico para el día siguiente para una ubicación específica
 * @param {number} lat - Latitud
 * @param {number} lon - Longitud
 * @returns {Promise<Object>} - Un objeto con las características meteorológicas procesadas
 */
export async function getFrostForecastData(lat, lon) {
  try {
    // Parámetros para la API según documentación de OpenMeteo
    const params = {
      latitude: lat,
      longitude: lon,
      hourly: [
        'temperature_2m',
        'relative_humidity_2m',
        'dew_point_2m',
        'precipitation',
        'rain',
        'wind_speed_10m',
        'surface_pressure'
      ].join(','),
      timezone: 'auto',
      past_days: 7,        // Datos históricos de 7 días
      forecast_days: 1     // Pronóstico de 1 día
    };

    // Realizar petición a la API
    const response = await axios.get(API_URL, { params });
    const dailyData = response.data;

    // Procesar y estructurar los datos para el modelo ML
    const processedData = processWeatherData(dailyData);
    
    return {
      success: true,
      data: processedData,
      metadata: {
        location: {
          latitude: dailyData.latitude,
          longitude: dailyData.longitude,
          timezone: dailyData.timezone,
          elevation: dailyData.elevation
        },
        generationtime_ms: dailyData.generationtime_ms
      }
    };

  } catch (error) {
    console.error('Error fetching OpenMeteo data:', error.message);
    return {
      success: false,
      error: error.message,
      data: null
    };
  }
}

/**
 * Procesa los datos hourly de OpenMeteo para el modelo ML
 * @param {Object} weatherData - Datos crudos de OpenMeteo
 * @returns {Object} - Datos procesados y agregados
 */
function processWeatherData(weatherData) {
  const hourly = weatherData.hourly;
  const hourlyUnits = weatherData.hourly_units;
  
  // Obtener índices para las próximas 24 horas (forecast)
  const currentTime = new Date();
  const forecastStartIndex = hourly.time.findIndex(time => 
    new Date(time) >= currentTime
  );
  const forecastEndIndex = Math.min(
    forecastStartIndex + 24, 
    hourly.time.length
  );

  // Extraer datos del pronóstico (próximas 24 horas)
  const forecastData = {
    temperature_2m: hourly.temperature_2m.slice(forecastStartIndex, forecastEndIndex),
    relative_humidity_2m: hourly.relative_humidity_2m.slice(forecastStartIndex, forecastEndIndex),
    dew_point_2m: hourly.dew_point_2m.slice(forecastStartIndex, forecastEndIndex),
    precipitation: hourly.precipitation.slice(forecastStartIndex, forecastEndIndex),
    rain: hourly.rain.slice(forecastStartIndex, forecastEndIndex),
    wind_speed_10m: hourly.wind_speed_10m.slice(forecastStartIndex, forecastEndIndex),
    surface_pressure: hourly.surface_pressure.slice(forecastStartIndex, forecastEndIndex)
  };

  // Calcular estadísticas agregadas para el modelo ML
  const aggregatedData = {
    // Temperatura
    temp_min: Math.min(...forecastData.temperature_2m),
    temp_max: Math.max(...forecastData.temperature_2m),
    temp_mean: calculateMean(forecastData.temperature_2m),
    temp_std: calculateStandardDeviation(forecastData.temperature_2m),
    
    // Humedad relativa
    humidity_min: Math.min(...forecastData.relative_humidity_2m),
    humidity_max: Math.max(...forecastData.relative_humidity_2m),
    humidity_mean: calculateMean(forecastData.relative_humidity_2m),
    
    // Punto de rocío
    dew_point_min: Math.min(...forecastData.dew_point_2m),
    dew_point_mean: calculateMean(forecastData.dew_point_2m),
    
    // Precipitación
    precipitation_sum: forecastData.precipitation.reduce((a, b) => a + b, 0),
    precipitation_max: Math.max(...forecastData.precipitation),
    rain_sum: forecastData.rain.reduce((a, b) => a + b, 0),
    
    // Viento
    wind_speed_mean: calculateMean(forecastData.wind_speed_10m),
    wind_speed_max: Math.max(...forecastData.wind_speed_10m),
    
    // Presión
    pressure_mean: calculateMean(forecastData.surface_pressure),
    pressure_min: Math.min(...forecastData.surface_pressure),
    
    // Indicadores de riesgo de helada
    frost_risk_hours: countFrostRiskHours(forecastData.temperature_2m, forecastData.dew_point_2m),
    
    // Metadata
    forecast_hours: forecastData.temperature_2m.length,
    units: hourlyUnits
  };

  // Datos históricos para comparación (últimos 7 días)
  const historicalStats = calculateHistoricalStats(
    hourly, 
    0, 
    forecastStartIndex
  );

  return {
    forecast: aggregatedData,
    historical: historicalStats,
    hourly_forecast: forecastData,
    time_range: {
      start: hourly.time[forecastStartIndex],
      end: hourly.time[forecastEndIndex - 1]
    }
  };
}

/**
 * Calcula estadísticas históricas de los últimos 7 días
 */
function calculateHistoricalStats(hourly, startIndex, endIndex) {
  const historicalData = {
    temperature_2m: hourly.temperature_2m.slice(startIndex, endIndex),
    relative_humidity_2m: hourly.relative_humidity_2m.slice(startIndex, endIndex),
    precipitation: hourly.precipitation.slice(startIndex, endIndex)
  };

  return {
    temp_mean_7d: calculateMean(historicalData.temperature_2m),
    temp_min_7d: Math.min(...historicalData.temperature_2m),
    humidity_mean_7d: calculateMean(historicalData.relative_humidity_2m),
    precipitation_sum_7d: historicalData.precipitation.reduce((a, b) => a + b, 0)
  };
}

/**
 * Cuenta las horas con riesgo de helada
 */
function countFrostRiskHours(temperatures, dewPoints) {
  let frostRiskHours = 0;
  for (let i = 0; i < temperatures.length; i++) {
    // Riesgo de helada si temperatura <= 2°C y punto de rocío cercano
    if (temperatures[i] <= 2 && (temperatures[i] - dewPoints[i]) < 3) {
      frostRiskHours++;
    }
  }
  return frostRiskHours;
}

/**
 * Calcula la media de un array
 */
function calculateMean(arr) {
  if (arr.length === 0) return 0;
  return arr.reduce((a, b) => a + b, 0) / arr.length;
}

/**
 * Calcula la desviación estándar
 */
function calculateStandardDeviation(arr) {
  const mean = calculateMean(arr);
  const squaredDiffs = arr.map(value => Math.pow(value - mean, 2));
  const avgSquaredDiff = calculateMean(squaredDiffs);
  return Math.sqrt(avgSquaredDiff);
}

/**
 * Obtiene datos para múltiples ubicaciones
 * @param {Array} locations - Array de objetos {lat, lon, name}
 * @returns {Promise<Array>} - Array con los resultados de cada ubicación
 */
export async function getMultipleLocationsForecast(locations) {
  try {
    const promises = locations.map(loc => 
      getFrostForecastData(loc.lat, loc.lon)
        .then(result => ({
          ...result,
          location: loc.name || `${loc.lat},${loc.lon}`
        }))
    );
    
    const results = await Promise.all(promises);
    return results;
  } catch (error) {
    console.error('Error fetching multiple locations:', error);
    throw error;
  }
}

/**
 * Prepara los datos para el modelo ML
 * @param {Object} weatherData - Datos procesados del clima
 * @returns {Array} - Vector de características para el modelo
 */
export function prepareMLFeatures(weatherData) {
  const forecast = weatherData.forecast;
  const historical = weatherData.historical;
  
  // Vector de características en el orden esperado por tu modelo ML
  // Ajusta este orden según los requerimientos de tu modelo
  return [
    forecast.temp_min,
    forecast.temp_max,
    forecast.temp_mean,
    forecast.temp_std,
    forecast.humidity_min,
    forecast.humidity_max,
    forecast.humidity_mean,
    forecast.dew_point_min,
    forecast.dew_point_mean,
    forecast.precipitation_sum,
    forecast.precipitation_max,
    forecast.rain_sum,
    forecast.wind_speed_mean,
    forecast.wind_speed_max,
    forecast.pressure_mean,
    forecast.pressure_min,
    forecast.frost_risk_hours,
    // Comparación con históricos
    forecast.temp_mean - historical.temp_mean_7d,
    forecast.humidity_mean - historical.humidity_mean_7d,
    forecast.precipitation_sum - (historical.precipitation_sum_7d / 7)
  ];
}

// Exportar todas las funciones
export default {
  getFrostForecastData,
  getMultipleLocationsForecast,
  prepareMLFeatures
};