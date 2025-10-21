const express = require('express');
const Joi = require('joi');
const { query } = require('../config/database');
const { verificarToken, verificarAdmin, verificarPropietario } = require('../middleware/auth');
const { asyncHandler, ValidationError, NotFoundError } = require('../middleware/errorHandler');
const { createLogger } = require('../middleware/logger');

const router = express.Router();
const logger = createLogger('notificaciones');

// Esquemas de validación
const enviarNotificacionSchema = Joi.object({
  usuario_id: Joi.number().integer().positive().required(),
  mensaje: Joi.string().min(5).max(500).required().messages({
    'string.min': 'El mensaje debe tener al menos 5 caracteres',
    'string.max': 'El mensaje no puede exceder 500 caracteres',
    'any.required': 'El mensaje es obligatorio'
  }),
  tipo: Joi.string().valid('sistema', 'correo', 'ambos').default('sistema'),
  asunto: Joi.string().max(150).when('tipo', {
    is: Joi.string().valid('correo', 'ambos'),
    then: Joi.required(),
    otherwise: Joi.optional()
  }),
  prioridad: Joi.string().valid('baja', 'normal', 'alta', 'urgente').default('normal'),
  categoria: Joi.string().valid('pedido', 'sistema', 'promocion', 'recordatorio', 'general').default('general'),
  datos_adicionales: Joi.object().optional()
});

const marcarLeidaSchema = Joi.object({
  notificacion_ids: Joi.array().items(Joi.number().integer().positive()).min(1).required()
});

const configurarPreferenciasSchema = Joi.object({
  notificaciones_correo: Joi.boolean().default(true),
  notificaciones_sistema: Joi.boolean().default(true),
  frecuencia_resumen: Joi.string().valid('inmediato', 'diario', 'semanal', 'nunca').default('inmediato'),
  categorias_habilitadas: Joi.array().items(
    Joi.string().valid('pedido', 'sistema', 'promocion', 'recordatorio', 'general')
  ).default(['pedido', 'sistema'])
});

