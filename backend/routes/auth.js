import express from 'express';
import { authController } from '../controllers/authController.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// Rutas públicas (no requieren autenticación)

// POST /api/auth/register - Registrar nuevo usuario
router.post('/register', authController.register);

// POST /api/auth/login - Iniciar sesión
router.post('/login', authController.login);

// Rutas protegidas (requieren autenticación)

// GET /api/auth/profile - Obtener perfil del usuario
router.get('/profile', authenticate, authController.getProfile);

// PUT /api/auth/profile - Actualizar perfil del usuario
router.put('/profile', authenticate, authController.updateProfile);

// PUT /api/auth/change-password - Cambiar contraseña
router.put('/change-password', authenticate, authController.changePassword);

// GET /api/auth/verify - Verificar token (útil para el frontend)
router.get('/verify', authenticate, (req, res) => {
  res.json({
    success: true,
    message: 'Token válido',
    data: {
      user: req.user
    }
  });
});

export default router;