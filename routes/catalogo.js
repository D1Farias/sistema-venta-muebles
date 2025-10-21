// Importaciones necesarias para el módulo de gestión del catálogo de productos
const express = require('express');
const Joi = require('joi'); // Para validación de datos de entrada
const { query } = require('../config/database'); // Función para consultas de base de datos
const { verificarToken, verificarAdmin, tokenOpcional } = require('../middleware/auth'); // Middleware de autenticación y autorización
const { asyncHandler, ValidationError, NotFoundError } = require('../middleware/errorHandler'); // Manejo de errores
const { createLogger } = require('../middleware/logger'); // Sistema de logging

// Inicialización del router de Express y logger específico para catálogo
const router = express.Router();
const logger = createLogger('catalogo');

// Esquemas de validación con Joi para diferentes operaciones

// Esquema para validar la creación de un nuevo producto en el catálogo
const crearProductoSchema = Joi.object({
  nombre: Joi.string().min(2).max(150).required().messages({
    'string.min': 'El nombre debe tener al menos 2 caracteres',
    'string.max': 'El nombre no puede exceder 150 caracteres',
    'any.required': 'El nombre es obligatorio'
  }),
  tipo: Joi.string().min(2).max(50).required().messages({
    'string.min': 'El tipo debe tener al menos 2 caracteres',
    'string.max': 'El tipo no puede exceder 50 caracteres',
    'any.required': 'El tipo es obligatorio'
  }),
  imagen_url: Joi.string().uri().max(500).optional(),
  precio_base: Joi.number().precision(2).min(0).required().messages({
    'number.min': 'El precio base debe ser mayor o igual a 0',
    'any.required': 'El precio base es obligatorio'
  }),
  estilo: Joi.string().max(50).optional(),
  dimensiones: Joi.string().max(200).optional(),
  descripcion: Joi.string().max(1000).optional(),
  materiales_disponibles: Joi.array().items(Joi.string().max(50)).optional(),
  colores_disponibles: Joi.array().items(Joi.string().max(30)).optional(),
  activo: Joi.boolean().default(true)
});

// Esquema para validar la actualización de un producto existente
const actualizarProductoSchema = Joi.object({
  nombre: Joi.string().min(2).max(150).optional(),
  tipo: Joi.string().min(2).max(50).optional(),
  imagen_url: Joi.string().uri().max(500).optional().allow(''),
  precio_base: Joi.number().precision(2).min(0).optional(),
  estilo: Joi.string().max(50).optional().allow(''),
  dimensiones: Joi.string().max(200).optional().allow(''),
  descripcion: Joi.string().max(1000).optional().allow(''),
  materiales_disponibles: Joi.array().items(Joi.string().max(50)).optional(),
  colores_disponibles: Joi.array().items(Joi.string().max(30)).optional(),
  activo: Joi.boolean().optional()
});

/**
 * GET /catalogo - Listar productos del catálogo (público con token opcional)
 * Permite ver productos del catálogo con filtros avanzados y paginación
 * Los usuarios no autenticados solo ven productos activos
 */
