// ...existing code...
import { PythonShell } from 'python-shell';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const script = join(__dirname, '../scripts/predict_frost_vector.py');

export async function inferFrost(vector, threshold = 0.9) {
  try {
    const results = await PythonShell.run(script, {
      mode: 'json',
      args: [JSON.stringify({ vector, threshold })]
    });
    return results[0]; // { risk, risk_level, threshold }
  } catch (e) {
    console.error('Error ejecutando modelo:', e.message);
    // Fallback con predicción basada en características básicas
    const temp = vector[10]; // TT_lag_6h (temperatura 6h atrás)
    const humidity = vector[0]; // HR (humedad relativa)
    const dewPoint = vector[3]; // dew_point
    
    // Lógica simple de fallback para heladas
    let risk = 0.1; // riesgo base bajo
    if (temp < 5) risk += 0.3; // temperatura muy baja
    if (temp < 2) risk += 0.3; // temperatura crítica
    if (humidity > 85) risk += 0.2; // alta humedad
    if (dewPoint < 0) risk += 0.2; // punto de rocío bajo cero
    
    risk = Math.min(risk, 1.0); // máximo 100%
    
    const risk_level = risk >= threshold ? 'alto' : (risk >= 0.5 ? 'medio' : 'bajo');
    
    return {
      risk,
      risk_level,
      threshold,
      mock: true,
      fallback: true,
      error: 'Modelo ML no disponible - usando predicción simplificada'
    };
  }
}