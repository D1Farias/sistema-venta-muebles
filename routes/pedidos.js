// Importaciones necesarias para el módulo de gestión de pedidos
const express = require('express');
const Joi = require('joi'); // Para validación de datos de entrada
const { query, transaction } = require('../config/database'); // Funciones para consultas y transacciones de base de datos
const { verificarToken, verificarAdmin, verificarPropietarioPedido } = require('../middleware/auth'); // Middleware de autenticación y autorización
const { asyncHandler, ValidationError, NotFoundError, ForbiddenError } = require('../middleware/errorHandler'); // Manejo de errores
const { createLogger } = require('../middleware/logger'); // Sistema de logging

// Inicialización del router de Express y logger específico para pedidos
const router = express.Router();
const logger = createLogger('pedidos');

// Configuración de estados y transiciones de pedidos

// Estados válidos que puede tener un pedido en el sistema
const ESTADOS_VALIDOS = ['nuevo', 'en_cotizacion', 'aprobado', 'en_produccion', 'entregado', 'cancelado'];

// Transiciones de estado permitidas - define qué cambios de estado son válidos
// Esto asegura que los pedidos sigan un flujo lógico de trabajo
const TRANSICIONES_PERMITIDAS = {
  'nuevo': ['en_cotizacion', 'cancelado'],
  'en_cotizacion': ['aprobado', 'cancelado'],
  'aprobado': ['en_produccion', 'cancelado'],
  'en_produccion': ['entregado'],
  'entregado': [], // Estado final - no se puede cambiar
  'cancelado': [] // Estado final - no se puede cambiar
};

// Esquemas de validación con Joi para diferentes operaciones

// Esquema para validar la creación de un nuevo pedido
const crearPedidoSchema = Joi.object({
  detalles: Joi.array().min(1).items(
    Joi.object({
      descripcion: Joi.string().min(10).max(1000).required().messages({
        'string.min': 'La descripción debe tener al menos 10 caracteres',
        'string.max': 'La descripción no puede exceder 1000 caracteres',
        'any.required': 'La descripción es obligatoria'
      }),
      medidas: Joi.string().max(200).optional(),
      material: Joi.string().max(100).optional(),
      color: Joi.string().max(50).optional(),
      cantidad: Joi.number().integer().min(1).default(1),
      observaciones: Joi.string().max(500).optional()
    })
  ).required(),
  notas_cliente: Joi.string().max(1000).optional(),
  direccion_entrega: Joi.string().max(500).optional()
});

// Esquema para validar actualización de estado de pedido
const actualizarEstadoSchema = Joi.object({
  estado: Joi.string().valid(...ESTADOS_VALIDOS).required(),
  notas_admin: Joi.string().max(1000).optional(),
  fecha_entrega: Joi.date().optional()
});

// Esquema para validar actualización de cotización
const actualizarCotizacionSchema = Joi.object({
  detalles: Joi.array().min(1).items(
    Joi.object({
      id: Joi.number().integer().required(),
      cotizacion: Joi.number().precision(2).min(0).required()
    })
  ).required(),
  total_estimado: Joi.number().precision(2).min(0).required()
});

/**
 * POST /pedidos - Crear nuevo pedido
 * Permite a los usuarios autenticados crear un nuevo pedido con múltiples detalles
 */
router.post('/', verificarToken, asyncHandler(async (req, res) => {
  // Validar datos de entrada usando el esquema de Joi
  const { error, value } = crearPedidoSchema.validate(req.body);
  if (error) {
    throw new ValidationError(error.details[0].message);
  }

  const { detalles, notas_cliente, direccion_entrega } = value;

  // Usar transacción para asegurar consistencia de datos
  const resultado = await transaction(async (client) => {
    // Crear el pedido principal con estado inicial 'nuevo'
    const pedidoResult = await client.query(`
      INSERT INTO pedidos (usuario_id, estado, notas_cliente, direccion_entrega)
      VALUES ($1, 'nuevo', $2, $3)
      RETURNING id, estado, fecha_creacion
    `, [req.usuario.id, notas_cliente, direccion_entrega]);

    const pedido = pedidoResult.rows[0];

    // Insertar cada detalle del pedido en la tabla de detalles
    const detallesInsertados = [];
    for (const detalle of detalles) {
      const detalleResult = await client.query(`
        INSERT INTO detalles_pedido 
        (pedido_id, descripcion, medidas, material, color, cantidad, observaciones)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING *
      `, [
        pedido.id,
        detalle.descripcion,
        detalle.medidas,
        detalle.material,
        detalle.color,
        detalle.cantidad || 1,
        detalle.observaciones
      ]);
      detallesInsertados.push(detalleResult.rows[0]);
    }

    return { pedido, detalles: detallesInsertados };
  });

  // Crear notificación automática para informar al usuario sobre el nuevo pedido
  await query(`
    INSERT INTO notificaciones (usuario_id, mensaje, tipo, asunto, datos_adicionales)
    VALUES ($1, $2, 'sistema', $3, $4)
  `, [
    req.usuario.id,
    'Tu pedido ha sido creado exitosamente y está siendo revisado por nuestro equipo.',
    'Nuevo pedido creado',
    JSON.stringify({ pedido_id: resultado.pedido.id })
  ]);

  // Registrar la creación del pedido en los logs
  logger.info('Nuevo pedido creado', {
    pedidoId: resultado.pedido.id,
    usuarioId: req.usuario.id,
    cantidadDetalles: resultado.detalles.length
  });

  res.status(201).json({
    message: 'Pedido creado exitosamente',
    pedido: {
      id: resultado.pedido.id,
      estado: resultado.pedido.estado,
      fechaCreacion: resultado.pedido.fecha_creacion,
      detalles: resultado.detalles
    }
  });
}));

