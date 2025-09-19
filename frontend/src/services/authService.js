import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

// Configurar axios
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
});

// Interceptor para agregar token a las peticiones
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Interceptor para manejar errores de autenticación
api.interceptors.response.use(
  (response) => response,
  (error) => Promise.reject(error)
);

export const authService = {
  // Iniciar sesión
  async login(credentials) {
    try {
      const response = await api.post('/auth/login', credentials);
      return response.data;
    } catch (error) {
      if (!navigator.onLine) {
        throw new Error('Sin conexión a internet');
      }
      throw new Error(error.response?.data?.message || 'Error de autenticación');
    }
  },

  // Registrar usuario
  async register(userData) {
    try {
      const response = await api.post('/auth/register', userData);
      return response.data;
    } catch (error) {
      if (!navigator.onLine) {
        throw new Error('Sin conexión a internet');
      }
      throw new Error(error.response?.data?.message || 'Error en el registro');
    }
  },

  // Verificar token
  async verifyToken(token) {
    try {
      const response = await api.get('/auth/verify', {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data.user;
    } catch (error) {
      throw error;
    }
  },

  // Validar número de teléfono peruano
  validatePeruvianPhone(phone) {
    // Formato: +51 9XX XXX XXX o 9XX XXX XXX
    const phoneRegex = /^(\+51\s?)?9\d{8}$/;
    return phoneRegex.test(phone.replace(/\s/g, ''));
  },

  // Formatear número peruano
  formatPeruvianPhone(phone) {
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.startsWith('51')) {
      return `+51 ${cleaned.slice(2, 5)} ${cleaned.slice(5, 8)} ${cleaned.slice(8)}`;
    } else if (cleaned.startsWith('9')) {
      return `+51 ${cleaned.slice(0, 3)} ${cleaned.slice(3, 6)} ${cleaned.slice(6)}`;
    }
    return phone;
  }
};

export default api;