// POST /notificaciones/enviar - Enviar notificación (solo administradores)
router.post('/enviar', verificarToken, verificarAdmin, asyncHandler(async (req, res) => {
  const { error, value } = enviarNotificacionSchema.validate(req.body);
  if (error) {
    throw new ValidationError(error.details[0].message);
  }

  const {
    usuario_id,
    mensaje,
    tipo,
    asunto,
    prioridad,
    categoria,
    datos_adicionales
  } = value;

  // Verificar que el usuario existe
  const usuarioResult = await query(`
    SELECT id, nombre, correo, preferencias_notificaciones FROM usuarios WHERE id = $1
  `, [usuario_id]);

  if (usuarioResult.rows.length === 0) {
    throw new NotFoundError('Usuario no encontrado');
  }

  const usuario = usuarioResult.rows[0];
  const preferencias = usuario.preferencias_notificaciones || {};

  // Verificar preferencias del usuario
  const debeEnviarSistema = preferencias.notificaciones_sistema !== false && 
                           (tipo === 'sistema' || tipo === 'ambos');
  const debeEnviarCorreo = preferencias.notificaciones_correo !== false && 
                          (tipo === 'correo' || tipo === 'ambos');

  // Verificar si la categoría está habilitada
  const categoriasHabilitadas = preferencias.categorias_habilitadas || ['pedido', 'sistema'];
  if (!categoriasHabilitadas.includes(categoria)) {
    return res.json({
      message: 'Notificación no enviada: categoría deshabilitada por el usuario',
      enviada: false,
      razon: 'categoria_deshabilitada'
    });
  }

  let notificacionId = null;
  let correoEnviado = false;

  try {
    // Crear notificación en sistema si corresponde
    if (debeEnviarSistema) {
      const notificacionResult = await query(`
        INSERT INTO notificaciones (
          usuario_id, mensaje, tipo, asunto, prioridad, categoria, 
          datos_adicionales, enviado_por
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING id
      `, [
        usuario_id, mensaje, 'sistema', asunto, prioridad, 
        categoria, JSON.stringify(datos_adicionales), req.usuario.id
      ]);

      notificacionId = notificacionResult.rows[0].id;
    }

    // Enviar correo si corresponde
    if (debeEnviarCorreo) {
      try {
        // Importar el servicio de correo dinámicamente
        const emailService = require('../services/emailService');
        
        await emailService.enviarNotificacion({
          destinatario: usuario.correo,
          nombre: usuario.nombre,
          asunto: asunto || 'Notificación del Sistema',
          mensaje,
          categoria,
          prioridad,
          datos_adicionales
        });

        correoEnviado = true;

        // Crear registro de notificación de correo
        if (tipo === 'correo' || tipo === 'ambos') {
          await query(`
            INSERT INTO notificaciones (
              usuario_id, mensaje, tipo, asunto, prioridad, categoria,
              datos_adicionales, enviado_por, fecha_envio_correo
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, CURRENT_TIMESTAMP)
          `, [
            usuario_id, mensaje, 'correo', asunto, prioridad,
            categoria, JSON.stringify(datos_adicionales), req.usuario.id
          ]);
        }

      } catch (emailError) {
        logger.error('Error al enviar correo de notificación', {
          error: emailError.message,
          usuarioId: usuario_id,
          adminId: req.usuario.id
        });

        // Marcar error en la notificación si existe
        if (notificacionId) {
          await query(`
            UPDATE notificaciones 
            SET error_envio = $1 
            WHERE id = $2
          `, [emailError.message, notificacionId]);
        }
      }
    }

    logger.info('Notificación enviada', {
      notificacionId,
      usuarioId: usuario_id,
      tipo,
      categoria,
      correoEnviado,
      adminId: req.usuario.id
    });

    res.status(201).json({
      message: 'Notificación enviada exitosamente',
      notificacion_id: notificacionId,
      correo_enviado: correoEnviado,
      tipo_enviado: tipo
    });

  } catch (error) {
    logger.error('Error al enviar notificación', {
      error: error.message,
      usuarioId: usuario_id,
      adminId: req.usuario.id
    });

    throw new Error('Error al enviar la notificación');
  }
}));

// GET /notificaciones/usuario/:usuarioId - Obtener notificaciones de un usuario
router.get('/usuario/:usuarioId', verificarToken, verificarPropietario('usuarioId'), asyncHandler(async (req, res) => {
  const { usuarioId } = req.params;
  const { 
    page = 1, 
    limit = 20, 
    leido = '', 
    categoria = '', 
    prioridad = '',
    desde = '',
    hasta = ''
  } = req.query;

  const offset = (parseInt(page) - 1) * parseInt(limit);

  let whereClause = 'WHERE usuario_id = $1';
  const valores = [usuarioId];
  let contador = 2;

  if (leido !== '') {
    whereClause += ` AND leido = $${contador}`;
    valores.push(leido === 'true');
    contador++;
  }

  if (categoria) {
    whereClause += ` AND categoria = $${contador}`;
    valores.push(categoria);
    contador++;
  }

  if (prioridad) {
    whereClause += ` AND prioridad = $${contador}`;
    valores.push(prioridad);
    contador++;
  }

  if (desde) {
    whereClause += ` AND fecha_envio >= $${contador}`;
    valores.push(desde);
    contador++;
  }

  if (hasta) {
    whereClause += ` AND fecha_envio <= $${contador}`;
    valores.push(hasta);
    contador++;
  }

  // Obtener total de registros
  const totalResult = await query(`
    SELECT COUNT(*) as total FROM notificaciones ${whereClause}
  `, valores);
  
  const total = parseInt(totalResult.rows[0].total);

  // Obtener notificaciones no leídas
  const noLeidasResult = await query(`
    SELECT COUNT(*) as no_leidas FROM notificaciones 
    WHERE usuario_id = $1 AND leido = false
  `, [usuarioId]);

  const noLeidas = parseInt(noLeidasResult.rows[0].no_leidas);

  // Obtener notificaciones paginadas
  valores.push(parseInt(limit), offset);
  const resultado = await query(`
    SELECT 
      id, mensaje, tipo, asunto, prioridad, categoria,
      datos_adicionales, leido, fecha_envio, fecha_leido
    FROM notificaciones 
    ${whereClause}
    ORDER BY fecha_envio DESC
    LIMIT $${contador} OFFSET $${contador + 1}
  `, valores);

  res.json({
    message: 'Notificaciones obtenidas exitosamente',
    notificaciones: resultado.rows,
    resumen: {
      total,
      no_leidas: noLeidas,
      leidas: total - noLeidas
    },
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      pages: Math.ceil(total / parseInt(limit))
    }
  });
}));

