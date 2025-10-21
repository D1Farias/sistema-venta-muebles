<template>
  <div class="container-custom section-padding">
    <!-- Header -->
    <div class="mb-8">
      <h1 class="text-3xl font-bold text-gray-900">Mi Perfil</h1>
      <p class="mt-2 text-gray-600">
        Gestiona tu información personal y configuraciones de cuenta
      </p>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <!-- Sidebar de navegación -->
      <div class="lg:col-span-1">
        <nav class="space-y-1">
          <button
            v-for="tab in tabs"
            :key="tab.id"
            @click="activeTab = tab.id"
            :class="[
              'w-full flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors',
              activeTab === tab.id
                ? 'bg-primary-100 text-primary-700 border-r-2 border-primary-500'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
            ]"
          >
            <component :is="tab.icon" class="flex-shrink-0 -ml-1 mr-3 h-5 w-5" />
            {{ tab.name }}
          </button>
        </nav>
      </div>

      <!-- Contenido principal -->
      <div class="lg:col-span-2">
        <!-- Información Personal -->
        <div v-if="activeTab === 'personal'" class="card">
          <div class="card-header">
            <h2 class="text-xl font-semibold text-gray-900">Información Personal</h2>
            <p class="text-sm text-gray-600 mt-1">
              Actualiza tu información personal y de contacto
            </p>
          </div>
          
          <div class="card-body">
            <form @submit.prevent="updateProfile" class="space-y-6">
              <!-- Avatar -->
              <div class="flex items-center space-x-6">
                <div class="flex-shrink-0">
                  <img
                    :src="profileForm.avatar_url || '/default-avatar.png'"
                    :alt="profileForm.nombre_completo"
                    class="h-20 w-20 rounded-full object-cover"
                  />
                </div>
                <div>
                  <label for="avatar" class="btn-secondary cursor-pointer">
                    Cambiar foto
                    <input
                      id="avatar"
                      type="file"
                      accept="image/*"
                      class="sr-only"
                      @change="handleAvatarChange"
                    />
                  </label>
                  <p class="text-xs text-gray-500 mt-1">
                    JPG, PNG o GIF. Máximo 2MB.
                  </p>
                </div>
              </div>

              <!-- Nombre completo -->
              <div class="form-group">
                <label for="nombre_completo" class="input-label">
                  Nombre completo *
                </label>
                <input
                  id="nombre_completo"
                  v-model="profileForm.nombre_completo"
                  type="text"
                  required
                  class="input-field"
                  :class="{ 'border-red-300 focus:ring-red-500': errors.nombre_completo }"
                />
                <p v-if="errors.nombre_completo" class="input-error">
                  {{ errors.nombre_completo }}
                </p>
              </div>

              <!-- Email -->
              <div class="form-group">
                <label for="email" class="input-label">
                  Correo electrónico *
                </label>
                <input
                  id="email"
                  v-model="profileForm.email"
                  type="email"
                  required
                  class="input-field"
                  :class="{ 'border-red-300 focus:ring-red-500': errors.email }"
                />
                <p v-if="errors.email" class="input-error">
                  {{ errors.email }}
                </p>
              </div>

              <!-- Teléfono -->
              <div class="form-group">
                <label for="telefono" class="input-label">
                  Teléfono
                </label>
                <input
                  id="telefono"
                  v-model="profileForm.telefono"
                  type="tel"
                  class="input-field"
                  :class="{ 'border-red-300 focus:ring-red-500': errors.telefono }"
                />
                <p v-if="errors.telefono" class="input-error">
                  {{ errors.telefono }}
                </p>
              </div>

              <!-- Dirección -->
              <div class="form-group">
                <label for="direccion" class="input-label">
                  Dirección
                </label>
                <textarea
                  id="direccion"
                  v-model="profileForm.direccion"
                  rows="3"
                  class="form-textarea"
                  :class="{ 'border-red-300 focus:ring-red-500': errors.direccion }"
                ></textarea>
                <p v-if="errors.direccion" class="input-error">
                  {{ errors.direccion }}
                </p>
              </div>

              <!-- Fecha de nacimiento -->
              <div class="form-group">
                <label for="fecha_nacimiento" class="input-label">
                  Fecha de nacimiento
                </label>
                <input
                  id="fecha_nacimiento"
                  v-model="profileForm.fecha_nacimiento"
                  type="date"
                  class="input-field"
                  :class="{ 'border-red-300 focus:ring-red-500': errors.fecha_nacimiento }"
                />
                <p v-if="errors.fecha_nacimiento" class="input-error">
                  {{ errors.fecha_nacimiento }}
                </p>
              </div>

              <!-- Botones -->
              <div class="flex justify-end space-x-3">
                <button
                  type="button"
                  @click="resetProfileForm"
                  class="btn-secondary"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  :disabled="isUpdatingProfile"
                  class="btn-primary"
                  :class="{ 'opacity-50 cursor-not-allowed': isUpdatingProfile }"
                >
                  <svg v-if="isUpdatingProfile" class="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  {{ isUpdatingProfile ? 'Guardando...' : 'Guardar Cambios' }}
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
          </div>
        </div>

        <!-- Seguridad -->
        <div v-if="activeTab === 'security'" class="card">
          <div class="card-header">
            <h2 class="text-xl font-semibold text-gray-900">Seguridad</h2>
            <p class="text-sm text-gray-600 mt-1">
              Gestiona tu contraseña y configuraciones de seguridad
            </p>
          </div>
          
          <div class="card-body">
            <form @submit.prevent="changePassword" class="space-y-6">
              <!-- Contraseña actual -->
              <div class="form-group">
                <label for="current_password" class="input-label">
                  Contraseña actual *
                </label>
                <input
                  id="current_password"
                  v-model="passwordForm.current_password"
                  type="password"
                  required
                  class="input-field"
                  :class="{ 'border-red-300 focus:ring-red-500': errors.current_password }"
                />
                <p v-if="errors.current_password" class="input-error">
                  {{ errors.current_password }}
                </p>
              </div>

              <!-- Nueva contraseña -->
              <div class="form-group">
                <label for="new_password" class="input-label">
                  Nueva contraseña *
                </label>
                <input
                  id="new_password"
                  v-model="passwordForm.new_password"
                  type="password"
                  required
                  class="input-field"
                  :class="{ 'border-red-300 focus:ring-red-500': errors.new_password }"
                />
                <p v-if="errors.new_password" class="input-error">
                  {{ errors.new_password }}
                </p>
                
                <!-- Indicador de fortaleza -->
                <div v-if="passwordForm.new_password" class="mt-2">
                  <div class="flex items-center space-x-2">
                    <div class="flex-1 bg-gray-200 rounded-full h-2">
                      <div
                        class="h-2 rounded-full transition-all duration-300"
                        :class="passwordStrengthClass"
                        :style="{ width: passwordStrengthPercentage + '%' }"
                      ></div>
                    </div>
                    <span class="text-xs font-medium" :class="passwordStrengthTextClass">
                      {{ passwordStrengthText }}
                    </span>
                  </div>
                </div>
              </div>

              <!-- Confirmar contraseña -->
              <div class="form-group">
                <label for="confirm_password" class="input-label">
                  Confirmar nueva contraseña *
                </label>
                <input
                  id="confirm_password"
                  v-model="passwordForm.confirm_password"
                  type="password"
                  required
                  class="input-field"
                  :class="{ 'border-red-300 focus:ring-red-500': errors.confirm_password }"
                />
                <p v-if="errors.confirm_password" class="input-error">
                  {{ errors.confirm_password }}
                </p>
              </div>

              <!-- Botones -->
              <div class="flex justify-end space-x-3">
                <button
                  type="button"
                  @click="resetPasswordForm"
                  class="btn-secondary"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  :disabled="isChangingPassword"
                  class="btn-primary"
                  :class="{ 'opacity-50 cursor-not-allowed': isChangingPassword }"
                >
                  <svg v-if="isChangingPassword" class="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  {{ isChangingPassword ? 'Cambiando...' : 'Cambiar Contraseña' }}
                </button>
              </div>
            </form>
          </div>
        </div>

        <!-- Notificaciones -->
        <div v-if="activeTab === 'notifications'" class="card">
          <div class="card-header">
            <h2 class="text-xl font-semibold text-gray-900">Notificaciones</h2>
            <p class="text-sm text-gray-600 mt-1">
              Configura cómo y cuándo quieres recibir notificaciones
            </p>
          </div>
          
          <div class="card-body">
            <form @submit.prevent="updateNotificationSettings" class="space-y-6">
              <!-- Notificaciones por email -->
              <div>
                <h3 class="text-lg font-medium text-gray-900 mb-4">Notificaciones por Email</h3>
                <div class="space-y-4">
                  <div
                    v-for="setting in emailNotificationSettings"
                    :key="setting.key"
                    class="flex items-center justify-between"
                  >
                    <div>
                      <h4 class="text-sm font-medium text-gray-900">{{ setting.title }}</h4>
                      <p class="text-sm text-gray-600">{{ setting.description }}</p>
                    </div>
                    <label class="relative inline-flex items-center cursor-pointer">
                      <input
                        v-model="notificationForm[setting.key]"
                        type="checkbox"
                        class="sr-only peer"
                      />
                      <div class="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                    </label>
                  </div>
                </div>
              </div>

              <!-- Notificaciones push -->
              <div>
                <h3 class="text-lg font-medium text-gray-900 mb-4">Notificaciones Push</h3>
                <div class="space-y-4">
                  <div
                    v-for="setting in pushNotificationSettings"
                    :key="setting.key"
                    class="flex items-center justify-between"
                  >
                    <div>
                      <h4 class="text-sm font-medium text-gray-900">{{ setting.title }}</h4>
                      <p class="text-sm text-gray-600">{{ setting.description }}</p>
                    </div>
                    <label class="relative inline-flex items-center cursor-pointer">
                      <input
                        v-model="notificationForm[setting.key]"
                        type="checkbox"
                        class="sr-only peer"
                      />
                      <div class="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                    </label>
                  </div>
                </div>
              </div>

              <!-- Botones -->
              <div class="flex justify-end space-x-3">
                <button
                  type="button"
                  @click="resetNotificationForm"
                  class="btn-secondary"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  :disabled="isUpdatingNotifications"
                  class="btn-primary"
                  :class="{ 'opacity-50 cursor-not-allowed': isUpdatingNotifications }"
                >
                  <svg v-if="isUpdatingNotifications" class="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  {{ isUpdatingNotifications ? 'Guardando...' : 'Guardar Configuración' }}
                </button>
              </div>
            </form>
          </div>
        </div>

        <!-- Privacidad -->
        <div v-if="activeTab === 'privacy'" class="card">
          <div class="card-header">
            <h2 class="text-xl font-semibold text-gray-900">Privacidad y Datos</h2>
            <p class="text-sm text-gray-600 mt-1">
              Gestiona tu privacidad y el uso de tus datos
            </p>
          </div>
          
          <div class="card-body space-y-6">
            <!-- Descargar datos -->
            <div class="border border-gray-200 rounded-lg p-4">
              <h3 class="text-lg font-medium text-gray-900 mb-2">Descargar mis datos</h3>
              <p class="text-sm text-gray-600 mb-4">
                Descarga una copia de todos tus datos personales almacenados en nuestra plataforma.
              </p>
              <button
                @click="downloadData"
                :disabled="isDownloadingData"
                class="btn-secondary"
                :class="{ 'opacity-50 cursor-not-allowed': isDownloadingData }"
              >
                <svg v-if="isDownloadingData" class="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                {{ isDownloadingData ? 'Preparando descarga...' : 'Descargar Datos' }}
              </button>
            </div>

            <!-- Eliminar cuenta -->
            <div class="border border-red-200 rounded-lg p-4 bg-red-50">
              <h3 class="text-lg font-medium text-red-900 mb-2">Eliminar cuenta</h3>
              <p class="text-sm text-red-700 mb-4">
                Una vez que elimines tu cuenta, no hay vuelta atrás. Por favor, asegúrate de que realmente quieres hacer esto.
              </p>
              <button
                @click="showDeleteAccountModal = true"
                class="btn-danger"
              >
                Eliminar mi cuenta
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal de confirmación para eliminar cuenta -->
    <div
      v-if="showDeleteAccountModal"
      class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50"
      @click="showDeleteAccountModal = false"
    >
      <div
        class="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white"
        @click.stop
      >
        <div class="mt-3 text-center">
          <div class="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
            <svg class="h-6 w-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h3 class="text-lg leading-6 font-medium text-gray-900 mt-4">Eliminar cuenta</h3>
          <div class="mt-2 px-7 py-3">
            <p class="text-sm text-gray-500">
              ¿Estás seguro de que quieres eliminar tu cuenta? Esta acción no se puede deshacer y perderás todos tus datos.
            </p>
            <div class="mt-4">
              <input
                v-model="deleteConfirmation"
                type="text"
                placeholder="Escribe 'ELIMINAR' para confirmar"
                class="input-field"
              />
            </div>
          </div>
          <div class="items-center px-4 py-3">
            <button
              @click="deleteAccount"
              :disabled="deleteConfirmation !== 'ELIMINAR' || isDeletingAccount"
              class="btn-danger w-full mb-2"
              :class="{ 'opacity-50 cursor-not-allowed': deleteConfirmation !== 'ELIMINAR' || isDeletingAccount }"
            >
              <svg v-if="isDeletingAccount" class="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              {{ isDeletingAccount ? 'Eliminando...' : 'Eliminar cuenta' }}
            </button>
            <button
              @click="showDeleteAccountModal = false"
              class="btn-secondary w-full"
            >
              Cancelar
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useToast } from 'vue-toastification'
import { useAuthStore } from '@/stores/auth'
import api from '@/services/api'