/**
 * GET /pedidos/:id - Obtener detalles completos de un pedido específico
 * Permite ver información detallada de un pedido (solo propietario o administrador)
 */
router.get('/:id', verificarToken, verificarPropietarioPedido, asyncHandler(async (req, res) => {
  const { id } = req.params;

  // Obtener información principal del pedido junto con datos del usuario
  const pedidoResult = await query(`
    SELECT 
      p.*,
      u.nombre as nombre_usuario,
      u.correo as correo_usuario
    FROM pedidos p
    JOIN usuarios u ON p.usuario_id = u.id
    WHERE p.id = $1
  `, [id]);

  if (pedidoResult.rows.length === 0) {
    throw new NotFoundError('Pedido no encontrado');
  }

  const pedido = pedidoResult.rows[0];

  // Obtener todos los detalles del pedido ordenados por ID
  const detallesResult = await query(`
    SELECT * FROM detalles_pedido WHERE pedido_id = $1 ORDER BY id
  `, [id]);

  // Obtener historial completo de cambios de estado del pedido
  const historialResult = await query(`
    SELECT 
      h.*,
      u.nombre as usuario_cambio_nombre
    FROM historial_estados h
    LEFT JOIN usuarios u ON h.usuario_cambio_id = u.id
    WHERE h.pedido_id = $1
    ORDER BY h.fecha_cambio DESC
  `, [id]);

  res.json({
    message: 'Pedido obtenido exitosamente',
    pedido: {
      ...pedido,
      detalles: detallesResult.rows,
      historial: historialResult.rows
    }
  });
}));

/**
 * GET /pedidos/usuario/:id - Listar pedidos de un usuario específico
 * Permite ver los pedidos de un usuario con filtros y paginación
 */
router.get('/usuario/:id', verificarToken, asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { page = 1, limit = 10, estado = '' } = req.query;

  // Verificar permisos: solo el propio usuario o administrador pueden ver los pedidos
  if (req.usuario.rol !== 'administrador' && parseInt(id) !== req.usuario.id) {
    throw new ForbiddenError('Solo puedes ver tus propios pedidos');
  }

  const offset = (parseInt(page) - 1) * parseInt(limit);
  
  // Construir filtros dinámicamente
  let whereClause = 'WHERE p.usuario_id = $1';
  const valores = [id];
  let contador = 2;

  // Filtro opcional por estado
  if (estado) {
    whereClause += ` AND p.estado = $${contador}`;
    valores.push(estado);
    contador++;
  }

  // Obtener el total de registros que coinciden con los filtros
  const totalResult = await query(`
    SELECT COUNT(*) as total FROM pedidos p ${whereClause}
  `, valores);
  
  const total = parseInt(totalResult.rows[0].total);

  // Obtener pedidos paginados con información resumida
  valores.push(parseInt(limit), offset);
  const resultado = await query(`
    SELECT 
      p.id, p.estado, p.fecha_creacion, p.fecha_entrega, p.total_estimado,
      COUNT(dp.id) as cantidad_items
    FROM pedidos p
    LEFT JOIN detalles_pedido dp ON p.id = dp.pedido_id
    ${whereClause}
    GROUP BY p.id, p.estado, p.fecha_creacion, p.fecha_entrega, p.total_estimado
    ORDER BY p.fecha_creacion DESC
    LIMIT $${contador} OFFSET $${contador + 1}
  `, valores);

  res.json({
    message: 'Pedidos obtenidos exitosamente',
    pedidos: resultado.rows,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      pages: Math.ceil(total / parseInt(limit))
    }
  });
}));

