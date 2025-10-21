// Importaciones necesarias para el módulo de gestión de usuarios
const express = require('express');
const bcrypt = require('bcryptjs'); // Para cifrado de contraseñas
const Joi = require('joi'); // Para validación de datos de entrada
const { query } = require('../config/database'); // Función para consultas a la base de datos
const { verificarToken, verificarAdmin, verificarPropietarioOAdmin } = require('../middleware/auth'); // Middleware de autenticación y autorización
const { asyncHandler, ValidationError, NotFoundError, ConflictError } = require('../middleware/errorHandler'); // Manejo de errores
const { createLogger } = require('../middleware/logger'); // Sistema de logging

// Inicialización del router de Express y logger específico para usuarios
const router = express.Router();
const logger = createLogger('usuarios');

// Esquemas de validación con Joi para diferentes operaciones

// Esquema para validar actualización de perfil de usuario
const actualizarPerfilSchema = Joi.object({
  nombre: Joi.string().min(2).max(100).optional(),
  telefono: Joi.string().max(20).optional().allow(''),
  direccion: Joi.string().max(500).optional().allow('')
});

// Esquema para validar cambio de contraseña
const cambiarContraseñaSchema = Joi.object({
  contraseñaActual: Joi.string().required().messages({
    'any.required': 'La contraseña actual es obligatoria'
  }),
  contraseñaNueva: Joi.string().min(6).max(100).required().messages({
    'string.min': 'La nueva contraseña debe tener al menos 6 caracteres',
    'string.max': 'La nueva contraseña no puede exceder 100 caracteres',
    'any.required': 'La nueva contraseña es obligatoria'
  })
});

// Esquema para validar actualización de usuario por administrador
const actualizarUsuarioAdminSchema = Joi.object({
  nombre: Joi.string().min(2).max(100).optional(),
  correo: Joi.string().email().max(150).optional(),
  rol: Joi.string().valid('usuario', 'administrador').optional(),
  activo: Joi.boolean().optional(),
  telefono: Joi.string().max(20).optional().allow(''),
  direccion: Joi.string().max(500).optional().allow('')
});

/**
 * GET /usuarios/perfil - Obtener perfil del usuario autenticado
 * Permite al usuario ver su propia información de perfil
 */
router.get('/perfil', verificarToken, asyncHandler(async (req, res) => {
  // Obtener información del usuario autenticado desde la base de datos
  const resultado = await query(`
    SELECT 
      id, nombre, correo, rol, telefono, direccion, 
      fecha_creacion, fecha_ultima_conexion, activo
    FROM usuarios 
    WHERE id = $1
  `, [req.usuario.id]);

  if (resultado.rows.length === 0) {
    throw new NotFoundError('Usuario no encontrado');
  }

  const usuario = resultado.rows[0];

  // Responder con la información del perfil (sin incluir la contraseña)
  res.json({
    message: 'Perfil obtenido exitosamente',
    usuario: {
      id: usuario.id,
      nombre: usuario.nombre,
      correo: usuario.correo,
      rol: usuario.rol,
      telefono: usuario.telefono,
      direccion: usuario.direccion,
      fechaCreacion: usuario.fecha_creacion,
      fechaUltimaConexion: usuario.fecha_ultima_conexion,
      activo: usuario.activo
    }
  });
}));

/**
 * PUT /usuarios/perfil - Actualizar perfil del usuario autenticado
 * Permite al usuario modificar su información personal (nombre, teléfono, dirección)
 */
router.put('/perfil', verificarToken, asyncHandler(async (req, res) => {
  // Validar datos de entrada usando el esquema de Joi
  const { error, value } = actualizarPerfilSchema.validate(req.body);
  if (error) {
    throw new ValidationError(error.details[0].message);
  }

  const { nombre, telefono, direccion } = value;
  const campos = [];
  const valores = [];
  let contador = 1;

  // Construir query dinámicamente solo con los campos proporcionados
  if (nombre !== undefined) {
    campos.push(`nombre = $${contador}`);
    valores.push(nombre);
    contador++;
  }
  if (telefono !== undefined) {
    campos.push(`telefono = $${contador}`);
    valores.push(telefono || null);
    contador++;
  }
  if (direccion !== undefined) {
    campos.push(`direccion = $${contador}`);
    valores.push(direccion || null);
    contador++;
  }

  // Verificar que se proporcionó al menos un campo para actualizar
  if (campos.length === 0) {
    throw new ValidationError('No se proporcionaron campos para actualizar');
  }

  valores.push(req.usuario.id);

  // Ejecutar la actualización en la base de datos
  const resultado = await query(`
    UPDATE usuarios 
    SET ${campos.join(', ')}
    WHERE id = $${contador}
    RETURNING id, nombre, correo, rol, telefono, direccion
  `, valores);

  const usuarioActualizado = resultado.rows[0];

  // Registrar la actualización en los logs
  logger.info('Usuario actualizó su perfil', {
    userId: req.usuario.id,
    camposActualizados: Object.keys(value)
  });

  res.json({
    message: 'Perfil actualizado exitosamente',
    usuario: usuarioActualizado
  });
}));