const router = useRouter()
const toast = useToast()
const authStore = useAuthStore()

// Estado
const activeTab = ref('personal')
const isUpdatingProfile = ref(false)
const isChangingPassword = ref(false)
const isUpdatingNotifications = ref(false)
const isDownloadingData = ref(false)
const isDeletingAccount = ref(false)
const showDeleteAccountModal = ref(false)
const deleteConfirmation = ref('')

// Iconos para las pestañas (usando SVG inline)
const UserIcon = 'svg'
const LockIcon = 'svg'
const BellIcon = 'svg'
const ShieldIcon = 'svg'

// Pestañas
const tabs = [
  { id: 'personal', name: 'Información Personal', icon: UserIcon },
  { id: 'security', name: 'Seguridad', icon: LockIcon },
  { id: 'notifications', name: 'Notificaciones', icon: BellIcon },
  { id: 'privacy', name: 'Privacidad', icon: ShieldIcon }
]

// Formularios
const profileForm = reactive({
  nombre_completo: '',
  email: '',
  telefono: '',
  direccion: '',
  fecha_nacimiento: '',
  avatar_url: ''
})

const passwordForm = reactive({
  current_password: '',
  new_password: '',
  confirm_password: ''
})

const notificationForm = reactive({
  email_pedidos: true,
  email_promociones: false,
  email_recomendaciones: true,
  email_recordatorios: true,
  push_pedidos: true,
  push_promociones: false,
  push_recomendaciones: false
})

