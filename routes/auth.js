// Importaciones necesarias para el módulo de autenticación
const express = require('express');
const bcrypt = require('bcryptjs'); // Para cifrado de contraseñas
const jwt = require('jsonwebtoken'); // Para manejo de tokens JWT
const Joi = require('joi'); // Para validación de datos de entrada
const xanoService = require('../services/xanoService'); // Servicio de Xano para autenticación
const { asyncHandler, ValidationError, UnauthorizedError, ConflictError } = require('../middleware/errorHandler'); // Manejo de errores
const { createLogger } = require('../middleware/logger'); // Sistema de logging

// Inicialización del router de Express y logger específico para autenticación
const router = express.Router();
const logger = createLogger('auth');

// ESQUEMAS DE VALIDACIÓN - Definición de reglas de validación usando Joi

// Esquema para validar datos de registro de usuario
const registroSchema = Joi.object({
  nombre: Joi.string().min(2).max(100).required().messages({
    'string.min': 'El nombre debe tener al menos 2 caracteres',
    'string.max': 'El nombre no puede exceder 100 caracteres',
    'any.required': 'El nombre es obligatorio'
  }),
  email: Joi.string().email().max(150).required().messages({
    'string.email': 'Debe ser un correo electrónico válido',
    'string.max': 'El correo no puede exceder 150 caracteres',
    'any.required': 'El correo es obligatorio'
  }),
  password: Joi.string().min(6).max(100).required().messages({
    'string.min': 'La contraseña debe tener al menos 6 caracteres',
    'string.max': 'La contraseña no puede exceder 100 caracteres',
    'any.required': 'La contraseña es obligatoria'
  }),
  password_confirmation: Joi.string().valid(Joi.ref('password')).required().messages({
    'any.only': 'Las contraseñas no coinciden',
    'any.required': 'La confirmación de contraseña es obligatoria'
  }),
  telefono: Joi.string().max(20).optional()
});

// Esquema para validar datos de inicio de sesión
const loginSchema = Joi.object({
  email: Joi.string().email().required().messages({
    'string.email': 'Debe ser un correo electrónico válido',
    'any.required': 'El correo es obligatorio'
  }),
  password: Joi.string().required().messages({
    'any.required': 'La contraseña es obligatoria'
  })
});

/**
 * Función para generar tokens JWT con información del usuario
 * @param {Object} usuario - Objeto con datos del usuario (id, correo, rol)
 * @returns {string} Token JWT firmado
 */
const generarToken = (usuario) => {
  return jwt.sign(
    { 
      userId: usuario.id,
      correo: usuario.correo,
      rol: usuario.rol
    },
    process.env.JWT_SECRET, // Clave secreta para firmar el token
    { 
      expiresIn: process.env.JWT_EXPIRES_IN || '24h', // Tiempo de expiración
      issuer: 'sistema-muebles', // Emisor del token
      audience: 'sistema-muebles-users' // Audiencia del token
    }
  );
};

/**
 * POST /usuarios/registrar - Endpoint para registrar un nuevo usuario
 * Valida los datos, verifica que el email no esté en uso usando Xano,
 * y crea el usuario en la base de datos de Xano
 */
router.post('/usuarios/registrar', asyncHandler(async (req, res) => {
  // Validar datos de entrada usando el esquema definido
  const { error, value } = registroSchema.validate(req.body);
  if (error) {
    throw new ValidationError(error.details[0].message);
  }

  const { nombre, email, password, password_confirmation, telefono } = value;

  try {
    // Registrar usuario usando el servicio de Xano
    const response = await xanoService.register({
      nombre,
      email,
      password,
      telefono: telefono || null
    });

    // Extraer datos de la respuesta de Xano
    const { authToken, user } = response;

    // Registrar el evento de registro exitoso
    logger.info('Usuario registrado exitosamente', {
      userId: user.id,
      email: user.email,
      ip: req.ip
    });

    // Responder con los datos del usuario y el token
    res.status(201).json({
      message: 'Usuario registrado exitosamente',
      token: authToken,
      refreshToken: authToken, // Xano maneja tokens de forma diferente
      usuario: {
        id: user.id,
        nombre: user.nombre,
        email: user.email,
        telefono: user.telefono,
        rol: user.rol || 'cliente',
        fecha_registro: user.created_at
      }
    });

  } catch (error) {
    // Manejar errores específicos de Xano
    if (error.response?.status === 409 || error.message.includes('duplicate') || error.message.includes('already exists')) {
      throw new ConflictError('El correo electrónico ya está registrado');
    }
    
    if (error.response?.status === 400) {
      throw new ValidationError(error.response.data.message || 'Datos de registro inválidos');
    }

    // Registrar error para debugging
    logger.error('Error en registro de usuario', {
      email,
      error: error.message,
      ip: req.ip
    });

    throw new Error('Error interno del servidor durante el registro');
  }
}));

/**
 * POST /login - Endpoint para iniciar sesión
 * Valida las credenciales del usuario usando Xano y genera un token JWT si son correctas
 */
