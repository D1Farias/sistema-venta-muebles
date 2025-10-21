// IMPORTS - Importación de dependencias necesarias
import axios from 'axios'
import { useToast } from 'vue-toastification'

// CONFIGURACIÓN BASE DE AXIOS
// Crea una instancia personalizada de Axios con configuración predeterminada
const api = axios.create({
  // URL base obtenida de variables de entorno o valor por defecto
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api',
  // Tiempo límite para las peticiones (30 segundos)
  timeout: 30000,
  // Headers por defecto para todas las peticiones
  headers: {
    'Content-Type': 'application/json'
  }
})

// INTERCEPTOR PARA REQUESTS
// Se ejecuta antes de enviar cada petición HTTP
api.interceptors.request.use(
  (config) => {
    // AUTENTICACIÓN AUTOMÁTICA - Agregar token JWT si existe en localStorage
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    
    // LOGGING EN DESARROLLO - Registrar peticiones para debugging
    if (import.meta.env.DEV) {
      console.log(`🚀 ${config.method?.toUpperCase()} ${config.url}`, {
        data: config.data,
        params: config.params
      })
    }
    
    return config
  },
  (error) => {
    console.error('Error en request:', error)
    return Promise.reject(error)
  }
)

// INTERCEPTOR PARA RESPONSES
// Se ejecuta después de recibir cada respuesta HTTP
api.interceptors.response.use(
  (response) => {
    // LOGGING DE RESPUESTAS EXITOSAS en desarrollo
    if (import.meta.env.DEV) {
      console.log(`✅ ${response.config.method?.toUpperCase()} ${response.config.url}`, {
        status: response.status,
        data: response.data
      })
    }
    
    return response
  },
  async (error) => {
    const toast = useToast()
    
    // LOGGING DE ERRORES en desarrollo
    if (import.meta.env.DEV) {
      console.error(`❌ ${error.config?.method?.toUpperCase()} ${error.config?.url}`, {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message
      })
    }
    
    // MANEJO CENTRALIZADO DE ERRORES HTTP
    if (error.response) {
      const { status, data } = error.response
      
      switch (status) {
        case 401:
          // MANEJO DE AUTENTICACIÓN - Token expirado o inválido
          if (data.codigo === 'TOKEN_EXPIRADO') {
            // Intentar renovar token automáticamente
            try {
              const refreshToken = localStorage.getItem('refreshToken')
              if (refreshToken) {
                const refreshResponse = await api.post('/auth/refresh-token', {
                  refreshToken
                })
                
                const { token: newToken } = refreshResponse.data
                localStorage.setItem('token', newToken)
                
                // Reintentar la petición original con el nuevo token
                error.config.headers.Authorization = `Bearer ${newToken}`
                return api.request(error.config)
              }
            } catch (refreshError) {
              // Si el refresh falla, limpiar tokens y redirigir a login
              localStorage.removeItem('token')
              localStorage.removeItem('refreshToken')
              window.location.href = '/login'
              return Promise.reject(refreshError)
            }
          } else {
            // Error de autenticación general
            toast.error(data.mensaje || 'No autorizado')
            if (window.location.pathname !== '/login') {
              window.location.href = '/login'
            }
          }
          break
          
        case 403:
          // MANEJO DE PERMISOS - Usuario sin autorización para la acción
          toast.error(data.mensaje || 'No tienes permisos para realizar esta acción')
          break
          
        case 404:
          // RECURSO NO ENCONTRADO
          toast.error(data.mensaje || 'Recurso no encontrado')
          break
          
        case 422:
          // ERRORES DE VALIDACIÓN - Mostrar errores específicos de campos
          if (data.errores && Array.isArray(data.errores)) {
            data.errores.forEach(error => {
              toast.error(`${error.campo}: ${error.mensaje}`)
            })
          } else {
            toast.error(data.mensaje || 'Error de validación')
          }
          break
          
        case 429:
          // RATE LIMITING - Demasiadas peticiones
          toast.error('Demasiadas solicitudes. Intenta de nuevo más tarde')
          break
          
        case 500:
          // ERROR INTERNO DEL SERVIDOR
          toast.error('Error interno del servidor. Intenta de nuevo más tarde')
          break
          
        default:
          // OTROS ERRORES HTTP
          toast.error(data.mensaje || `Error ${status}`)
      }
    } else if (error.request) {
      // ERROR DE RED - Sin respuesta del servidor
      toast.error('Error de conexión. Verifica tu conexión a internet')
    } else {
      // ERROR DE CONFIGURACIÓN - Error en la configuración de la petición
      toast.error('Error inesperado')
    }
    
    return Promise.reject(error)
  }
)