/**
 * GET /pedidos - Listar todos los pedidos con filtros (solo administradores)
 * Permite a los administradores ver todos los pedidos del sistema con opciones de filtrado
 */
router.get('/', verificarToken, verificarAdmin, asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, estado = '', usuario_id = '' } = req.query;
  
  const offset = (parseInt(page) - 1) * parseInt(limit);
  
  // Construir filtros dinámicamente basados en los parámetros de consulta
  let whereClause = 'WHERE 1=1';
  const valores = [];
  let contador = 1;

  // Filtro por estado específico
  if (estado) {
    whereClause += ` AND p.estado = $${contador}`;
    valores.push(estado);
    contador++;
  }

  // Filtro por usuario específico
  if (usuario_id) {
    whereClause += ` AND p.usuario_id = $${contador}`;
    valores.push(usuario_id);
    contador++;
  }

  // Obtener el total de registros que coinciden con los filtros
  const totalResult = await query(`
    SELECT COUNT(*) as total FROM pedidos p ${whereClause}
  `, valores);
  
  const total = parseInt(totalResult.rows[0].total);

  // Obtener pedidos paginados con información del usuario y resumen
  valores.push(parseInt(limit), offset);
  const resultado = await query(`
    SELECT 
      p.id, p.estado, p.fecha_creacion, p.fecha_entrega, p.total_estimado,
      u.nombre as nombre_usuario, u.correo as correo_usuario,
      COUNT(dp.id) as cantidad_items
    FROM pedidos p
    JOIN usuarios u ON p.usuario_id = u.id
    LEFT JOIN detalles_pedido dp ON p.id = dp.pedido_id
    ${whereClause}
    GROUP BY p.id, p.estado, p.fecha_creacion, p.fecha_entrega, p.total_estimado, u.nombre, u.correo
    ORDER BY p.fecha_creacion DESC
    LIMIT $${contador} OFFSET $${contador + 1}
  `, valores);

  res.json({
    message: 'Pedidos obtenidos exitosamente',
    pedidos: resultado.rows,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      pages: Math.ceil(total / parseInt(limit))
    }
  });
}));

/**
 * PATCH /pedidos/:id/estado - Actualizar estado del pedido (solo administradores)
 * Permite cambiar el estado de un pedido siguiendo las transiciones válidas
 */
router.patch('/:id/estado', verificarToken, verificarAdmin, asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { error, value } = actualizarEstadoSchema.validate(req.body);
  
  if (error) {
    throw new ValidationError(error.details[0].message);
  }

  const { estado, notas_admin, fecha_entrega } = value;

  // Obtener el estado actual del pedido y el ID del usuario propietario
  const pedidoActual = await query(
    'SELECT estado, usuario_id FROM pedidos WHERE id = $1',
    [id]
  );

  if (pedidoActual.rows.length === 0) {
    throw new NotFoundError('Pedido no encontrado');
  }

  const estadoActual = pedidoActual.rows[0].estado;
  const usuarioId = pedidoActual.rows[0].usuario_id;

  // Verificar que la transición de estado es válida según las reglas de negocio
  if (!TRANSICIONES_PERMITIDAS[estadoActual].includes(estado)) {
    throw new ValidationError(
      `No se puede cambiar el estado de '${estadoActual}' a '${estado}'. ` +
      `Estados permitidos: ${TRANSICIONES_PERMITIDAS[estadoActual].join(', ')}`
    );
  }

  // Construir query dinámicamente para actualizar solo los campos proporcionados
  const campos = ['estado = $2'];
  const valores = [id, estado];
  let contador = 3;

  if (notas_admin !== undefined) {
    campos.push(`notas_admin = $${contador}`);
    valores.push(notas_admin);
    contador++;
  }

  if (fecha_entrega !== undefined) {
    campos.push(`fecha_entrega = $${contador}`);
    valores.push(fecha_entrega);
    contador++;
  }

  // Actualizar el pedido en la base de datos
  const resultado = await query(`
    UPDATE pedidos 
    SET ${campos.join(', ')}
    WHERE id = $1
    RETURNING *
  `, valores);

  const pedidoActualizado = resultado.rows[0];

  // Actualizar el historial de estados con información del administrador que hizo el cambio
  // (el trigger de la base de datos crea automáticamente el registro de historial)
  await query(`
    UPDATE historial_estados 
    SET usuario_cambio_id = $1, comentario = $2
    WHERE pedido_id = $3 AND estado_nuevo = $4 AND usuario_cambio_id IS NULL
  `, [req.usuario.id, notas_admin, id, estado]);

  // Crear notificación automática para informar al usuario sobre el cambio de estado
  const mensajesEstado = {
    'en_cotizacion': 'Tu pedido está siendo cotizado por nuestro equipo.',
    'aprobado': 'Tu pedido ha sido aprobado y pronto comenzará la producción.',
    'en_produccion': 'Tu pedido está en producción.',
    'entregado': 'Tu pedido ha sido entregado exitosamente.',
    'cancelado': 'Tu pedido ha sido cancelado.'
  };

  await query(`
    INSERT INTO notificaciones (usuario_id, mensaje, tipo, asunto, datos_adicionales)
    VALUES ($1, $2, 'sistema', $3, $4)
  `, [
    usuarioId,
    mensajesEstado[estado] || `El estado de tu pedido ha cambiado a: ${estado}`,
    `Pedido ${estado}`,
    JSON.stringify({ pedido_id: id, estado_anterior: estadoActual, estado_nuevo: estado })
  ]);

  // Registrar el cambio de estado en los logs para auditoría
  logger.info('Estado de pedido actualizado', {
    pedidoId: id,
    estadoAnterior: estadoActual,
    estadoNuevo: estado,
    adminId: req.usuario.id,
    usuarioId: usuarioId
  });

  res.json({
    message: 'Estado del pedido actualizado exitosamente',
    pedido: pedidoActualizado
  });
}));

