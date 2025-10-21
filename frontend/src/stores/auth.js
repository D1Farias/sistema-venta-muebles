// IMPORTS - Importación de dependencias necesarias
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import api from '@/services/api'
import { useToast } from 'vue-toastification'

// STORE DE AUTENTICACIÓN - Gestión centralizada del estado de autenticación
export const useAuthStore = defineStore('auth', () => {
  const toast = useToast()
  
  // ESTADO REACTIVO - Variables de estado para la autenticación
  const user = ref(null)                                    // Datos del usuario autenticado
  const token = ref(localStorage.getItem('token'))          // Token JWT de acceso
  const refreshToken = ref(localStorage.getItem('refreshToken')) // Token para renovar acceso
  const isLoading = ref(false)                              // Estado de carga para operaciones async
  
  // COMPUTED PROPERTIES - Propiedades calculadas basadas en el estado
  const isAuthenticated = computed(() => !!token.value && !!user.value) // Usuario está autenticado
  const isAdmin = computed(() => user.value?.rol === 'administrador')    // Usuario es administrador
  const userName = computed(() => user.value?.nombre || '')              // Nombre del usuario
  const userEmail = computed(() => user.value?.email || '')              // Email del usuario
  
  // ACCIONES - Funciones para manejar la autenticación
  
  // FUNCIÓN DE LOGIN - Iniciar sesión con credenciales
  const login = async (credentials) => {
    try {
      isLoading.value = true
      const response = await api.post('/auth/login', credentials)
      
      const { token: accessToken, refreshToken: newRefreshToken, usuario } = response.data
      
      // GUARDAR TOKENS Y USUARIO en el estado
      token.value = accessToken
      refreshToken.value = newRefreshToken
      user.value = usuario
      
      // PERSISTIR TOKENS en localStorage para mantener sesión
      localStorage.setItem('token', accessToken)
      localStorage.setItem('refreshToken', newRefreshToken)
      
      // CONFIGURAR TOKEN en headers de API para futuras peticiones
      api.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`
      
      toast.success(`¡Bienvenido, ${usuario.nombre}!`)
      
      return { success: true, user: usuario }
    } catch (error) {
      const message = error.response?.data?.mensaje || 'Error al iniciar sesión'
      toast.error(message)
      return { success: false, error: message }
    } finally {
      isLoading.value = false
    }
  }
  
  // FUNCIÓN DE REGISTRO - Crear nueva cuenta de usuario
  const register = async (userData) => {
    try {
      isLoading.value = true
      const response = await api.post('/auth/usuarios/registrar', userData)
      
      const { token: accessToken, refreshToken: newRefreshToken, usuario } = response.data
      
      // GUARDAR TOKENS Y USUARIO tras registro exitoso
      token.value = accessToken
      refreshToken.value = newRefreshToken
      user.value = usuario
      
      // PERSISTIR TOKENS en localStorage
      localStorage.setItem('token', accessToken)
      localStorage.setItem('refreshToken', newRefreshToken)
      
      // CONFIGURAR TOKEN en headers de API
      api.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`
      
      toast.success('¡Registro exitoso! Bienvenido al sistema')
      
      return { success: true, user: usuario }
    } catch (error) {
      const message = error.response?.data?.mensaje || 'Error al registrarse'
      toast.error(message)
      return { success: false, error: message }
    } finally {
      isLoading.value = false
    }
  }
  
  // FUNCIÓN DE LOGOUT - Cerrar sesión y limpiar estado
  const logout = async () => {
    try {
      // INTENTAR LOGOUT en el servidor para invalidar token
      if (token.value) {
        await api.post('/auth/logout')
      }
    } catch (error) {
      console.warn('Error al hacer logout en el servidor:', error)
    } finally {
      // LIMPIAR ESTADO LOCAL independientemente del resultado del servidor
      user.value = null
      token.value = null
      refreshToken.value = null
      
      // LIMPIAR PERSISTENCIA en localStorage
      localStorage.removeItem('token')
      localStorage.removeItem('refreshToken')
      
      // LIMPIAR HEADER de autorización en API
      delete api.defaults.headers.common['Authorization']
      
      toast.info('Sesión cerrada correctamente')
    }
  }
  
  // FUNCIÓN DE VERIFICACIÓN - Validar token actual con el servidor
  const verifyToken = async () => {
    try {
      if (!token.value) {
        throw new Error('No hay token disponible')
      }
      
      const response = await api.get('/auth/verify-token')
      user.value = response.data.usuario
      
      return { success: true, user: response.data.usuario }
    } catch (error) {
      // TOKEN INVÁLIDO - Intentar renovar con refresh token
      if (refreshToken.value) {
        return await refreshAccessToken()
      }
      
      // NO SE PUEDE VERIFICAR - Hacer logout automático
      await logout()
      throw error
    }
  }
  
  // FUNCIÓN DE RENOVACIÓN - Obtener nuevo token de acceso
  const refreshAccessToken = async () => {
    try {
      if (!refreshToken.value) {
        throw new Error('No hay refresh token disponible')
      }
      
      const response = await api.post('/auth/refresh-token', {
        refreshToken: refreshToken.value
      })
      
      const { token: newAccessToken, usuario } = response.data
      
      // ACTUALIZAR TOKEN de acceso
      token.value = newAccessToken
      user.value = usuario
      
      // PERSISTIR NUEVO TOKEN
      localStorage.setItem('token', newAccessToken)
      
      // CONFIGURAR NUEVO TOKEN en headers de API
      api.defaults.headers.common['Authorization'] = `Bearer ${newAccessToken}`
      
      return { success: true, user: usuario }
    } catch (error) {
      // REFRESH TOKEN INVÁLIDO - Hacer logout automático
      await logout()
      throw error
    }
  }
  
  // FUNCIÓN DE ACTUALIZACIÓN DE PERFIL - Modificar datos del usuario
  const updateProfile = async (profileData) => {
    try {
      isLoading.value = true
      const response = await api.put('/usuarios/perfil', profileData)
      
      // ACTUALIZAR DATOS del usuario en el estado
      user.value = { ...user.value, ...response.data.usuario }
      toast.success('Perfil actualizado correctamente')
      
      return { success: true, user: user.value }
    } catch (error) {
      const message = error.response?.data?.mensaje || 'Error al actualizar perfil'
      toast.error(message)
      return { success: false, error: message }
    } finally {
      isLoading.value = false
    }
  }
  
  // FUNCIÓN DE CAMBIO DE CONTRASEÑA - Actualizar contraseña del usuario
  const changePassword = async (passwordData) => {
    try {
      isLoading.value = true
      await api.put('/usuarios/cambiar-password', passwordData)
      
      toast.success('Contraseña cambiada correctamente')
      return { success: true }
    } catch (error) {
      const message = error.response?.data?.mensaje || 'Error al cambiar contraseña'
      toast.error(message)
      return { success: false, error: message }
    } finally {
      isLoading.value = false
    }
  }
  
  // FUNCIÓN DE RECUPERACIÓN - Solicitar enlace de recuperación de contraseña
  const forgotPassword = async (email) => {
    try {
      isLoading.value = true
      await api.post('/auth/forgot-password', { email })
      
      toast.success('Se ha enviado un enlace de recuperación a tu correo')
      return { success: true }
    } catch (error) {
      const message = error.response?.data?.mensaje || 'Error al enviar correo de recuperación'
      toast.error(message)
      return { success: false, error: message }
    } finally {
      isLoading.value = false
    }
  }
  
  // FUNCIÓN DE RESTABLECIMIENTO - Restablecer contraseña con token
  const resetPassword = async (resetData) => {
    try {
      isLoading.value = true
      await api.post('/auth/reset-password', resetData)
      
      toast.success('Contraseña restablecida correctamente')
      return { success: true }
    } catch (error) {
      const message = error.response?.data?.mensaje || 'Error al restablecer contraseña'
      toast.error(message)
      return { success: false, error: message }
    } finally {
      isLoading.value = false
    }
  }
  
  // FUNCIÓN DE INICIALIZACIÓN - Configurar store al cargar la aplicación
  const initialize = async () => {
    if (token.value) {
      // CONFIGURAR TOKEN en headers de API si existe
      api.defaults.headers.common['Authorization'] = `Bearer ${token.value}`
      
      // VERIFICAR VALIDEZ del token al inicializar
      try {
        await verifyToken()
      } catch (error) {
        console.warn('Token inválido al inicializar:', error)
      }
    }
  }
  
  // EXPORTACIÓN DEL STORE - Retornar estado y acciones disponibles
  return {
    // ESTADO REACTIVO
    user,
    token,
    refreshToken,
    isLoading,
    
    // PROPIEDADES COMPUTADAS
    isAuthenticated,
    isAdmin,
    userName,
    userEmail,
    
    // ACCIONES DISPONIBLES
    login,
    register,
    logout,
    verifyToken,
    refreshAccessToken,
    updateProfile,
    changePassword,
    forgotPassword,
    resetPassword,
    initialize
  }
})