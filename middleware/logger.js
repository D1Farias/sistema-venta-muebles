// MIDDLEWARE DE LOGGING PARA PETICIONES HTTP
// Este archivo proporciona un sistema completo de logging para monitoreo y debugging

// MIDDLEWARE PRINCIPAL DE LOGGING DE PETICIONES - Registra todas las peticiones HTTP
const requestLogger = (req, res, next) => {
  // MARCAR TIEMPO DE INICIO para calcular duración
  const start = Date.now();
  
  // RECOPILAR INFORMACIÓN BÁSICA DE LA PETICIÓN
  const requestInfo = {
    method: req.method,
    url: req.originalUrl,
    ip: req.ip || req.connection.remoteAddress,
    userAgent: req.get('User-Agent'),
    timestamp: new Date().toISOString(),
    contentType: req.get('Content-Type'),
    contentLength: req.get('Content-Length')
  };

  // LOG DE PETICIÓN ENTRANTE (solo en desarrollo para evitar spam)
  if (process.env.NODE_ENV === 'development') {
    console.log(`📥 ${requestInfo.method} ${requestInfo.url} - ${requestInfo.ip}`);
  }

  // INTERCEPTAR MÉTODO SEND para loggear cuando termine la respuesta
  const originalSend = res.send;
  res.send = function(data) {
    // CALCULAR DURACIÓN DE LA PETICIÓN
    const duration = Date.now() - start;
    
    // RECOPILAR INFORMACIÓN DE LA RESPUESTA
    const responseInfo = {
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      contentLength: res.get('Content-Length') || (data ? data.length : 0)
    };

    // DETERMINAR NIVEL DE LOG basado en el código de estado
    const isError = res.statusCode >= 400;
    const isWarning = res.statusCode >= 300 && res.statusCode < 400;
    
    // EMOJI VISUAL para identificar rápidamente el estado
    let statusEmoji = '✅';
    if (isError) statusEmoji = '❌';
    else if (isWarning) statusEmoji = '⚠️';

    // CREAR MENSAJE DE LOG LEGIBLE
    const logMessage = `${statusEmoji} ${requestInfo.method} ${requestInfo.url} - ${res.statusCode} - ${responseInfo.duration}`;
    
    // LOG PARA DESARROLLO (formato legible)
    if (process.env.NODE_ENV === 'development') {
      console.log(logMessage);
      
      // LOG ADICIONAL PARA ERRORES (mostrar detalles del error)
      if (isError && data) {
        try {
          const errorData = JSON.parse(data);
          console.log(`   Error: ${errorData.message || errorData.error}`);
        } catch (e) {
          // Si no es JSON válido, no hacer nada
        }
      }
    }

    // LOG ESTRUCTURADO PARA PRODUCCIÓN (formato JSON para parseo automático)
    if (process.env.NODE_ENV === 'production') {
      const logEntry = {
        ...requestInfo,
        ...responseInfo,
        level: isError ? 'error' : isWarning ? 'warn' : 'info'
      };
      
      // En producción, usar un logger más sofisticado como Winston
      console.log(JSON.stringify(logEntry));
    }

    // LLAMAR AL MÉTODO ORIGINAL para enviar la respuesta
    originalSend.call(this, data);
  };

  next(); // Continuar con el siguiente middleware
};

// MIDDLEWARE DE LOGGING DE ERRORES - Registra errores detallados para debugging
const errorLogger = (err, req, res, next) => {
  // RECOPILAR INFORMACIÓN COMPLETA DEL ERROR
  const errorInfo = {
    error: {
      name: err.name,
      message: err.message,
      stack: err.stack
    },
    request: {
      method: req.method,
      url: req.originalUrl,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      body: req.body,
      params: req.params,
      query: req.query
    },
    timestamp: new Date().toISOString()
  };

  // LOG DETALLADO DEL ERROR para debugging
  console.error('🚨 Error en petición:', JSON.stringify(errorInfo, null, 2));

  // En producción, aquí se podría enviar a un servicio de logging externo
  // como Sentry, LogRocket, etc.

  next(err); // Pasar el error al siguiente middleware
};

// MIDDLEWARE DE LOGGING DE AUTENTICACIÓN - Registra acciones de usuarios autenticados
const authLogger = (req, res, next) => {
  // VERIFICAR SI HAY USUARIO AUTENTICADO
  if (req.usuario) {
    // RECOPILAR INFORMACIÓN DE LA ACCIÓN DEL USUARIO
    const authInfo = {
      userId: req.usuario.id,
      userEmail: req.usuario.correo,
      userRole: req.usuario.rol,
      action: `${req.method} ${req.originalUrl}`,
      timestamp: new Date().toISOString(),
      ip: req.ip
    };

    // LOG DE ACCIONES DE USUARIOS (importante para auditoría de seguridad)
    console.log(`👤 Usuario ${req.usuario.correo} (${req.usuario.rol}): ${authInfo.action}`);

    // LOG ESTRUCTURADO PARA PRODUCCIÓN (auditoría)
    if (process.env.NODE_ENV === 'production') {
      console.log(JSON.stringify({ type: 'user_action', ...authInfo }));
    }
  }

  next(); // Continuar con el siguiente middleware
};

// FACTORY PARA CREAR LOGGERS PERSONALIZADOS - Permite logging categorizado
const createLogger = (category) => {
  return {
    // MÉTODO INFO - Para información general
    info: (message, data = {}) => {
      const logEntry = {
        level: 'info',
        category,
        message,
        data,
        timestamp: new Date().toISOString()
      };
      
      if (process.env.NODE_ENV === 'development') {
        console.log(`ℹ️  [${category}] ${message}`, data);
      } else {
        console.log(JSON.stringify(logEntry));
      }
    },
    
    // MÉTODO WARN - Para advertencias
    warn: (message, data = {}) => {
      const logEntry = {
        level: 'warn',
        category,
        message,
        data,
        timestamp: new Date().toISOString()
      };
      
      if (process.env.NODE_ENV === 'development') {
        console.warn(`⚠️  [${category}] ${message}`, data);
      } else {
        console.warn(JSON.stringify(logEntry));
      }
    },
    
    // MÉTODO ERROR - Para errores con stack trace
    error: (message, error = {}, data = {}) => {
      const logEntry = {
        level: 'error',
        category,
        message,
        error: {
          name: error.name,
          message: error.message,
          stack: error.stack
        },
        data,
        timestamp: new Date().toISOString()
      };
      
      if (process.env.NODE_ENV === 'development') {
        console.error(`❌ [${category}] ${message}`, error, data);
      } else {
        console.error(JSON.stringify(logEntry));
      }
    }
  };
};

// EXPORTAR TODOS LOS MIDDLEWARE Y UTILIDADES DE LOGGING
module.exports = {
  requestLogger,
  errorLogger,
  authLogger,
  createLogger
};