router.get('/', tokenOpcional, asyncHandler(async (req, res) => {
  const { 
    page = 1, 
    limit = 12, 
    search = '', 
    tipo = '', 
    estilo = '',
    precio_min = '',
    precio_max = '',
    materiales = '',
    colores = '',
    activo = 'true' // Por defecto solo mostrar productos activos
  } = req.query;

  const offset = (parseInt(page) - 1) * parseInt(limit);
  
  // Construir filtros dinámicamente basados en los parámetros de consulta
  let whereClause = 'WHERE 1=1';
  const valores = [];
  let contador = 1;

  // Control de visibilidad: solo los administradores pueden ver productos inactivos
  if (req.usuario?.rol !== 'administrador') {
    whereClause += ' AND activo = true';
  } else if (activo !== '') {
    whereClause += ` AND activo = $${contador}`;
    valores.push(activo === 'true');
    contador++;
  }

  // Filtro de búsqueda por texto en nombre, descripción o tipo
  if (search) {
    whereClause += ` AND (nombre ILIKE $${contador} OR descripcion ILIKE $${contador} OR tipo ILIKE $${contador})`;
    valores.push(`%${search}%`);
    contador++;
  }

  // Filtro por tipo de producto
  if (tipo) {
    whereClause += ` AND tipo ILIKE $${contador}`;
    valores.push(`%${tipo}%`);
    contador++;
  }

  // Filtro por estilo de producto
  if (estilo) {
    whereClause += ` AND estilo ILIKE $${contador}`;
    valores.push(`%${estilo}%`);
    contador++;
  }

  // Filtro por precio mínimo
  if (precio_min) {
    whereClause += ` AND precio_base >= $${contador}`;
    valores.push(parseFloat(precio_min));
    contador++;
  }

  // Filtro por precio máximo
  if (precio_max) {
    whereClause += ` AND precio_base <= $${contador}`;
    valores.push(parseFloat(precio_max));
    contador++;
  }

  // Filtro por materiales disponibles (usando operador de arrays de PostgreSQL)
  if (materiales) {
    const materialesArray = materiales.split(',').map(m => m.trim());
    whereClause += ` AND materiales_disponibles && $${contador}`;
    valores.push(materialesArray);
    contador++;
  }

  // Filtro por colores disponibles (usando operador de arrays de PostgreSQL)
  if (colores) {
    const coloresArray = colores.split(',').map(c => c.trim());
    whereClause += ` AND colores_disponibles && $${contador}`;
    valores.push(coloresArray);
    contador++;
  }

  // Obtener el total de registros que coinciden con los filtros
  const totalResult = await query(`
    SELECT COUNT(*) as total FROM catalogo ${whereClause}
  `, valores);
  
  const total = parseInt(totalResult.rows[0].total);

  // Obtener productos paginados con todos los campos necesarios
  valores.push(parseInt(limit), offset);
  const resultado = await query(`
    SELECT 
      id, nombre, tipo, imagen_url, precio_base, estilo, dimensiones,
      descripcion, materiales_disponibles, colores_disponibles, activo,
      fecha_creacion
    FROM catalogo 
    ${whereClause}
    ORDER BY fecha_creacion DESC
    LIMIT $${contador} OFFSET $${contador + 1}
  `, valores);

  res.json({
    message: 'Catálogo obtenido exitosamente',
    productos: resultado.rows,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      pages: Math.ceil(total / parseInt(limit))
    },
    filtros_aplicados: {
      search, tipo, estilo, precio_min, precio_max, materiales, colores
    }
  });
}));

/**
 * GET /catalogo/:id - Obtener producto específico del catálogo
 * Permite ver detalles completos de un producto específico
 * Los usuarios no autenticados solo pueden ver productos activos
 */
router.get('/:id', tokenOpcional, asyncHandler(async (req, res) => {
  const { id } = req.params;

  let whereClause = 'WHERE id = $1';
  const valores = [id];

  // Control de visibilidad: solo los administradores pueden ver productos inactivos
  if (req.usuario?.rol !== 'administrador') {
    whereClause += ' AND activo = true';
  }

  const resultado = await query(`
    SELECT * FROM catalogo ${whereClause}
  `, valores);

  if (resultado.rows.length === 0) {
    throw new NotFoundError('Producto no encontrado en el catálogo');
  }

  res.json({
    message: 'Producto obtenido exitosamente',
    producto: resultado.rows[0]
  });
}));

/**
 * POST /catalogo - Crear nuevo producto en el catálogo (solo administradores)
 * Permite a los administradores agregar nuevos productos al catálogo
 */
