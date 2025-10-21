// IMPORTS - Importación de dependencias para JWT y base de datos
const jwt = require('jsonwebtoken');
const { query } = require('../config/database');

// MIDDLEWARE PRINCIPAL DE AUTENTICACIÓN - Verificar token JWT en peticiones protegidas
const verificarToken = async (req, res, next) => {
  try {
    // EXTRAER HEADER DE AUTORIZACIÓN
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
      return res.status(401).json({
        error: 'Token de acceso requerido',
        message: 'Debes incluir el header Authorization con el token'
      });
    }

    // EXTRAER TOKEN del formato "Bearer TOKEN"
    const token = authHeader.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({
        error: 'Token malformado',
        message: 'El formato debe ser: Bearer <token>'
      });
    }

    // VERIFICAR Y DECODIFICAR TOKEN JWT
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // VERIFICAR EXISTENCIA Y ESTADO DEL USUARIO en la base de datos
    const result = await query(
      'SELECT id, nombre, correo, rol, activo FROM usuarios WHERE id = $1',
      [decoded.userId]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({
        error: 'Usuario no encontrado',
        message: 'El usuario asociado al token no existe'
      });
    }

    const usuario = result.rows[0];

    // VERIFICAR QUE EL USUARIO ESTÉ ACTIVO
    if (!usuario.activo) {
      return res.status(401).json({
        error: 'Usuario inactivo',
        message: 'Tu cuenta ha sido desactivada'
      });
    }

    // AGREGAR INFORMACIÓN DEL USUARIO al objeto request para uso posterior
    req.usuario = {
      id: usuario.id,
      nombre: usuario.nombre,
      correo: usuario.correo,
      rol: usuario.rol
    };

    next(); // Continuar con el siguiente middleware
  } catch (error) {
    // MANEJO DE ERRORES ESPECÍFICOS DE JWT
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        error: 'Token inválido',
        message: 'El token proporcionado no es válido'
      });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        error: 'Token expirado',
        message: 'El token ha expirado, inicia sesión nuevamente'
      });
    }

    // ERROR INTERNO DEL SERVIDOR
    console.error('Error en verificación de token:', error);
    res.status(500).json({
      error: 'Error interno del servidor',
      message: 'Error al verificar el token de autenticación'
    });
  }
};

// MIDDLEWARE DE VERIFICACIÓN DE ADMINISTRADOR - Verificar permisos de admin
const verificarAdmin = (req, res, next) => {
  // VERIFICAR QUE EL USUARIO ESTÉ AUTENTICADO
  if (!req.usuario) {
    return res.status(401).json({
      error: 'No autenticado',
      message: 'Debes estar autenticado para acceder a este recurso'
    });
  }

  // VERIFICAR ROL DE ADMINISTRADOR
  if (req.usuario.rol !== 'administrador') {
    return res.status(403).json({
      error: 'Acceso denegado',
      message: 'Solo los administradores pueden acceder a este recurso'
    });
  }

  next(); // Continuar si es administrador
};

// MIDDLEWARE DE VERIFICACIÓN DE PROPIETARIO - Verificar acceso a recursos propios
const verificarPropietarioOAdmin = (paramName = 'id') => {
  return (req, res, next) => {
    // VERIFICAR AUTENTICACIÓN
    if (!req.usuario) {
      return res.status(401).json({
        error: 'No autenticado',
        message: 'Debes estar autenticado para acceder a este recurso'
      });
    }

    // EXTRAER IDs para comparación
    const recursoId = req.params[paramName];
    const usuarioId = req.usuario.id;
    const esAdmin = req.usuario.rol === 'administrador';

    // PERMITIR ACCESO A ADMINISTRADORES sin restricciones
    if (esAdmin) {
      return next();
    }

    // VERIFICAR QUE EL USUARIO ACCEDA SOLO A SUS RECURSOS
    if (parseInt(recursoId) !== usuarioId) {
      return res.status(403).json({
        error: 'Acceso denegado',
        message: 'Solo puedes acceder a tus propios recursos'
      });
    }

    next(); // Permitir acceso al propietario
  };
};

// MIDDLEWARE ESPECÍFICO PARA PEDIDOS - Verificar propietario de pedido
const verificarPropietarioPedido = async (req, res, next) => {
  try {
    // VERIFICAR AUTENTICACIÓN
    if (!req.usuario) {
      return res.status(401).json({
        error: 'No autenticado',
        message: 'Debes estar autenticado para acceder a este recurso'
      });
    }

    // EXTRAER DATOS para verificación
    const pedidoId = req.params.id;
    const usuarioId = req.usuario.id;
    const esAdmin = req.usuario.rol === 'administrador';

    // PERMITIR ACCESO COMPLETO A ADMINISTRADORES
    if (esAdmin) {
      return next();
    }

    // VERIFICAR PROPIETARIO DEL PEDIDO en la base de datos
    const result = await query(
      'SELECT usuario_id FROM pedidos WHERE id = $1',
      [pedidoId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: 'Pedido no encontrado',
        message: 'El pedido especificado no existe'
      });
    }

    // VERIFICAR QUE EL PEDIDO PERTENEZCA AL USUARIO
    if (result.rows[0].usuario_id !== usuarioId) {
      return res.status(403).json({
        error: 'Acceso denegado',
        message: 'Solo puedes acceder a tus propios pedidos'
      });
    }

    next(); // Permitir acceso al propietario del pedido
  } catch (error) {
    console.error('Error en verificación de propietario de pedido:', error);
    res.status(500).json({
      error: 'Error interno del servidor',
      message: 'Error al verificar permisos del pedido'
    });
  }
};

// MIDDLEWARE OPCIONAL - Para rutas que pueden ser públicas o privadas
const tokenOpcional = async (req, res, next) => {
  try {
    // INTENTAR EXTRAER TOKEN si está presente
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
      return next(); // Continuar sin usuario autenticado
    }

    const token = authHeader.split(' ')[1];
    
    if (!token) {
      return next(); // Continuar sin usuario autenticado
    }

    // INTENTAR VERIFICAR TOKEN sin fallar si es inválido
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // VERIFICAR USUARIO si el token es válido
    const result = await query(
      'SELECT id, nombre, correo, rol, activo FROM usuarios WHERE id = $1 AND activo = true',
      [decoded.userId]
    );

    if (result.rows.length > 0) {
      const usuario = result.rows[0];
      // AGREGAR USUARIO AL REQUEST si está autenticado
      req.usuario = {
        id: usuario.id,
        nombre: usuario.nombre,
        correo: usuario.correo,
        rol: usuario.rol
      };
    }

    next(); // Continuar con o sin usuario
  } catch (error) {
    // CONTINUAR SIN USUARIO si hay error en el token
    next();
  }
};

// EXPORTAR TODOS LOS MIDDLEWARE
module.exports = {
  verificarToken,
  verificarAdmin,
  verificarPropietarioOAdmin,
  verificarPropietarioPedido,
  tokenOpcional
};