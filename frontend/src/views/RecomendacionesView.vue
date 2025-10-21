<template>
  <div class="container-custom section-padding">
    <!-- Header -->
    <div class="mb-8">
      <h1 class="text-3xl font-bold text-gray-900">Recomendaciones de IA</h1>
      <p class="mt-2 text-gray-600">
        Obtén recomendaciones personalizadas de muebles basadas en tus necesidades y preferencias
      </p>
    </div>

    <!-- Formulario de recomendación -->
    <div class="card mb-8">
      <div class="card-header">
        <h2 class="text-xl font-semibold text-gray-900">Nueva Recomendación</h2>
        <p class="text-sm text-gray-600 mt-1">
          Describe tus necesidades y preferencias para obtener recomendaciones personalizadas
        </p>
      </div>
      
      <div class="card-body">
        <form @submit.prevent="generateRecommendation" class="space-y-6">
          <!-- Tipo de espacio -->
          <div class="form-group">
            <label for="tipoEspacio" class="input-label">
              Tipo de espacio *
            </label>
            <select
              id="tipoEspacio"
              v-model="form.tipoEspacio"
              required
              class="form-select"
              :class="{ 'border-red-300 focus:ring-red-500': errors.tipoEspacio }"
            >
              <option value="">Selecciona el tipo de espacio</option>
              <option value="sala">Sala de estar</option>
              <option value="dormitorio">Dormitorio</option>
              <option value="comedor">Comedor</option>
              <option value="cocina">Cocina</option>
              <option value="oficina">Oficina</option>
              <option value="estudio">Estudio</option>
              <option value="terraza">Terraza/Balcón</option>
              <option value="otro">Otro</option>
            </select>
            <p v-if="errors.tipoEspacio" class="input-error">
              {{ errors.tipoEspacio }}
            </p>
          </div>

          <!-- Dimensiones del espacio -->
          <div class="form-group">
            <label class="input-label">Dimensiones del espacio</label>
            <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label for="largo" class="block text-sm text-gray-600 mb-1">Largo (metros)</label>
                <input
                  id="largo"
                  v-model.number="form.dimensiones.largo"
                  type="number"
                  step="0.1"
                  min="0"
                  class="input-field"
                  placeholder="3.5"
                />
              </div>
              <div>
                <label for="ancho" class="block text-sm text-gray-600 mb-1">Ancho (metros)</label>
                <input
                  id="ancho"
                  v-model.number="form.dimensiones.ancho"
                  type="number"
                  step="0.1"
                  min="0"
                  class="input-field"
                  placeholder="2.8"
                />
              </div>
              <div>
                <label for="altura" class="block text-sm text-gray-600 mb-1">Altura (metros)</label>
                <input
                  id="altura"
                  v-model.number="form.dimensiones.altura"
                  type="number"
                  step="0.1"
                  min="0"
                  class="input-field"
                  placeholder="2.5"
                />
              </div>
            </div>
          </div>

          <!-- Estilo preferido -->
          <div class="form-group">
            <label for="estilo" class="input-label">
              Estilo preferido *
            </label>
            <select
              id="estilo"
              v-model="form.estilo"
              required
              class="form-select"
              :class="{ 'border-red-300 focus:ring-red-500': errors.estilo }"
            >
              <option value="">Selecciona un estilo</option>
              <option value="moderno">Moderno</option>
              <option value="contemporaneo">Contemporáneo</option>
              <option value="minimalista">Minimalista</option>
              <option value="industrial">Industrial</option>
              <option value="escandinavo">Escandinavo</option>
              <option value="rustico">Rústico</option>
              <option value="clasico">Clásico</option>
              <option value="vintage">Vintage</option>
              <option value="bohemio">Bohemio</option>
            </select>
            <p v-if="errors.estilo" class="input-error">
              {{ errors.estilo }}
            </p>
          </div>

          <!-- Presupuesto -->
          <div class="form-group">
            <label for="presupuesto" class="input-label">
              Presupuesto aproximado *
            </label>
            <select
              id="presupuesto"
              v-model="form.presupuesto"
              required
              class="form-select"
              :class="{ 'border-red-300 focus:ring-red-500': errors.presupuesto }"
            >
              <option value="">Selecciona tu presupuesto</option>
              <option value="bajo">Hasta $50,000</option>
              <option value="medio">$50,000 - $150,000</option>
              <option value="alto">$150,000 - $300,000</option>
              <option value="premium">Más de $300,000</option>
            </select>
            <p v-if="errors.presupuesto" class="input-error">
              {{ errors.presupuesto }}
            </p>
          </div>

          <!-- Colores preferidos -->
          <div class="form-group">
            <label class="input-label">Colores preferidos</label>
            <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <label
                v-for="color in coloresDisponibles"
                :key="color.value"
                class="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
                :class="form.colores.includes(color.value) ? 'border-primary-500 bg-primary-50' : 'border-gray-300'"
              >
                <input
                  v-model="form.colores"
                  type="checkbox"
                  :value="color.value"
                  class="sr-only"
                />
                <div
                  class="w-4 h-4 rounded-full mr-2 border border-gray-300"
                  :style="{ backgroundColor: color.hex }"
                ></div>
                <span class="text-sm">{{ color.label }}</span>
              </label>
            </div>
          </div>

          <!-- Materiales preferidos -->
          <div class="form-group">
            <label class="input-label">Materiales preferidos</label>
            <div class="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <label
                v-for="material in materialesDisponibles"
                :key="material"
                class="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
                :class="form.materiales.includes(material) ? 'border-primary-500 bg-primary-50' : 'border-gray-300'"
              >
                <input
                  v-model="form.materiales"
                  type="checkbox"
                  :value="material"
                  class="sr-only"
                />
                <span class="text-sm">{{ material }}</span>
              </label>
            </div>
          </div>

          <!-- Descripción adicional -->
          <div class="form-group">
            <label for="descripcion" class="input-label">
              Descripción adicional
            </label>
            <textarea
              id="descripcion"
              v-model="form.descripcion"
              rows="4"
              class="form-textarea"
              placeholder="Describe cualquier requerimiento específico, funcionalidades especiales, o detalles adicionales sobre lo que buscas..."
            ></textarea>
            <p class="input-help">
              Ejemplo: "Necesito un sofá cómodo para 4 personas, con almacenamiento, que combine con mi mesa de centro de madera"
            </p>
          </div>

          <!-- Botón de envío -->
          <div class="flex justify-end">
            <button
              type="submit"
              :disabled="isGenerating"
              class="btn-primary px-8 py-3"
              :class="{ 'opacity-50 cursor-not-allowed': isGenerating }"
            >
              <svg v-if="isGenerating" class="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              {{ isGenerating ? 'Generando recomendación...' : 'Generar Recomendación' }}
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

    <!-- Resultado de la recomendación -->
    <div v-if="currentRecommendation" class="card mb-8">
      <div class="card-header">
        <div class="flex items-center justify-between">
          <h2 class="text-xl font-semibold text-gray-900">Tu Recomendación Personalizada</h2>
          <span class="badge-success">Generada por IA</span>
        </div>
      </div>
      
      <div class="card-body">
        <!-- Información general -->
        <div class="mb-6">
          <h3 class="text-lg font-medium text-gray-900 mb-2">{{ currentRecommendation.titulo }}</h3>
          <p class="text-gray-600">{{ currentRecommendation.descripcion }}</p>
        </div>

        <!-- Productos recomendados -->
        <div v-if="currentRecommendation.productos && currentRecommendation.productos.length > 0" class="mb-6">
          <h4 class="text-md font-medium text-gray-900 mb-4">Productos Recomendados</h4>
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div
              v-for="producto in currentRecommendation.productos"
              :key="producto.id"
              class="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
              @click="goToProduct(producto.id)"
            >
              <img
                :src="producto.imagen_url || '/placeholder-furniture.jpg'"
                :alt="producto.nombre"
                class="w-full h-32 object-cover rounded-lg mb-3"
              />
              <h5 class="font-medium text-gray-900">{{ producto.nombre }}</h5>
              <p class="text-sm text-gray-600 mt-1">{{ producto.categoria }}</p>
              <p class="text-lg font-semibold text-primary-600 mt-2">
                ${{ formatPrice(producto.precio_base) }}
              </p>
            </div>
          </div>
        </div>

        <!-- Imagen generada -->
        <div v-if="currentRecommendation.imagen_url" class="mb-6">
          <h4 class="text-md font-medium text-gray-900 mb-4">Visualización del Espacio</h4>
          <div class="rounded-lg overflow-hidden">
            <img
              :src="currentRecommendation.imagen_url"
              alt="Visualización del espacio recomendado"
              class="w-full h-64 object-cover"
            />
          </div>
        </div>

        <!-- Detalles adicionales -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div v-if="currentRecommendation.tiempo_produccion">
            <h5 class="font-medium text-gray-900 mb-2">Tiempo de Producción</h5>
            <p class="text-gray-600">{{ currentRecommendation.tiempo_produccion }} días</p>
          </div>
          
          <div v-if="currentRecommendation.precio_estimado">
            <h5 class="font-medium text-gray-900 mb-2">Precio Estimado Total</h5>
            <p class="text-2xl font-semibold text-primary-600">
              ${{ formatPrice(currentRecommendation.precio_estimado) }}
            </p>
          </div>
        </div>

        <!-- Acciones -->
        <div class="mt-6 flex flex-wrap gap-3">
          <button
            @click="saveRecommendation"
            class="btn-primary"
            :disabled="isSaving"
          >
            <svg v-if="isSaving" class="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            {{ isSaving ? 'Guardando...' : 'Guardar Recomendación' }}
          </button>
          
          <button
            @click="createOrder"
            class="btn-success"
          >
            Crear Pedido
          </button>
          
          <button
            @click="shareRecommendation"
            class="btn-secondary"
          >
            Compartir
          </button>
        </div>
      </div>
    </div>

    <!-- Historial de recomendaciones -->
    <div class="card">
      <div class="card-header">
        <h2 class="text-xl font-semibold text-gray-900">Historial de Recomendaciones</h2>
      </div>
      
      <div class="card-body">
        <div v-if="isLoadingHistory" class="space-y-4">
          <div v-for="i in 3" :key="i" class="animate-pulse">
            <div class="flex space-x-4">
              <div class="bg-gray-200 h-20 w-20 rounded-lg"></div>
              <div class="flex-1 space-y-2">
                <div class="h-4 bg-gray-200 rounded w-3/4"></div>
                <div class="h-4 bg-gray-200 rounded w-1/2"></div>
                <div class="h-4 bg-gray-200 rounded w-1/4"></div>
              </div>
            </div>
          </div>
        </div>

        <div v-else-if="recommendationHistory.length === 0" class="text-center py-8">
          <svg class="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
          </svg>
          <h3 class="mt-2 text-sm font-medium text-gray-900">No hay recomendaciones anteriores</h3>
          <p class="mt-1 text-sm text-gray-500">Genera tu primera recomendación usando el formulario de arriba.</p>
        </div>

        <div v-else class="space-y-4">
          <div
            v-for="recommendation in recommendationHistory"
            :key="recommendation.id"
            class="flex items-start space-x-4 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
            @click="loadRecommendation(recommendation)"
          >
            <div class="flex-shrink-0">
              <img
                :src="recommendation.imagen_url || '/placeholder-furniture.jpg'"
                :alt="recommendation.titulo"
                class="h-16 w-16 object-cover rounded-lg"
              />
            </div>
            
            <div class="flex-1 min-w-0">
              <h4 class="text-sm font-medium text-gray-900">{{ recommendation.titulo }}</h4>
              <p class="text-sm text-gray-600 mt-1 line-clamp-2">{{ recommendation.descripcion }}</p>
              <div class="mt-2 flex items-center space-x-4 text-xs text-gray-500">
                <span>{{ formatDate(recommendation.created_at) }}</span>
                <span v-if="recommendation.precio_estimado">
                  ${{ formatPrice(recommendation.precio_estimado) }}
                </span>
                <span v-if="recommendation.productos_count">
                  {{ recommendation.productos_count }} productos
                </span>
              </div>
            </div>
            
            <div class="flex-shrink-0">
              <button
                @click.stop="deleteRecommendation(recommendation.id)"
                class="p-2 text-gray-400 hover:text-red-500 transition-colors"
              >
                <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useToast } from 'vue-toastification'