/**
 * PUT /usuarios/cambiar-contraseña - Cambiar contraseña del usuario autenticado
 * Permite al usuario cambiar su contraseña verificando la contraseña actual
 */
router.put('/cambiar-contraseña', verificarToken, asyncHandler(async (req, res) => {
  // Validar datos de entrada usando el esquema de Joi
  const { error, value } = cambiarContraseñaSchema.validate(req.body);
  if (error) {
    throw new ValidationError(error.details[0].message);
  }

  const { contraseñaActual, contraseñaNueva } = value;

  // Obtener la contraseña actual cifrada del usuario
  const resultado = await query(
    'SELECT contraseña FROM usuarios WHERE id = $1',
    [req.usuario.id]
  );

  if (resultado.rows.length === 0) {
    throw new NotFoundError('Usuario no encontrado');
  }

  const usuario = resultado.rows[0];

  // Verificar que la contraseña actual proporcionada es correcta
  const contraseñaValida = await bcrypt.compare(contraseñaActual, usuario.contraseña);
  if (!contraseñaValida) {
    throw new ValidationError('La contraseña actual es incorrecta');
  }

  // Cifrar la nueva contraseña usando bcrypt con 12 rondas de salt
  const saltRounds = 12;
  const nuevaContraseñaCifrada = await bcrypt.hash(contraseñaNueva, saltRounds);

  // Actualizar la contraseña en la base de datos
  await query(
    'UPDATE usuarios SET contraseña = $1 WHERE id = $2',
    [nuevaContraseñaCifrada, req.usuario.id]
  );

  // Registrar el cambio de contraseña en los logs
  logger.info('Usuario cambió su contraseña', {
    userId: req.usuario.id,
    correo: req.usuario.correo
  });

  res.json({
    message: 'Contraseña cambiada exitosamente'
  });
}));

/**
 * GET /usuarios - Listar usuarios con filtros y paginación (solo administradores)
 * Permite a los administradores ver todos los usuarios con opciones de búsqueda y filtrado
 */
router.get('/', verificarToken, verificarAdmin, asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, search = '', rol = '', activo = '' } = req.query;
  
  const offset = (parseInt(page) - 1) * parseInt(limit);
  
  // Construir filtros dinámicamente basados en los parámetros de consulta
  let whereClause = 'WHERE 1=1';
  const valores = [];
  let contador = 1;

  // Filtro de búsqueda por nombre o correo
  if (search) {
    whereClause += ` AND (nombre ILIKE $${contador} OR correo ILIKE $${contador})`;
    valores.push(`%${search}%`);
    contador++;
  }

  // Filtro por rol específico
  if (rol) {
    whereClause += ` AND rol = $${contador}`;
    valores.push(rol);
    contador++;
  }

  // Filtro por estado activo/inactivo
  if (activo !== '') {
    whereClause += ` AND activo = $${contador}`;
    valores.push(activo === 'true');
    contador++;
  }

  // Obtener el total de registros que coinciden con los filtros
  const totalResult = await query(`
    SELECT COUNT(*) as total FROM usuarios ${whereClause}
  `, valores);
  
  const total = parseInt(totalResult.rows[0].total);

  // Obtener usuarios paginados con los filtros aplicados
  valores.push(parseInt(limit), offset);
  const resultado = await query(`
    SELECT 
      id, nombre, correo, rol, telefono, activo,
      fecha_creacion, fecha_ultima_conexion
    FROM usuarios 
    ${whereClause}
    ORDER BY fecha_creacion DESC
    LIMIT $${contador} OFFSET $${contador + 1}
  `, valores);

  res.json({
    message: 'Usuarios obtenidos exitosamente',
    usuarios: resultado.rows,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      pages: Math.ceil(total / parseInt(limit))
    }
  });
}));

/**
 * GET /usuarios/:id - Obtener usuario específico
 * Permite ver información de un usuario específico (solo el propietario o administrador)
 */
router.get('/:id', verificarToken, verificarPropietarioOAdmin('id'), asyncHandler(async (req, res) => {
  const { id } = req.params;

  // Obtener información del usuario específico
  const resultado = await query(`
    SELECT 
      id, nombre, correo, rol, telefono, direccion, activo,
      fecha_creacion, fecha_ultima_conexion
    FROM usuarios 
    WHERE id = $1
  `, [id]);

  if (resultado.rows.length === 0) {
    throw new NotFoundError('Usuario no encontrado');
  }

  res.json({
    message: 'Usuario obtenido exitosamente',
    usuario: resultado.rows[0]
  });
}));

/**
 * PUT /usuarios/:id - Actualizar usuario específico (solo administradores)
 * Permite a los administradores modificar cualquier campo de un usuario
 */
