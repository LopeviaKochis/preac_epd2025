import jwt from 'jsonwebtoken';
import { User } from '../models/User.js';

// Generar JWT
const generateToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '30d',
  });
};

// Validar formato de teléfono peruano
const validatePeruvianPhone = (phone) => {
  const phoneRegex = /^\+51\s?9\d{2}\s?\d{3}\s?\d{3}$/;
  return phoneRegex.test(phone);
};

export const authController = {
  // Registro de usuario
  async register(req, res) {
    try {
      const { name, email, password, phone } = req.body;

      // Validaciones básicas
      if (!name || !email || !password) {
        return res.status(400).json({
          success: false,
          message: 'Nombre, email y contraseña son requeridos'
        });
      }

      // Validar formato de email
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({
          success: false,
          message: 'Formato de email inválido'
        });
      }

      // Validar teléfono si se proporciona
      if (phone && !validatePeruvianPhone(phone)) {
        return res.status(400).json({
          success: false,
          message: 'El teléfono debe tener formato +51 9XX XXX XXX'
        });
      }

      // Validar longitud de contraseña
      if (password.length < 6) {
        return res.status(400).json({
          success: false,
          message: 'La contraseña debe tener al menos 6 caracteres'
        });
      }

      // Crear usuario
      const user = await User.create({ name, email, password, phone });
      
      // Generar token
      const token = generateToken(user.id);

      res.status(201).json({
        success: true,
        message: 'Usuario registrado exitosamente',
        data: {
          user,
          token
        }
      });
    } catch (error) {
      console.error('Error en registro:', error);
      
      if (error.message.includes('ya está registrado')) {
        return res.status(409).json({
          success: false,
          message: error.message
        });
      }

      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  },

  // Login de usuario
  async login(req, res) {
    try {
      const { email, password } = req.body;

      // Validaciones básicas
      if (!email || !password) {
        return res.status(400).json({
          success: false,
          message: 'Email y contraseña son requeridos'
        });
      }

      // Buscar usuario
      const user = await User.findByEmail(email);
      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'Credenciales inválidas'
        });
      }

      // Validar contraseña
      const isPasswordValid = await User.validatePassword(password, user.password);
      if (!isPasswordValid) {
        return res.status(401).json({
          success: false,
          message: 'Credenciales inválidas'
        });
      }

      // Generar token
      const token = generateToken(user.id);

      // Remover password del objeto user
      const { password: _, ...userWithoutPassword } = user;

      res.json({
        success: true,
        message: 'Login exitoso',
        data: {
          user: userWithoutPassword,
          token
        }
      });
    } catch (error) {
      console.error('Error en login:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  },

  // Obtener perfil del usuario
  async getProfile(req, res) {
    try {
      // El usuario ya está disponible en req.user gracias al middleware de auth
      res.json({
        success: true,
        data: {
          user: req.user
        }
      });
    } catch (error) {
      console.error('Error obteniendo perfil:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  },

  // Actualizar perfil
  async updateProfile(req, res) {
    try {
      const { name, phone } = req.body;
      const updateData = {};

      if (name) updateData.name = name;
      if (phone) {
        // Validar formato de teléfono
        if (!validatePeruvianPhone(phone)) {
          return res.status(400).json({
            success: false,
            message: 'El teléfono debe tener formato +51 9XX XXX XXX'
          });
        }
        updateData.phone = phone;
      }

      if (Object.keys(updateData).length === 0) {
        return res.status(400).json({
          success: false,
          message: 'No hay datos para actualizar'
        });
      }

      const updatedUser = await User.update(req.user.id, updateData);

      res.json({
        success: true,
        message: 'Perfil actualizado exitosamente',
        data: {
          user: updatedUser
        }
      });
    } catch (error) {
      console.error('Error actualizando perfil:', error);
      
      if (error.message.includes('ya está registrado')) {
        return res.status(409).json({
          success: false,
          message: error.message
        });
      }

      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  },

  // Cambiar contraseña
  async changePassword(req, res) {
    try {
      const { currentPassword, newPassword } = req.body;

      if (!currentPassword || !newPassword) {
        return res.status(400).json({
          success: false,
          message: 'Contraseña actual y nueva contraseña son requeridas'
        });
      }

      if (newPassword.length < 6) {
        return res.status(400).json({
          success: false,
          message: 'La nueva contraseña debe tener al menos 6 caracteres'
        });
      }

      // Obtener usuario completo con contraseña
      const userWithPassword = await User.findByEmail(req.user.email);
      
      // Validar contraseña actual
      const isCurrentPasswordValid = await User.validatePassword(
        currentPassword, 
        userWithPassword.password
      );
      
      if (!isCurrentPasswordValid) {
        return res.status(401).json({
          success: false,
          message: 'Contraseña actual incorrecta'
        });
      }

      // Actualizar contraseña
      await User.update(req.user.id, { password: newPassword });

      res.json({
        success: true,
        message: 'Contraseña actualizada exitosamente'
      });
    } catch (error) {
      console.error('Error cambiando contraseña:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  }
};