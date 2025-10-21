<template>
  <!-- Contenedor principal de la página de registro con diseño centrado -->
  <div class="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
    <div class="max-w-md w-full space-y-8">
      <!-- Header con icono y título -->
      <div>
        <!-- Icono de usuario con símbolo de agregar para representar registro -->
        <div class="mx-auto h-12 w-12 flex items-center justify-center rounded-full bg-primary-100">
          <svg class="h-6 w-6 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
          </svg>
        </div>
        <!-- Título principal de la página -->
        <h2 class="mt-6 text-center text-3xl font-extrabold text-gray-900">
          Crear Cuenta
        </h2>
        <!-- Enlace alternativo para iniciar sesión -->
        <p class="mt-2 text-center text-sm text-gray-600">
          O
          <router-link to="/auth/login" class="font-medium text-primary-600 hover:text-primary-500 transition-colors">
            iniciar sesión con tu cuenta existente
          </router-link>
        </p>
      </div>

      <!-- Formulario de registro con prevención de envío por defecto -->
      <form class="mt-8 space-y-6" @submit.prevent="handleRegister">
        <div class="space-y-4">
          <!-- Campo de nombre completo -->
          <div class="input-group">
            <label for="nombre" class="input-label">
              Nombre Completo
            </label>
            <input
              id="nombre"
              v-model="form.nombre"
              type="text"
              autocomplete="name"
              required
              class="input-field"
              :class="{ 'border-red-300 focus:ring-red-500': errors.nombre }"
              placeholder="Tu nombre completo"
            />
            <p v-if="errors.nombre" class="input-error">
              {{ errors.nombre }}
            </p>
          </div>

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

          <!-- Campo de teléfono (opcional) -->
          <div class="input-group">
            <label for="telefono" class="input-label">
              Teléfono
            </label>
            <input
              id="telefono"
              v-model="form.telefono"
              type="tel"
              autocomplete="tel"
              class="input-field"
              :class="{ 'border-red-300 focus:ring-red-500': errors.telefono }"
              placeholder="+1 (555) 123-4567"
            />
            <p v-if="errors.telefono" class="input-error">
              {{ errors.telefono }}
            </p>
          </div>

          <!-- Campo de contraseña con indicador de fortaleza -->
          <div class="input-group">
            <label for="password" class="input-label">
              Contraseña
            </label>
            <div class="relative">
              <input
                id="password"
                v-model="form.password"
                :type="showPassword ? 'text' : 'password'"
                autocomplete="new-password"
                required
                class="input-field pr-10"
                :class="{ 'border-red-300 focus:ring-red-500': errors.password }"
                placeholder="••••••••"
              />
              <!-- Botón para mostrar/ocultar contraseña -->
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
            <!-- Indicador de fortaleza de contraseña -->
            <div v-if="form.password" class="mt-2">
              <div class="flex items-center space-x-2">
                <div class="flex-1 bg-gray-200 rounded-full h-2">
                  <div 
                    class="h-2 rounded-full transition-all duration-300"
                    :class="passwordStrengthColor"
                    :style="{ width: passwordStrengthWidth }"
                  ></div>
                </div>
                <span class="text-xs font-medium" :class="passwordStrengthColor.replace('bg-', 'text-')">
                  {{ passwordStrengthText }}
                </span>
              </div>
            </div>
          </div>

          <!-- Campo de confirmación de contraseña con toggle de visibilidad -->
          <div class="input-group">
            <label for="password_confirmation" class="input-label">
              Confirmar Contraseña
            </label>
            <div class="relative">
              <input
                id="password_confirmation"
                v-model="form.password_confirmation"
                :type="showPasswordConfirm ? 'text' : 'password'"
                autocomplete="new-password"
                required
                class="input-field pr-10"
                :class="{ 'border-red-300 focus:ring-red-500': errors.password_confirmation }"
                placeholder="••••••••"
              />
              <!-- Botón para mostrar/ocultar confirmación de contraseña -->
              <button
                type="button"
                class="absolute inset-y-0 right-0 pr-3 flex items-center"
                @click="showPasswordConfirm = !showPasswordConfirm"
              >
                <!-- Icono de ojo tachado cuando la contraseña es visible -->
                <svg v-if="showPasswordConfirm" class="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                </svg>
                <!-- Icono de ojo normal cuando la contraseña está oculta -->
                <svg v-else class="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              </button>
            </div>
            <!-- Mensaje de error específico para confirmación de contraseña -->
            <p v-if="errors.password_confirmation" class="input-error">
              {{ errors.password_confirmation }}
            </p>
          </div>
        </div>

        <!-- Sección de términos y condiciones obligatorios -->
        <div class="flex items-start">
          <div class="flex items-center h-5">
            <!-- Checkbox para aceptar términos y condiciones -->
            <input
              id="terms"
              v-model="form.acceptTerms"
              type="checkbox"
              required
              class="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
              :class="{ 'border-red-300': errors.acceptTerms }"
            />
          </div>
          <div class="ml-3 text-sm">
            <!-- Etiqueta con enlaces a términos y política de privacidad -->
            <label for="terms" class="text-gray-700">
              Acepto los
              <a href="#" class="font-medium text-primary-600 hover:text-primary-500 transition-colors">
                términos y condiciones
              </a>
              y la
              <a href="#" class="font-medium text-primary-600 hover:text-primary-500 transition-colors">
                política de privacidad
              </a>
            </label>
            <!-- Error específico para términos y condiciones -->
            <p v-if="errors.acceptTerms" class="input-error mt-1">
              {{ errors.acceptTerms }}
            </p>
          </div>
        </div>

        <!-- Botón de envío del formulario con estado de carga -->
        <div>
          <button
            type="submit"
            :disabled="isLoading"
            class="btn-primary w-full flex justify-center py-3 px-4 text-sm font-medium"
            :class="{ 'opacity-50 cursor-not-allowed': isLoading }"
          >
            <!-- Spinner de carga cuando se está procesando el registro -->
            <svg v-if="isLoading" class="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <!-- Texto dinámico del botón según el estado de carga -->
            {{ isLoading ? 'Creando cuenta...' : 'Crear Cuenta' }}
          </button>
        </div>

        <!-- Alerta de error general del formulario -->
        <div v-if="errors.general" class="alert-error">
          <div class="flex">
            <div class="flex-shrink-0">
              <!-- Icono de error -->
              <svg class="h-5 w-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
              </svg>
            </div>
            <div class="ml-3">
              <!-- Mensaje de error general -->
              <p class="text-sm">{{ errors.general }}</p>
            </div>
          </div>
        </div>
      </form>

      <!-- Enlaces adicionales para navegación -->
      <div class="text-center">
        <p class="text-sm text-gray-600">
          ¿Ya tienes una cuenta?
          <!-- Enlace para redirigir al login -->
          <router-link to="/login" class="font-medium text-primary-600 hover:text-primary-500 transition-colors">
            Inicia sesión aquí
          </router-link>
        </p>
      </div>
    </div>
  </div>
