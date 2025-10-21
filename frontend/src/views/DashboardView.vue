<template>
  <div class="container-custom section-padding">
    <!-- Header del Dashboard -->
    <div class="mb-8">
      <h1 class="text-3xl font-bold text-gray-900">
        ¡Bienvenido, {{ authStore.user?.nombre }}!
      </h1>
      <p class="mt-2 text-gray-600">
        Aquí tienes un resumen de tu actividad y accesos rápidos a las funciones principales.
      </p>
    </div>

    <!-- Estadísticas principales -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      <!-- Total de pedidos -->
      <div class="card">
        <div class="card-body">
          <div class="flex items-center">
            <div class="flex-shrink-0">
              <div class="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                <svg class="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                </svg>
              </div>
            </div>
            <div class="ml-4">
              <p class="text-sm font-medium text-gray-600">Total Pedidos</p>
              <p class="text-2xl font-semibold text-gray-900">{{ stats.totalPedidos }}</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Pedidos pendientes -->
      <div class="card">
        <div class="card-body">
          <div class="flex items-center">
            <div class="flex-shrink-0">
              <div class="w-8 h-8 bg-yellow-100 rounded-lg flex items-center justify-center">
                <svg class="w-5 h-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
            <div class="ml-4">
              <p class="text-sm font-medium text-gray-600">Pendientes</p>
              <p class="text-2xl font-semibold text-gray-900">{{ stats.pedidosPendientes }}</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Recomendaciones IA -->
      <div class="card">
        <div class="card-body">
          <div class="flex items-center">
            <div class="flex-shrink-0">
              <div class="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                <svg class="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
            </div>
            <div class="ml-4">
              <p class="text-sm font-medium text-gray-600">Recomendaciones IA</p>
              <p class="text-2xl font-semibold text-gray-900">{{ stats.recomendacionesIA }}</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Productos favoritos -->
      <div class="card">
        <div class="card-body">
          <div class="flex items-center">
            <div class="flex-shrink-0">
              <div class="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center">
                <svg class="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
              </div>
            </div>
            <div class="ml-4">
              <p class="text-sm font-medium text-gray-600">Favoritos</p>
              <p class="text-2xl font-semibold text-gray-900">{{ stats.productosFavoritos }}</p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Acciones rápidas -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
      <!-- Acciones principales -->
      <div class="card">
        <div class="card-header">
          <h3 class="text-lg font-medium text-gray-900">Acciones Rápidas</h3>
        </div>
        <div class="card-body">
          <div class="grid grid-cols-2 gap-4">
            <router-link
              to="/catalogo"
              class="flex flex-col items-center p-4 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors group"
            >
              <div class="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center group-hover:bg-blue-200 transition-colors">
                <svg class="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
              </div>
              <span class="mt-2 text-sm font-medium text-gray-900">Ver Catálogo</span>
            </router-link>

            <router-link
              to="/recomendaciones/nueva"
              class="flex flex-col items-center p-4 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors group"
            >
              <div class="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center group-hover:bg-purple-200 transition-colors">
                <svg class="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
              <span class="mt-2 text-sm font-medium text-gray-900">Nueva Recomendación</span>
            </router-link>

            <router-link
              to="/pedidos"
              class="flex flex-col items-center p-4 bg-green-50 rounded-lg hover:bg-green-100 transition-colors group"
            >
              <div class="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center group-hover:bg-green-200 transition-colors">
                <svg class="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <span class="mt-2 text-sm font-medium text-gray-900">Mis Pedidos</span>
            </router-link>

            <router-link
              to="/perfil"
              class="flex flex-col items-center p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors group"
            >
              <div class="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center group-hover:bg-gray-200 transition-colors">
                <svg class="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <span class="mt-2 text-sm font-medium text-gray-900">Mi Perfil</span>
            </router-link>
          </div>
        </div>
      </div>

      <!-- Actividad reciente -->
      <div class="card">
        <div class="card-header">
          <h3 class="text-lg font-medium text-gray-900">Actividad Reciente</h3>
        </div>
        <div class="card-body">
          <div v-if="recentActivity.length === 0" class="text-center py-8">
            <svg class="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
            </svg>
            <p class="mt-2 text-sm text-gray-500">No hay actividad reciente</p>
          </div>
          <div v-else class="space-y-4">
            <div
              v-for="activity in recentActivity"
              :key="activity.id"
              class="flex items-start space-x-3"
            >
              <div class="flex-shrink-0">
                <div 
                  class="w-8 h-8 rounded-full flex items-center justify-center"
                  :class="getActivityIconClass(activity.type)"
                >
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" :d="getActivityIconPath(activity.type)" />
                  </svg>
                </div>
              </div>
              <div class="flex-1 min-w-0">
                <p class="text-sm font-medium text-gray-900">{{ activity.title }}</p>
                <p class="text-sm text-gray-500">{{ activity.description }}</p>
                <p class="text-xs text-gray-400 mt-1">{{ formatDate(activity.created_at) }}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Productos destacados -->
    <div class="card">
      <div class="card-header">
        <div class="flex items-center justify-between">
          <h3 class="text-lg font-medium text-gray-900">Productos Destacados</h3>
          <router-link
            to="/catalogo"
            class="text-sm font-medium text-primary-600 hover:text-primary-500 transition-colors"
          >
            Ver todos
          </router-link>
        </div>
      </div>
      <div class="card-body">
        <div v-if="featuredProducts.length === 0" class="text-center py-8">
          <svg class="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
          </svg>
          <p class="mt-2 text-sm text-gray-500">No hay productos destacados disponibles</p>
        </div>
        <div v-else class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          <div
            v-for="product in featuredProducts"
            :key="product.id"
            class="group cursor-pointer"
            @click="$router.push(`/catalogo/${product.id}`)"
          >
            <div class="aspect-w-1 aspect-h-1 w-full overflow-hidden rounded-lg bg-gray-200 group-hover:opacity-75 transition-opacity">
              <img
                :src="product.imagen_url || '/placeholder-furniture.jpg'"
                :alt="product.nombre"
                class="h-full w-full object-cover object-center"
              />
            </div>
            <div class="mt-4">
              <h4 class="text-sm font-medium text-gray-900 group-hover:text-primary-600 transition-colors">
                {{ product.nombre }}
              </h4>
              <p class="mt-1 text-sm text-gray-500">{{ product.categoria }}</p>
              <p class="mt-1 text-lg font-medium text-gray-900">
                ${{ formatPrice(product.precio_base) }}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useToast } from 'vue-toastification'