import api from '@/services/api'

const router = useRouter()
const toast = useToast()

// Estado del formulario
const form = reactive({
  tipoEspacio: '',
  dimensiones: {
    largo: null,
    ancho: null,
    altura: null
  },
  estilo: '',
  presupuesto: '',
  colores: [],
  materiales: [],
  descripcion: ''
})

// Estado de la UI
const isGenerating = ref(false)
const isSaving = ref(false)
const isLoadingHistory = ref(true)

// Errores
const errors = reactive({
  tipoEspacio: '',
  estilo: '',
  presupuesto: '',
  general: ''
})

// Datos
const currentRecommendation = ref(null)
const recommendationHistory = ref([])

// Opciones disponibles
const coloresDisponibles = [
  { value: 'blanco', label: 'Blanco', hex: '#FFFFFF' },
  { value: 'negro', label: 'Negro', hex: '#000000' },
  { value: 'gris', label: 'Gris', hex: '#6B7280' },
  { value: 'beige', label: 'Beige', hex: '#F5F5DC' },
  { value: 'marron', label: 'Marrón', hex: '#8B4513' },
  { value: 'azul', label: 'Azul', hex: '#3B82F6' },
  { value: 'verde', label: 'Verde', hex: '#10B981' },
  { value: 'rojo', label: 'Rojo', hex: '#EF4444' }
]

