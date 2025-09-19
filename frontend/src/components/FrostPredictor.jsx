import { useState } from 'react';
import { Card, CardContent, Box, Button, TextField, Typography, Alert, CircularProgress } from '@mui/material';
import { apiService } from '../services/apiService';

const phoneRegex = /^\+51\s?9\d{8}$/;

export default function FrostPredictor({ autoPredict = false }) {
  const [coords, setCoords] = useState({ lat: null, lon: null });
  const [phone, setPhone] = useState('');
  const [predictionResp, setPredictionResp] = useState(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');

  const getLocation = () => {
    setErr('');
    if (!navigator.geolocation) {
      setErr('Geolocalización no soportada');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      pos => {
        const lat = +pos.coords.latitude.toFixed(4);
        const lon = +pos.coords.longitude.toFixed(4);
        setCoords({ lat, lon });
        if (autoPredict) {
          predict(lat, lon);
        }
      },
      e => setErr('No se pudo obtener ubicación: ' + e.message),
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const predict = async (latArg, lonArg) => {
    const lat = latArg ?? coords.lat;
    const lon = lonArg ?? coords.lon;
    setErr('');
    setPredictionResp(null);
    if (lat == null || lon == null) {
      setErr('Ubicación no disponible');
      return;
    }
    if (phone && !phoneRegex.test(phone)) {
      setErr('Teléfono inválido (+51 9XXXXXXXX)');
      return;
    }
    setLoading(true);
    try {
      const data = await apiService.predictFrostRisk({ 
        phone: phone || undefined, 
        lat, 
        lon, 
        sendSms: true 
      });
      setPredictionResp(data);
    } catch (error) {
      setErr(error?.response?.data?.message || error.message || 'Error en la predicción');
    } finally {
      setLoading(false);
    }
  };

  const colorFor = lvl =>
    lvl === 'alto' ? 'error.main' : lvl === 'medio' ? 'warning.main' : 'success.main';

  return (
    <Card sx={{ mb: 3 }}>
      <CardContent>
        <Typography variant="h6" gutterBottom>Predicción de Helada (Modelo ML)</Typography>
        <Box display="flex" flexWrap="wrap" gap={2} mb={2}>
            <Button variant="outlined" onClick={getLocation}>
              {coords.lat ? `Lat: ${coords.lat} Lon: ${coords.lon}` : 'Usar mi ubicación'}
            </Button>
            <TextField
              label="Teléfono (opcional)"
              size="small"
              value={phone}
              onChange={e => setPhone(e.target.value.trim())}
              placeholder="+51 9XXXXXXXX"
            />
            <Button
              variant="contained"
              disabled={loading || coords.lat == null}
              onClick={() => predict()}
            >
              {loading ? <CircularProgress color="inherit" size={20} /> : 'Predecir'}
            </Button>
        </Box>
        {err && <Alert severity="error" sx={{ mb: 2 }}>{err}</Alert>}
        {predictionResp?.success && (
          <Box>
            <Typography fontWeight={600}>
              Riesgo: <span style={{ color: colorFor(predictionResp.prediction.risk_level) }}>
                {predictionResp.prediction.risk_level.toUpperCase()}
              </span> ({Math.round(predictionResp.prediction.risk * 100)}%)
            </Typography>
            {predictionResp.smsSent && (
              <Alert severity="info" sx={{ mt: 1 }}>SMS enviado (riesgo ≥ 90%)</Alert>
            )}
            {predictionResp.prediction.mock && (
              <Alert severity="warning" sx={{ mt: 1 }}>Predicción simulada (fallback)</Alert>
            )}
          </Box>
        )}
      </CardContent>
    </Card>
  );
}