import api from '@/services/api'

const authStore = useAuthStore()
const toast = useToast()

// Estado reactivo
const stats = reactive({
  totalPedidos: 0,
  pedidosPendientes: 0,
  recomendacionesIA: 0,
  productosFavoritos: 0
})

const recentActivity = ref([])
const featuredProducts = ref([])
const isLoading = ref(true)

// Cargar datos del dashboard
const loadDashboardData = async () => {
  try {
    isLoading.value = true

    // Cargar estadísticas
    const [statsResponse, activityResponse, productsResponse] = await Promise.allSettled([
      api.get('/dashboard/stats'),
      api.get('/dashboard/activity'),
      api.get('/dashboard/featured-products')
    ])

    // Procesar estadísticas
    if (statsResponse.status === 'fulfilled') {
      Object.assign(stats, statsResponse.value.data)
    }

    // Procesar actividad reciente
    if (activityResponse.status === 'fulfilled') {
      recentActivity.value = activityResponse.value.data.slice(0, 5) // Mostrar solo las últimas 5
    }

    // Procesar productos destacados
    if (productsResponse.status === 'fulfilled') {
      featuredProducts.value = productsResponse.value.data.slice(0, 8) // Mostrar solo 8 productos
    }

  } catch (error) {
    console.error('Error cargando datos del dashboard:', error)
    toast.error('Error al cargar los datos del dashboard')
  } finally {
    isLoading.value = false
  }
}

// Utilidades para actividad
const getActivityIconClass = (type) => {
  const classes = {
    pedido: 'bg-blue-100 text-blue-600',
    recomendacion: 'bg-purple-100 text-purple-600',
    favorito: 'bg-red-100 text-red-600',
    perfil: 'bg-green-100 text-green-600',
    default: 'bg-gray-100 text-gray-600'
  }
  return classes[type] || classes.default
}

const getActivityIconPath = (type) => {
  const paths = {
    pedido: 'M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z',
    recomendacion: 'M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z',
    favorito: 'M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z',
    perfil: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z',
    default: 'M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2'
  }
  return paths[type] || paths.default
}

// Formatear fecha
const formatDate = (dateString) => {
  const date = new Date(dateString)
  const now = new Date()
  const diffTime = Math.abs(now - date)
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

  if (diffDays === 1) {
    return 'Hace 1 día'
  } else if (diffDays < 7) {
    return `Hace ${diffDays} días`
  } else {
    return date.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }
}

// Formatear precio
const formatPrice = (price) => {
  return new Intl.NumberFormat('es-ES', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(price)
}

// Cargar datos al montar el componente
onMounted(() => {
  loadDashboardData()
})
</script>