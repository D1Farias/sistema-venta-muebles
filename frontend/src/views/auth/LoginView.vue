<template>
  <!-- Contenedor principal de la página de login con diseño centrado -->
  <div class="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
    <div class="max-w-md w-full space-y-8">
      <!-- Header con icono y título -->
      <div>
        <!-- Icono de candado para representar seguridad -->
        <div class="mx-auto h-12 w-12 flex items-center justify-center rounded-full bg-primary-100">
          <svg class="h-6 w-6 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
        </div>
        <!-- Título principal de la página -->
        <h2 class="mt-6 text-center text-3xl font-extrabold text-gray-900">
          Iniciar Sesión
        </h2>
        <!-- Enlace alternativo para crear cuenta nueva -->
        <p class="mt-2 text-center text-sm text-gray-600">
          O
          <router-link to="/auth/register" class="font-medium text-primary-600 hover:text-primary-500 transition-colors">
            crear una cuenta nueva
          </router-link>
        </p>
      </div>

      <!-- Formulario de login con prevención de envío por defecto -->
      <form class="mt-8 space-y-6" @submit.prevent="handleLogin">
        <div class="space-y-4">
          <!-- Campo de email con validación -->
          <div class="input-group">
            <label for="email" class="input-label">
              Correo Electrónico
            </label>
            <input
              id="email"
              v-model="form.email"
              type="email"
              autocomplete="email"
              required
              class="input-field"
              :class="{ 'border-red-300 focus:ring-red-500': errors.email }"
              placeholder="tu@ejemplo.com"
            />
            <p v-if="errors.email" class="input-error">
              {{ errors.email }}
            </p>
          </div>

          <!-- Contraseña -->
          <div class="input-group">
            <label for="password" class="input-label">
              Contraseña
            </label>
            <div class="relative">
              <input
                id="password"
                v-model="form.password"
                :type="showPassword ? 'text' : 'password'"
                autocomplete="current-password"
                required
                class="input-field pr-10"
                :class="{ 'border-red-300 focus:ring-red-500': errors.password }"
                placeholder="••••••••"
              />
              <button
                type="button"
                class="absolute inset-y-0 right-0 pr-3 flex items-center"
                @click="showPassword = !showPassword"
              >
                <svg v-if="showPassword" class="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                </svg>
                <svg v-else class="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              </button>
            </div>
            <p v-if="errors.password" class="input-error">
              {{ errors.password }}
            </p>
          </div>
        </div>

        <!-- Recordar y Olvidé contraseña -->
        <div class="flex items-center justify-between">
          <div class="flex items-center">
            <input
              id="remember-me"
              v-model="form.remember"
              type="checkbox"
              class="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
            />
            <label for="remember-me" class="ml-2 block text-sm text-gray-900">
              Recordarme
            </label>
          </div>

          <div class="text-sm">
            <router-link to="/auth/forgot-password" class="font-medium text-primary-600 hover:text-primary-500 transition-colors">
              ¿Olvidaste tu contraseña?
            </router-link>
          </div>
        </div>

        <!-- Botón de envío -->
        <div>
          <button
            type="submit"
            :disabled="isLoading"
            class="btn-primary w-full flex justify-center py-3 px-4 text-sm font-medium"
            :class="{ 'opacity-50 cursor-not-allowed': isLoading }"
          >
            <svg v-if="isLoading" class="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            {{ isLoading ? 'Iniciando sesión...' : 'Iniciar Sesión' }}
          </button>
        </div>

        <!-- Error general -->
        <div v-if="errors.general" class="alert-error">
          <div class="flex">
            <div class="flex-shrink-0">
              <svg class="h-5 w-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
              </svg>
            </div>
            <div class="ml-3">
              <p class="text-sm">{{ errors.general }}</p>
            </div>
          </div>
        </div>
      </form>

      <!-- Enlaces adicionales -->
      <div class="text-center">
        <p class="text-sm text-gray-600">
          ¿No tienes una cuenta?
          <router-link to="/register" class="font-medium text-primary-600 hover:text-primary-500 transition-colors">
            Regístrate aquí
          </router-link>
        </p>
      </div>
    </div>
  </div>
</template>

<script setup>
// IMPORTS - Dependencias necesarias para el componente
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useToast } from 'vue-toastification'

// COMPOSABLES - Instancias de los composables necesarios
const router = useRouter()
const authStore = useAuthStore()
const toast = useToast()

// ESTADO DEL FORMULARIO - Datos reactivos del formulario de login
const form = reactive({
  email: '',
  password: '',
  remember: false // Checkbox para recordar sesión
})

// ESTADO DE LA UI - Variables reactivas para controlar la interfaz
const isLoading = ref(false) // Indicador de carga durante el login
const showPassword = ref(false) // Toggle para mostrar/ocultar contraseña

// ERRORES - Objeto reactivo para manejar errores de validación
const errors = reactive({
  email: '',
  password: '',
  general: '' // Errores generales del servidor
})

// VALIDACIÓN DEL FORMULARIO - Función para validar los datos antes del envío
const validateForm = () => {
  // Limpiar errores previos
  Object.keys(errors).forEach(key => {
    errors[key] = ''
  })

  let isValid = true

  // Validar email - Verificar que existe y tiene formato válido
  if (!form.email) {
    errors.email = 'El correo electrónico es requerido'
    isValid = false
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
    errors.email = 'El correo electrónico no es válido'
    isValid = false
  }

  // Validar contraseña - Verificar que existe y tiene longitud mínima
  if (!form.password) {
    errors.password = 'La contraseña es requerida'
    isValid = false
  } else if (form.password.length < 6) {
    errors.password = 'La contraseña debe tener al menos 6 caracteres'
    isValid = false
  }

  return isValid
}

// MANEJAR LOGIN - Función principal para procesar el inicio de sesión
const handleLogin = async () => {
  // Validar formulario antes de proceder
  if (!validateForm()) {
    return
  }

  // Activar estado de carga y limpiar errores
  isLoading.value = true
  errors.general = ''

  try {
    // Llamar al store de autenticación para hacer login
    await authStore.login({
      email: form.email,
      password: form.password,
      remember: form.remember
    })

    // Mostrar mensaje de éxito
    toast.success('¡Bienvenido! Has iniciado sesión correctamente')
    
    // Redirigir al dashboard o página anterior (si existe en query params)
    const redirectTo = router.currentRoute.value.query.redirect || '/dashboard'
    router.push(redirectTo)
  } catch (error) {
    console.error('Error en login:', error)
    
    // Manejar diferentes tipos de errores del servidor
    if (error.response?.status === 401) {
      errors.general = 'Credenciales incorrectas. Verifica tu email y contraseña.'
    } else if (error.response?.status === 422) {
      // Errores de validación del servidor
      const serverErrors = error.response.data.errors || {}
      Object.keys(serverErrors).forEach(field => {
        if (errors.hasOwnProperty(field)) {
          errors[field] = serverErrors[field][0] || serverErrors[field]
        }
      })
    } else {
      errors.general = 'Error al iniciar sesión. Por favor, inténtalo de nuevo.'
    }
  } finally {
    // Desactivar estado de carga
    isLoading.value = false
  }
}

// LIMPIAR ERRORES - Función para limpiar errores de campos específicos
const clearFieldError = (field) => {
  if (errors[field]) {
    errors[field] = ''
  }
}

// WATCHERS - Observadores para limpiar errores cuando el usuario escribe
import { watch } from 'vue'

watch(() => form.email, () => clearFieldError('email'))
watch(() => form.password, () => clearFieldError('password'))
</script>