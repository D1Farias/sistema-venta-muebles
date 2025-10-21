// ============================================================================
// RUTAS DE RECOMENDACIONES DE IA
// ============================================================================
// Este archivo define todas las rutas relacionadas con el sistema de 
// recomendaciones de IA para muebles personalizados.
// 
// Funcionalidades principales:
// - Solicitar recomendaciones de IA basadas en parámetros del usuario
// - Gestionar y consultar recomendaciones existentes
// - Calificar y comentar recomendaciones
// - Estadísticas y administración de recomendaciones
// ============================================================================

// Importaciones necesarias
const express = require('express');              // Framework web para Node.js
const Joi = require('joi');                      // Librería para validación de datos
const { query } = require('../config/database'); // Función para ejecutar consultas a la base de datos
const { verificarToken, verificarAdmin, verificarPropietario } = require('../middleware/auth'); // Middleware de autenticación y autorización
const { asyncHandler, ValidationError, NotFoundError } = require('../middleware/errorHandler'); // Middleware para manejo de errores
const { createLogger } = require('../middleware/logger'); // Sistema de logging

// Inicialización del router de Express y logger específico para recomendaciones
const router = express.Router();
const logger = createLogger('recomendaciones');

// ============================================================================
// ESQUEMAS DE VALIDACIÓN CON JOI
// ============================================================================

// Esquema para validar datos al solicitar una nueva recomendación de IA
const solicitarRecomendacionSchema = Joi.object({
  pedido_id: Joi.number().integer().positive().optional(),    // ID del pedido asociado (opcional)
  medidas: Joi.object({                                       // Dimensiones del mueble requerido
    largo: Joi.number().positive().required(),                // Largo en unidades especificadas
    ancho: Joi.number().positive().required(),                // Ancho en unidades especificadas
    alto: Joi.number().positive().required(),                 // Alto en unidades especificadas
    unidad: Joi.string().valid('cm', 'm', 'mm').default('cm') // Unidad de medida (por defecto cm)
  }).required(),
  material: Joi.string().min(2).max(50).required().messages({
    'string.min': 'El material debe tener al menos 2 caracteres',
    'string.max': 'El material no puede exceder 50 caracteres',
    'any.required': 'El material es obligatorio'
  }),
  color: Joi.string().min(2).max(30).required().messages({
    'string.min': 'El color debe tener al menos 2 caracteres',
    'string.max': 'El color no puede exceder 30 caracteres',
    'any.required': 'El color es obligatorio'
  }),
  estilo: Joi.string().min(2).max(50).required().messages({
    'string.min': 'El estilo debe tener al menos 2 caracteres',
    'string.max': 'El estilo no puede exceder 50 caracteres',
    'any.required': 'El estilo es obligatorio'
  }),
  tipo_mueble: Joi.string().min(2).max(50).optional(),        // Tipo específico de mueble (opcional)
  presupuesto_estimado: Joi.number().positive().optional(),   // Presupuesto aproximado del cliente
  descripcion_adicional: Joi.string().max(500).optional(),    // Descripción adicional de requerimientos
  preferencias_especiales: Joi.array().items(Joi.string().max(100)).optional() // Array de preferencias especiales
});

// Esquema para validar actualizaciones de recomendaciones existentes
const actualizarRecomendacionSchema = Joi.object({
  texto_recomendacion: Joi.string().min(10).max(2000).optional(),              // Texto de la recomendación generada
  imagen_generada_url: Joi.string().uri().max(500).optional(),                 // URL de imagen generada por IA
  estado: Joi.string().valid('pendiente', 'procesando', 'completada', 'error').optional(), // Estado de la recomendación
  puntuacion_usuario: Joi.number().min(1).max(5).optional(),                   // Calificación del usuario (1-5 estrellas)
  comentario_usuario: Joi.string().max(500).optional()                         // Comentario del usuario sobre la recomendación
});

// ============================================================================
// RUTAS DE RECOMENDACIONES
// ============================================================================