const materialesDisponibles = [
  'Madera',
  'Metal',
  'Vidrio',
  'Cuero',
  'Tela',
  'Plástico',
  'Mármol',
  'Cerámica'
]

// Validar formulario
const validateForm = () => {
  // Limpiar errores
  Object.keys(errors).forEach(key => {
    errors[key] = ''
  })

  let isValid = true

  if (!form.tipoEspacio) {
    errors.tipoEspacio = 'El tipo de espacio es requerido'
    isValid = false
  }

  if (!form.estilo) {
    errors.estilo = 'El estilo es requerido'
    isValid = false
  }

  if (!form.presupuesto) {
    errors.presupuesto = 'El presupuesto es requerido'
    isValid = false
  }

  return isValid
}

// Generar recomendación
const generateRecommendation = async () => {
  if (!validateForm()) {
    return
  }

  isGenerating.value = true
  errors.general = ''

  try {
    const response = await api.post('/recomendaciones/generar', form)
    currentRecommendation.value = response.data
    toast.success('¡Recomendación generada exitosamente!')
    
    // Recargar historial
    loadRecommendationHistory()
  } catch (error) {
    console.error('Error generando recomendación:', error)
    
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
      errors.general = 'Error al generar la recomendación. Por favor, inténtalo de nuevo.'
    }
  } finally {
    isGenerating.value = false
  }
}