/**
 * PUT /pedidos/:id/cotizacion - Actualizar cotización del pedido (solo administradores)
 * Permite establecer precios para los detalles del pedido y el total estimado
 */
router.put('/:id/cotizacion', verificarToken, verificarAdmin, asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { error, value } = actualizarCotizacionSchema.validate(req.body);
  
  if (error) {
    throw new ValidationError(error.details[0].message);
  }

  const { detalles, total_estimado } = value;

  // Usar transacción para asegurar consistencia al actualizar múltiples registros
  const resultado = await transaction(async (client) => {
    // Verificar que el pedido existe antes de proceder
    const pedidoResult = await client.query(
      'SELECT id, estado FROM pedidos WHERE id = $1',
      [id]
    );

    if (pedidoResult.rows.length === 0) {
      throw new NotFoundError('Pedido no encontrado');
    }

    // Actualizar la cotización de cada detalle del pedido
    for (const detalle of detalles) {
      await client.query(
        'UPDATE detalles_pedido SET cotizacion = $1 WHERE id = $2 AND pedido_id = $3',
        [detalle.cotizacion, detalle.id, id]
      );
    }

    // Actualizar el total estimado del pedido principal
    const pedidoActualizado = await client.query(
      'UPDATE pedidos SET total_estimado = $1 WHERE id = $2 RETURNING *',
      [total_estimado, id]
    );

    return pedidoActualizado.rows[0];
  });

  // Registrar la actualización de cotización en los logs
  logger.info('Cotización de pedido actualizada', {
    pedidoId: id,
    totalEstimado: total_estimado,
    adminId: req.usuario.id
  });

  res.json({
    message: 'Cotización actualizada exitosamente',
    pedido: resultado
  });
}));

/**
 * GET /pedidos/estadisticas/resumen - Obtener estadísticas de pedidos (solo administradores)
 * Proporciona un resumen estadístico de todos los pedidos para análisis de negocio
 */
router.get('/estadisticas/resumen', verificarToken, verificarAdmin, asyncHandler(async (req, res) => {
  // Obtener estadísticas agrupadas por estado de pedido
  const estadisticas = await query(`
    SELECT 
      estado,
      COUNT(*) as cantidad,
      SUM(total_estimado) as valor_total
    FROM pedidos 
    GROUP BY estado
    ORDER BY 
      CASE estado
        WHEN 'nuevo' THEN 1
        WHEN 'en_cotizacion' THEN 2
        WHEN 'aprobado' THEN 3
        WHEN 'en_produccion' THEN 4
        WHEN 'entregado' THEN 5
        WHEN 'cancelado' THEN 6
      END
  `);

  // Obtener resumen mensual de pedidos de los últimos 12 meses
  const resumenMensual = await query(`
    SELECT 
      DATE_TRUNC('month', fecha_creacion) as mes,
      COUNT(*) as pedidos_creados,
      SUM(total_estimado) as valor_total
    FROM pedidos 
    WHERE fecha_creacion >= CURRENT_DATE - INTERVAL '12 months'
    GROUP BY DATE_TRUNC('month', fecha_creacion)
    ORDER BY mes DESC
  `);

  res.json({
    message: 'Estadísticas obtenidas exitosamente',
    estadisticas: {
      por_estado: estadisticas.rows,
      resumen_mensual: resumenMensual.rows
    }
  });
}));

// Exportar el router para uso en el servidor principal
module.exports = router;