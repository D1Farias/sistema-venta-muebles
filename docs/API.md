# Documentación de la API

## Información General

- **URL Base**: `http://localhost:3000/api`
- **Formato**: JSON
- **Autenticación**: JWT Bearer Token
- **Versión**: 1.0.0

## Autenticación

### Registro de Usuario
```http
POST /auth/registro
Content-Type: application/json

{
  "nombre_completo": "Juan Pérez",
  "email": "juan@email.com",
  "telefono": "+1234567890",
  "password": "password123"
}
```

**Respuesta exitosa (201):**
```json
{
  "success": true,
  "message": "Usuario registrado exitosamente",
  "data": {
    "user": {
      "id": 1,
      "nombre_completo": "Juan Pérez",
      "email": "juan@email.com",
      "telefono": "+1234567890",
      "rol": "cliente"
    },
    "tokens": {
      "access_token": "eyJ...",
      "refresh_token": "eyJ..."
    }
  }
}
```

### Inicio de Sesión
```http
POST /auth/login
Content-Type: application/json

{
  "email": "juan@email.com",
  "password": "password123",
  "recordarme": true
}
```

### Renovar Token
```http
POST /auth/refresh
Content-Type: application/json

{
  "refresh_token": "eyJ..."
}
```

### Cerrar Sesión
```http
POST /auth/logout
Authorization: Bearer <access_token>
```

## Usuarios

### Obtener Perfil
```http
GET /usuarios/perfil
Authorization: Bearer <access_token>
```

### Actualizar Perfil
```http
PUT /usuarios/perfil
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "nombre_completo": "Juan Pérez Actualizado",
  "telefono": "+0987654321"
}
```

### Cambiar Contraseña
```http
PUT /usuarios/cambiar-password
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "password_actual": "password123",
  "password_nuevo": "newpassword123"
}
```

## Productos

### Listar Productos
```http
GET /productos?page=1&limit=12&categoria=sillas&material=madera&precio_min=100&precio_max=1000&buscar=moderna
```

**Parámetros de consulta:**
- `page`: Número de página (default: 1)
- `limit`: Elementos por página (default: 12, max: 50)
- `categoria`: Filtrar por categoría
- `material`: Filtrar por material
- `precio_min`: Precio mínimo
- `precio_max`: Precio máximo
- `buscar`: Término de búsqueda
- `ordenar`: `precio_asc`, `precio_desc`, `nombre_asc`, `nombre_desc`, `fecha_desc`

### Obtener Producto
```http
GET /productos/:id
```

### Productos Destacados
```http
GET /productos/destacados?limit=8
```

### Categorías
```http
GET /productos/categorias
```

### Materiales
```http
GET /productos/materiales
```

## Favoritos

### Listar Favoritos
```http
GET /favoritos
Authorization: Bearer <access_token>
```

### Agregar a Favoritos
```http
POST /favoritos
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "producto_id": 123
}
```

### Eliminar de Favoritos
```http
DELETE /favoritos/:producto_id
Authorization: Bearer <access_token>
```

## Carrito

### Obtener Carrito
```http
GET /carrito
Authorization: Bearer <access_token>
```

### Agregar al Carrito
```http
POST /carrito
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "producto_id": 123,
  "cantidad": 2,
  "personalizaciones": {
    "color": "azul",
    "material": "roble"
  }
}
```

### Actualizar Cantidad
```http
PUT /carrito/:item_id
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "cantidad": 3
}
```

### Eliminar del Carrito
```http
DELETE /carrito/:item_id
Authorization: Bearer <access_token>
```

### Vaciar Carrito
```http
DELETE /carrito
Authorization: Bearer <access_token>
```

## Pedidos

### Listar Pedidos
```http
GET /pedidos?page=1&limit=10&estado=pendiente&fecha_desde=2024-01-01&fecha_hasta=2024-12-31
Authorization: Bearer <access_token>
```

### Crear Pedido
```http
POST /pedidos
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "direccion_envio": {
    "calle": "Calle Principal 123",
    "ciudad": "Ciudad",
    "codigo_postal": "12345",
    "pais": "País"
  },
  "metodo_pago": "tarjeta",
  "notas": "Entregar en horario de oficina"
}
```

### Obtener Pedido
```http
GET /pedidos/:id
Authorization: Bearer <access_token>
```

### Cancelar Pedido
```http
PUT /pedidos/:id/cancelar
Authorization: Bearer <access_token>
```

## Recomendaciones de IA

