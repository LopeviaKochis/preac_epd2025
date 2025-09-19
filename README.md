# Plataforma de Resiliencia Energética y Agroclimática (EnerAgro PE)

## 📋 Descripción
EnerAgro PE es una aplicación web progresiva (PWA) y Plataforma de Resiliencia Energética y Agroclimática, diseñada para la datathon "Exprésate Perú con Datos 2025". Su objetivo es empoderar a los agricultores peruanos con herramientas inteligentes para mejorar la productividad y la resiliencia frente al cambio climático, integrando Machine Learning e Internet de las Cosas (IoT).

## ✨ Características Principales

### 🌟 Funcionalidades Core
- **💡 Resiliencia Energética**: Calculadora para sistemas fotovoltaicos y optimización de consumo.
- **💧 Riego Inteligente**: Optimización de sistemas de irrigación basados en datos locales.
- **🌤️ Asistencia Agroclimática**: Pronósticos de heladas y alertas meteorológicas personalizadas.
- **📊 Recomendaciones de Producción**: Optimización de cultivos y variedades según el clima.
- **🐛 Prevención de Plagas**: Detección temprana y manejo integrado.

### 🔧 Características Técnicas
- **🤖 Modelo ML Integrado**: Predicción de heladas con un modelo de Gradient Boosting.
- **📱 PWA**: Funcionamiento offline con Service Workers para zonas de baja conectividad.
- **🔐 Autenticación**: Sistema JWT con validación de números peruanos.
- **📨 Alertas SMS**: Notificaciones críticas vía Twilio.
- **🎨 UI/UX**: Interfaz moderna y accesible con Material-UI.
- **🌐 API REST**: Backend robusto con Node.js y Express.js.

## 🏗️ Arquitectura del Sistema

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │    Backend      │    │  Python Script  │
│  (EnerAgro PE)  │◄──►│   Node.js +     │◄──►│   (ML Model)    │
│   React + Vite  │    │   Express.js    │    │   scikit-learn  │
│   PWA + MUI     │    │   Twilio  │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## 🚀 Roadmap y Visión a Futuro

Nuestro objetivo es evolucionar de un MVP a una plataforma integral y escalable.

### Fase 1: Despliegue y Consolidación
1.  **☁️ Desplegar en GCP (Google Cloud Platform)**: Mover la aplicación a una infraestructura cloud robusta para garantizar alta disponibilidad y escalabilidad.
2.  **📦 Contenerización**: Utilizar Docker para estandarizar los entornos de desarrollo y producción.
3.  **🧪 Pruebas Unitarias y de Integración**: Implementar un pipeline de testing con Jest y Cypress para asegurar la calidad del código.

### Fase 2: Abstracción del Machine Learning
1.  **🤖 Endpoint de Modelos ML**: Migrar la ejecución de los scripts de Python a un servidor dedicado (usando FastAPI o Flask) para desacoplar la lógica de ML del backend principal.
2.  **🧠 Modelos Avanzados**: Desarrollar y consumir nuevos modelos para:
    *   **Prevención de Plagas**: Detección de plagas mediante Computer Vision y metodologías basadas en clima, presente en estudios del IGP aquí -> https://repositorio.igp.gob.pe/items/339d8484-dd5f-4656-8fc9-313f4b915af7
    *   **Riego Inteligente**: Predicción de necesidades hídricas con mayor precisión según tipo de cultivo y datos climáticos hiperlocales.
    *   **Producción**: Modelos de predicción de rendimiento de cultivos utilizando datos del BSRN y EMA.

### Fase 3: Soberanía de Datos y Escalabilidad
1.  **🛰️ Pipeline de Datos Locales**: Establecer un sistema de recolección y procesamiento de datos climáticos y de campo (sensores IoT) para reducir la dependencia de APIs externas como OpenMeteo. Esto nos permitirá generar predicciones hiper-localizadas y en tiempo real.
2.  **🐘 Base de Datos Escalable**: Migrar de archivos JSON a un sistema de base de datos robusto como PostgreSQL o MongoDB.
3.  **⚙️ CI/CD**: Automatizar los despliegues utilizando GitHub Actions.

### Fase 4: Expansión de Módulos
1.  **💧 Riego Inteligente**: Integrar datos de repositorios públicos como IGP/SENAMHI para un pipeline hiperlocal y de ser posible sensores IoT para ofrecer recomendaciones de riego ultra-precisas.
2.  **🐛 Prevención de Plagas**: Activar el módulo con modelos de CV para que los usuarios puedan identificar plagas subiendo una foto desde su celular reforzado el pronóstico con datos climáticos.
3.  **📊 Recomendaciones de Producción**: Mejorar las recomendaciones con datos históricos de rendimiento y precios de mercado.
4.  **💡 Resiliencia Energética**: Añadir un dashboard de monitoreo de consumo en tiempo real para sistemas fotovoltaicos.

## 🚀 Instalación y Configuración

### Prerrequisitos
- Node.js 18+ 
- npm 9+
- Puerto 3000 disponible (frontend)
- Puerto 5002 disponible (backend)

