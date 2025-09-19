import twilio from 'twilio';

// Configuración de Twilio
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const phoneNumber = process.env.TWILIO_PHONE_NUMBER;

let client = null;
// Inicializar cliente Twilio solo si las credenciales parecen válidas
try {
  const looksValid = Boolean(accountSid && authToken && phoneNumber && accountSid.startsWith('AC'));
  if (looksValid) {
    client = twilio(accountSid, authToken);
  } else {
    console.warn('Configuración de Twilio incompleta o inválida. SMS será simulado.');
  }
} catch (e) {
  console.warn('No se pudo inicializar Twilio. Modo simulación activado.');
  client = null;
}

// Validar número de teléfono peruano
const validatePeruvianPhone = (phone) => {
  const phoneRegex = /^\+51\s?9\d{2}\s?\d{3}\s?\d{3}$/;
  return phoneRegex.test(phone);
};

// Formatear número de teléfono
const formatPhoneNumber = (phone) => {
  // Remover espacios y asegurar formato +51
  return phone.replace(/\s/g, '');
};

export const smsService = {
  // Enviar alerta de helada
  async sendFrostAlert(phone, prediction, meta) {
    const { risk, risk_level } = prediction;
    const pct = Math.round(risk * 100);
    const hourLocal = meta?.targetHourUTC || '';
    const msg = `ALERTA HELADA (${pct}% - ${risk_level.toUpperCase()}) Hora objetivo: ${hourLocal}. Protege tus cultivos.`;
    return await this.sendSMS(phone, msg, 'frost_alert');
  },

  // Enviar SMS de bienvenida
  async sendWelcomeSMS(phone, userName) {
    try {
      if (!validatePeruvianPhone(phone)) {
        throw new Error('Número de teléfono inválido');
      }

      const message = `¡Hola ${userName}! 🌱 Bienvenido(a) a EnerAgro PE. Te has registrado correctamente. Ahora puedes acceder a todas nuestras herramientas agrícolas inteligentes.`;

      return await this.sendSMS(phone, message, 'welcome');
    } catch (error) {
      console.error('Error enviando SMS de bienvenida:', error);
      throw error;
    }
  },

  // Enviar alerta de riego
  async sendIrrigationAlert(phone, cropType, recommendation) {
    try {
      if (!validatePeruvianPhone(phone)) {
        throw new Error('Número de teléfono inválido');
      }

      const message = `🚨 ALERTA DE RIEGO - ${cropType.toUpperCase()}: ${recommendation}. Revisa la app para más detalles. AgroTech PE`;

      return await this.sendSMS(phone, message, 'irrigation_alert');
    } catch (error) {
      console.error('Error enviando alerta de riego:', error);
      throw error;
    }
  },

  // Enviar alerta climática
  async sendWeatherAlert(phone, alertType, message) {
    try {
      if (!validatePeruvianPhone(phone)) {
        throw new Error('Número de teléfono inválido');
      }

      const smsMessage = `🌦️ ALERTA CLIMÁTICA: ${message}. Toma las precauciones necesarias. EnerAgro PE`;

      return await this.sendSMS(phone, smsMessage, 'weather_alert');
    } catch (error) {
      console.error('Error enviando alerta climática:', error);
      throw error;
    }
  },

  // Enviar alerta de plagas
  async sendPestAlert(phone, pestType, severity, recommendation) {
    try {
      if (!validatePeruvianPhone(phone)) {
        throw new Error('Número de teléfono inválido');
      }

      const severityText = {
        'low': 'BAJA',
        'medium': 'MEDIA',
        'high': 'ALTA',
        'critical': 'CRÍTICA'
      }[severity] || severity.toUpperCase();

      const message = `🐛 ALERTA DE PLAGAS - Severidad: ${severityText}. ${pestType}: ${recommendation}. Revisa la app para más información. AgroTech PE`;

      return await this.sendSMS(phone, message, 'pest_alert');
    } catch (error) {
      console.error('Error enviando alerta de plagas:', error);
      throw error;
    }
  },

  // Enviar recordatorio de mantenimiento solar
  async sendSolarMaintenanceReminder(phone, systemType, nextMaintenance) {
    try {
      if (!validatePeruvianPhone(phone)) {
        throw new Error('Número de teléfono inválido');
      }

      const message = `☀️ RECORDATORIO: Mantenimiento de tu sistema solar ${systemType} programado para ${nextMaintenance}. AgroTech PE`;

      return await this.sendSMS(phone, message, 'solar_maintenance');
    } catch (error) {
      console.error('Error enviando recordatorio solar:', error);
      throw error;
    }
  },

  // Función genérica para enviar SMS
  async sendSMS(phone, message, type = 'general') {
    try {
      const formattedPhone = formatPhoneNumber(phone);
      
      // Si no hay cliente de Twilio configurado, simular envío
      if (!client) {
        console.log(`[SMS SIMULADO] ${type.toUpperCase()}:`);
        console.log(`Para: ${formattedPhone}`);
        console.log(`Mensaje: ${message}`);
        console.log('---');
        
        return {
          success: true,
          messageId: `sim_${Date.now()}`,
          phone: formattedPhone,
          message,
          type,
          status: 'simulated',
          timestamp: new Date().toISOString()
        };
      }

      // Enviar SMS real usando Twilio
      const result = await client.messages.create({
        body: message,
        from: phoneNumber,
        to: formattedPhone
      });

      console.log(`SMS enviado exitosamente: ${result.sid}`);

      return {
        success: true,
        messageId: result.sid,
        phone: formattedPhone,
        message,
        type,
        status: result.status,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error enviando SMS:', error);
      
      return {
        success: false,
        error: error.message,
        phone: formatPhoneNumber(phone),
        message,
        type,
        timestamp: new Date().toISOString()
      };
    }
  },

  // Obtener historial de SMS (simulado)
  async getSMSHistory(userId, limit = 10) {
    try {
      // En una implementación real, esto vendría de una base de datos
      // Por ahora, retornamos datos de ejemplo
      return {
        success: true,
        data: {
          userId,
          messages: [],
          total: 0,
          limit
        }
      };
    } catch (error) {
      console.error('Error obteniendo historial SMS:', error);
      throw error;
    }
  },

  // Validar configuración de Twilio
  isConfigured() {
  return !!(accountSid && authToken && phoneNumber && accountSid.startsWith('AC'));
  },

  // Obtener información de configuración
  getConfig() {
    return {
      isConfigured: this.isConfigured(),
      hasAccountSid: !!accountSid,
      hasAuthToken: !!authToken,
      hasPhoneNumber: !!phoneNumber,
      mode: this.isConfigured() ? 'real' : 'simulation'
    };
  }
};