// POST /notificaciones/marcar-leidas - Marcar notificaciones como leídas
router.post('/marcar-leidas', verificarToken, asyncHandler(async (req, res) => {
  const { error, value } = marcarLeidaSchema.validate(req.body);
  if (error) {
    throw new ValidationError(error.details[0].message);
  }

  const { notificacion_ids } = value;

  // Verificar que todas las notificaciones pertenecen al usuario (excepto admin)
  if (req.usuario.rol !== 'administrador') {
    const verificacionResult = await query(`
      SELECT id FROM notificaciones 
      WHERE id = ANY($1) AND usuario_id != $2
    `, [notificacion_ids, req.usuario.id]);

    if (verificacionResult.rows.length > 0) {
      throw new ValidationError('No tienes permisos para marcar algunas de estas notificaciones');
    }
  }

  // Marcar como leídas
  const resultado = await query(`
    UPDATE notificaciones 
    SET leido = true, fecha_leido = CURRENT_TIMESTAMP
    WHERE id = ANY($1) AND leido = false
    RETURNING id
  `, [notificacion_ids]);

  const marcadas = resultado.rows.length;

  logger.info('Notificaciones marcadas como leídas', {
    cantidad: marcadas,
    notificacionIds: resultado.rows.map(r => r.id),
    usuarioId: req.usuario.id
  });

  res.json({
    message: `${marcadas} notificaciones marcadas como leídas`,
    marcadas
  });
}));

// POST /notificaciones/marcar-todas-leidas - Marcar todas las notificaciones como leídas
router.post('/marcar-todas-leidas', verificarToken, asyncHandler(async (req, res) => {
  const resultado = await query(`
    UPDATE notificaciones 
    SET leido = true, fecha_leido = CURRENT_TIMESTAMP
    WHERE usuario_id = $1 AND leido = false
    RETURNING id
  `, [req.usuario.id]);

  const marcadas = resultado.rows.length;

  logger.info('Todas las notificaciones marcadas como leídas', {
    cantidad: marcadas,
    usuarioId: req.usuario.id
  });

  res.json({
    message: `${marcadas} notificaciones marcadas como leídas`,
    marcadas
  });
}));

// GET /notificaciones/preferencias - Obtener preferencias de notificaciones del usuario
router.get('/preferencias', verificarToken, asyncHandler(async (req, res) => {
  const resultado = await query(`
    SELECT preferencias_notificaciones FROM usuarios WHERE id = $1
  `, [req.usuario.id]);

  const preferencias = resultado.rows[0].preferencias_notificaciones || {
    notificaciones_correo: true,
    notificaciones_sistema: true,
    frecuencia_resumen: 'inmediato',
    categorias_habilitadas: ['pedido', 'sistema']
  };

  res.json({
    message: 'Preferencias de notificaciones obtenidas exitosamente',
    preferencias
  });
}));

// PUT /notificaciones/preferencias - Actualizar preferencias de notificaciones
router.put('/preferencias', verificarToken, asyncHandler(async (req, res) => {
  const { error, value } = configurarPreferenciasSchema.validate(req.body);
  if (error) {
    throw new ValidationError(error.details[0].message);
  }

  await query(`
    UPDATE usuarios 
    SET preferencias_notificaciones = $1
    WHERE id = $2
  `, [JSON.stringify(value), req.usuario.id]);

  logger.info('Preferencias de notificaciones actualizadas', {
    usuarioId: req.usuario.id,
    nuevasPreferencias: value
  });

  res.json({
    message: 'Preferencias de notificaciones actualizadas exitosamente',
    preferencias: value
  });
}));

