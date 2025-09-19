export const errorHandler = (err, req, res, next) => {
  console.error('Error:', err);

  // Error de validación de MongoDB/Mongoose
  if (err.name === 'ValidationError') {
    const errors = Object.values(err.errors).map(e => e.message);
    return res.status(400).json({
      success: false,
      error: 'Error de validación',
      details: errors
    });
  }

  // Error de JWT
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      success: false,
      error: 'Token inválido'
    });
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      success: false,
      error: 'Token expirado'
    });
  }

  // Error de casteo de MongoDB
  if (err.name === 'CastError') {
    return res.status(400).json({
      success: false,
      error: 'ID inválido'
    });
  }

  // Error de clave duplicada de MongoDB
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    return res.status(400).json({
      success: false,
      error: `${field} ya existe`
    });
  }

  // Error de conexión a FastAPI
  if (err.code === 'ECONNREFUSED' || err.code === 'ETIMEDOUT') {
    return res.status(503).json({
      success: false,
      error: 'Servicio de ML temporalmente no disponible',
      details: 'Intente nuevamente en unos momentos'
    });
  }

  // Error por defecto
  res.status(err.statusCode || 500).json({
    success: false,
    error: err.message || 'Error interno del servidor',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
};