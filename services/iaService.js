/**
 * SERVICIO DE INTELIGENCIA ARTIFICIAL
 * 
 * Este servicio maneja la generación de recomendaciones personalizadas de muebles
 * utilizando diferentes proveedores de IA (Hugging Face, Replicate, OpenAI) o
 * algoritmos simulados cuando no hay APIs externas disponibles.
 * 
 * Funcionalidades principales:
 * - Generación de recomendaciones basadas en parámetros del usuario
 * - Integración con múltiples proveedores de IA
 * - Sistema de fallback con recomendaciones simuladas
 * - Cálculo de estimaciones de precio, tiempo y características técnicas
 * - Generación de contenido descriptivo y visual
 */

const axios = require('axios');                    // Cliente HTTP para APIs externas
const { createLogger } = require('../middleware/logger'); // Sistema de logging

const logger = createLogger('iaService');

class IAService {
  /**
   * Constructor del servicio de IA
   * Inicializa la configuración de proveedores y datos de referencia
   */
  constructor() {
    // Configuración de API externa desde variables de entorno
    this.apiKey = process.env.IA_API_KEY;           // Clave de API para servicios externos
    this.apiUrl = process.env.IA_API_URL;           // URL base del proveedor de IA
    this.isExternalAPIEnabled = !!(this.apiKey && this.apiUrl); // Flag de disponibilidad de API externa
    
    // Configuración para diferentes proveedores de IA
    this.providers = {
      // Configuración para Hugging Face (modelos de lenguaje gratuitos)
      huggingface: {
        baseUrl: 'https://api-inference.huggingface.co/models',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        }
      },
      // Configuración para Replicate (modelos especializados)
      replicate: {
        baseUrl: 'https://api.replicate.com/v1',
        headers: {
          'Authorization': `Token ${this.apiKey}`,
          'Content-Type': 'application/json'
        }
      },
      // Configuración para OpenAI (GPT y modelos premium)
      openai: {
        baseUrl: 'https://api.openai.com/v1',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        }
      }
    };

    // ========================================================================
    // DATOS DE REFERENCIA PARA RECOMENDACIONES SIMULADAS
    // ========================================================================

    // Tipos de muebles disponibles para recomendaciones
    this.tiposMuebles = [
      'Mesa de comedor', 'Silla', 'Sofá', 'Cama', 'Escritorio', 'Estantería',
      'Mesa de centro', 'Armario', 'Cómoda', 'Sillón', 'Mesa auxiliar', 'Banco'
    ];

    // Estilos de diseño soportados
    this.estilosDisponibles = [
      'Moderno', 'Clásico', 'Industrial', 'Rústico', 'Minimalista', 
      'Escandinavo', 'Vintage', 'Contemporáneo', 'Art Deco', 'Bohemio'
    ];

    // Materiales comunes para fabricación
    this.materialesComunes = [
      'Madera de roble', 'Madera de pino', 'MDF', 'Metal', 'Vidrio',
      'Cuero', 'Tela', 'Mármol', 'Acero inoxidable', 'Bambú'
    ];

    // Paleta de colores populares
    this.coloresPopulares = [
      'Blanco', 'Negro', 'Marrón', 'Gris', 'Beige', 'Azul marino',
      'Verde oliva', 'Rojo burdeos', 'Amarillo mostaza', 'Rosa pálido'
    ];
  }

  // ============================================================================
  // MÉTODOS PRINCIPALES DE GENERACIÓN DE RECOMENDACIONES
  // ============================================================================

  /**
   * Método principal para generar recomendaciones de muebles personalizados
   * Intenta usar APIs externas de IA y recurre a algoritmos simulados como fallback
   * @param {Object} parametros - Parámetros de especificación del mueble
   * @param {Object} parametros.medidas - Dimensiones (largo, ancho, alto, unidad)
   * @param {string} parametros.material - Material principal deseado
   * @param {string} parametros.color - Color principal
   * @param {string} parametros.estilo - Estilo de diseño
   * @param {string} parametros.tipo_mueble - Tipo específico de mueble
   * @param {number} parametros.presupuesto_estimado - Presupuesto aproximado
   * @param {string} parametros.descripcion_adicional - Requisitos especiales
   * @returns {Object} Recomendación completa con especificaciones técnicas y estimaciones
   */
  async generarRecomendacion(parametros) {
    try {
      logger.info('Generando recomendación de IA', {
        material: parametros.material,
        color: parametros.color,
        estilo: parametros.estilo,
        tipoMueble: parametros.tipo_mueble
      });

      // Si hay API externa configurada, intentar usarla
      if (this.isExternalAPIEnabled) {
        try {
          const recomendacionExterna = await this.generarRecomendacionExterna(parametros);
          if (recomendacionExterna) {
            return recomendacionExterna;
          }
        } catch (error) {
          logger.warn('Error con API externa, usando recomendación simulada', {
            error: error.message
          });
        }
      }

      // Generar recomendación simulada
      return this.generarRecomendacionSimulada(parametros);

    } catch (error) {
      logger.error('Error al generar recomendación', {
        error: error.message,
        parametros
      });
      throw new Error('Error al generar la recomendación de IA');
    }
  }

  /**
   * Genera recomendación utilizando APIs externas de IA
   * Detecta automáticamente el proveedor basado en la URL configurada
   * @param {Object} parametros - Parámetros de especificación del mueble
   * @returns {Object} Recomendación generada por IA externa
   * @throws {Error} Si el proveedor no es soportado o hay errores de API
   */
  async generarRecomendacionExterna(parametros) {
    try {
      const prompt = this.construirPrompt(parametros);
      
      // Ejemplo para Hugging Face
      if (this.apiUrl.includes('huggingface')) {
        return await this.generarConHuggingFace(prompt, parametros);
      }
      
      // Ejemplo para Replicate
      if (this.apiUrl.includes('replicate')) {
        return await this.generarConReplicate(prompt, parametros);
      }
      
      // Ejemplo para OpenAI
      if (this.apiUrl.includes('openai')) {
        return await this.generarConOpenAI(prompt, parametros);
      }

      throw new Error('Proveedor de IA no soportado');

    } catch (error) {
      logger.error('Error en API externa de IA', {
        error: error.message,
        provider: this.detectarProveedor()
      });
      throw error;
    }
  }

  /**
   * Construye el prompt para la IA basado en los parámetros
   * @param {Object} parametros - Parámetros del mueble
   * @returns {string} Prompt construido
   */
  construirPrompt(parametros) {
    const { medidas, material, color, estilo, tipo_mueble, presupuesto_estimado, descripcion_adicional } = parametros;
    
    let prompt = `Diseña un mueble personalizado con las siguientes especificaciones:
    
Tipo: ${tipo_mueble || 'Mueble personalizado'}
Dimensiones: ${medidas.largo}x${medidas.ancho}x${medidas.alto} ${medidas.unidad}
Material: ${material}
Color: ${color}
Estilo: ${estilo}`;

    if (presupuesto_estimado) {
      prompt += `\nPresupuesto estimado: $${presupuesto_estimado}`;
    }

    if (descripcion_adicional) {
      prompt += `\nDescripción adicional: ${descripcion_adicional}`;
    }

    prompt += `\n\nProporciona una recomendación detallada que incluya:
1. Descripción del diseño
2. Características técnicas
3. Proceso de fabricación sugerido
4. Estimación de tiempo de producción
5. Recomendaciones de acabado`;

    return prompt;
  }

  /**
   * Genera recomendación usando Hugging Face
   * @param {string} prompt - Prompt para la IA
   * @param {Object} parametros - Parámetros originales
   * @returns {Object} Recomendación generada
   */
  async generarConHuggingFace(prompt, parametros) {
    const response = await axios.post(
      `${this.providers.huggingface.baseUrl}/microsoft/DialoGPT-large`,
      {
        inputs: prompt,
        parameters: {
          max_length: 500,
          temperature: 0.7,
          do_sample: true
        }
      },
      { headers: this.providers.huggingface.headers }
    );

    return this.procesarRespuestaIA(response.data, parametros);
  }

  /**
   * Genera recomendación usando Replicate
   * @param {string} prompt - Prompt para la IA
   * @param {Object} parametros - Parámetros originales
   * @returns {Object} Recomendación generada
   */
  async generarConReplicate(prompt, parametros) {
    const response = await axios.post(
      `${this.providers.replicate.baseUrl}/predictions`,
      {
        version: "modelo-version-id",
        input: {
          prompt: prompt,
          max_tokens: 500,
          temperature: 0.7
        }
      },
      { headers: this.providers.replicate.headers }
    );

    return this.procesarRespuestaIA(response.data, parametros);
  }

  /**
   * Genera recomendación usando OpenAI
   * @param {string} prompt - Prompt para la IA
   * @param {Object} parametros - Parámetros originales
   * @returns {Object} Recomendación generada
   */
  async generarConOpenAI(prompt, parametros) {
    const response = await axios.post(
      `${this.providers.openai.baseUrl}/chat/completions`,
      {
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content: "Eres un experto diseñador de muebles personalizados. Proporciona recomendaciones detalladas y profesionales."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        max_tokens: 500,
        temperature: 0.7
      },
      { headers: this.providers.openai.headers }
    );

    return this.procesarRespuestaIA(response.data.choices[0].message.content, parametros);
  }

  /**
   * Genera recomendación simulada cuando no hay API externa
   * @param {Object} parametros - Parámetros para la recomendación
   * @returns {Object} Recomendación simulada
   */
  generarRecomendacionSimulada(parametros) {
    const { medidas, material, color, estilo, tipo_mueble, presupuesto_estimado } = parametros;
    
    // Generar recomendación basada en reglas
    const tipoRecomendado = tipo_mueble || this.seleccionarTipoOptimo(medidas);
    const materialesCompatibles = this.obtenerMaterialesCompatibles(material, estilo);
    const coloresComplementarios = this.obtenerColoresComplementarios(color);
    
    // Calcular estimaciones
    const volumen = medidas.largo * medidas.ancho * medidas.alto;
    const complejidad = this.calcularComplejidad(parametros);
    const tiempoEstimado = this.calcularTiempoProduccion(volumen, complejidad);
    const precioEstimado = this.calcularPrecioEstimado(volumen, material, complejidad);

    const recomendacion = {
      texto: this.generarTextoRecomendacion(parametros, tipoRecomendado, materialesCompatibles),
      imagen_url: this.generarURLImagenSimulada(parametros),
      productos_sugeridos: this.obtenerProductosSimilares(parametros),
      estimacion_precio: {
        minimo: Math.round(precioEstimado * 0.8),
        maximo: Math.round(precioEstimado * 1.2),
        promedio: precioEstimado
      },
      tiempo_estimado: {
        dias_minimo: Math.round(tiempoEstimado * 0.8),
        dias_maximo: Math.round(tiempoEstimado * 1.3),
        dias_promedio: tiempoEstimado
      },
      caracteristicas_tecnicas: {
        volumen_m3: (volumen / 1000000).toFixed(3),
        peso_estimado_kg: this.calcularPesoEstimado(volumen, material),
        nivel_complejidad: complejidad,
        materiales_recomendados: materialesCompatibles,
        colores_complementarios: coloresComplementarios
      },
      proceso_fabricacion: this.generarProcesoFabricacion(parametros),
      recomendaciones_adicionales: this.generarRecomendacionesAdicionales(parametros)
    };

    logger.info('Recomendación simulada generada exitosamente', {
      tipo: tipoRecomendado,
      precio: precioEstimado,
      tiempo: tiempoEstimado
    });

    return recomendacion;
  }

  /**
   * Procesa la respuesta de la IA externa y la estructura
   * @param {string|Object} respuestaIA - Respuesta de la API de IA
   * @param {Object} parametros - Parámetros originales
   * @returns {Object} Recomendación estructurada
   */
  procesarRespuestaIA(respuestaIA, parametros) {
    let textoRecomendacion;
    
    if (typeof respuestaIA === 'string') {
      textoRecomendacion = respuestaIA;
    } else if (respuestaIA.generated_text) {
      textoRecomendacion = respuestaIA.generated_text;
    } else {
      textoRecomendacion = JSON.stringify(respuestaIA);
    }

    // Combinar respuesta de IA con datos calculados
    const recomendacionSimulada = this.generarRecomendacionSimulada(parametros);
    
    return {
      ...recomendacionSimulada,
      texto: textoRecomendacion,
      fuente: 'ia_externa'
    };
  }

  // Métodos auxiliares para la generación simulada

  seleccionarTipoOptimo(medidas) {
    const volumen = medidas.largo * medidas.ancho * medidas.alto;
    
    if (medidas.alto < 50) return 'Mesa';
    if (medidas.alto > 180) return 'Estantería';
    if (volumen > 500000) return 'Armario';
    if (medidas.largo > medidas.ancho * 2) return 'Banco';
    
    return this.tiposMuebles[Math.floor(Math.random() * this.tiposMuebles.length)];
  }

  obtenerMaterialesCompatibles(materialPrincipal, estilo) {
    const compatibilidades = {
      'madera': ['MDF', 'Contrachapado', 'Madera maciza'],
      'metal': ['Acero', 'Aluminio', 'Hierro forjado'],
      'vidrio': ['Vidrio templado', 'Cristal', 'Acrílico']
    };

    const materialBase = materialPrincipal.toLowerCase();
    for (const [categoria, materiales] of Object.entries(compatibilidades)) {
      if (materialBase.includes(categoria)) {
        return materiales;
      }
    }

    return this.materialesComunes.slice(0, 3);
  }

  obtenerColoresComplementarios(colorPrincipal) {
    const complementarios = {
      'blanco': ['Gris claro', 'Beige', 'Azul pastel'],
      'negro': ['Blanco', 'Gris', 'Dorado'],
      'marrón': ['Crema', 'Verde oliva', 'Naranja quemado'],
      'gris': ['Blanco', 'Azul', 'Amarillo'],
      'azul': ['Blanco', 'Gris', 'Naranja']
    };

    const colorBase = colorPrincipal.toLowerCase();
    for (const [color, complementos] of Object.entries(complementarios)) {
      if (colorBase.includes(color)) {
        return complementos;
      }
    }

    return this.coloresPopulares.slice(0, 3);
  }

  calcularComplejidad(parametros) {
    let complejidad = 1;
    
    if (parametros.preferencias_especiales?.length > 0) complejidad += 0.5;
    if (parametros.descripcion_adicional?.length > 100) complejidad += 0.3;
    if (parametros.estilo === 'Art Deco' || parametros.estilo === 'Vintage') complejidad += 0.4;
    
    return Math.min(complejidad, 3);
  }

  calcularTiempoProduccion(volumen, complejidad) {
    const tiempoBase = Math.ceil(volumen / 100000) + 5; // Días base según volumen
    return Math.round(tiempoBase * complejidad);
  }

  calcularPrecioEstimado(volumen, material, complejidad) {
    const precioBasePorM3 = {
      'madera': 800,
      'metal': 1200,
      'vidrio': 600,
      'cuero': 1500
    };

    let precioBase = 500; // Precio mínimo
    const materialKey = Object.keys(precioBasePorM3).find(key => 
      material.toLowerCase().includes(key)
    );

    if (materialKey) {
      precioBase = precioBasePorM3[materialKey];
    }

    const volumenM3 = volumen / 1000000;
    return Math.round(precioBase * volumenM3 * complejidad);
  }

  calcularPesoEstimado(volumen, material) {
    const densidades = {
      'madera': 0.6,
      'metal': 7.8,
      'vidrio': 2.5,
      'plastico': 0.9
    };

    const materialKey = Object.keys(densidades).find(key => 
      material.toLowerCase().includes(key)
    );

    const densidad = materialKey ? densidades[materialKey] : 0.8;
    const volumenM3 = volumen / 1000000;
    
    return Math.round(volumenM3 * densidad * 1000); // kg
  }

  generarTextoRecomendacion(parametros, tipoRecomendado, materialesCompatibles) {
    const { medidas, material, color, estilo } = parametros;
    
    return `Recomendación para ${tipoRecomendado} personalizado:

Basándome en las especificaciones proporcionadas (${medidas.largo}x${medidas.ancho}x${medidas.alto} ${medidas.unidad}), recomiendo un diseño ${estilo.toLowerCase()} que combine funcionalidad y estética.

CARACTERÍSTICAS PRINCIPALES:
• Material principal: ${material} con acabado en ${color.toLowerCase()}
• Estilo: ${estilo} con líneas limpias y proporciones equilibradas
• Dimensiones optimizadas para el espacio disponible

RECOMENDACIONES DE DISEÑO:
• Utilizar ${materialesCompatibles[0]} como material complementario
• Incorporar elementos de ${materialesCompatibles[1]} para mayor durabilidad
• Acabado mate/satinado para resaltar la textura natural

CONSIDERACIONES TÉCNICAS:
• Estructura reforzada en puntos de mayor estrés
• Tratamiento anti-humedad y protección UV
• Herrajes de alta calidad para mayor durabilidad

Este diseño combina la elegancia del estilo ${estilo} con la practicidad moderna, resultando en una pieza única que se adaptará perfectamente a sus necesidades.`;
  }

  generarURLImagenSimulada(parametros) {
    // En un entorno real, aquí se generaría una imagen con IA
    const { tipo_mueble, estilo, color } = parametros;
    const baseUrl = 'https://via.placeholder.com/400x300';
    const colorHex = this.colorAHex(color);
    
    return `${baseUrl}/${colorHex}/FFFFFF?text=${encodeURIComponent(tipo_mueble || 'Mueble')}+${encodeURIComponent(estilo)}`;
  }

  colorAHex(nombreColor) {
    const colores = {
      'blanco': 'FFFFFF',
      'negro': '000000',
      'gris': '808080',
      'marrón': '8B4513',
      'azul': '0000FF',
      'verde': '008000',
      'rojo': 'FF0000',
      'amarillo': 'FFFF00'
    };

    const colorKey = Object.keys(colores).find(key => 
      nombreColor.toLowerCase().includes(key)
    );

    return colorKey ? colores[colorKey] : '808080';
  }

  obtenerProductosSimilares(parametros) {
    // Simular productos similares del catálogo
    return [
      {
        id: Math.floor(Math.random() * 100) + 1,
        nombre: `${parametros.tipo_mueble || 'Mueble'} ${parametros.estilo}`,
        precio_base: this.calcularPrecioEstimado(
          parametros.medidas.largo * parametros.medidas.ancho * parametros.medidas.alto,
          parametros.material,
          1
        ),
        similitud: 85
      },
      {
        id: Math.floor(Math.random() * 100) + 1,
        nombre: `${parametros.estilo} en ${parametros.material}`,
        precio_base: this.calcularPrecioEstimado(
          parametros.medidas.largo * parametros.medidas.ancho * parametros.medidas.alto,
          parametros.material,
          0.8
        ),
        similitud: 72
      }
    ];
  }

  generarProcesoFabricacion(parametros) {
    return [
      'Diseño técnico y planos detallados',
      'Selección y preparación de materiales',
      'Corte y mecanizado de piezas',
      'Ensamblaje de estructura principal',
      'Aplicación de acabados y tratamientos',
      'Control de calidad final',
      'Embalaje y preparación para entrega'
    ];
  }

  generarRecomendacionesAdicionales(parametros) {
    return [
      'Considerar tratamiento antimanchas para mayor durabilidad',
      'Incluir sistema de ajuste de altura si es aplicable',
      'Evaluar opciones de almacenamiento integrado',
      'Planificar mantenimiento preventivo cada 6 meses'
    ];
  }

  detectarProveedor() {
    if (this.apiUrl?.includes('huggingface')) return 'huggingface';
    if (this.apiUrl?.includes('replicate')) return 'replicate';
    if (this.apiUrl?.includes('openai')) return 'openai';
    return 'desconocido';
  }
}

module.exports = new IAService();