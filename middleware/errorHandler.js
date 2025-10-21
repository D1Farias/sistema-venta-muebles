// MIDDLEWARE DE MANEJO CENTRALIZADO DE ERRORES
// Este archivo proporciona un sistema completo de manejo de errores para la aplicación

// MIDDLEWARE PRINCIPAL DE MANEJO DE ERRORES - Captura y procesa todos los errores
const errorHandler = (err, req, res, next) => {
  // CREAR COPIA DEL ERROR para evitar mutaciones
  let error = { ...err };
  error.message = err.message;

  // LOGGING DETALLADO DEL ERROR para debugging y monitoreo
  console.error('Error capturado:', {
    message: err.message,
    stack: err.stack,
    url: req.originalUrl,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    timestamp: new Date().toISOString()
  });

  // MANEJO DE ERRORES DE VALIDACIÓN JOI
  if (err.isJoi) {
    const message = err.details.map(detail => detail.message).join(', ');
    return res.status(400).json({
      error: 'Error de validación',
      message: message,
      details: err.details
    });
  }

  // MANEJO DE ERRORES DE POSTGRESQL - Códigos específicos de la base de datos
  if (err.code) {
    switch (err.code) {
      case '23505': // VIOLACIÓN DE RESTRICCIÓN ÚNICA (duplicate key)
        return res.status(409).json({
          error: 'Conflicto de datos',
          message: 'Ya existe un registro con estos datos',
          detail: err.detail
        });
      
      case '23503': // VIOLACIÓN DE CLAVE FORÁNEA (foreign key constraint)
        return res.status(400).json({
          error: 'Referencia inválida',
          message: 'El registro referenciado no existe',
          detail: err.detail
        });
      
      case '23502': // VIOLACIÓN DE NOT NULL (null value constraint)
        return res.status(400).json({
          error: 'Campo requerido',
          message: 'Faltan campos obligatorios',
          detail: err.detail
        });
      
      case '42P01': // TABLA NO EXISTE (undefined table)
        return res.status(500).json({
          error: 'Error de configuración',
          message: 'Error en la estructura de la base de datos'
        });
      
      default: // OTROS ERRORES DE POSTGRESQL
        return res.status(500).json({
          error: 'Error de base de datos',
          message: 'Error interno en la base de datos',
          code: err.code
        });
    }
  }

  // MANEJO DE ERRORES DE JWT (JSON Web Token)
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      error: 'Token inválido',
      message: 'El token de autenticación no es válido'
    });
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      error: 'Token expirado',
      message: 'El token de autenticación ha expirado'
    });
  }

  // MANEJO DE ERRORES DE SINTAXIS JSON
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return res.status(400).json({
      error: 'JSON inválido',
      message: 'El formato del JSON enviado no es válido'
    });
  }

  // MANEJO DE ERRORES DE UPLOAD DE ARCHIVOS
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(413).json({
      error: 'Archivo muy grande',
      message: 'El archivo excede el tamaño máximo permitido'
    });
  }

  // MANEJO DE TIPOS DE ARCHIVO NO PERMITIDOS
  if (err.code === 'LIMIT_UNEXPECTED_FILE') {
    return res.status(400).json({
      error: 'Tipo de archivo no permitido',
      message: 'El tipo de archivo no está permitido'
    });
  }

  // MANEJO DE ERRORES PERSONALIZADOS con código de estado
  if (err.statusCode) {
    return res.status(err.statusCode).json({
      error: err.name || 'Error',
      message: err.message
    });
  }

  // ERROR POR DEFECTO - Error interno del servidor (500)
  res.status(500).json({
    error: 'Error interno del servidor',
    message: process.env.NODE_ENV === 'production' 
      ? 'Ha ocurrido un error interno' 
      : err.message,
    // INCLUIR STACK TRACE solo en desarrollo
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
};

// WRAPPER PARA FUNCIONES ASÍNCRONAS - Captura errores automáticamente
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

// CLASE BASE PARA ERRORES PERSONALIZADOS
class CustomError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    this.name = this.constructor.name;
    
    // CAPTURAR STACK TRACE excluyendo el constructor
    Error.captureStackTrace(this, this.constructor);
  }
}

// CLASES DE ERRORES ESPECÍFICOS DEL DOMINIO

// ERROR DE VALIDACIÓN (400 Bad Request)
class ValidationError extends CustomError {
  constructor(message) {
    super(message, 400);
  }
}

// ERROR DE RECURSO NO ENCONTRADO (404 Not Found)
class NotFoundError extends CustomError {
  constructor(message = 'Recurso no encontrado') {
    super(message, 404);
  }
}

// ERROR DE AUTENTICACIÓN (401 Unauthorized)
class UnauthorizedError extends CustomError {
  constructor(message = 'No autorizado') {
    super(message, 401);
  }
}

// ERROR DE AUTORIZACIÓN (403 Forbidden)
class ForbiddenError extends CustomError {
  constructor(message = 'Acceso denegado') {
    super(message, 403);
  }
}

// ERROR DE CONFLICTO (409 Conflict)
class ConflictError extends CustomError {
  constructor(message = 'Conflicto de datos') {
    super(message, 409);
  }
}

// EXPORTAR TODAS LAS UTILIDADES DE MANEJO DE ERRORES
module.exports = {
  errorHandler,
  asyncHandler,
  CustomError,
  ValidationError,
  NotFoundError,
  UnauthorizedError,
  ForbiddenError,
  ConflictError
};