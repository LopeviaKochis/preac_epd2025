import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import dotenv from 'dotenv';

// Configurar __dirname para ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Cargar variables de entorno
dotenv.config();

const app = express();

// Middleware de seguridad
app.use(helmet());
// Construir lista de orígenes permitidos desde .env
const defaultOrigins = ['http://localhost:3000', 'http://127.0.0.1:3000', 'http://localhost:5173', 'http://127.0.0.1:5173'];
const envOrigins = (process.env.CORS_ORIGINS || '')
  .split(',')
  .map((o) => o.trim())
  .filter(Boolean);
const allowedOrigins = Array.from(new Set([...defaultOrigins, ...envOrigins]));
app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100 // limite de 100 requests por windowMs
});
app.use(limiter);

// Middleware de parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'PREAC Backend Server is running',
    timestamp: new Date().toISOString(),
  port: process.env.PORT || 5003,
    modules: 'ES6'
  });
});

// Importar rutas de forma dinámica con ES modules
let authRoutes, solarRoutes, irrigationRoutes, notificationRoutes;
let weatherRoutes, pestRoutes, productionRoutes;

try {
  const authModule = await import('./routes/auth.js');
  authRoutes = authModule.default;
  console.log('✅ Auth routes loaded successfully');
} catch (error) {
  console.log('⚠️  Auth routes error:', error.message);
  authRoutes = express.Router();
  authRoutes.get('/', (req, res) => res.json({ message: 'Auth module coming soon' }));
}

try {
  const solarModule = await import('./routes/solar.js');
  solarRoutes = solarModule.default;
  console.log('✅ Solar routes loaded successfully');
} catch (error) {
  console.log('⚠️  Solar routes error:', error.message);
  solarRoutes = express.Router();
  solarRoutes.get('/', (req, res) => res.json({ message: 'Solar module coming soon' }));
}

try {
  const irrigationModule = await import('./routes/irrigation.js');
  irrigationRoutes = irrigationModule.default;
  console.log('✅ Irrigation routes loaded successfully');
} catch (error) {
  console.log('⚠️  Irrigation routes error:', error.message);
  irrigationRoutes = express.Router();
  irrigationRoutes.get('/', (req, res) => res.json({ message: 'Irrigation module coming soon' }));
}

try {
  const notificationModule = await import('./routes/notifications.js');
  notificationRoutes = notificationModule.default;
  console.log('✅ Notification routes loaded successfully');
} catch (error) {
  console.log('⚠️  Notification routes error:', error.message);
  notificationRoutes = express.Router();
  notificationRoutes.get('/', (req, res) => res.json({ message: 'Notifications module coming soon' }));
}

try {
  const weatherModule = await import('./routes/weather.js');
  weatherRoutes = weatherModule.default;
  console.log('✅ Weather routes loaded successfully');
} catch (error) {
  console.log('⚠️  Weather routes error:', error.message);
  weatherRoutes = express.Router();
  weatherRoutes.get('/', (req, res) => res.json({ message: 'Weather module coming soon' }));
}

try {
  const pestModule = await import('./routes/pest.js');
  pestRoutes = pestModule.default;
  console.log('✅ Pest routes loaded successfully');
} catch (error) {
  console.log('⚠️  Pest routes error:', error.message);
  pestRoutes = express.Router();
  pestRoutes.get('/', (req, res) => res.json({ message: 'Pest module coming soon' }));
}

try {
  const productionModule = await import('./routes/production.js');
  productionRoutes = productionModule.default;
  console.log('✅ Production routes loaded successfully');
} catch (error) {
  console.log('⚠️  Production routes error:', error.message);
  productionRoutes = express.Router();
  productionRoutes.get('/', (req, res) => res.json({ message: 'Production module coming soon' }));
}

// Usar rutas
app.use('/api/auth', authRoutes);
app.use('/api/solar', solarRoutes);
app.use('/api/irrigation', irrigationRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/weather', weatherRoutes);
app.use('/api/pest', pestRoutes);
app.use('/api/production', productionRoutes);

// Middleware de manejo de errores
app.use((err, req, res, next) => {
  console.error('❌ Server Error:', err.stack);
  res.status(500).json({ 
    message: 'Something went wrong!',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// Ruta 404
app.use('*', (req, res) => {
  res.status(404).json({ 
    message: 'Route not found',
    availableRoutes: ['/health', '/api/auth', '/api/solar', '/api/irrigation', '/api/notifications', '/api/weather', '/api/pest', '/api/production']
  });
});

const PORT = process.env.PORT || 5003;

const server = app.listen(PORT, () => {
  console.log('🚀 =====================================');
  console.log(`🌾 PREAC Backend Server RUNNING`);
  console.log(`📍 Port: ${PORT}`);
  console.log(`🏥 Health: http://localhost:${PORT}/health`);
  console.log(`🌐 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`📦 Module System: ES6`);
  console.log('🚀 =====================================');
});

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`❌ Port ${PORT} is already in use.`);
    console.log('💡 Stop the existing process or change the PORT in .env');
    
    // Buscar y mostrar el proceso que usa el puerto
    import('child_process').then(({ exec }) => {
      exec(`netstat -ano | findstr :${PORT}`, (error, stdout) => {
        if (stdout) {
          console.log('🔍 Process using this port:');
          console.log(stdout);
        }
      });
    });
  } else {
    console.error('❌ Server failed to start:', err.message);
  }
  process.exit(1);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('🛑 SIGTERM received, shutting down gracefully...');
  server.close(() => {
    console.log('✅ Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('🛑 SIGINT received, shutting down gracefully...');
  server.close(() => {
    console.log('✅ Server closed');
    process.exit(0);
  });
});