### Generar Recomendación
```http
POST /ia/recomendaciones
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "tipo_espacio": "sala",
  "dimensiones": "4x3 metros",
  "estilo": "moderno",
  "presupuesto": 5000,
  "colores_preferidos": ["azul", "blanco"],
  "materiales_preferidos": ["madera", "metal"],
  "descripcion_adicional": "Busco un ambiente minimalista y funcional"
}
```

### Listar Recomendaciones
```http
GET /ia/recomendaciones?page=1&limit=10
Authorization: Bearer <access_token>
```

### Obtener Recomendación
```http
GET /ia/recomendaciones/:id
Authorization: Bearer <access_token>
```

### Guardar Recomendación
```http
POST /ia/recomendaciones/:id/guardar
Authorization: Bearer <access_token>
```

### Eliminar Recomendación
```http
DELETE /ia/recomendaciones/:id
Authorization: Bearer <access_token>
```

## Notificaciones

### Listar Notificaciones
```http
GET /notificaciones?page=1&limit=20&leidas=false
Authorization: Bearer <access_token>
```

### Marcar como Leída
```http
PUT /notificaciones/:id/leer
Authorization: Bearer <access_token>
```

### Marcar Todas como Leídas
```http
PUT /notificaciones/leer-todas
Authorization: Bearer <access_token>
```

### Eliminar Notificación
```http
DELETE /notificaciones/:id
Authorization: Bearer <access_token>
```

## Dashboard

### Estadísticas del Usuario
```http
GET /dashboard/estadisticas
Authorization: Bearer <access_token>
```

**Respuesta:**
```json
{
  "success": true,
  "data": {
    "total_pedidos": 15,
    "pedidos_pendientes": 3,
    "recomendaciones_ia": 8,
    "productos_favoritos": 12,
    "actividad_reciente": [
      {
        "tipo": "pedido",
        "descripcion": "Nuevo pedido #1234",
        "fecha": "2024-01-15T10:30:00Z"
      }
    ]
  }
}
```

### Productos Destacados para Dashboard
```http
GET /dashboard/productos-destacados?limit=6
Authorization: Bearer <access_token>
```

## Newsletter

### Suscribirse
```http
POST /newsletter/suscribir
Content-Type: application/json

{
  "email": "usuario@email.com"
}
```

### Desuscribirse
```http
POST /newsletter/desuscribir
Content-Type: application/json

{
  "email": "usuario@email.com"
}
```

## Administración (Solo Administradores)

### Estadísticas Generales
```http
GET /admin/estadisticas
Authorization: Bearer <admin_access_token>
```

### Gestión de Usuarios
```http
GET /admin/usuarios?page=1&limit=20&buscar=juan&rol=cliente
PUT /admin/usuarios/:id/rol
DELETE /admin/usuarios/:id
```

### Gestión de Productos
```http
POST /admin/productos
PUT /admin/productos/:id
DELETE /admin/productos/:id
```

### Gestión de Pedidos
```http
GET /admin/pedidos?estado=todos&fecha_desde=2024-01-01
PUT /admin/pedidos/:id/estado
```

## Códigos de Estado HTTP

- **200**: OK - Solicitud exitosa
- **201**: Created - Recurso creado exitosamente
- **400**: Bad Request - Error en los datos enviados
- **401**: Unauthorized - Token inválido o expirado
- **403**: Forbidden - Sin permisos para acceder al recurso
- **404**: Not Found - Recurso no encontrado
- **422**: Unprocessable Entity - Error de validación
- **429**: Too Many Requests - Límite de solicitudes excedido
- **500**: Internal Server Error - Error interno del servidor

## Estructura de Respuestas

### Respuesta Exitosa
```json
{
  "success": true,
  "message": "Operación exitosa",
  "data": {
    // Datos de respuesta
  },
  "meta": {
    "page": 1,
    "limit": 12,
    "total": 150,
    "total_pages": 13
  }
}
```

### Respuesta de Error
```json
{
  "success": false,
  "message": "Descripción del error",
  "errors": [
    {
      "field": "email",
      "message": "El email es requerido"
    }
  ]
}
```

## Rate Limiting

- **Límite**: 100 solicitudes por 15 minutos por IP
- **Headers de respuesta**:
  - `X-RateLimit-Limit`: Límite total
  - `X-RateLimit-Remaining`: Solicitudes restantes
  - `X-RateLimit-Reset`: Tiempo de reset en segundos

## Versionado

La API utiliza versionado en la URL. La versión actual es `v1` y está incluida en la URL base.

## Soporte

Para soporte técnico o preguntas sobre la API:
- Email: api-support@muebles.com
- Documentación: https://docs.muebles.com
- Status: https://status.muebles.com