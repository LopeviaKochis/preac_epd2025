import jwt from 'jsonwebtoken';
import { User } from '../models/User.js';

export const authenticate = async (req, res, next) => {
  try {
    let token;

    // Verificar si el token está en los headers
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    // Verificar si existe token
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'No autorizado - Token requerido'
      });
    }

    try {
      // Verificar token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      // Buscar usuario en el modelo (sin contraseña)
      const user = await User.findById(decoded.userId);
      
      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'No autorizado - Usuario no encontrado'
        });
      }
      
      // Agregar usuario al request
      req.user = user;
      next();
    } catch (error) {
      console.error('Error verificando token:', error);
      return res.status(401).json({
        success: false,
        message: 'No autorizado - Token inválido'
      });
    }
  } catch (error) {
    console.error('Error en middleware de autenticación:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

// Middleware para validar números de teléfono peruanos
export const validatePeruvianPhone = (req, res, next) => {
  const { phone } = req.body;
  
  if (phone) {
    const phoneRegex = /^\+51\s?9\d{2}\s?\d{3}\s?\d{3}$/;
    
    if (!phoneRegex.test(phone)) {
      return res.status(400).json({
        success: false,
        message: 'Número de teléfono peruano inválido. Formato: +51 9XX XXX XXX'
      });
    }
  }
  
  next();
};

// Alias para compatibilidad
export const protect = authenticate;