// MÉTODOS DE CONVENIENCIA
// Funciones wrapper para simplificar el uso de la API
export const apiMethods = {
  // GET request - Obtener datos
  get: (url, config = {}) => api.get(url, config),
  
  // POST request - Crear nuevos recursos
  post: (url, data = {}, config = {}) => api.post(url, data, config),
  
  // PUT request - Actualizar recursos completos
  put: (url, data = {}, config = {}) => api.put(url, data, config),
  
  // PATCH request - Actualizar recursos parcialmente
  patch: (url, data = {}, config = {}) => api.patch(url, data, config),
  
  // DELETE request - Eliminar recursos
  delete: (url, config = {}) => api.delete(url, config),
  
  // UPLOAD FILE - Subir archivos con FormData
  upload: (url, formData, config = {}) => {
    return api.post(url, formData, {
      ...config,
      headers: {
        ...config.headers,
        'Content-Type': 'multipart/form-data'
      }
    })
  },
  
  // DOWNLOAD FILE - Descargar archivos como blob
  download: (url, config = {}) => {
    return api.get(url, {
      ...config,
      responseType: 'blob'
    })
  }
}

// FUNCIONES ESPECÍFICAS PARA ENDPOINTS

// API DE AUTENTICACIÓN - Manejo de sesiones y tokens
export const authAPI = {
  // Iniciar sesión con credenciales
  login: (credentials) => api.post('/auth/login', credentials),
  // Registrar nuevo usuario
  register: (userData) => api.post('/auth/usuarios/registrar', userData),
  // Cerrar sesión
  logout: () => api.post('/auth/logout'),
  // Renovar token de acceso
  refreshToken: (refreshToken) => api.post('/auth/refresh-token', { refreshToken }),
  // Verificar validez del token actual
  verifyToken: () => api.get('/auth/verify-token'),
  // Solicitar recuperación de contraseña
  forgotPassword: (email) => api.post('/auth/forgot-password', { email }),
  // Restablecer contraseña con token
  resetPassword: (resetData) => api.post('/auth/reset-password', resetData)
}

// API DE USUARIOS - Gestión de perfiles y usuarios
export const usersAPI = {
  // Obtener perfil del usuario actual
  getProfile: () => api.get('/usuarios/perfil'),
  // Actualizar perfil del usuario
  updateProfile: (data) => api.put('/usuarios/perfil', data),
  // Cambiar contraseña del usuario
  changePassword: (data) => api.put('/usuarios/cambiar-password', data),
  // Listar usuarios (admin)
  getUsers: (params) => api.get('/usuarios', { params }),
  // Obtener usuario específico por ID
  getUserById: (id) => api.get(`/usuarios/${id}`),
  // Actualizar usuario específico (admin)
  updateUser: (id, data) => api.put(`/usuarios/${id}`, data),
  // Desactivar usuario (admin)
  deactivateUser: (id) => api.patch(`/usuarios/${id}/desactivar`),
  // Reactivar usuario (admin)
  reactivateUser: (id) => api.patch(`/usuarios/${id}/reactivar`)
}