</template>

<script setup>
// IMPORTS - Importación de dependencias de Vue y librerías externas
import { ref, reactive, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useToast } from 'vue-toastification'

// COMPOSABLES - Inicialización de composables y stores
const router = useRouter()
const authStore = useAuthStore()
const toast = useToast()

// ESTADO DEL FORMULARIO - Datos reactivos del formulario de registro
const form = reactive({
  nombre: '',
  email: '',
  telefono: '',
  password: '',
  password_confirmation: '',
  acceptTerms: false
})

// ESTADO DE LA UI - Variables reactivas para controlar la interfaz
const isLoading = ref(false)
const showPassword = ref(false)
const showPasswordConfirm = ref(false)

// MANEJO DE ERRORES - Objeto reactivo para almacenar errores de validación
const errors = reactive({
  nombre: '',
  email: '',
  telefono: '',
  password: '',
  password_confirmation: '',
  acceptTerms: '',
  general: ''
})

// COMPUTED PROPERTIES - Propiedades computadas para la fortaleza de contraseña

// Calcula la fortaleza de la contraseña basada en varios criterios
const passwordStrength = computed(() => {
  const password = form.password
  if (!password) return 0

  let score = 0
  
  // Criterios de longitud
  if (password.length >= 8) score += 1
  if (password.length >= 12) score += 1
  
  // Criterios de caracteres
  if (/[a-z]/.test(password)) score += 1  // Minúsculas
  if (/[A-Z]/.test(password)) score += 1  // Mayúsculas
  if (/[0-9]/.test(password)) score += 1  // Números
  if (/[^A-Za-z0-9]/.test(password)) score += 1  // Caracteres especiales

  return Math.min(score, 4)
})

// Texto descriptivo de la fortaleza de la contraseña
const passwordStrengthText = computed(() => {
  switch (passwordStrength.value) {
    case 0:
    case 1: return 'Débil'
    case 2: return 'Regular'
    case 3: return 'Buena'
    case 4: return 'Fuerte'
    default: return ''
  }
})

