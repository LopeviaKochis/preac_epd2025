import axios from 'axios';

const OM_URL = 'https://api.open-meteo.com/v1/forecast';

/**
 * Construye el vector de características para el modelo de heladas.
 * Retorna: { featureVector, orderedFeatures, meta }
 */
export async function buildFrostFeatures(lat, lon) {
  const params = {
    latitude: lat,
    longitude: lon,
    past_days: 1,
    forecast_days: 1,
    hourly: [
      'temperature_2m',
      'relative_humidity_2m',
      'dew_point_2m',
      'precipitation',
      'wind_speed_10m',
      'surface_pressure',
      'is_day'
    ].join(','),
    timezone: 'auto'
  };

  const { data } = await axios.get(OM_URL, { params });
  const h = data?.hourly;
  if (!h?.time?.length) throw new Error('No se obtuvieron datos horarios');

  const now = Date.now();
  let targetIdx = h.time.findIndex(t => new Date(t).getTime() > now);
  if (targetIdx === -1) targetIdx = h.time.length - 1;

  if (targetIdx < 6) {
    throw new Error('Horas previas insuficientes (se requieren >= 6 para lags)');
  }

  const temp = h.temperature_2m;
  const rh = h.relative_humidity_2m;
  const dew = h.dew_point_2m;
  const wind = h.wind_speed_10m;
  const precip = h.precipitation;
  const press = h.surface_pressure;
  const isDay = h.is_day;

  const TT_target = temp[targetIdx];
  const TT_prev = temp[targetIdx - 1];
  const TT_lag_6h = temp[targetIdx - 6];
  const HR_target = rh[targetIdx];
  const HR_lag_3h = rh[targetIdx - 3];
  const dewPoint = dew[targetIdx];
  const FF = wind[targetIdx];
  const PP = (press && press[targetIdx] != null) ? press[targetIdx] : precip[targetIdx];
  const TT_change = TT_target - TT_prev;

  const ts = new Date(h.time[targetIdx]);
  const hour = ts.getHours();
  const month = ts.getMonth() + 1;

  const hour_sin = Math.sin((2 * Math.PI * hour) / 24);
  const hour_cos = Math.cos((2 * Math.PI * hour) / 24);
  const month_sin = Math.sin((2 * Math.PI * (month - 1)) / 12);
  const month_cos = Math.cos((2 * Math.PI * (month - 1)) / 12);
  const is_night = isDay ? (isDay[targetIdx] === 0 ? 1 : 0) : (hour < 6 || hour >= 18 ? 1 : 0);

  // Orden EXACTO requerido:
  const featureVector = [
    HR_target,
    FF,
    PP,
    dewPoint,
    TT_change,
    hour_sin,
    hour_cos,
    month_sin,
    month_cos,
    is_night,
    TT_lag_6h,
    HR_lag_3h
  ];

  return {
    featureVector,
    orderedFeatures: {
      HR: HR_target,
      FF,
      PP,
      dew_point: dewPoint,
      TT_change,
      hour_sin,
      hour_cos,
      month_sin,
      month_cos,
      is_night,
      TT_lag_6h,
      HR_lag_3h
    },
    meta: {
      targetHourUTC: h.time[targetIdx],
      latitude: data.latitude,
      longitude: data.longitude,
      timezone: data.timezone
    }
  };
}