### 📥 Instalación

1. **Clonar el repositorio**
```bash
git clone <repository-url>
cd preac_epd2025
```

2. **Instalar dependencias**
```bash
# Instalar dependencias del proyecto
npm install

# Instalar dependencias del backend
cd backend && npm install

# Instalar dependencias del frontend  
cd ../frontend && npm install
```

3. **Configurar variables de entorno**
```bash
# En backend/.env
PORT=5002
NODE_ENV=development
JWT_SECRET=tu-secreto-super-seguro
JWT_EXPIRES_IN=30d
CORS_ORIGINS=http://localhost:3000,http://localhost:5173
TWILIO_ACCOUNT_SID=tu-account-sid
TWILIO_AUTH_TOKEN=tu-auth-token
TWILIO_PHONE_NUMBER=+1234567890
FASTAPI_URL=http://localhost:8000
```

### 🎯 Ejecución

1. **Iniciar Backend**
```bash
cd backend
npm start
```
Servidor disponible en: `http://localhost:5002`

2. **Iniciar Frontend**
```bash
cd frontend  
npm run dev
```
Aplicación disponible en: `http://localhost:3000`

## 📡 API Endpoints

### 🔐 Autenticación (NO UTILIZADO PERO IMPLEMENTADO)
- `POST /api/auth/register` - Registro de usuario
- `POST /api/auth/login` - Inicio de sesión
- `GET /api/auth/profile` - Perfil del usuario
- `POST /api/auth/refresh` - Renovar token

### Alerta de Heladas (FUNCIONAL)
- `POST /api/weather/frost/predict` - Realizar predicción de heladas

### ⚡ Energía Solar (NO FUNCIONAL)
- `POST /api/solar/calculate` - Estimación de producción FV
- `GET /api/solar/recommendations` - Recomendaciones personalizadas

### 💧 Riego Inteligente (NO FUNCIONAL)
- `POST /api/irrigation/calculate` - Calcular necesidades de riego
- `GET /api/irrigation/schedule` - Programación de riego

### 🌤️ Clima (NO FUNCIONAL)
- `GET /api/weather/current` - Clima actual
- `GET /api/weather/forecast` - Pronóstico 7 días
- `GET /api/weather/alerts` - Alertas meteorológicas

### 🐛 Plagas (NO FUNCIONAL)
- `POST /api/pest/assess` - Evaluación de riesgo
- `POST /api/pest/identify` - Identificación de plagas
- `GET /api/pest/treatments` - Tratamientos recomendados

### 📊 Producción (NO FUNCIONAL)
- `POST /api/production/recommend` - Recomendaciones de cultivos
- `GET /api/production/calendar` - Calendario de siembra
- `POST /api/production/optimize` - Optimización de producción

### 📨 Notificaciones (FUNCIONAL)
- `POST /api/notifications/send` - Enviar SMS
- `GET /api/notifications/history` - Historial de notificaciones

## 🧪 Testing

### Ejecutar pruebas
```bash
# Backend
cd backend && npm test

# Frontend  
cd frontend && npm test

# E2E (futuro)
npm run test:e2e
```

## 📱 PWA Features

### Funcionalidad Offline
- ✅ Cache de archivos estáticos
- ✅ Cache de API responses
- ✅ Sincronización en segundo plano
- ✅ Indicadores de estado de conectividad

### Instalación
- ✅ Manifest configurado
- ✅ Service Worker registrado
- ✅ Prompt de instalación personalizado
- ✅ Iconos para todas las plataformas

## 🔧 Tecnologías Utilizadas

### Frontend
- **React 18** - Librería de UI
- **Vite 5** - Build tool y dev server
- **Material-UI 5** - Componentes de interfaz
- **Chart.js 4** - Visualización de datos
- **React Router 6** - Navegación
- **Service Workers** - Funcionalidad offline

### Backend
- **Node.js** - Runtime de JavaScript
- **Express.js 4** - Framework web
- **JWT** - Autenticación
- **Twilio** - SMS y notificaciones
- **Helmet** - Seguridad HTTP
- **CORS** - Cross-Origin Resource Sharing

### DevOps y Herramientas
- **ESLint** - Linting de código
- **Prettier** - Formateo de código
- **Nodemon** - Auto-reload en desarrollo
- **Compression** - Compresión gzip
- **Rate Limiting** - Limitación de peticiones

## 📊 Estructura del Proyecto

```
preac_epd2025/
├── frontend/                 # Aplicación React
│   ├── public/              # Archivos estáticos
│   │   ├── sw.js           # Service Worker
│   │   ├── manifest.json   # PWA Manifest
│   │   └── images/         # Imágenes y assets
│   ├── src/
│   │   ├── components/     # Componentes reutilizables
│   │   ├── pages/          # Páginas de la aplicación
│   │   ├── context/        # Context API (Auth)
│   │   ├── services/       # Servicios y APIs
│   │   └── utils/          # Utilidades
│   ├── package.json
│   └── vite.config.js      # Configuración Vite
├── backend/                 # Servidor Express
│   ├── routes/             # Rutas de la API
│   ├── middleware/         # Middleware personalizado
│   ├── utils/              # Utilidades del servidor
│   ├── .env                # Variables de entorno
│   ├── package.json
│   └── server.js           # Servidor principal
├── package.json            # Scripts del proyecto raíz
└── README.md              # Documentación
```