router.post('/', verificarToken, verificarAdmin, asyncHandler(async (req, res) => {
  // Validar datos de entrada usando el esquema de Joi
  const { error, value } = crearProductoSchema.validate(req.body);
  if (error) {
    throw new ValidationError(error.details[0].message);
  }

  const {
    nombre, tipo, imagen_url, precio_base, estilo, dimensiones,
    descripcion, materiales_disponibles, colores_disponibles, activo
  } = value;

  // Insertar el nuevo producto en la base de datos
  const resultado = await query(`
    INSERT INTO catalogo (
      nombre, tipo, imagen_url, precio_base, estilo, dimensiones,
      descripcion, materiales_disponibles, colores_disponibles, activo
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
    RETURNING *
  `, [
    nombre, tipo, imagen_url, precio_base, estilo, dimensiones,
    descripcion, materiales_disponibles, colores_disponibles, activo
  ]);

  const nuevoProducto = resultado.rows[0];

  // Registrar la creación del producto en los logs
  logger.info('Nuevo producto creado en catálogo', {
    productoId: nuevoProducto.id,
    nombre: nuevoProducto.nombre,
    tipo: nuevoProducto.tipo,
    adminId: req.usuario.id
  });

  res.status(201).json({
    message: 'Producto creado exitosamente en el catálogo',
    producto: nuevoProducto
  });
}));

/**
 * PUT /catalogo/:id - Actualizar producto del catálogo (solo administradores)
 * Permite a los administradores modificar productos existentes en el catálogo
 */
router.put('/:id', verificarToken, verificarAdmin, asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { error, value } = actualizarProductoSchema.validate(req.body);
  
  if (error) {
    throw new ValidationError(error.details[0].message);
  }

  // Verificar que el producto existe antes de intentar actualizarlo
  const productoExistente = await query('SELECT id FROM catalogo WHERE id = $1', [id]);
  if (productoExistente.rows.length === 0) {
    throw new NotFoundError('Producto no encontrado en el catálogo');
  }

  // Construir query dinámicamente para actualizar solo los campos proporcionados
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

  // Ejecutar la actualización en la base de datos
  const resultado = await query(`
    UPDATE catalogo 
    SET ${campos.join(', ')}
    WHERE id = $${contador}
    RETURNING *
  `, valores);

  const productoActualizado = resultado.rows[0];

  // Registrar la actualización del producto en los logs
  logger.info('Producto actualizado en catálogo', {
    productoId: id,
    camposActualizados: Object.keys(value),
    adminId: req.usuario.id
  });

  res.json({
    message: 'Producto actualizado exitosamente',
    producto: productoActualizado
  });
}));

/**
 * DELETE /catalogo/:id - Eliminar producto del catálogo (solo administradores)
 * En lugar de eliminar físicamente, desactiva el producto para mantener integridad referencial
 */
router.delete('/:id', verificarToken, verificarAdmin, asyncHandler(async (req, res) => {
  const { id } = req.params;

  // Verificar que el producto existe antes de intentar desactivarlo
  const productoExistente = await query('SELECT id, nombre FROM catalogo WHERE id = $1', [id]);
  if (productoExistente.rows.length === 0) {
    throw new NotFoundError('Producto no encontrado en el catálogo');
  }

  // Desactivar el producto en lugar de eliminarlo físicamente
  // Esto mantiene la integridad referencial con pedidos existentes
  await query('UPDATE catalogo SET activo = false WHERE id = $1', [id]);

  // Registrar la desactivación del producto en los logs
  logger.info('Producto desactivado en catálogo', {
    productoId: id,
    nombre: productoExistente.rows[0].nombre,
    adminId: req.usuario.id
  });

  res.json({
    message: 'Producto desactivado exitosamente del catálogo'
  });
}));

/**
 * POST /catalogo/:id/activar - Reactivar producto del catálogo (solo administradores)
 * Permite reactivar productos que fueron previamente desactivados
 */
router.post('/:id/activar', verificarToken, verificarAdmin, asyncHandler(async (req, res) => {
  const { id } = req.params;

  // Verificar que el producto existe y obtener su estado actual
  const productoExistente = await query('SELECT id, nombre, activo FROM catalogo WHERE id = $1', [id]);
  if (productoExistente.rows.length === 0) {
    throw new NotFoundError('Producto no encontrado en el catálogo');
  }

  // Verificar que el producto no esté ya activo
  if (productoExistente.rows[0].activo) {
    throw new ValidationError('El producto ya está activo');
  }

  // Reactivar el producto
  await query('UPDATE catalogo SET activo = true WHERE id = $1', [id]);

  // Registrar la reactivación del producto en los logs
  logger.info('Producto reactivado en catálogo', {
    productoId: id,
    nombre: productoExistente.rows[0].nombre,
    adminId: req.usuario.id
  });

  res.json({
    message: 'Producto reactivado exitosamente en el catálogo'
  });
}));