// Guardar recomendación
const saveRecommendation = async () => {
  if (!currentRecommendation.value) return

  isSaving.value = true

  try {
    await api.post('/recomendaciones/guardar', {
      recomendacion_id: currentRecommendation.value.id
    })
    toast.success('Recomendación guardada exitosamente')
    loadRecommendationHistory()
  } catch (error) {
    console.error('Error guardando recomendación:', error)
    toast.error('Error al guardar la recomendación')
  } finally {
    isSaving.value = false
  }
}

// Crear pedido
const createOrder = () => {
  if (!currentRecommendation.value) return
  
  router.push({
    name: 'NuevoPedido',
    query: { recomendacion_id: currentRecommendation.value.id }
  })
}

// Compartir recomendación
const shareRecommendation = async () => {
  if (!currentRecommendation.value) return

  try {
    if (navigator.share) {
      await navigator.share({
        title: currentRecommendation.value.titulo,
        text: currentRecommendation.value.descripcion,
        url: window.location.href
      })
    } else {
      // Fallback: copiar al portapapeles
      await navigator.clipboard.writeText(window.location.href)
      toast.success('Enlace copiado al portapapeles')
    }
  } catch (error) {
    console.error('Error compartiendo:', error)
    toast.error('Error al compartir la recomendación')
  }
}

// Cargar historial de recomendaciones
const loadRecommendationHistory = async () => {
  try {
    isLoadingHistory.value = true
    const response = await api.get('/recomendaciones')
    recommendationHistory.value = response.data.data || response.data
  } catch (error) {
    console.error('Error cargando historial:', error)
    toast.error('Error al cargar el historial de recomendaciones')
  } finally {
    isLoadingHistory.value = false
  }
}

// Cargar recomendación específica
const loadRecommendation = async (recommendation) => {
  try {
    const response = await api.get(`/recomendaciones/${recommendation.id}`)
    currentRecommendation.value = response.data
  } catch (error) {
    console.error('Error cargando recomendación:', error)
    toast.error('Error al cargar la recomendación')
  }
}

// Eliminar recomendación
const deleteRecommendation = async (id) => {
  if (!confirm('¿Estás seguro de que quieres eliminar esta recomendación?')) {
    return
  }

  try {
    await api.delete(`/recomendaciones/${id}`)
    toast.success('Recomendación eliminada')
    loadRecommendationHistory()
    
    // Si es la recomendación actual, limpiarla
    if (currentRecommendation.value?.id === id) {
      currentRecommendation.value = null
    }
  } catch (error) {
    console.error('Error eliminando recomendación:', error)
    toast.error('Error al eliminar la recomendación')
  }
}

// Ir a producto
const goToProduct = (productId) => {
  router.push(`/catalogo/${productId}`)
}

// Formatear precio
const formatPrice = (price) => {
  return new Intl.NumberFormat('es-ES', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(price)
}

// Formatear fecha
const formatDate = (dateString) => {
  const date = new Date(dateString)
  return date.toLocaleDateString('es-ES', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}

// Cargar datos al montar
onMounted(() => {
  loadRecommendationHistory()
})
</script>

<style scoped>
.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>