// ============================================================================
// SERVICIO DE CORREO ELECTRÓNICO
// ============================================================================
// Este servicio maneja todas las funcionalidades relacionadas con el envío
// de correos electrónicos del sistema de muebles personalizados.
// 
// Funcionalidades principales:
// - Configuración y gestión del transportador SMTP
// - Envío de correos con plantillas HTML personalizadas
// - Notificaciones automáticas para diferentes eventos del sistema
// - Modo simulado para desarrollo sin configuración SMTP
// ============================================================================

// Importaciones necesarias
const nodemailer = require('nodemailer');        // Librería para envío de correos electrónicos
const { createLogger } = require('../middleware/logger'); // Sistema de logging

// Logger específico para el servicio de correo
const logger = createLogger('emailService');

/**
 * Clase principal del servicio de correo electrónico
 * Maneja la configuración SMTP y el envío de diferentes tipos de notificaciones
 */
class EmailService {
  /**
   * Constructor de la clase EmailService
   * Inicializa las propiedades y configura el transportador SMTP
   */
  constructor() {
    this.transporter = null;      // Transportador de nodemailer (null si no está configurado)
    this.isConfigured = false;    // Flag que indica si el servicio está correctamente configurado
    this.initializeTransporter(); // Inicializa la configuración SMTP
  }