// POST /recomendaciones/ia - Solicitar recomendación de IA
// Permite a los usuarios autenticados solicitar recomendaciones personalizadas
// de muebles utilizando inteligencia artificial basada en sus especificaciones
router.post('/ia', verificarToken, asyncHandler(async (req, res) => {
  const { error, value } = solicitarRecomendacionSchema.validate(req.body);
  if (error) {
    throw new ValidationError(error.details[0].message);
  }

  const {
    pedido_id,
    medidas,
    material,
    color,
    estilo,
    tipo_mueble,
    presupuesto_estimado,
    descripcion_adicional,
    preferencias_especiales
  } = value;

  // Si se proporciona pedido_id, verificar que el usuario sea propietario o admin
  if (pedido_id) {
    const pedidoResult = await query('SELECT usuario_id FROM pedidos WHERE id = $1', [pedido_id]);
    if (pedidoResult.rows.length === 0) {
      throw new NotFoundError('Pedido no encontrado');
    }

    const pedido = pedidoResult.rows[0];
    if (req.usuario.rol !== 'administrador' && pedido.usuario_id !== req.usuario.id) {
      throw new ValidationError('No tienes permisos para solicitar recomendaciones para este pedido');
    }
  }

  try {
    // Importar el servicio de IA dinámicamente para evitar problemas de dependencias circulares
    const iaService = require('../services/iaService');

    // Crear registro inicial de recomendación
    const recomendacionResult = await query(`
      INSERT INTO recomendaciones_ia (
        pedido_id, usuario_id, datos_entrada, estado
      )
      VALUES ($1, $2, $3, 'procesando')
      RETURNING id
    `, [
      pedido_id,
      req.usuario.id,
      JSON.stringify({
        medidas,
        material,
        color,
        estilo,
        tipo_mueble,
        presupuesto_estimado,
        descripcion_adicional,
        preferencias_especiales
      })
    ]);

    const recomendacionId = recomendacionResult.rows[0].id;

    // Solicitar recomendación al servicio de IA
    const recomendacion = await iaService.generarRecomendacion({
      medidas,
      material,
      color,
      estilo,
      tipo_mueble,
      presupuesto_estimado,
      descripcion_adicional,
      preferencias_especiales
    });

    // Actualizar la recomendación con los resultados
    const recomendacionActualizada = await query(`
      UPDATE recomendaciones_ia 
      SET 
        texto_recomendacion = $1,
        imagen_generada_url = $2,
        estado = 'completada',
        fecha_completada = CURRENT_TIMESTAMP
      WHERE id = $3
      RETURNING *
    `, [
      recomendacion.texto,
      recomendacion.imagen_url,
      recomendacionId
    ]);

    logger.info('Recomendación de IA generada exitosamente', {
      recomendacionId,
      usuarioId: req.usuario.id,
      pedidoId: pedido_id,
      parametros: { material, color, estilo }
    });

    res.status(201).json({
      message: 'Recomendación generada exitosamente',
      recomendacion: {
        id: recomendacionActualizada.rows[0].id,
        texto_recomendacion: recomendacion.texto,
        imagen_generada_url: recomendacion.imagen_url,
        productos_sugeridos: recomendacion.productos_sugeridos,
        estimacion_precio: recomendacion.estimacion_precio,
        tiempo_estimado: recomendacion.tiempo_estimado,
        fecha_generacion: recomendacionActualizada.rows[0].fecha_generacion
      }
    });

  } catch (iaError) {
    // Si hay error en el servicio de IA, actualizar el estado
    await query(`
      UPDATE recomendaciones_ia 
      SET estado = 'error', error_mensaje = $1
      WHERE id = $2
    `, [iaError.message, recomendacionResult?.rows[0]?.id]);

    logger.error('Error al generar recomendación de IA', {
      error: iaError.message,
      usuarioId: req.usuario.id,
      parametros: { material, color, estilo }
    });

    throw new Error('Error al generar la recomendación. Por favor, inténtalo de nuevo más tarde.');
  }
}));

// GET /recomendaciones/usuario/:usuarioId - Obtener recomendaciones de un usuario
// Permite obtener todas las recomendaciones de un usuario específico con paginación
// Solo el propietario de las recomendaciones o un administrador pueden acceder
router.get('/usuario/:usuarioId', verificarToken, verificarPropietario('usuarioId'), asyncHandler(async (req, res) => {
  const { usuarioId } = req.params;
  const { page = 1, limit = 10, estado = '' } = req.query;

  const offset = (parseInt(page) - 1) * parseInt(limit);

  let whereClause = 'WHERE usuario_id = $1';
  const valores = [usuarioId];
  let contador = 2;

  if (estado) {
    whereClause += ` AND estado = $${contador}`;
    valores.push(estado);
    contador++;
  }

  // Obtener total de registros
  const totalResult = await query(`
    SELECT COUNT(*) as total FROM recomendaciones_ia ${whereClause}
  `, valores);
  
  const total = parseInt(totalResult.rows[0].total);

  // Obtener recomendaciones paginadas
  valores.push(parseInt(limit), offset);
  const resultado = await query(`
    SELECT 
      r.*,
      p.estado as estado_pedido
    FROM recomendaciones_ia r
    LEFT JOIN pedidos p ON r.pedido_id = p.id
    ${whereClause}
    ORDER BY r.fecha_generacion DESC
    LIMIT $${contador} OFFSET $${contador + 1}
  `, valores);

  res.json({
    message: 'Recomendaciones obtenidas exitosamente',
    recomendaciones: resultado.rows,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      pages: Math.ceil(total / parseInt(limit))
    }
  });
}));