// Errores
const errors = reactive({
  nombre_completo: '',
  email: '',
  telefono: '',
  direccion: '',
  fecha_nacimiento: '',
  current_password: '',
  new_password: '',
  confirm_password: '',
  general: ''
})

// Configuraciones de notificaciones
const emailNotificationSettings = [
  {
    key: 'email_pedidos',
    title: 'Actualizaciones de pedidos',
    description: 'Recibe notificaciones sobre el estado de tus pedidos'
  },
  {
    key: 'email_promociones',
    title: 'Promociones y ofertas',
    description: 'Recibe información sobre descuentos y ofertas especiales'
  },
  {
    key: 'email_recomendaciones',
    title: 'Recomendaciones de productos',
    description: 'Recibe sugerencias personalizadas de productos'
  },
  {
    key: 'email_recordatorios',
    title: 'Recordatorios',
    description: 'Recibe recordatorios sobre carritos abandonados y seguimientos'
  }
]

const pushNotificationSettings = [
  {
    key: 'push_pedidos',
    title: 'Actualizaciones de pedidos',
    description: 'Notificaciones push sobre el estado de tus pedidos'
  },
  {
    key: 'push_promociones',
    title: 'Promociones y ofertas',
    description: 'Notificaciones push sobre descuentos y ofertas'
  },
  {
    key: 'push_recomendaciones',
    title: 'Nuevas recomendaciones',
    description: 'Notificaciones cuando tengas nuevas recomendaciones de IA'
  }
]