  /**
   * Inicializa el transportador de correo con la configuración SMTP
   * Utiliza variables de entorno para la configuración y maneja errores graciosamente
   */
  initializeTransporter() {
    try {
      const emailConfig = {
        host: process.env.SMTP_HOST || 'smtp.gmail.com',
        port: parseInt(process.env.SMTP_PORT) || 587,
        secure: process.env.SMTP_SECURE === 'true', // true para 465, false para otros puertos
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS
        },
        tls: {
          rejectUnauthorized: false
        }
      };

      // Verificar que las credenciales estén configuradas
      if (!emailConfig.auth.user || !emailConfig.auth.pass) {
        logger.warn('Credenciales de correo no configuradas, el servicio funcionará en modo simulado');
        this.isConfigured = false;
        return;
      }

      this.transporter = nodemailer.createTransporter(emailConfig);
      this.isConfigured = true;

      // Verificar la conexión
      this.transporter.verify((error, success) => {
        if (error) {
          logger.error('Error al verificar configuración de correo', { error: error.message });
          this.isConfigured = false;
        } else {
          logger.info('Servicio de correo configurado correctamente');
        }
      });

    } catch (error) {
      logger.error('Error al inicializar servicio de correo', { error: error.message });
      this.isConfigured = false;
    }
  }

  /**
   * Método principal para enviar correos electrónicos
   * Maneja tanto el envío real como la simulación en modo desarrollo
   * @param {Object} opciones - Opciones del correo
   * @param {string} opciones.destinatario - Dirección de correo del destinatario
   * @param {string} opciones.asunto - Asunto del correo
   * @param {string} opciones.contenido - Contenido del correo (HTML o texto)
   * @param {boolean} opciones.esHTML - Si el contenido es HTML (por defecto true)
   * @param {Array} opciones.adjuntos - Array de adjuntos (opcional)
   * @returns {Object} Resultado del envío con información de éxito/error
   */
  async enviarCorreo(opciones) {
    try {
      const { destinatario, asunto, contenido, esHTML = true, adjuntos = [] } = opciones;

      if (!this.isConfigured) {
        logger.info('Simulando envío de correo (servicio no configurado)', {
          destinatario,
          asunto
        });
        return {
          exito: true,
          simulado: true,
          messageId: `sim_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
        };
      }

      const mailOptions = {
        from: {
          name: process.env.SMTP_FROM_NAME || 'Sistema de Muebles',
          address: process.env.SMTP_FROM_EMAIL || process.env.SMTP_USER
        },
        to: destinatario,
        subject: asunto,
        [esHTML ? 'html' : 'text']: contenido,
        attachments: adjuntos
      };

      const resultado = await this.transporter.sendMail(mailOptions);

      logger.info('Correo enviado exitosamente', {
        destinatario,
        asunto,
        messageId: resultado.messageId
      });

      return {
        exito: true,
        simulado: false,
        messageId: resultado.messageId,
        response: resultado.response
      };

    } catch (error) {
      logger.error('Error al enviar correo', {
        error: error.message,
        destinatario: opciones.destinatario,
        asunto: opciones.asunto
      });

      return {
        exito: false,
        error: error.message
      };
    }
  }

  // ============================================================================
  // MÉTODOS DE NOTIFICACIONES ESPECÍFICAS
  // ============================================================================

  /**
   * Envía notificación de bienvenida a nuevo usuario registrado
   * @param {Object} usuario - Datos del usuario recién registrado
   * @param {string} usuario.email - Correo electrónico del usuario
   * @param {string} usuario.nombre - Nombre del usuario
   * @returns {Object} Resultado del envío
   */
  async enviarBienvenida(usuario) {
    const asunto = '¡Bienvenido a nuestro sistema de muebles personalizados!';
    const contenido = this.generarPlantillaBienvenida(usuario);

    return await this.enviarCorreo({
      destinatario: usuario.email,
      asunto,
      contenido,
      esHTML: true
    });
  }

  /**
   * Envía notificación cuando cambia el estado de un pedido
   * @param {Object} pedido - Datos del pedido actualizado
   * @param {Object} usuario - Datos del propietario del pedido
   * @returns {Object} Resultado del envío
   */
  async enviarCambioEstadoPedido(pedido, usuario) {
    const asunto = `Actualización de su pedido #${pedido.id}`;
    const contenido = this.generarPlantillaCambioEstado(pedido, usuario);

    return await this.enviarCorreo({
      destinatario: usuario.email,
      asunto,
      contenido,
      esHTML: true
    });
  }

  /**
   * Envía notificación cuando se genera una nueva recomendación de IA
   * @param {Object} recomendacion - Datos de la recomendación generada
   * @param {Object} usuario - Datos del usuario que solicitó la recomendación
   * @returns {Object} Resultado del envío
   */
  async enviarNuevaRecomendacion(recomendacion, usuario) {
    const asunto = 'Nueva recomendación personalizada disponible';
    const contenido = this.generarPlantillaRecomendacion(recomendacion, usuario);

    return await this.enviarCorreo({
      destinatario: usuario.email,
      asunto,
      contenido,
      esHTML: true
    });
  }

  /**
   * Envía notificación cuando una cotización está lista para revisión
   * @param {Object} pedido - Datos del pedido con cotización
   * @param {Object} usuario - Datos del propietario del pedido
   * @returns {Object} Resultado del envío
   */
  async enviarCotizacionLista(pedido, usuario) {
    const asunto = `Cotización lista para su pedido #${pedido.id}`;
    const contenido = this.generarPlantillaCotizacion(pedido, usuario);

    return await this.enviarCorreo({
      destinatario: usuario.email,
      asunto,
      contenido,
      esHTML: true
    });
  }

  /**
   * Envía recordatorio para pedidos que requieren atención del usuario
   * @param {Object} pedido - Datos del pedido pendiente
   * @param {Object} usuario - Datos del propietario del pedido
   * @returns {Object} Resultado del envío
   */
  async enviarRecordatorioPedido(pedido, usuario) {
    const asunto = `Recordatorio: Pedido #${pedido.id} pendiente de confirmación`;
    const contenido = this.generarPlantillaRecordatorio(pedido, usuario);

    return await this.enviarCorreo({
      destinatario: usuario.email,
      asunto,
      contenido,
      esHTML: true
    });
  }

  /**
   * Envía notificación para restablecimiento de contraseña
   * @param {Object} usuario - Datos del usuario que solicita el restablecimiento
   * @param {string} token - Token único para el restablecimiento de contraseña
   * @returns {Object} Resultado del envío
   */
  async enviarRestablecimientoPassword(usuario, token) {
    const asunto = 'Restablecimiento de contraseña';
    const contenido = this.generarPlantillaRestablecimiento(usuario, token);

    return await this.enviarCorreo({
      destinatario: usuario.email,
      asunto,
      contenido,
      esHTML: true
    });
  }

  // ============================================================================
  // MÉTODOS DE GENERACIÓN DE PLANTILLAS HTML
  // ============================================================================

  /**
   * Genera plantilla HTML para correo de bienvenida a nuevos usuarios
   * @param {Object} usuario - Datos del usuario recién registrado
   * @returns {string} HTML del correo de bienvenida
   */
  generarPlantillaBienvenida(usuario) {
    return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Bienvenido</title>
        <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #2c3e50; color: white; padding: 20px; text-align: center; }
            .content { padding: 20px; background: #f9f9f9; }
            .footer { background: #34495e; color: white; padding: 15px; text-align: center; font-size: 12px; }
            .button { display: inline-block; padding: 12px 24px; background: #3498db; color: white; text-decoration: none; border-radius: 5px; margin: 10px 0; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>¡Bienvenido a Muebles Personalizados!</h1>
            </div>
            <div class="content">
                <h2>Hola ${usuario.nombre},</h2>
                <p>¡Gracias por registrarte en nuestro sistema de muebles personalizados!</p>
                <p>Ahora puedes:</p>
                <ul>
                    <li>Explorar nuestro catálogo de productos</li>
                    <li>Solicitar muebles personalizados</li>
                    <li>Recibir recomendaciones de IA</li>
                    <li>Hacer seguimiento de tus pedidos</li>
                </ul>
                <p>Estamos aquí para ayudarte a crear los muebles perfectos para tu hogar.</p>
                <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}" class="button">Comenzar a explorar</a>
            </div>
            <div class="footer">
                <p>© 2024 Sistema de Muebles Personalizados. Todos los derechos reservados.</p>
            </div>
        </div>
    </body>
    </html>`;
  }

  /**
   * Genera plantilla HTML para notificación de cambio de estado de pedido
   * @param {Object} pedido - Datos del pedido con estado actualizado
   * @param {Object} usuario - Datos del propietario del pedido
   * @returns {string} HTML del correo de notificación
   */
  generarPlantillaCambioEstado(pedido, usuario) {
    const estadosDescripcion = {
      'pendiente': 'Su pedido está siendo revisado por nuestro equipo',
      'en_proceso': 'Hemos comenzado a trabajar en su pedido',
      'en_produccion': 'Su mueble está siendo fabricado',
      'listo': 'Su pedido está listo para entrega',
      'entregado': 'Su pedido ha sido entregado exitosamente',
      'cancelado': 'Su pedido ha sido cancelado'
    };

    const descripcionEstado = estadosDescripcion[pedido.estado] || 'Estado actualizado';

    return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Actualización de Pedido</title>
        <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #27ae60; color: white; padding: 20px; text-align: center; }
            .content { padding: 20px; background: #f9f9f9; }
            .footer { background: #34495e; color: white; padding: 15px; text-align: center; font-size: 12px; }
            .status { background: #e8f5e8; padding: 15px; border-left: 4px solid #27ae60; margin: 15px 0; }
            .button { display: inline-block; padding: 12px 24px; background: #3498db; color: white; text-decoration: none; border-radius: 5px; margin: 10px 0; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>Actualización de Pedido #${pedido.id}</h1>
            </div>
            <div class="content">
                <h2>Hola ${usuario.nombre},</h2>
                <p>Tenemos una actualización sobre su pedido:</p>
                <div class="status">
                    <h3>Estado actual: ${pedido.estado.toUpperCase()}</h3>
                    <p>${descripcionEstado}</p>
                </div>
                <p><strong>Descripción del pedido:</strong> ${pedido.descripcion}</p>
                ${pedido.fecha_estimada_entrega ? `<p><strong>Fecha estimada de entrega:</strong> ${new Date(pedido.fecha_estimada_entrega).toLocaleDateString()}</p>` : ''}
                ${pedido.precio_cotizado ? `<p><strong>Precio cotizado:</strong> $${pedido.precio_cotizado}</p>` : ''}
                <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/pedidos/${pedido.id}" class="button">Ver detalles del pedido</a>
            </div>
            <div class="footer">
                <p>© 2024 Sistema de Muebles Personalizados. Todos los derechos reservados.</p>
            </div>
        </div>
    </body>
    </html>`;
  }

  /**
   * Genera plantilla HTML para notificación de nueva recomendación de IA
   * @param {Object} recomendacion - Datos de la recomendación generada
   * @param {Object} usuario - Datos del usuario que recibe la recomendación
   * @returns {string} HTML del correo de recomendación
   */
  generarPlantillaRecomendacion(recomendacion, usuario) {
    return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Nueva Recomendación</title>
        <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #9b59b6; color: white; padding: 20px; text-align: center; }
            .content { padding: 20px; background: #f9f9f9; }
            .footer { background: #34495e; color: white; padding: 15px; text-align: center; font-size: 12px; }
            .recommendation { background: #f8f4ff; padding: 15px; border-left: 4px solid #9b59b6; margin: 15px 0; }
            .button { display: inline-block; padding: 12px 24px; background: #3498db; color: white; text-decoration: none; border-radius: 5px; margin: 10px 0; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>🤖 Nueva Recomendación de IA</h1>
            </div>
            <div class="content">
                <h2>Hola ${usuario.nombre},</h2>
                <p>Nuestra IA ha generado una nueva recomendación personalizada para usted:</p>
                <div class="recommendation">
                    <h3>Recomendación Personalizada</h3>
                    <p>${recomendacion.texto ? recomendacion.texto.substring(0, 200) + '...' : 'Recomendación disponible'}</p>
                    ${recomendacion.estimacion_precio ? `<p><strong>Precio estimado:</strong> $${recomendacion.estimacion_precio.promedio}</p>` : ''}
                </div>
                <p>Esta recomendación ha sido creada específicamente basándose en sus preferencias y necesidades.</p>
                <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/recomendaciones/${recomendacion.id}" class="button">Ver recomendación completa</a>
            </div>
            <div class="footer">
                <p>© 2024 Sistema de Muebles Personalizados. Todos los derechos reservados.</p>
            </div>
        </div>
    </body>
    </html>`;
  }

  /**
   * Genera plantilla HTML para notificación de cotización lista
   * @param {Object} pedido - Datos del pedido con cotización preparada
   * @param {Object} usuario - Datos del propietario del pedido
   * @returns {string} HTML del correo de cotización
   */
  generarPlantillaCotizacion(pedido, usuario) {
    return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Cotización Lista</title>
        <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #f39c12; color: white; padding: 20px; text-align: center; }
            .content { padding: 20px; background: #f9f9f9; }
            .footer { background: #34495e; color: white; padding: 15px; text-align: center; font-size: 12px; }
            .quote { background: #fff8e1; padding: 15px; border-left: 4px solid #f39c12; margin: 15px 0; }
            .button { display: inline-block; padding: 12px 24px; background: #3498db; color: white; text-decoration: none; border-radius: 5px; margin: 10px 0; }
            .price { font-size: 24px; font-weight: bold; color: #f39c12; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>💰 Cotización Lista</h1>
            </div>
            <div class="content">
                <h2>Hola ${usuario.nombre},</h2>
                <p>Su cotización para el pedido #${pedido.id} está lista:</p>
                <div class="quote">
                    <h3>Detalles de la Cotización</h3>
                    <p><strong>Descripción:</strong> ${pedido.descripcion}</p>
                    <p class="price">Precio: $${pedido.precio_cotizado}</p>
                    ${pedido.fecha_estimada_entrega ? `<p><strong>Tiempo estimado:</strong> ${new Date(pedido.fecha_estimada_entrega).toLocaleDateString()}</p>` : ''}
                </div>
                <p>Esta cotización es válida por 30 días. ¿Le gustaría proceder con el pedido?</p>
                <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/pedidos/${pedido.id}" class="button">Ver cotización completa</a>
            </div>
            <div class="footer">
                <p>© 2024 Sistema de Muebles Personalizados. Todos los derechos reservados.</p>
            </div>
        </div>
    </body>
    </html>`;
  }

  /**
   * Genera plantilla HTML para recordatorio de pedido pendiente
   * @param {Object} pedido - Datos del pedido que requiere atención
   * @param {Object} usuario - Datos del propietario del pedido
   * @returns {string} HTML del correo de recordatorio
   */
  generarPlantillaRecordatorio(pedido, usuario) {
    return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Recordatorio de Pedido</title>
        <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #e74c3c; color: white; padding: 20px; text-align: center; }
            .content { padding: 20px; background: #f9f9f9; }
            .footer { background: #34495e; color: white; padding: 15px; text-align: center; font-size: 12px; }
            .reminder { background: #ffebee; padding: 15px; border-left: 4px solid #e74c3c; margin: 15px 0; }
            .button { display: inline-block; padding: 12px 24px; background: #3498db; color: white; text-decoration: none; border-radius: 5px; margin: 10px 0; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>⏰ Recordatorio de Pedido</h1>
            </div>
            <div class="content">
                <h2>Hola ${usuario.nombre},</h2>
                <p>Le recordamos que tiene un pedido pendiente de confirmación:</p>
                <div class="reminder">
                    <h3>Pedido #${pedido.id}</h3>
                    <p><strong>Descripción:</strong> ${pedido.descripcion}</p>
                    <p><strong>Estado:</strong> ${pedido.estado}</p>
                    ${pedido.precio_cotizado ? `<p><strong>Precio cotizado:</strong> $${pedido.precio_cotizado}</p>` : ''}
                </div>
                <p>Para continuar con su pedido, por favor revise los detalles y confirme su interés.</p>
                <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/pedidos/${pedido.id}" class="button">Revisar pedido</a>
            </div>
            <div class="footer">
                <p>© 2024 Sistema de Muebles Personalizados. Todos los derechos reservados.</p>
            </div>
        </div>
    </body>
    </html>`;
  }

  /**
   * Genera plantilla HTML para restablecimiento de contraseña
   * @param {Object} usuario - Datos del usuario que solicita el restablecimiento
   * @param {string} token - Token único para validar el restablecimiento
   * @returns {string} HTML del correo de restablecimiento
   */
  generarPlantillaRestablecimiento(usuario, token) {
    const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password?token=${token}`;
    
    return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Restablecimiento de Contraseña</title>
        <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #e67e22; color: white; padding: 20px; text-align: center; }
            .content { padding: 20px; background: #f9f9f9; }
            .footer { background: #34495e; color: white; padding: 15px; text-align: center; font-size: 12px; }
            .security { background: #fff3cd; padding: 15px; border-left: 4px solid #e67e22; margin: 15px 0; }
            .button { display: inline-block; padding: 12px 24px; background: #e67e22; color: white; text-decoration: none; border-radius: 5px; margin: 10px 0; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>🔐 Restablecimiento de Contraseña</h1>
            </div>
            <div class="content">
                <h2>Hola ${usuario.nombre},</h2>
                <p>Hemos recibido una solicitud para restablecer la contraseña de su cuenta.</p>
                <div class="security">
                    <h3>Instrucciones de Seguridad</h3>
                    <p>Si usted solicitó este restablecimiento, haga clic en el botón de abajo. Si no fue usted, ignore este correo.</p>
                    <p><strong>Este enlace expira en 1 hora por seguridad.</strong></p>
                </div>
                <a href="${resetUrl}" class="button">Restablecer Contraseña</a>
                <p>Si el botón no funciona, copie y pegue este enlace en su navegador:</p>
                <p style="word-break: break-all; color: #666;">${resetUrl}</p>
            </div>
            <div class="footer">
                <p>© 2024 Sistema de Muebles Personalizados. Todos los derechos reservados.</p>
            </div>
        </div>
    </body>
    </html>`;
  }
}

// Exporta una instancia única del servicio de email (patrón Singleton)
// para uso en toda la aplicación
module.exports = new EmailService();