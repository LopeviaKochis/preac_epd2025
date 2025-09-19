import { useState } from 'react';
import { Box, Card, CardContent, TextField, Button, Typography, Alert, CircularProgress } from '@mui/material';
import { apiService } from '../services/apiService';

const phoneRegex = /^\+51\s?9\d{8}$/;

export default function FrostPredictor() {
  const [phone, setPhone] = useState('');
  const [coords, setCoords] = useState({ lat: null, lon: null });
  const [result, setResult] = useState(null);
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
        setCoords({
          lat: +pos.coords.latitude.toFixed(4),
          lon: +pos.coords.longitude.toFixed(4)
        });
      },
      e => setErr('No se pudo obtener ubicación: ' + e.message),
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const registerForAlerts = async () => {
    setErr('');
    setResult(null);
    if (!coords.lat || !coords.lon) {
      setErr('Se requiere la ubicación para registrarse.');
      return;
    }
    if (!phoneRegex.test(phone)) {
      setErr('Formato de teléfono inválido. Use +51 9XXXXXXXX');
      return;
    }
    setLoading(true);
    try {
      const res = await apiService.predictFrostRisk({
        phone,
        lat: coords.lat,
        lon: coords.lon,
        sendSms: true
      });
      setResult(res);
    } catch (e) {
      setErr(e.message || 'Error registrando para alertas.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card sx={{ mt: 3 }}>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Notificaciones de Heladas por SMS
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Regístrate para recibir alertas por SMS cuando se detecte un alto riesgo de helada en tu ubicación. Se enviará un SMS de bienvenida confirmando tu registro.
        </Typography>
        <Box display="flex" gap={2} flexWrap="wrap" mb={2}>
          <Button variant="outlined" onClick={getLocation} sx={{ flexShrink: 0 }}>
            {coords.lat ? `Ubicación: ${coords.lat}, ${coords.lon}` : 'Obtener mi ubicación'}
          </Button>
          <TextField
            label="Número de Teléfono"
            size="small"
            value={phone}
            onChange={e => setPhone(e.target.value.trim())}
            placeholder="+51 9XXXXXXXX"
            fullWidth
            sx={{ maxWidth: '250px' }}
          />
          <Button
            variant="contained"
            onClick={registerForAlerts}
            disabled={loading || !coords.lat || !phone}
          >
            {loading ? <CircularProgress size={24} /> : 'Registrarse'}
          </Button>
        </Box>
        {err && <Alert severity="error" sx={{ mb: 2 }}>{err}</Alert>}
        {result && result.success && (
          <Box>
            <Alert severity="success" sx={{ mt: 1 }}>
              ¡Registro exitoso! Se ha enviado un SMS de bienvenida a tu teléfono. Se te notificará cuando el riesgo de helada sea alto.
            </Alert>
            <Typography variant="body2" sx={{ mt: 2 }}>
              Predicción actual para tu zona: <strong>{result.prediction.risk_level?.toUpperCase()}</strong> ({Math.round(result.prediction.risk * 100)}% de riesgo).
            </Typography>
            {result.prediction.fallback && (
              <Alert severity="warning" sx={{ mt: 1, fontSize: '0.8rem' }}>
                Nota: La predicción actual se basa en un modelo simplificado. Las alertas se enviarán usando el modelo de alta precisión.
              </Alert>
            )}
          </Box>
        )}
      </CardContent>
    </Card>
  );
}