// Computed para fortaleza de contraseña
const passwordStrength = computed(() => {
  const password = passwordForm.new_password
  if (!password) return 0

  let score = 0
  
  // Longitud
  if (password.length >= 8) score += 1
  if (password.length >= 12) score += 1
  
  // Caracteres
  if (/[a-z]/.test(password)) score += 1
  if (/[A-Z]/.test(password)) score += 1
  if (/[0-9]/.test(password)) score += 1
  if (/[^A-Za-z0-9]/.test(password)) score += 1

  return Math.min(score, 5)
})

const passwordStrengthPercentage = computed(() => {
  return (passwordStrength.value / 5) * 100
})

const passwordStrengthClass = computed(() => {
  const strength = passwordStrength.value
  if (strength <= 2) return 'bg-red-500'
  if (strength <= 3) return 'bg-yellow-500'
  if (strength <= 4) return 'bg-blue-500'
  return 'bg-green-500'
})

const passwordStrengthTextClass = computed(() => {
  const strength = passwordStrength.value
  if (strength <= 2) return 'text-red-600'
  if (strength <= 3) return 'text-yellow-600'
  if (strength <= 4) return 'text-blue-600'
  return 'text-green-600'
})

const passwordStrengthText = computed(() => {
  const strength = passwordStrength.value
  if (strength <= 2) return 'Débil'
  if (strength <= 3) return 'Regular'
  if (strength <= 4) return 'Buena'
  return 'Muy fuerte'
})