// POST /notificaciones/automatica/pedido - Enviar notificación automática por cambio de estado de pedido
router.post('/automatica/pedido', verificarToken, verificarAdmin, asyncHandler(async (req, res) => {
  const { pedido_id, nuevo_estado, estado_anterior } = req.body;

  if (!pedido_id || !nuevo_estado) {
    throw new ValidationError('pedido_id y nuevo_estado son obligatorios');
  }

  // Obtener información del pedido y usuario
  const pedidoResult = await query(`
    SELECT p.id, p.usuario_id, p.estado, u.nombre, u.correo
    FROM pedidos p
    JOIN usuarios u ON p.usuario_id = u.id
    WHERE p.id = $1
  `, [pedido_id]);

  if (pedidoResult.rows.length === 0) {
    throw new NotFoundError('Pedido no encontrado');
  }

  const pedido = pedidoResult.rows[0];

  // Generar mensaje según el estado
  const mensajes = {
    'en_cotizacion': 'Tu pedido está siendo cotizado. Te notificaremos cuando esté listo.',
    'aprobado': 'Tu pedido ha sido aprobado y pasará a producción.',
    'en_produccion': 'Tu pedido está en producción. Pronto estará listo.',
    'entregado': 'Tu pedido ha sido entregado. ¡Esperamos que lo disfrutes!'
  };

  const mensaje = mensajes[nuevo_estado] || `El estado de tu pedido ha cambiado a: ${nuevo_estado}`;
  const asunto = `Actualización de tu pedido #${pedido_id}`;

  try {
    // Enviar notificación automática
    await query(`
      INSERT INTO notificaciones (
        usuario_id, mensaje, tipo, asunto, prioridad, categoria,
        datos_adicionales, enviado_por
      )
      VALUES ($1, $2, 'sistema', $3, 'normal', 'pedido', $4, $5)
    `, [
      pedido.usuario_id,
      mensaje,
      asunto,
      JSON.stringify({
        pedido_id,
        nuevo_estado,
        estado_anterior,
        automatica: true
      }),
      req.usuario.id
    ]);

    // Intentar enviar correo también
    try {
      const emailService = require('../services/emailService');
      
      await emailService.enviarNotificacionPedido({
        destinatario: pedido.correo,
        nombre: pedido.nombre,
        pedidoId: pedido_id,
        nuevoEstado: nuevo_estado,
        estadoAnterior: estado_anterior
      });

    } catch (emailError) {
      logger.error('Error al enviar correo automático de pedido', {
        error: emailError.message,
        pedidoId: pedido_id,
        usuarioId: pedido.usuario_id
      });
    }

    logger.info('Notificación automática de pedido enviada', {
      pedidoId: pedido_id,
      usuarioId: pedido.usuario_id,
      nuevoEstado: nuevo_estado,
      adminId: req.usuario.id
    });

    res.json({
      message: 'Notificación automática enviada exitosamente',
      pedido_id,
      nuevo_estado,
      usuario_notificado: pedido.usuario_id
    });

  } catch (error) {
    logger.error('Error al enviar notificación automática de pedido', {
      error: error.message,
      pedidoId: pedido_id,
      usuarioId: pedido.usuario_id
    });

    throw new Error('Error al enviar la notificación automática');
  }
}));

