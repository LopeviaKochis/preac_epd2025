import express from 'express';
import { smsService } from '../services/smsService.js';
import { subscribersService } from '../services/subscribersService.js';

const router = express.Router();

// Validación simple de teléfono peruano
const phoneRegex = /^\+51\s?9\d{2}\s?\d{3}\s?\d{3}$/;
const normalizePhone = (p) => (p || '').replace(/\s/g, '');

// GET /api/notifications/config - Obtener configuración de SMS
router.get('/config', async (req, res) => {
  try {
    const config = smsService.getConfig();
    
    res.json({
      success: true,
      data: config
    });
  } catch (error) {
    console.error('Error obteniendo configuración SMS:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// POST /api/notifications/subscribe - Suscribir número a notificaciones SMS
router.post('/subscribe', async (req, res) => {
  try {
    const { phone, name } = req.body || {};
    if (!phone || !phoneRegex.test(phone)) {
      return res.status(400).json({ success: false, message: 'Número de teléfono peruano inválido (+51 9XX XXX XXX)' });
    }
    const formatted = normalizePhone(phone);
    const result = await subscribersService.subscribe(formatted, name);
    res.json({ success: true, data: result });
  } catch (error) {
    console.error('Error suscribiendo teléfono:', error);
    res.status(500).json({ success: false, message: 'Error interno del servidor' });
  }
});

// POST /api/notifications/unsubscribe - Cancelar suscripción SMS
router.post('/unsubscribe', async (req, res) => {
  try {
    const { phone } = req.body || {};
    if (!phone || !phoneRegex.test(phone)) {
      return res.status(400).json({ success: false, message: 'Número de teléfono peruano inválido (+51 9XX XXX XXX)' });
    }
    const formatted = normalizePhone(phone);
    const result = await subscribersService.unsubscribe(formatted);
    res.json({ success: true, data: result });
  } catch (error) {
    console.error('Error desuscribiendo teléfono:', error);
    res.status(500).json({ success: false, message: 'Error interno del servidor' });
  }
});

// GET /api/notifications/status?phone=+51...
router.get('/status', async (req, res) => {
  try {
    const phone = req.query.phone;
    if (!phone || !phoneRegex.test(phone)) {
      return res.status(400).json({ success: false, message: 'Número de teléfono peruano inválido (+51 9XX XXX XXX)' });
    }
    const formatted = normalizePhone(phone);
    const result = await subscribersService.getStatus(formatted);
    res.json({ success: true, data: result });
  } catch (error) {
    console.error('Error consultando estado de suscripción:', error);
    res.status(500).json({ success: false, message: 'Error interno del servidor' });
  }
});

// POST /api/notifications/test - Enviar SMS de prueba
router.post('/test', async (req, res) => {
  try {
    const { phone } = req.body;
    
    if (!phone || !phoneRegex.test(phone)) {
      return res.status(400).json({
        success: false,
        message: 'Número de teléfono peruano inválido (+51 9XX XXX XXX)'
      });
    }

    const result = await smsService.sendSMS(
      normalizePhone(phone),
      `Prueba de SMS desde AgroTech PE. Tu suscripción de SMS funciona correctamente.`,
      'test'
    );

    res.json({
      success: true,
      message: 'SMS de prueba enviado',
      data: result
    });
  } catch (error) {
    console.error('Error enviando SMS de prueba:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error enviando SMS de prueba'
    });
  }
});

// POST /api/notifications/irrigation-alert - Enviar alerta de riego
router.post('/irrigation-alert', async (req, res) => {
  try {
    const { phone, cropType, recommendation } = req.body;
    
    if (!phone || !phoneRegex.test(phone) || !cropType || !recommendation) {
      return res.status(400).json({
        success: false,
        message: 'Teléfono válido (+51 9XX XXX XXX), tipo de cultivo y recomendación son requeridos'
      });
    }

    const result = await smsService.sendIrrigationAlert(normalizePhone(phone), cropType, recommendation);

    res.json({
      success: true,
      message: 'Alerta de riego enviada',
      data: result
    });
  } catch (error) {
    console.error('Error enviando alerta de riego:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error enviando alerta de riego'
    });
  }
});

// POST /api/notifications/weather-alert - Enviar alerta climática
router.post('/weather-alert', async (req, res) => {
  try {
    const { phone, alertType, message } = req.body;
    
    if (!phone || !phoneRegex.test(phone) || !alertType || !message) {
      return res.status(400).json({
        success: false,
        message: 'Teléfono válido (+51 9XX XXX XXX), tipo de alerta y mensaje son requeridos'
      });
    }

    const result = await smsService.sendWeatherAlert(normalizePhone(phone), alertType, message);

    res.json({
      success: true,
      message: 'Alerta climática enviada',
      data: result
    });
  } catch (error) {
    console.error('Error enviando alerta climática:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error enviando alerta climática'
    });
  }
});

// POST /api/notifications/pest-alert - Enviar alerta de plagas
router.post('/pest-alert', async (req, res) => {
  try {
    const { phone, pestType, severity, recommendation } = req.body;
    
    if (!phone || !phoneRegex.test(phone) || !pestType || !severity || !recommendation) {
      return res.status(400).json({
        success: false,
        message: 'Todos los campos son requeridos: teléfono válido (+51 9XX XXX XXX), tipo de plaga, severidad y recomendación'
      });
    }

    const result = await smsService.sendPestAlert(normalizePhone(phone), pestType, severity, recommendation);

    res.json({
      success: true,
      message: 'Alerta de plagas enviada',
      data: result
    });
  } catch (error) {
    console.error('Error enviando alerta de plagas:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error enviando alerta de plagas'
    });
  }
});

// POST /api/notifications/solar-maintenance - Enviar recordatorio de mantenimiento solar
router.post('/solar-maintenance', async (req, res) => {
  try {
    const { phone, systemType, nextMaintenance } = req.body;
    
    if (!phone || !phoneRegex.test(phone) || !systemType || !nextMaintenance) {
      return res.status(400).json({
        success: false,
        message: 'Teléfono válido (+51 9XX XXX XXX), tipo de sistema y fecha de mantenimiento son requeridos'
      });
    }

    const result = await smsService.sendSolarMaintenanceReminder(normalizePhone(phone), systemType, nextMaintenance);

    res.json({
      success: true,
      message: 'Recordatorio de mantenimiento enviado',
      data: result
    });
  } catch (error) {
    console.error('Error enviando recordatorio de mantenimiento:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error enviando recordatorio de mantenimiento'
    });
  }
});

// GET /api/notifications/history - Obtener historial de SMS
router.get('/history', async (req, res) => {
  try {
    const { limit = 10 } = req.query;
    const result = await smsService.getSMSHistory('anonymous', parseInt(limit));

    res.json({
      success: true,
      data: result.data
    });
  } catch (error) {
    console.error('Error obteniendo historial de SMS:', error);
    res.status(500).json({
      success: false,
      message: 'Error obteniendo historial de SMS'
    });
  }
});

export default router;