router.post('/login', asyncHandler(async (req, res) => {
  // Validar datos de entrada usando el esquema definido
  const { error, value } = loginSchema.validate(req.body);
  if (error) {
    throw new ValidationError(error.details[0].message);
  }

  const { email, password } = value;

  try {
    // Autenticar usuario usando el servicio de Xano
    const response = await xanoService.login({
      email,
      password
    });

    // Extraer datos de la respuesta de Xano
    const { authToken, user } = response;

    // Registrar el evento de inicio de sesión exitoso
    logger.info('Usuario inició sesión', {
      userId: user.id,
      email: user.email,
      ip: req.ip
    });

    // Responder con los datos del usuario y el token
    res.json({
      message: 'Inicio de sesión exitoso',
      token: authToken,
      refreshToken: authToken, // Xano maneja tokens de forma diferente
      usuario: {
        id: user.id,
        nombre: user.nombre,
        email: user.email,
        telefono: user.telefono,
        rol: user.rol || 'cliente'
      }
    });

  } catch (error) {
    // Manejar errores específicos de Xano
    if (error.response?.status === 401 || error.response?.status === 403) {
      throw new UnauthorizedError('Credenciales inválidas. Verifica tu email y contraseña');
    }
    
    if (error.response?.status === 404) {
      throw new UnauthorizedError('Usuario no encontrado. Verifica tu email o regístrate');
    }

    if (error.response?.status === 400) {
      throw new ValidationError('Datos de inicio de sesión inválidos');
    }

    // Registrar error para debugging
    logger.error('Error en inicio de sesión', {
      email,
      error: error.message,
      ip: req.ip
    });

    throw new UnauthorizedError('Error durante el inicio de sesión. Intenta nuevamente');
  }
}));

/**
 * POST /logout - Endpoint para cerrar sesión
 * Actualmente solo registra el evento, pero podría implementar invalidación de tokens
 */
router.post('/logout', asyncHandler(async (req, res) => {
  // En una implementación más avanzada, aquí se podría agregar el token
  // a una lista negra en Redis o base de datos para invalidarlo

  // Registrar el evento de cierre de sesión
  logger.info('Usuario cerró sesión', {
    ip: req.ip,
    userAgent: req.get('User-Agent')
  });

  res.json({
    message: 'Sesión cerrada exitosamente'
  });
}));

/**
 * POST /refresh-token - Endpoint para renovar un token JWT
 * Permite obtener un nuevo token válido usando un token existente (incluso expirado)
 */
router.post('/refresh-token', asyncHandler(async (req, res) => {
  const { token } = req.body;

  if (!token) {
    throw new ValidationError('Token requerido para renovación');
  }

  try {
    // Verificar token actual (permitiendo tokens expirados para renovación)
    const decoded = jwt.verify(token, process.env.JWT_SECRET, { ignoreExpiration: true });
    
    // Verificar que el usuario aún existe y está activo en la base de datos
    const resultado = await query(
      'SELECT id, nombre, correo, rol, activo FROM usuarios WHERE id = $1',
      [decoded.userId]
    );

    if (resultado.rows.length === 0 || !resultado.rows[0].activo) {
      throw new UnauthorizedError('Usuario no válido para renovación de token');
    }

    const usuario = resultado.rows[0];
    
    // Generar un nuevo token JWT
    const nuevoToken = generarToken(usuario);

    // Registrar el evento de renovación de token
    logger.info('Token renovado', {
      userId: usuario.id,
      correo: usuario.correo,
      ip: req.ip
    });

    res.json({
      message: 'Token renovado exitosamente',
      token: nuevoToken,
      expiresIn: process.env.JWT_EXPIRES_IN || '24h'
    });

  } catch (error) {
    // Manejar errores específicos de JWT
    if (error.name === 'JsonWebTokenError') {
      throw new UnauthorizedError('Token inválido para renovación');
    }
    throw error;
  }
}));

/**
 * GET /verify-token - Endpoint para verificar la validez de un token JWT
 * Comprueba si el token es válido y si el usuario asociado aún existe y está activo
 */
router.get('/verify-token', asyncHandler(async (req, res) => {
  const authHeader = req.headers.authorization;
  
  // Verificar que se proporcione el header de autorización
  if (!authHeader) {
    return res.status(401).json({
      valid: false,
      message: 'Token no proporcionado'
    });
  }

  // Extraer el token del header Authorization (formato: "Bearer <token>")
  const token = authHeader.split(' ')[1];
  
  try {
    // Verificar y decodificar el token JWT
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Verificar que el usuario aún existe y está activo en la base de datos
    const resultado = await query(
      'SELECT id, activo FROM usuarios WHERE id = $1',
      [decoded.userId]
    );

    if (resultado.rows.length === 0 || !resultado.rows[0].activo) {
      return res.status(401).json({
        valid: false,
        message: 'Usuario no válido'
      });
    }

    // Responder con información de validez del token
    res.json({
      valid: true,
      message: 'Token válido',
      expiresAt: new Date(decoded.exp * 1000) // Convertir timestamp a fecha
    });

  } catch (error) {
    // Manejar diferentes tipos de errores de JWT
    res.status(401).json({
      valid: false,
      message: error.name === 'TokenExpiredError' ? 'Token expirado' : 'Token inválido'
    });
  }
}));

// Exportar el router para uso en el servidor principal
module.exports = router;