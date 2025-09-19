import React, { useState, useEffect } from 'react';
import { Box, TextField, Button, Typography, Alert, Stack } from '@mui/material';
import axios from 'axios';

const peruPhoneRegex = /^\+51\s?9\d{2}\s?\d{3}\s?\d{3}$/;

const PhoneOptIn = () => {
  const [phone, setPhone] = useState('');
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const fetchStatus = async (p) => {
    try {
      if (!p || !peruPhoneRegex.test(p)) return;
      const res = await axios.get(`/api/notifications/status`, { params: { phone: p } });
      setStatus(res.data?.data || null);
    } catch (e) {
      // ignore
    }
  };

  useEffect(() => {
    const saved = localStorage.getItem('preac_phone');
    if (saved) {
      setPhone(saved);
      fetchStatus(saved);
    }
  }, []);

  const onSubscribe = async () => {
    try {
      setLoading(true);
      setMessage('');
      if (!peruPhoneRegex.test(phone)) {
        setMessage('Número inválido. Formato: +51 9XX XXX XXX');
        return;
      }
      const res = await axios.post('/api/notifications/subscribe', { phone });
      setStatus(res.data?.data || { subscribed: true });
      localStorage.setItem('preac_phone', phone);
      setMessage('Suscripción activa para SMS.');
    } catch (e) {
      setMessage(e.response?.data?.message || 'Error al suscribirse');
    } finally {
      setLoading(false);
    }
  };

  const onUnsubscribe = async () => {
    try {
      setLoading(true);
      setMessage('');
      if (!peruPhoneRegex.test(phone)) {
        setMessage('Número inválido. Formato: +51 9XX XXX XXX');
        return;
      }
      const res = await axios.post('/api/notifications/unsubscribe', { phone });
      setStatus({ subscribed: false });
      setMessage('Suscripción cancelada.');
    } catch (e) {
      setMessage(e.response?.data?.message || 'Error al cancelar');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
      <Typography variant="subtitle1" sx={{ mb: 1 }}>Alertas por SMS (opcional)</Typography>
      {message && (
        <Alert severity="info" sx={{ mb: 1 }}>{message}</Alert>
      )}
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} alignItems="center">
        <TextField
          label="Teléfono (+51 9XX XXX XXX)"
          size="small"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          sx={{ minWidth: 260 }}
        />
        <Button variant="contained" disabled={loading} onClick={onSubscribe}>Suscribirse</Button>
        <Button variant="outlined" disabled={loading} onClick={onUnsubscribe}>Cancelar</Button>
      </Stack>
      {status && (
        <Typography variant="caption" sx={{ mt: 1, display: 'block', color: status.subscribed ? 'success.main' : 'text.secondary' }}>
          Estado: {status.subscribed ? 'Suscrito' : 'No suscrito'}
        </Typography>
      )}
    </Box>
  );
};

export default PhoneOptIn;