// Cargar datos del usuario
const loadUserData = async () => {
  try {
    const user = authStore.user
    if (user) {
      Object.assign(profileForm, {
        nombre_completo: user.nombre_completo || '',
        email: user.email || '',
        telefono: user.telefono || '',
        direccion: user.direccion || '',
        fecha_nacimiento: user.fecha_nacimiento || '',
        avatar_url: user.avatar_url || ''
      })
    }

    // Cargar configuraciones de notificaciones
    const response = await api.get('/usuario/configuraciones')
    if (response.data.notificaciones) {
      Object.assign(notificationForm, response.data.notificaciones)
    }
  } catch (error) {
    console.error('Error cargando datos del usuario:', error)
  }
}

// Actualizar perfil
const updateProfile = async () => {
  // Limpiar errores
  Object.keys(errors).forEach(key => {
    if (key !== 'current_password' && key !== 'new_password' && key !== 'confirm_password') {
      errors[key] = ''
    }
  })

  isUpdatingProfile.value = true

  try {
    const response = await authStore.updateProfile(profileForm)
    toast.success('Perfil actualizado exitosamente')
  } catch (error) {
    console.error('Error actualizando perfil:', error)
    
    if (error.response?.status === 422) {
      const serverErrors = error.response.data.errors || {}
      Object.keys(serverErrors).forEach(field => {
        if (errors.hasOwnProperty(field)) {
          errors[field] = Array.isArray(serverErrors[field]) 
            ? serverErrors[field][0] 
            : serverErrors[field]
        }
      })
    } else {
      errors.general = 'Error al actualizar el perfil. Por favor, inténtalo de nuevo.'
    }
  } finally {
    isUpdatingProfile.value = false
  }
}

