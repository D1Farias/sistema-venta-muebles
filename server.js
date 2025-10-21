// IMPORTS - Importación de dependencias principales
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
require('dotenv').config(); // Cargar variables de entorno

// Importar configuración de base de datos
const { testConnection } = require('./config/database');

// IMPORTAR RUTAS - Módulos de rutas organizados por funcionalidad
const authRoutes = require('./routes/auth');
const usuariosRoutes = require('./routes/usuarios');
const pedidosRoutes = require('./routes/pedidos');
const catalogoRoutes = require('./routes/catalogo');
const recomendacionesRoutes = require('./routes/recomendaciones');
const notificacionesRoutes = require('./routes/notificaciones');

// IMPORTAR MIDDLEWARE - Middleware personalizado para manejo de errores y logging
const { errorHandler } = require('./middleware/errorHandler');
const { requestLogger } = require('./middleware/logger');

// CONFIGURACIÓN DEL SERVIDOR - Inicialización de Express y configuración del puerto
const app = express();
const PORT = process.env.PORT || 3000;

// MIDDLEWARE DE SEGURIDAD - Configuración de Helmet para headers de seguridad
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"], // Solo permitir recursos del mismo origen
      styleSrc: ["'self'", "'unsafe-inline'"], // Permitir estilos inline
      scriptSrc: ["'self'"], // Solo scripts del mismo origen
      imgSrc: ["'self'", "data:", "https:"], // Permitir imágenes de múltiples fuentes
    },
  },
}));

// CONFIGURACIÓN CORS - Permitir peticiones desde el frontend
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:8080', // URL del frontend
  credentials: true, // Permitir cookies y headers de autenticación
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'], // Métodos HTTP permitidos
  allowedHeaders: ['Content-Type', 'Authorization'] // Headers permitidos
}));

// MIDDLEWARE PARA PARSING - Configuración para procesar JSON y URL-encoded
app.use(express.json({ limit: '10mb' })); // Límite de 10MB para JSON
app.use(express.urlencoded({ extended: true, limit: '10mb' })); // Límite para form data

// MIDDLEWARE DE LOGGING - Registrar todas las peticiones HTTP
app.use(requestLogger);

// RUTA DE SALUD DEL SERVIDOR - Endpoint para verificar el estado del servidor
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(), // Tiempo que lleva ejecutándose el servidor
    environment: process.env.NODE_ENV || 'development'
  });
});

// RUTA RAÍZ - Información general de la API y endpoints disponibles
app.get('/', (req, res) => {
  res.json({
    message: 'API Sistema de Gestión de Muebles a Medida',
    version: '1.0.0',
    documentation: '/api/docs',
    endpoints: {
      auth: '/login, /usuarios/registrar',
      usuarios: '/usuarios/*',
      pedidos: '/pedidos/*',
      catalogo: '/catalogo',
      recomendaciones: '/recomendaciones/*',
      notificaciones: '/notificaciones/*'
    }
  });
});

// CONFIGURACIÓN DE RUTAS - Montaje de rutas organizadas por módulos
app.use('/', authRoutes); // Rutas de autenticación (login, registro)
app.use('/usuarios', usuariosRoutes); // Rutas de gestión de usuarios
app.use('/pedidos', pedidosRoutes); // Rutas de gestión de pedidos
app.use('/catalogo', catalogoRoutes); // Rutas del catálogo de productos
app.use('/recomendaciones', recomendacionesRoutes); // Rutas del sistema de IA
app.use('/notificaciones', notificacionesRoutes); // Rutas de notificaciones

// MIDDLEWARE PARA RUTAS NO ENCONTRADAS - Manejo de 404
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Ruta no encontrada',
    message: `La ruta ${req.originalUrl} no existe en esta API`,
    availableRoutes: [
      'GET /',
      'GET /health',
      'POST /login',
      'POST /usuarios/registrar',
      'GET /usuarios/perfil',
      'POST /pedidos',
      'GET /pedidos/:id',
      'GET /catalogo',
      'POST /recomendaciones/ia'
    ]
  });
});

// MIDDLEWARE DE MANEJO DE ERRORES - Debe ir al final para capturar todos los errores
app.use(errorHandler);

// FUNCIÓN PARA INICIAR EL SERVIDOR - Configuración de inicio con verificación de BD
const startServer = async () => {
  try {
    // Probar conexión a la base de datos antes de iniciar
    await testConnection();
    
    // Iniciar servidor HTTP
    app.listen(PORT, () => {
      console.log(`🚀 Servidor ejecutándose en puerto ${PORT}`);
      console.log(`🌍 Entorno: ${process.env.NODE_ENV || 'development'}`);
      console.log(`📡 API disponible en: http://localhost:${PORT}`);
      console.log(`🏥 Health check: http://localhost:${PORT}/health`);
      
      if (process.env.NODE_ENV === 'development') {
        console.log(`📚 Documentación: http://localhost:${PORT}/`);
      }
    });
  } catch (error) {
    console.error('❌ Error al iniciar el servidor:', error);
    process.exit(1); // Salir con código de error
  }
};

// MANEJO DE SEÑALES - Configuración para cierre graceful del servidor
process.on('SIGTERM', () => {
  console.log('🛑 SIGTERM recibido, cerrando servidor...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('🛑 SIGINT recibido, cerrando servidor...');
  process.exit(0);
});

// MANEJO DE ERRORES NO CAPTURADOS - Prevención de crashes inesperados
process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection en:', promise, 'razón:', reason);
});

process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
  process.exit(1); // Salir con código de error para errores críticos
});

// INICIAR SERVIDOR - Llamada a la función de inicio
startServer();

module.exports = app;