// GET /recomendaciones/:id - Obtener recomendación específica
// Permite obtener los detalles completos de una recomendación específica
// Solo el propietario de la recomendación o un administrador pueden acceder
router.get('/:id', verificarToken, asyncHandler(async (req, res) => {
  const { id } = req.params;

  const resultado = await query(`
    SELECT 
      r.*,
      u.nombre as usuario_nombre,
      p.estado as estado_pedido
    FROM recomendaciones_ia r
    JOIN usuarios u ON r.usuario_id = u.id
    LEFT JOIN pedidos p ON r.pedido_id = p.id
    WHERE r.id = $1
  `, [id]);

  if (resultado.rows.length === 0) {
    throw new NotFoundError('Recomendación no encontrada');
  }

  const recomendacion = resultado.rows[0];

  // Verificar permisos: solo el propietario o admin pueden ver la recomendación
  if (req.usuario.rol !== 'administrador' && recomendacion.usuario_id !== req.usuario.id) {
    throw new ValidationError('No tienes permisos para ver esta recomendación');
  }

  res.json({
    message: 'Recomendación obtenida exitosamente',
    recomendacion
  });
}));

// PUT /recomendaciones/:id - Actualizar recomendación (para calificaciones de usuario)
// Permite actualizar una recomendación existente. Los usuarios pueden calificar y comentar
// sus propias recomendaciones, mientras que los administradores pueden modificar cualquier campo
router.put('/:id', verificarToken, asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { error, value } = actualizarRecomendacionSchema.validate(req.body);
  
  if (error) {
    throw new ValidationError(error.details[0].message);
  }

  // Verificar que la recomendación existe y permisos
  const recomendacionExistente = await query(`
    SELECT usuario_id, estado FROM recomendaciones_ia WHERE id = $1
  `, [id]);

  if (recomendacionExistente.rows.length === 0) {
    throw new NotFoundError('Recomendación no encontrada');
  }

  const recomendacion = recomendacionExistente.rows[0];

  // Los usuarios solo pueden actualizar sus propias recomendaciones (calificaciones)
  // Los administradores pueden actualizar cualquier campo
  if (req.usuario.rol !== 'administrador' && recomendacion.usuario_id !== req.usuario.id) {
    throw new ValidationError('No tienes permisos para actualizar esta recomendación');
  }

  // Si es usuario normal, solo permitir actualizar calificación y comentario
  if (req.usuario.rol !== 'administrador') {
    const camposPermitidos = ['puntuacion_usuario', 'comentario_usuario'];
    const camposProporcionados = Object.keys(value);
    const camposNoPermitidos = camposProporcionados.filter(campo => !camposPermitidos.includes(campo));
    
    if (camposNoPermitidos.length > 0) {
      throw new ValidationError(`No tienes permisos para actualizar los campos: ${camposNoPermitidos.join(', ')}`);
    }
  }

  // Construir query dinámicamente
  const campos = [];
  const valores = [];
  let contador = 1;

  Object.entries(value).forEach(([campo, valor]) => {
    if (valor !== undefined) {
      campos.push(`${campo} = $${contador}`);
      valores.push(valor);
      contador++;
    }
  });

  if (campos.length === 0) {
    throw new ValidationError('No se proporcionaron campos para actualizar');
  }

  valores.push(id);

  const resultado = await query(`
    UPDATE recomendaciones_ia 
    SET ${campos.join(', ')}, fecha_actualizacion = CURRENT_TIMESTAMP
    WHERE id = $${contador}
    RETURNING *
  `, valores);

  logger.info('Recomendación actualizada', {
    recomendacionId: id,
    camposActualizados: Object.keys(value),
    usuarioId: req.usuario.id,
    esAdmin: req.usuario.rol === 'administrador'
  });

  res.json({
    message: 'Recomendación actualizada exitosamente',
    recomendacion: resultado.rows[0]
  });
}));

// GET /recomendaciones/pedido/:pedidoId - Obtener recomendaciones de un pedido específico
// Permite obtener todas las recomendaciones asociadas a un pedido específico
// Solo el propietario del pedido o un administrador pueden acceder
router.get('/pedido/:pedidoId', verificarToken, asyncHandler(async (req, res) => {
  const { pedidoId } = req.params;

  // Verificar que el pedido existe y permisos
  const pedidoResult = await query('SELECT usuario_id FROM pedidos WHERE id = $1', [pedidoId]);
  if (pedidoResult.rows.length === 0) {
    throw new NotFoundError('Pedido no encontrado');
  }

  const pedido = pedidoResult.rows[0];
  if (req.usuario.rol !== 'administrador' && pedido.usuario_id !== req.usuario.id) {
    throw new ValidationError('No tienes permisos para ver las recomendaciones de este pedido');
  }

  const resultado = await query(`
    SELECT * FROM recomendaciones_ia 
    WHERE pedido_id = $1
    ORDER BY fecha_generacion DESC
  `, [pedidoId]);

  res.json({
    message: 'Recomendaciones del pedido obtenidas exitosamente',
    recomendaciones: resultado.rows
  });
}));