// Cambiar contraseña
const changePassword = async () => {
  // Limpiar errores de contraseña
  errors.current_password = ''
  errors.new_password = ''
  errors.confirm_password = ''
  errors.general = ''

  // Validaciones
  if (passwordForm.new_password !== passwordForm.confirm_password) {
    errors.confirm_password = 'Las contraseñas no coinciden'
    return
  }

  if (passwordForm.new_password.length < 8) {
    errors.new_password = 'La contraseña debe tener al menos 8 caracteres'
    return
  }

  isChangingPassword.value = true

  try {
    await authStore.changePassword(passwordForm)
    toast.success('Contraseña cambiada exitosamente')
    resetPasswordForm()
  } catch (error) {
    console.error('Error cambiando contraseña:', error)
    
    if (error.response?.status === 422) {
      const serverErrors = error.response.data.errors || {}
      Object.keys(serverErrors).forEach(field => {
        if (errors.hasOwnProperty(field)) {
          errors[field] = Array.isArray(serverErrors[field]) 
            ? serverErrors[field][0] 
            : serverErrors[field]
        }
      })
    } else if (error.response?.status === 400) {
      errors.current_password = 'La contraseña actual es incorrecta'
    } else {
      errors.general = 'Error al cambiar la contraseña. Por favor, inténtalo de nuevo.'
    }
  } finally {
    isChangingPassword.value = false
  }
}

// Actualizar configuraciones de notificaciones
const updateNotificationSettings = async () => {
  isUpdatingNotifications.value = true

  try {
    await api.patch('/usuario/configuraciones', {
      notificaciones: notificationForm
    })
    toast.success('Configuraciones de notificaciones actualizadas')
  } catch (error) {
    console.error('Error actualizando configuraciones:', error)
    toast.error('Error al actualizar las configuraciones')
  } finally {
    isUpdatingNotifications.value = false
  }
}

// Manejar cambio de avatar
const handleAvatarChange = async (event) => {
  const file = event.target.files[0]
  if (!file) return

  // Validar tamaño (2MB)
  if (file.size > 2 * 1024 * 1024) {
    toast.error('La imagen debe ser menor a 2MB')
    return
  }

  // Validar tipo
  if (!file.type.startsWith('image/')) {
    toast.error('Solo se permiten archivos de imagen')
    return
  }

  try {
    const formData = new FormData()
    formData.append('avatar', file)

    const response = await api.post('/usuario/avatar', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })

    profileForm.avatar_url = response.data.avatar_url
    toast.success('Avatar actualizado exitosamente')
  } catch (error) {
    console.error('Error subiendo avatar:', error)
    toast.error('Error al subir la imagen')
  }
}

// Descargar datos
const downloadData = async () => {
  isDownloadingData.value = true

  try {
    const response = await api.get('/usuario/exportar-datos', {
      responseType: 'blob'
    })

    const url = window.URL.createObjectURL(new Blob([response.data]))
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', 'mis-datos.json')
    document.body.appendChild(link)
    link.click()
    link.remove()
    window.URL.revokeObjectURL(url)

    toast.success('Datos descargados exitosamente')
  } catch (error) {
    console.error('Error descargando datos:', error)
    toast.error('Error al descargar los datos')
  } finally {
    isDownloadingData.value = false
  }
}

// Eliminar cuenta
const deleteAccount = async () => {
  if (deleteConfirmation.value !== 'ELIMINAR') return

  isDeletingAccount.value = true

  try {
    await api.delete('/usuario/eliminar-cuenta')
    toast.success('Cuenta eliminada exitosamente')
    authStore.logout()
    router.push('/')
  } catch (error) {
    console.error('Error eliminando cuenta:', error)
    toast.error('Error al eliminar la cuenta')
  } finally {
    isDeletingAccount.value = false
    showDeleteAccountModal.value = false
    deleteConfirmation.value = ''
  }
}

// Reset forms
const resetProfileForm = () => {
  loadUserData()
  Object.keys(errors).forEach(key => {
    if (key !== 'current_password' && key !== 'new_password' && key !== 'confirm_password') {
      errors[key] = ''
    }
  })
}

const resetPasswordForm = () => {
  Object.assign(passwordForm, {
    current_password: '',
    new_password: '',
    confirm_password: ''
  })
  errors.current_password = ''
  errors.new_password = ''
  errors.confirm_password = ''
}

const resetNotificationForm = () => {
  loadUserData()
}

// Cargar datos al montar
onMounted(() => {
  loadUserData()
})
</script>