router.put('/:id', verificarToken, verificarAdmin, asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { error, value } = actualizarUsuarioAdminSchema.validate(req.body);
  
  if (error) {
    throw new ValidationError(error.details[0].message);
  }

  const { nombre, correo, rol, activo, telefono, direccion } = value;

  // Verificar que el usuario a actualizar existe
  const usuarioExistente = await query('SELECT id FROM usuarios WHERE id = $1', [id]);
  if (usuarioExistente.rows.length === 0) {
    throw new NotFoundError('Usuario no encontrado');
  }

  // Si se está cambiando el correo, verificar que no exista otro usuario con ese correo
  if (correo) {
    const correoExistente = await query(
      'SELECT id FROM usuarios WHERE correo = $1 AND id != $2',
      [correo.toLowerCase(), id]
    );
    if (correoExistente.rows.length > 0) {
      throw new ConflictError('Ya existe otro usuario con este correo electrónico');
    }
  }

  // Construir query dinámicamente solo con los campos proporcionados
  const campos = [];
  const valores = [];
  let contador = 1;

  if (nombre !== undefined) {
    campos.push(`nombre = $${contador}`);
    valores.push(nombre);
    contador++;
  }
  if (correo !== undefined) {
    campos.push(`correo = $${contador}`);
    valores.push(correo.toLowerCase());
    contador++;
  }
  if (rol !== undefined) {
    campos.push(`rol = $${contador}`);
    valores.push(rol);
    contador++;
  }
  if (activo !== undefined) {
    campos.push(`activo = $${contador}`);
    valores.push(activo);
    contador++;
  }
  if (telefono !== undefined) {
    campos.push(`telefono = $${contador}`);
    valores.push(telefono || null);
    contador++;
  }
  if (direccion !== undefined) {
    campos.push(`direccion = $${contador}`);
    valores.push(direccion || null);
    contador++;
  }

  // Verificar que se proporcionó al menos un campo para actualizar
  if (campos.length === 0) {
    throw new ValidationError('No se proporcionaron campos para actualizar');
  }

  valores.push(id);

  // Ejecutar la actualización en la base de datos
  const resultado = await query(`
    UPDATE usuarios 
    SET ${campos.join(', ')}
    WHERE id = $${contador}
    RETURNING id, nombre, correo, rol, telefono, direccion, activo
  `, valores);

  const usuarioActualizado = resultado.rows[0];

  // Registrar la actualización realizada por el administrador
  logger.info('Administrador actualizó usuario', {
    adminId: req.usuario.id,
    usuarioActualizadoId: id,
    camposActualizados: Object.keys(value)
  });

  res.json({
    message: 'Usuario actualizado exitosamente',
    usuario: usuarioActualizado
  });
}));

/**
 * DELETE /usuarios/:id - Desactivar usuario (solo administradores)
 * Desactiva un usuario en lugar de eliminarlo permanentemente
 */
router.delete('/:id', verificarToken, verificarAdmin, asyncHandler(async (req, res) => {
  const { id } = req.params;

  // Verificar que el usuario a desactivar existe
  const usuarioExistente = await query('SELECT id, activo FROM usuarios WHERE id = $1', [id]);
  if (usuarioExistente.rows.length === 0) {
    throw new NotFoundError('Usuario no encontrado');
  }

  // Prevenir que el administrador se desactive a sí mismo
  if (parseInt(id) === req.usuario.id) {
    throw new ValidationError('No puedes desactivar tu propia cuenta');
  }

  // Desactivar usuario en lugar de eliminarlo físicamente
  await query('UPDATE usuarios SET activo = false WHERE id = $1', [id]);

  // Registrar la desactivación realizada por el administrador
  logger.info('Administrador desactivó usuario', {
    adminId: req.usuario.id,
    usuarioDesactivadoId: id
  });

  res.json({
    message: 'Usuario desactivado exitosamente'
  });
}));

/**
 * POST /usuarios/:id/reactivar - Reactivar usuario desactivado (solo administradores)
 * Permite reactivar un usuario que había sido desactivado previamente
 */
router.post('/:id/reactivar', verificarToken, verificarAdmin, asyncHandler(async (req, res) => {
  const { id } = req.params;

  // Verificar que el usuario existe y obtener su estado actual
  const usuarioExistente = await query('SELECT id, activo FROM usuarios WHERE id = $1', [id]);
  if (usuarioExistente.rows.length === 0) {
    throw new NotFoundError('Usuario no encontrado');
  }

  // Verificar que el usuario no esté ya activo
  if (usuarioExistente.rows[0].activo) {
    throw new ValidationError('El usuario ya está activo');
  }

  // Reactivar el usuario
  await query('UPDATE usuarios SET activo = true WHERE id = $1', [id]);

  // Registrar la reactivación realizada por el administrador
  logger.info('Administrador reactivó usuario', {
    adminId: req.usuario.id,
    usuarioReactivadoId: id
  });

  res.json({
    message: 'Usuario reactivado exitosamente'
  });
}));

// Exportar el router para uso en el servidor principal
module.exports = router;