// Color del indicador de fortaleza de contraseña
const passwordStrengthColor = computed(() => {
  switch (passwordStrength.value) {
    case 0:
    case 1: return 'bg-red-500'
    case 2: return 'bg-yellow-500'
    case 3: return 'bg-blue-500'
    case 4: return 'bg-green-500'
    default: return 'bg-gray-300'
  }
})

// Ancho de la barra de progreso de fortaleza de contraseña
const passwordStrengthWidth = computed(() => {
  return `${(passwordStrength.value / 4) * 100}%`
})

// FUNCIONES DE VALIDACIÓN

// Función principal de validación del formulario
const validateForm = () => {
  // Limpiar errores previos
  Object.keys(errors).forEach(key => {
    errors[key] = ''
  })

  let isValid = true

  // Validar nombre completo
  if (!form.nombre.trim()) {
    errors.nombre = 'El nombre es requerido'
    isValid = false
  } else if (form.nombre.trim().length < 2) {
    errors.nombre = 'El nombre debe tener al menos 2 caracteres'
    isValid = false
  }

  // Validar email con expresión regular
  if (!form.email) {
    errors.email = 'El correo electrónico es requerido'
    isValid = false
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
    errors.email = 'El correo electrónico no es válido'
    isValid = false
  }

  // Validar teléfono (opcional pero debe ser válido si se proporciona)
  if (form.telefono && !/^[\+]?[1-9][\d]{0,15}$/.test(form.telefono.replace(/\s/g, ''))) {
    errors.telefono = 'El teléfono no es válido'
    isValid = false
  }

  // Validar contraseña con criterios de seguridad
  if (!form.password) {
    errors.password = 'La contraseña es requerida'
    isValid = false
  } else if (form.password.length < 8) {
    errors.password = 'La contraseña debe tener al menos 8 caracteres'
    isValid = false
  } else if (passwordStrength.value < 2) {
    errors.password = 'La contraseña es muy débil. Incluye mayúsculas, minúsculas y números'
    isValid = false
  }

  // Validar confirmación de contraseña
  if (!form.password_confirmation) {
    errors.password_confirmation = 'Debes confirmar tu contraseña'
    isValid = false
  } else if (form.password !== form.password_confirmation) {
    errors.password_confirmation = 'Las contraseñas no coinciden'
    isValid = false
  }

  // Validar aceptación de términos y condiciones
  if (!form.acceptTerms) {
    errors.acceptTerms = 'Debes aceptar los términos y condiciones'
    isValid = false
  }

  return isValid
}

// FUNCIÓN PRINCIPAL DE REGISTRO

// Maneja el proceso de registro del usuario
const handleRegister = async () => {
  // Validar formulario antes de enviar
  if (!validateForm()) {
    return
  }

  isLoading.value = true
  errors.general = ''

  try {
    // Llamar al store de autenticación para registrar usuario
    await authStore.register({
      nombre: form.nombre.trim(),
      email: form.email.toLowerCase().trim(),
      telefono: form.telefono.trim() || null,
      password: form.password,
      password_confirmation: form.password_confirmation
    })

    // Mostrar mensaje de éxito
    toast.success('¡Cuenta creada exitosamente! Bienvenido')
    
    // Redirigir al dashboard después del registro exitoso
    router.push('/dashboard')
  } catch (error) {
    console.error('Error en registro:', error)
    
    if (error.response?.status === 422) {
      // Manejar errores de validación del servidor
      const serverErrors = error.response.data.errors || {}
      Object.keys(serverErrors).forEach(field => {
        if (errors.hasOwnProperty(field)) {
          errors[field] = Array.isArray(serverErrors[field]) 
            ? serverErrors[field][0] 
            : serverErrors[field]
        }
      })
      
      // Manejar error específico de email duplicado
      if (serverErrors.email && serverErrors.email.includes('already been taken')) {
        errors.email = 'Este correo electrónico ya está registrado'
      }
    } else {
      // Error general del servidor
      errors.general = 'Error al crear la cuenta. Por favor, inténtalo de nuevo.'
    }
  } finally {
    isLoading.value = false
  }
}

// FUNCIONES AUXILIARES

// Función para limpiar errores específicos de campos
const clearFieldError = (field) => {
  if (errors[field]) {
    errors[field] = ''
  }
}

// WATCHERS - Observadores para limpiar errores cuando el usuario escribe
import { watch } from 'vue'

watch(() => form.nombre, () => clearFieldError('nombre'))
watch(() => form.email, () => clearFieldError('email'))
watch(() => form.telefono, () => clearFieldError('telefono'))
watch(() => form.password, () => clearFieldError('password'))
watch(() => form.password_confirmation, () => clearFieldError('password_confirmation'))
watch(() => form.acceptTerms, () => clearFieldError('acceptTerms'))
</script>