// GET /notificaciones/admin/todas - Listar todas las notificaciones (solo administradores)
router.get('/admin/todas', verificarToken, verificarAdmin, asyncHandler(async (req, res) => {
  const { 
    page = 1, 
    limit = 50, 
    usuario_id = '', 
    categoria = '', 
    prioridad = '',
    tipo = '',
    desde = '',
    hasta = ''
  } = req.query;

  const offset = (parseInt(page) - 1) * parseInt(limit);

  let whereClause = 'WHERE 1=1';
  const valores = [];
  let contador = 1;

  if (usuario_id) {
    whereClause += ` AND n.usuario_id = $${contador}`;
    valores.push(usuario_id);
    contador++;
  }

  if (categoria) {
    whereClause += ` AND n.categoria = $${contador}`;
    valores.push(categoria);
    contador++;
  }

  if (prioridad) {
    whereClause += ` AND n.prioridad = $${contador}`;
    valores.push(prioridad);
    contador++;
  }

  if (tipo) {
    whereClause += ` AND n.tipo = $${contador}`;
    valores.push(tipo);
    contador++;
  }

  if (desde) {
    whereClause += ` AND n.fecha_envio >= $${contador}`;
    valores.push(desde);
    contador++;
  }

  if (hasta) {
    whereClause += ` AND n.fecha_envio <= $${contador}`;
    valores.push(hasta);
    contador++;
  }

  // Obtener total de registros
  const totalResult = await query(`
    SELECT COUNT(*) as total FROM notificaciones n ${whereClause}
  `, valores);
  
  const total = parseInt(totalResult.rows[0].total);

  // Obtener notificaciones paginadas
  valores.push(parseInt(limit), offset);
  const resultado = await query(`
    SELECT 
      n.*,
      u.nombre as usuario_nombre,
      u.correo as usuario_correo,
      admin.nombre as enviado_por_nombre
    FROM notificaciones n
    JOIN usuarios u ON n.usuario_id = u.id
    LEFT JOIN usuarios admin ON n.enviado_por = admin.id
    ${whereClause}
    ORDER BY n.fecha_envio DESC
    LIMIT $${contador} OFFSET $${contador + 1}
  `, valores);

  res.json({
    message: 'Todas las notificaciones obtenidas exitosamente',
    notificaciones: resultado.rows,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      pages: Math.ceil(total / parseInt(limit))
    }
  });
}));

// GET /notificaciones/estadisticas/resumen - Obtener estadísticas de notificaciones (solo administradores)
router.get('/estadisticas/resumen', verificarToken, verificarAdmin, asyncHandler(async (req, res) => {
  const estadisticasGenerales = await query(`
    SELECT 
      COUNT(*) as total_notificaciones,
      COUNT(*) FILTER (WHERE leido = true) as leidas,
      COUNT(*) FILTER (WHERE leido = false) as no_leidas,
      COUNT(*) FILTER (WHERE tipo = 'sistema') as tipo_sistema,
      COUNT(*) FILTER (WHERE tipo = 'correo') as tipo_correo,
      COUNT(*) FILTER (WHERE error_envio IS NOT NULL) as con_errores
    FROM notificaciones
  `);

  const porCategoria = await query(`
    SELECT 
      categoria,
      COUNT(*) as cantidad,
      COUNT(*) FILTER (WHERE leido = true) as leidas
    FROM notificaciones
    GROUP BY categoria
    ORDER BY cantidad DESC
  `);

  const porPrioridad = await query(`
    SELECT 
      prioridad,
      COUNT(*) as cantidad
    FROM notificaciones
    GROUP BY prioridad
    ORDER BY 
      CASE prioridad 
        WHEN 'urgente' THEN 1
        WHEN 'alta' THEN 2
        WHEN 'normal' THEN 3
        WHEN 'baja' THEN 4
      END
  `);

  const tendenciasDiarias = await query(`
    SELECT 
      DATE(fecha_envio) as fecha,
      COUNT(*) as total,
      COUNT(*) FILTER (WHERE leido = true) as leidas
    FROM notificaciones
    WHERE fecha_envio >= CURRENT_DATE - INTERVAL '30 days'
    GROUP BY DATE(fecha_envio)
    ORDER BY fecha DESC
  `);

  res.json({
    message: 'Estadísticas de notificaciones obtenidas exitosamente',
    estadisticas: {
      resumen_general: estadisticasGenerales.rows[0],
      por_categoria: porCategoria.rows,
      por_prioridad: porPrioridad.rows,
      tendencias_diarias: tendenciasDiarias.rows
    }
  });
}));

module.exports = router;