// API DE PEDIDOS - Gestión de órdenes y cotizaciones
export const ordersAPI = {
  // Listar pedidos del usuario con filtros
  getOrders: (params) => api.get('/pedidos', { params }),
  // Obtener pedido específico por ID
  getOrderById: (id) => api.get(`/pedidos/${id}`),
  // Crear nuevo pedido
  createOrder: (data) => api.post('/pedidos', data),
  // Actualizar estado del pedido (admin)
  updateOrderStatus: (id, data) => api.patch(`/pedidos/${id}/estado`, data),
  // Actualizar cotización del pedido (admin)
  updateOrderQuote: (id, data) => api.patch(`/pedidos/${id}/cotizacion`, data),
  // Obtener todos los pedidos (admin)
  getAllOrders: (params) => api.get('/pedidos/admin/todos', { params })
}

// API DE CATÁLOGO - Gestión de productos y muebles
export const catalogAPI = {
  // Listar productos con filtros y paginación
  getProducts: (params) => api.get('/catalogo', { params }),
  // Obtener producto específico por ID
  getProductById: (id) => api.get(`/catalogo/${id}`),
  // Crear nuevo producto (admin)
  createProduct: (data) => api.post('/catalogo', data),
  // Actualizar producto existente (admin)
  updateProduct: (id, data) => api.put(`/catalogo/${id}`, data),
  // Desactivar producto (admin)
  deactivateProduct: (id) => api.patch(`/catalogo/${id}/desactivar`),
  // Reactivar producto (admin)
  reactivateProduct: (id) => api.patch(`/catalogo/${id}/reactivar`),
  // Obtener opciones de filtros disponibles
  getFilterOptions: () => api.get('/catalogo/filtros'),
  // Obtener estadísticas del catálogo (admin)
  getStatistics: () => api.get('/catalogo/estadisticas')
}

// API DE RECOMENDACIONES - Gestión de IA y sugerencias
export const recommendationsAPI = {
  // Listar recomendaciones del usuario
  getRecommendations: (params) => api.get('/recomendaciones', { params }),
  // Obtener recomendación específica por ID
  getRecommendationById: (id) => api.get(`/recomendaciones/${id}`),
  // Crear nueva recomendación con IA
  createRecommendation: (data) => api.post('/recomendaciones', data),
  // Actualizar recomendación existente
  updateRecommendation: (id, data) => api.put(`/recomendaciones/${id}`, data),
  // Obtener todas las recomendaciones (admin)
  getAllRecommendations: (params) => api.get('/recomendaciones/admin/todas', { params }),
  // Obtener recomendaciones específicas de un pedido
  getOrderRecommendations: (orderId) => api.get(`/recomendaciones/pedido/${orderId}`),
  // Obtener estadísticas de recomendaciones (admin)
  getStatistics: () => api.get('/recomendaciones/estadisticas')
}

// API DE NOTIFICACIONES - Gestión de alertas y mensajes
export const notificationsAPI = {
  // Listar notificaciones del usuario con filtros
  getNotifications: (params) => api.get('/notificaciones', { params }),
  // Marcar notificación específica como leída
  markAsRead: (id) => api.patch(`/notificaciones/${id}/leida`),
  // Marcar todas las notificaciones como leídas
  markAllAsRead: () => api.patch('/notificaciones/marcar-todas-leidas'),
  // Obtener preferencias de notificaciones
  getPreferences: () => api.get('/notificaciones/preferencias'),
  // Actualizar preferencias de notificaciones
  updatePreferences: (data) => api.put('/notificaciones/preferencias', data),
  // Enviar notificación (admin)
  sendNotification: (data) => api.post('/notificaciones/enviar', data),
  // Obtener todas las notificaciones (admin)
  getAllNotifications: (params) => api.get('/notificaciones/admin/todas', { params }),
  // Obtener estadísticas de notificaciones (admin)
  getStatistics: () => api.get('/notificaciones/estadisticas')
}

// EXPORTACIÓN POR DEFECTO - Instancia principal de Axios configurada
export default api