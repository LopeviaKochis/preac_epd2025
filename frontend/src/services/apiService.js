import axios from 'axios';

// Usa una URL relativa para que el proxy de Vite funcione correctamente.
const api = axios.create({
  baseURL: '/api', //  => hará que las peticiones vayan a http://localhost:3000/api -> proxied to 5003
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Interceptor para agregar token de autenticación
api.interceptors.response.use(
  r => r,
  e => {
    if (e?.response?.status === 404) {
      console.warn('Endpoint 404:', e.config?.url);
    }
    return Promise.reject(e);
  }
);

// Interceptor para manejar respuestas y errores
api.interceptors.response.use(
  (response) => {
    return response.data;
  },
  (error) => {
    const errorMessage = error.response?.data?.message || error.message || 'Error desconocido';
    return Promise.reject(new Error(errorMessage));
  }
);

// Servicios de energía solar
export const solarService = {
  async calculate(data) {
    try {
      const response = await api.post('/solar/calculate', data);
      return response.data;
    } catch (error) {
      console.error('Error en cálculo solar:', error);
      
      // Fallback offline con datos simulados
      if (!navigator.onLine) {
        return this.getOfflineCalculation(data);
      }
      throw error;
    }
  },

  async getLocations() {
    try {
      const response = await api.get('/solar/locations');
      return response.data;
    } catch (error) {
      console.error('Error obteniendo ubicaciones:', error);
      
      // Fallback offline
      if (!navigator.onLine) {
        return [
          { id: 'lima', name: 'Lima', irradiation: 4.5, efficiency: 0.85 },
          { id: 'arequipa', name: 'Arequipa', irradiation: 5.2, efficiency: 0.88 },
          { id: 'cusco', name: 'Cusco', irradiation: 4.8, efficiency: 0.82 }
        ];
      }
      throw error;
    }
  },

  async getSystemTypes() {
    try {
      const response = await api.get('/solar/system-types');
      return response.data;
    } catch (error) {
      console.error('Error obteniendo tipos de sistema:', error);
      
      // Fallback offline
      if (!navigator.onLine) {
        return [
          { id: 'monocristalino', name: 'Monocristalino', efficiency: 0.20, costPerWatt: 1.2, lifespan: 25 },
          { id: 'policristalino', name: 'Policristalino', efficiency: 0.16, costPerWatt: 1.0, lifespan: 22 },
          { id: 'amorfo', name: 'Amorfo', efficiency: 0.10, costPerWatt: 0.8, lifespan: 20 }
        ];
      }
      throw error;
    }
  },

  getOfflineCalculation(data) {
    const { area, systemType = 'monocristalino' } = data;
    const baseGeneration = area * 150;
    const systemMultiplier = systemType === 'monocristalino' ? 1.2 : 
                           systemType === 'policristalino' ? 1.0 : 0.8;
    
    const monthlyGeneration = baseGeneration * systemMultiplier;
    const annualSavings = monthlyGeneration * 12 * 0.22;
    
    return {
      calculations: {
        panelPower: area * 200,
        systemPower: area * 200 * 0.2,
        dailyGeneration: monthlyGeneration / 30,
        monthlyGeneration: Math.round(monthlyGeneration),
        annualGeneration: monthlyGeneration * 12
      },
      economics: {
        systemCost: area * 1200,
        monthlySavings: Math.round(monthlyGeneration * 0.22),
        annualSavings: Math.round(annualSavings),
        paybackPeriod: Math.round((area * 1200) / annualSavings * 10) / 10,
        totalSavings: annualSavings * 25,
        roi: ((annualSavings * 25 - area * 1200) / (area * 1200)) * 100
      },
      charts: {
        monthlyProduction: [
          { month: 'Ene', production: monthlyGeneration * 1.1 },
          { month: 'Feb', production: monthlyGeneration * 1.0 },
          { month: 'Mar', production: monthlyGeneration * 1.2 },
          { month: 'Abr', production: monthlyGeneration * 1.0 },
          { month: 'May', production: monthlyGeneration * 0.9 },
          { month: 'Jun', production: monthlyGeneration * 0.8 }
        ],
        savingsBreakdown: [
          { category: 'Ahorro Mensual', value: monthlyGeneration * 0.22 },
          { category: 'Ahorro Anual', value: annualSavings },
          { category: 'Ahorro Total (25 años)', value: annualSavings * 25 }
        ]
      },
      recommendations: [
        {
          type: 'info',
          title: 'Datos offline',
          message: 'Conecta a internet para obtener cálculos actualizados'
        }
      ]
    };
  }
};

// Servicios de API
export const apiService = {
  // Predicción de heladas
  async predictFrostRisk({ phone, lat, lon, sendSms = true }) {
    try {
      console.log('Llamando predicción helada', { phone, lat, lon, endpoint: '/weather/frost/predict' });
      // La respuesta de axios ya está siendo procesada por el interceptor, 
      // que devuelve directamente `response.data`. Aquí simplemente retornamos eso.
      const responseData = await api.post('/weather/frost/predict', { phone, lat, lon, sendSms });
      return responseData;
    } catch (err) {
      // El interceptor ya formatea el error, así que lo relanzamos.
      console.error('Error en predictFrostRisk (apiService):', err.message);
      throw err;
    }
  },
};

// Servicios de riego inteligente
export const irrigationService = {
  async calculate(data) {
    try {
      const response = await api.post('/irrigation/calculate', data);
      return response.data;
    } catch (error) {
      console.error('Error en cálculo de riego:', error);
      
      // Fallback offline
      if (!navigator.onLine) {
        return this.getOfflineCalculation(data);
      }
      throw error;
    }
  },

  async getCrops() {
    try {
      const response = await api.get('/irrigation/crops');
      return response.data;
    } catch (error) {
      console.error('Error obteniendo cultivos:', error);
      
      // Fallback offline
      if (!navigator.onLine) {
        return [
          { id: 'maiz', name: 'Maíz', waterNeed: 500, growthStages: 5 },
          { id: 'papa', name: 'Papa', waterNeed: 450, growthStages: 5 },
          { id: 'cebada', name: 'Cebada', waterNeed: 350, growthStages: 6 }
        ];
      }
      throw error;
    }
  },

  async getSystems() {
    try {
      const response = await api.get('/irrigation/systems');
      return response.data;
    } catch (error) {
      console.error('Error obteniendo sistemas:', error);
      
      // Fallback offline
      if (!navigator.onLine) {
        return [
          { id: 'goteo', name: 'Riego por Goteo', efficiency: 0.90, costPerHa: 3500 },
          { id: 'aspersion', name: 'Riego por Aspersión', efficiency: 0.75, costPerHa: 2500 },
          { id: 'microaspersion', name: 'Micro Aspersión', efficiency: 0.85, costPerHa: 2800 }
        ];
      }
      throw error;
    }
  },

  getOfflineCalculation(data) {
    const { area, cropType, systemType } = data;
    const baseWaterNeed = area * 500;
    
    const systemEfficiency = {
      'goteo': 0.9,
      'aspersion': 0.75,
      'microaspersion': 0.85,
      'gravedad': 0.45
    };
    
    const efficiency = systemEfficiency[systemType] || 0.75;
    const waterSavings = baseWaterNeed * (1 - efficiency);
    const costSavings = waterSavings * 0.002;
    
    return {
      calculations: {
        baseWaterNeed,
        adjustedWaterNeed: baseWaterNeed,
        currentWaterUse: baseWaterNeed / 0.45,
        newWaterUse: baseWaterNeed / efficiency,
        waterSaved: waterSavings,
        waterSavingsPercent: ((1 - efficiency / 0.45) * 100),
        systemEfficiency: efficiency * 100
      },
      economics: {
        systemCost: area * 2500,
        annualWaterSavings: costSavings,
        laborCostReduction: area * 1000,
        annualSavings: costSavings + (area * 1000),
        paybackPeriod: (area * 2500) / (costSavings + (area * 1000))
      },
      charts: {
        waterUsageComparison: [
          { system: 'Sistema Actual', usage: baseWaterNeed / 0.45 },
          { system: 'Sistema Nuevo', usage: baseWaterNeed / efficiency },
          { system: 'Ahorro', usage: waterSavings }
        ]
      },
      recommendations: [
        {
          type: 'info',
          title: 'Datos offline',
          message: 'Conecta a internet para obtener cálculos actualizados'
        }
      ]
    };
  }
};

// Servicios de notificaciones
export const notificationService = {
  async sendTestSMS(phone) {
    try {
      const response = await api.post('/notifications/test', { phone });
      return response.data;
    } catch (error) {
      console.error('Error enviando SMS de prueba:', error);
      
      if (!navigator.onLine) {
        return {
          success: true,
          messageId: 'offline_' + Date.now(),
          phone,
          status: 'offline',
          message: 'SMS simulado en modo offline'
        };
      }
      throw error;
    }
  },

  async sendIrrigationAlert(phone, cropType, recommendation) {
    try {
      const response = await api.post('/notifications/irrigation-alert', {
        phone,
        cropType,
        recommendation
      });
      return response.data;
    } catch (error) {
      console.error('Error enviando alerta de riego:', error);
      throw error;
    }
  },

  async getConfig() {
    try {
      const response = await api.get('/notifications/config');
      return response.data;
    } catch (error) {
      console.error('Error obteniendo configuración SMS:', error);
      throw error;
    }
  }
};

// Función para verificar conectividad con el backend
export const checkBackendHealth = async () => {
  try {
    const response = await axios.get(`${API_BASE_URL.replace('/api', '')}/health`, { timeout: 5000 });
    return response.data;
  } catch (error) {
    console.error('Backend no disponible:', error);
    return null;
  }
};

export default api;