// GET /recomendaciones/admin/todas - Listar todas las recomendaciones (solo administradores)
// Permite a los administradores obtener todas las recomendaciones del sistema con paginación
// Incluye filtros por estado y usuario, junto con información detallada de usuarios y pedidos
router.get('/admin/todas', verificarToken, verificarAdmin, asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, estado = '', usuario_id = '' } = req.query;

  const offset = (parseInt(page) - 1) * parseInt(limit);

  let whereClause = 'WHERE 1=1';
  const valores = [];
  let contador = 1;

  if (estado) {
    whereClause += ` AND r.estado = $${contador}`;
    valores.push(estado);
    contador++;
  }

  if (usuario_id) {
    whereClause += ` AND r.usuario_id = $${contador}`;
    valores.push(usuario_id);
    contador++;
  }

  // Obtener total de registros
  const totalResult = await query(`
    SELECT COUNT(*) as total FROM recomendaciones_ia r ${whereClause}
  `, valores);
  
  const total = parseInt(totalResult.rows[0].total);

  // Obtener recomendaciones paginadas
  valores.push(parseInt(limit), offset);
  const resultado = await query(`
    SELECT 
      r.*,
      u.nombre as usuario_nombre,
      u.correo as usuario_correo,
      p.estado as estado_pedido
    FROM recomendaciones_ia r
    JOIN usuarios u ON r.usuario_id = u.id
    LEFT JOIN pedidos p ON r.pedido_id = p.id
    ${whereClause}
    ORDER BY r.fecha_generacion DESC
    LIMIT $${contador} OFFSET $${contador + 1}
  `, valores);

  res.json({
    message: 'Todas las recomendaciones obtenidas exitosamente',
    recomendaciones: resultado.rows,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      pages: Math.ceil(total / parseInt(limit))
    }
  });
}));

// GET /recomendaciones/estadisticas/resumen - Obtener estadísticas de recomendaciones (solo administradores)
// Proporciona estadísticas completas del sistema de recomendaciones incluyendo:
// - Resumen general de estados y calificaciones
// - Análisis por material y estilo más solicitados
// - Tendencias mensuales de uso del sistema
router.get('/estadisticas/resumen', verificarToken, verificarAdmin, asyncHandler(async (req, res) => {
  const estadisticasGenerales = await query(`
    SELECT 
      COUNT(*) as total_recomendaciones,
      COUNT(*) FILTER (WHERE estado = 'completada') as completadas,
      COUNT(*) FILTER (WHERE estado = 'pendiente') as pendientes,
      COUNT(*) FILTER (WHERE estado = 'procesando') as procesando,
      COUNT(*) FILTER (WHERE estado = 'error') as con_error,
      AVG(puntuacion_usuario) FILTER (WHERE puntuacion_usuario IS NOT NULL) as puntuacion_promedio,
      COUNT(*) FILTER (WHERE puntuacion_usuario IS NOT NULL) as total_calificadas
    FROM recomendaciones_ia
  `);

  const porMaterial = await query(`
    SELECT 
      datos_entrada->>'material' as material,
      COUNT(*) as cantidad
    FROM recomendaciones_ia 
    WHERE estado = 'completada'
    GROUP BY datos_entrada->>'material'
    ORDER BY cantidad DESC
    LIMIT 10
  `);

  const porEstilo = await query(`
    SELECT 
      datos_entrada->>'estilo' as estilo,
      COUNT(*) as cantidad
    FROM recomendaciones_ia 
    WHERE estado = 'completada'
    GROUP BY datos_entrada->>'estilo'
    ORDER BY cantidad DESC
    LIMIT 10
  `);

  const tendenciasMensuales = await query(`
    SELECT 
      DATE_TRUNC('month', fecha_generacion) as mes,
      COUNT(*) as total,
      COUNT(*) FILTER (WHERE estado = 'completada') as completadas
    FROM recomendaciones_ia
    WHERE fecha_generacion >= CURRENT_DATE - INTERVAL '12 months'
    GROUP BY DATE_TRUNC('month', fecha_generacion)
    ORDER BY mes DESC
  `);

  res.json({
    message: 'Estadísticas de recomendaciones obtenidas exitosamente',
    estadisticas: {
      resumen_general: estadisticasGenerales.rows[0],
      por_material: porMaterial.rows,
      por_estilo: porEstilo.rows,
      tendencias_mensuales: tendenciasMensuales.rows
    }
  });
}));

// Exportar el router para su uso en la aplicación principal
module.exports = router;