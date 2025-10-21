-- Schema para Sistema de Gestión de Muebles a Medida
-- Base de datos: PostgreSQL

-- Crear base de datos
-- CREATE DATABASE sistema_muebles;

-- Usar la base de datos
-- \c sistema_muebles;

-- Tabla de usuarios
CREATE TABLE usuarios (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    correo VARCHAR(150) UNIQUE NOT NULL,
    rol VARCHAR(20) DEFAULT 'usuario' CHECK (rol IN ('usuario', 'administrador')),
    contraseña VARCHAR(255) NOT NULL, -- Hash bcrypt
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    activo BOOLEAN DEFAULT true,
    telefono VARCHAR(20),
    direccion TEXT
);

-- Tabla de pedidos
CREATE TABLE pedidos (
    id SERIAL PRIMARY KEY,
    usuario_id INTEGER REFERENCES usuarios(id) ON DELETE CASCADE,
    estado VARCHAR(30) DEFAULT 'nuevo' CHECK (estado IN ('nuevo', 'en_cotizacion', 'aprobado', 'en_produccion', 'entregado', 'cancelado')),
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_entrega DATE,
    total_estimado DECIMAL(10,2) DEFAULT 0.00,
    notas_cliente TEXT,
    notas_admin TEXT,
    direccion_entrega TEXT
);

-- Tabla de detalles del pedido
CREATE TABLE detalles_pedido (
    id SERIAL PRIMARY KEY,
    pedido_id INTEGER REFERENCES pedidos(id) ON DELETE CASCADE,
    descripcion TEXT NOT NULL,
    medidas VARCHAR(200), -- ej: "200x100x80 cm"
    material VARCHAR(100),
    color VARCHAR(50),
    imagen_referencia_url VARCHAR(500),
    cotizacion DECIMAL(10,2) DEFAULT 0.00,
    cantidad INTEGER DEFAULT 1,
    observaciones TEXT
);

-- Tabla del catálogo
CREATE TABLE catalogo (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(150) NOT NULL,
    tipo VARCHAR(50) NOT NULL, -- ej: "silla", "mesa", "armario"
    imagen_url VARCHAR(500),
    precio_base DECIMAL(10,2) NOT NULL,
    estilo VARCHAR(50), -- ej: "moderno", "clásico", "rústico"
    dimensiones VARCHAR(200),
    descripcion TEXT,
    materiales_disponibles TEXT[], -- Array de materiales
    colores_disponibles TEXT[], -- Array de colores
    activo BOOLEAN DEFAULT true,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de recomendaciones de IA
CREATE TABLE recomendaciones_ia (
    id SERIAL PRIMARY KEY,
    pedido_id INTEGER REFERENCES pedidos(id) ON DELETE CASCADE,
    texto_recomendacion TEXT NOT NULL,
    imagen_generada_url VARCHAR(500),
    fecha_generacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    parametros_entrada JSONB, -- Almacena medidas, color, estilo, material
    confianza DECIMAL(3,2) DEFAULT 0.00, -- Nivel de confianza de la IA (0-1)
    modelo_ia_usado VARCHAR(100)
);

-- Tabla de notificaciones
CREATE TABLE notificaciones (
    id SERIAL PRIMARY KEY,
    usuario_id INTEGER REFERENCES usuarios(id) ON DELETE CASCADE,
    mensaje TEXT NOT NULL,
    tipo VARCHAR(20) DEFAULT 'sistema' CHECK (tipo IN ('sistema', 'correo', 'sms')),
    fecha_envio TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    leido BOOLEAN DEFAULT false,
    asunto VARCHAR(200),
    datos_adicionales JSONB -- Para almacenar datos extra como IDs de pedidos
);

-- Tabla de historial de estados (para auditoría)
CREATE TABLE historial_estados (
    id SERIAL PRIMARY KEY,
    pedido_id INTEGER REFERENCES pedidos(id) ON DELETE CASCADE,
    estado_anterior VARCHAR(30),
    estado_nuevo VARCHAR(30) NOT NULL,
    usuario_cambio_id INTEGER REFERENCES usuarios(id),
    fecha_cambio TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    comentario TEXT
);

-- Índices para optimizar consultas
CREATE INDEX idx_usuarios_correo ON usuarios(correo);
CREATE INDEX idx_usuarios_rol ON usuarios(rol);
CREATE INDEX idx_pedidos_usuario ON pedidos(usuario_id);
CREATE INDEX idx_pedidos_estado ON pedidos(estado);
CREATE INDEX idx_pedidos_fecha ON pedidos(fecha_creacion);
CREATE INDEX idx_detalles_pedido ON detalles_pedido(pedido_id);
CREATE INDEX idx_catalogo_tipo ON catalogo(tipo);
CREATE INDEX idx_catalogo_activo ON catalogo(activo);
CREATE INDEX idx_notificaciones_usuario ON notificaciones(usuario_id);
CREATE INDEX idx_notificaciones_leido ON notificaciones(leido);
CREATE INDEX idx_recomendaciones_pedido ON recomendaciones_ia(pedido_id);

-- Función para actualizar automáticamente el historial de estados
CREATE OR REPLACE FUNCTION actualizar_historial_estados()
RETURNS TRIGGER AS $$
BEGIN
    IF OLD.estado IS DISTINCT FROM NEW.estado THEN
        INSERT INTO historial_estados (pedido_id, estado_anterior, estado_nuevo, fecha_cambio)
        VALUES (NEW.id, OLD.estado, NEW.estado, CURRENT_TIMESTAMP);
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para el historial de estados
CREATE TRIGGER trigger_historial_estados
    AFTER UPDATE ON pedidos
    FOR EACH ROW
    EXECUTE FUNCTION actualizar_historial_estados();

-- Datos de ejemplo para el administrador inicial
INSERT INTO usuarios (nombre, correo, rol, contraseña) VALUES 
('Administrador', 'admin@muebles.com', 'administrador', '$2a$10$example_hash_here');

-- Datos de ejemplo para el catálogo
INSERT INTO catalogo (nombre, tipo, precio_base, estilo, dimensiones, descripcion, materiales_disponibles, colores_disponibles) VALUES 
('Mesa de Comedor Clásica', 'mesa', 1500.00, 'clásico', '180x90x75 cm', 'Mesa de comedor elegante para 6 personas', ARRAY['roble', 'nogal', 'pino'], ARRAY['natural', 'nogal', 'blanco']),
('Silla Moderna', 'silla', 350.00, 'moderno', '45x50x85 cm', 'Silla ergonómica con diseño contemporáneo', ARRAY['metal', 'madera', 'plástico'], ARRAY['negro', 'blanco', 'gris']),
('Armario Empotrado', 'armario', 2500.00, 'moderno', '200x60x240 cm', 'Armario a medida con múltiples compartimentos', ARRAY['melamina', 'madera maciza'], ARRAY['blanco', 'roble', 'nogal']);

-- Comentarios en las tablas
COMMENT ON TABLE usuarios IS 'Tabla de usuarios del sistema con roles diferenciados';
COMMENT ON TABLE pedidos IS 'Tabla principal de pedidos con estados de seguimiento';
COMMENT ON TABLE detalles_pedido IS 'Especificaciones técnicas de cada item del pedido';
COMMENT ON TABLE catalogo IS 'Catálogo de productos base disponibles';
COMMENT ON TABLE recomendaciones_ia IS 'Recomendaciones generadas por inteligencia artificial';
COMMENT ON TABLE notificaciones IS 'Sistema de notificaciones para usuarios';
COMMENT ON TABLE historial_estados IS 'Auditoría de cambios de estado en pedidos';