/**
 * GET /catalogo/filtros/opciones - Obtener opciones disponibles para filtros
 * Proporciona todas las opciones únicas disponibles para filtrar el catálogo
 * Endpoint público para construir interfaces de filtrado dinámicas
 */
router.get('/filtros/opciones', asyncHandler(async (req, res) => {
  // Obtener todos los tipos únicos de productos activos
  const tiposResult = await query(`
    SELECT DISTINCT tipo FROM catalogo WHERE activo = true ORDER BY tipo
  `);

  // Obtener todos los estilos únicos de productos activos
  const estilosResult = await query(`
    SELECT DISTINCT estilo FROM catalogo WHERE activo = true AND estilo IS NOT NULL ORDER BY estilo
  `);

  // Obtener el rango de precios de productos activos
  const preciosResult = await query(`
    SELECT MIN(precio_base) as precio_min, MAX(precio_base) as precio_max FROM catalogo WHERE activo = true
  `);

  // Obtener todos los materiales únicos disponibles (usando UNNEST para arrays)
  const materialesResult = await query(`
    SELECT DISTINCT UNNEST(materiales_disponibles) as material 
    FROM catalogo 
    WHERE activo = true AND materiales_disponibles IS NOT NULL
    ORDER BY material
  `);

  // Obtener todos los colores únicos disponibles (usando UNNEST para arrays)
  const coloresResult = await query(`
    SELECT DISTINCT UNNEST(colores_disponibles) as color 
    FROM catalogo 
    WHERE activo = true AND colores_disponibles IS NOT NULL
    ORDER BY color
  `);

  res.json({
    message: 'Opciones de filtros obtenidas exitosamente',
    filtros: {
      tipos: tiposResult.rows.map(row => row.tipo),
      estilos: estilosResult.rows.map(row => row.estilo),
      rango_precios: preciosResult.rows[0],
      materiales: materialesResult.rows.map(row => row.material),
      colores: coloresResult.rows.map(row => row.color)
    }
  });
}));

/**
 * GET /catalogo/estadisticas/resumen - Obtener estadísticas del catálogo (solo administradores)
 * Proporciona un resumen estadístico completo del catálogo para análisis de negocio
 */
router.get('/estadisticas/resumen', verificarToken, verificarAdmin, asyncHandler(async (req, res) => {
  // Obtener estadísticas generales del catálogo
  const estadisticas = await query(`
    SELECT 
      COUNT(*) as total_productos,
      COUNT(*) FILTER (WHERE activo = true) as productos_activos,
      COUNT(*) FILTER (WHERE activo = false) as productos_inactivos,
      AVG(precio_base) as precio_promedio,
      MIN(precio_base) as precio_minimo,
      MAX(precio_base) as precio_maximo
    FROM catalogo
  `);

  // Obtener estadísticas agrupadas por tipo de producto
  const porTipo = await query(`
    SELECT 
      tipo,
      COUNT(*) as cantidad,
      AVG(precio_base) as precio_promedio
    FROM catalogo 
    WHERE activo = true
    GROUP BY tipo
    ORDER BY cantidad DESC
  `);

  // Obtener estadísticas agrupadas por estilo de producto
  const porEstilo = await query(`
    SELECT 
      estilo,
      COUNT(*) as cantidad
    FROM catalogo 
    WHERE activo = true AND estilo IS NOT NULL
    GROUP BY estilo
    ORDER BY cantidad DESC
  `);

  res.json({
    message: 'Estadísticas del catálogo obtenidas exitosamente',
    estadisticas: {
      resumen_general: estadisticas.rows[0],
      por_tipo: porTipo.rows,
      por_estilo: porEstilo.rows
    }
  });
}));

// Exportar el router para uso en el servidor principal
module.exports = router;