## 🎯 Cultivos Soportados (A FUTURO PARA FUNCIONALIDADES AGRÍCOLAS)

### 🌽 Maíz (Zea mays)
- **Variedades**: Amiláceo y Duro
- **Regiones**: Junín
- **Ciclo**: 120-180 días

### 🥔 Papa (Solanum tuberosum)  
- **Variedades**: Canchán, Huayro
- **Regiones**: Junín
- **Ciclo**: 100-180 días

### 🌾 Cebada (Hordeum vulgare)
- **Variedades**: UNA-80, Centenario
- **Regiones**: Junín
- **Ciclo**: 120-140 días  

## 🌍 Regiones Geográficas Soportadas

### ⛰️ Sierra - Junín
- Agricultura de secano y riego
- Altitudes 2,500-4,000 msnm

## 📈 Características de Producción

### 🔋 Energía Solar
- Cálculos personalizados por región
- Estimaciones de ahorro energético
- Análisis de retorno de inversión
- Recomendaciones de equipos

### 💧 Riego Inteligente
- Cálculo de ETc por cultivo
- Programación automática
- Eficiencia de aplicación
- Monitoreo de humedad

### 🌡️ Monitoreo Climático
- Pronósticos localizados
- Alertas automáticas
- Datos históricos
- Índices bioclimáticos

### 🐛 Manejo de Plagas
- Identificación automática
- Evaluación de riesgo
- Manejo integrado (MIP)
- Tratamientos ecológicos

## 🔒 Seguridad

### 🛡️ Autenticación y Autorización (NO FUNCIONAL PERO IMPLEMENTADO)
- Tokens JWT con expiración
- Validación de números telefónicos peruanos
- Rate limiting por IP
- Middleware de seguridad

### 🔐 Protección de Datos
- Headers de seguridad (Helmet)
- Validación de entrada
- Sanitización de datos
- CORS configurado

## 📱 Funcionalidades Móviles

### 📲 PWA (Progressive Web App - A FUTURO)
- Instalable en dispositivos móviles
- Funciona sin conexión
- Notificaciones push (futuro)
- Interfaz nativa

### 📶 Modo Offline
- Cache inteligente de datos
- Sincronización automática
- Indicadores de conectividad
- Funcionalidad básica sin internet

## 🚀 Roadmap Futuro

### 🤖 Integración ML/DL
- [ ] Modelos de predicción de rendimiento
- [ ] Reconocimiento de imágenes para plagas
- [ ] Optimización de recursos con IA
- [ ] Predicción de precios de mercado

### 📊 Analytics Avanzado
- [ ] Dashboard de métricas agrícolas
- [ ] Reportes automáticos
- [ ] Comparativas regionales
- [ ] Indicadores de sostenibilidad

### 🌐 Expansión
- [ ] Más cultivos andinos
- [ ] Integración con sensores IoT
- [ ] Marketplace de productos
- [ ] Red social de agricultores

## 👥 Contribución

### 📝 Proceso de Desarrollo
1. Fork del repositorio
2. Crear rama feature (`git checkout -b feature/nueva-funcionalidad`)
3. Commit cambios (`git commit -am 'Agregar nueva funcionalidad'`)
4. Push a la rama (`git push origin feature/nueva-funcionalidad`)
5. Crear Pull Request

### 🐛 Reporte de Bugs
- Usar GitHub Issues
- Incluir pasos para reproducir
- Especificar entorno (OS, browser, etc.)
- Adjuntar screenshots si es posible

## 📞 Soporte

### 📧 Contacto
- **Email**: ylopevia@gmail.com
- **WhatsApp**: 958 268 152

## 📄 Licencia

Este proyecto está bajo la Licencia MIT - ver el archivo [LICENSE.md](LICENSE.md) para detalles.

## 🙏 Agradecimientos

- Instituto Geofísico del Perú (IGP)
- Secretaría de Gobierno y Transformación Digital (SGTD - PCM)

---

## 📈 Estado del Proyecto

**Versión**: 1.0.0
**Estado**: ✅ Demo Completado
**Última actualización**: Septiembre 2025

### ✅ Características Implementadas
- [x] 1 módulo agroclimático
- [x] API REST
- [x] Interfaz responsive
- [x] Sistema de notificaciones SMS
- [x] Dashboard interactivo

### 🔄 En Desarrollo
- [ ] Las otras 4 funcionalidades energéticas y agroclimáticas
- [ ] Integración FastAPI para ML
- [ ] Tests automatizados
- [ ] Documentación API (Swagger)
- [ ] Optimizaciones de performance
