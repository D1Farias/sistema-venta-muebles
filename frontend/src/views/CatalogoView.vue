<template>
  <div class="container-custom section-padding">
    <!-- Header -->
    <div class="mb-8">
      <h1 class="text-3xl font-bold text-gray-900">Catálogo de Muebles</h1>
      <p class="mt-2 text-gray-600">
        Descubre nuestra amplia selección de muebles de alta calidad
      </p>
    </div>

    <!-- Filtros y búsqueda -->
    <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <!-- Búsqueda -->
        <div class="lg:col-span-2">
          <label for="search" class="block text-sm font-medium text-gray-700 mb-2">
            Buscar productos
          </label>
          <div class="relative">
            <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg class="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              id="search"
              v-model="filters.search"
              type="text"
              class="input-field pl-10"
              placeholder="Buscar por nombre, descripción..."
              @input="debouncedSearch"
            />
          </div>
        </div>

        <!-- Categoría -->
        <div>
          <label for="categoria" class="block text-sm font-medium text-gray-700 mb-2">
            Categoría
          </label>
          <select
            id="categoria"
            v-model="filters.categoria"
            class="form-select"
            @change="applyFilters"
          >
            <option value="">Todas las categorías</option>
            <option v-for="categoria in categorias" :key="categoria" :value="categoria">
              {{ categoria }}
            </option>
          </select>
        </div>

        <!-- Ordenar por -->
        <div>
          <label for="sortBy" class="block text-sm font-medium text-gray-700 mb-2">
            Ordenar por
          </label>
          <select
            id="sortBy"
            v-model="filters.sortBy"
            class="form-select"
            @change="applyFilters"
          >
            <option value="nombre_asc">Nombre (A-Z)</option>
            <option value="nombre_desc">Nombre (Z-A)</option>
            <option value="precio_asc">Precio (Menor a Mayor)</option>
            <option value="precio_desc">Precio (Mayor a Menor)</option>
            <option value="created_at_desc">Más Recientes</option>
          </select>
        </div>
      </div>

      <!-- Filtros adicionales -->
      <div class="mt-4 pt-4 border-t border-gray-200">
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <!-- Rango de precios -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              Rango de precios
            </label>
            <div class="flex items-center space-x-2">
              <input
                v-model.number="filters.precioMin"
                type="number"
                class="input-field"
                placeholder="Mín"
                min="0"
                @change="applyFilters"
              />
              <span class="text-gray-500">-</span>
              <input
                v-model.number="filters.precioMax"
                type="number"
                class="input-field"
                placeholder="Máx"
                min="0"
                @change="applyFilters"
              />
            </div>
          </div>

          <!-- Material -->
          <div>
            <label for="material" class="block text-sm font-medium text-gray-700 mb-2">
              Material
            </label>
            <select
              id="material"
              v-model="filters.material"
              class="form-select"
              @change="applyFilters"
            >
              <option value="">Todos los materiales</option>
              <option v-for="material in materiales" :key="material" :value="material">
                {{ material }}
              </option>
            </select>
          </div>

          <!-- Disponibilidad -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              Disponibilidad
            </label>
            <div class="flex items-center space-x-4">
              <label class="flex items-center">
                <input
                  v-model="filters.disponible"
                  type="checkbox"
                  class="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                  @change="applyFilters"
                />
                <span class="ml-2 text-sm text-gray-700">Solo disponibles</span>
              </label>
            </div>
          </div>
        </div>
      </div>

      <!-- Botón limpiar filtros -->
      <div class="mt-4 pt-4 border-t border-gray-200">
        <button
          @click="clearFilters"
          class="btn-secondary text-sm"
        >
          Limpiar filtros
        </button>
      </div>
    </div>

    <!-- Resultados -->
    <div class="flex items-center justify-between mb-6">
      <p class="text-sm text-gray-700">
        Mostrando {{ products.length }} de {{ totalProducts }} productos
      </p>
      
      <!-- Vista -->
      <div class="flex items-center space-x-2">
        <span class="text-sm text-gray-700">Vista:</span>
        <button
          @click="viewMode = 'grid'"
          class="p-2 rounded-md"
          :class="viewMode === 'grid' ? 'bg-primary-100 text-primary-600' : 'text-gray-400 hover:text-gray-600'"
        >
          <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
          </svg>
        </button>
        <button
          @click="viewMode = 'list'"
          class="p-2 rounded-md"
          :class="viewMode === 'list' ? 'bg-primary-100 text-primary-600' : 'text-gray-400 hover:text-gray-600'"
        >
          <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 10h16M4 14h16M4 18h16" />
          </svg>
        </button>
      </div>
    </div>

    <!-- Loading -->
    <div v-if="isLoading" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      <div v-for="i in 8" :key="i" class="animate-pulse">
        <div class="bg-gray-200 aspect-w-1 aspect-h-1 rounded-lg"></div>
        <div class="mt-4 space-y-2">
          <div class="h-4 bg-gray-200 rounded"></div>
          <div class="h-4 bg-gray-200 rounded w-3/4"></div>
          <div class="h-4 bg-gray-200 rounded w-1/2"></div>
        </div>
      </div>
    </div>

    <!-- Grid de productos -->
    <div v-else-if="viewMode === 'grid'" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      <div
        v-for="product in products"
        :key="product.id"
        class="group cursor-pointer bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow"
        @click="goToProduct(product.id)"
      >
        <div class="aspect-w-1 aspect-h-1 w-full overflow-hidden rounded-t-lg bg-gray-200">
          <img
            :src="product.imagen_url || '/placeholder-furniture.jpg'"
            :alt="product.nombre"
            class="h-full w-full object-cover object-center group-hover:scale-105 transition-transform duration-300"
          />
          <!-- Badge de disponibilidad -->
          <div v-if="!product.disponible" class="absolute top-2 left-2">
            <span class="badge-danger">No disponible</span>
          </div>
          <!-- Botón favorito -->
          <button
            class="absolute top-2 right-2 p-2 bg-white rounded-full shadow-md opacity-0 group-hover:opacity-100 transition-opacity"
            @click.stop="toggleFavorite(product)"
          >
            <svg
              class="h-5 w-5"
              :class="product.is_favorite ? 'text-red-500 fill-current' : 'text-gray-400'"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
          </button>
        </div>
        
        <div class="p-4">
          <h3 class="text-lg font-medium text-gray-900 group-hover:text-primary-600 transition-colors">
            {{ product.nombre }}
          </h3>
          <p class="mt-1 text-sm text-gray-500">{{ product.categoria }}</p>
          <p class="mt-2 text-sm text-gray-600 line-clamp-2">{{ product.descripcion }}</p>
          
          <div class="mt-4 flex items-center justify-between">
            <div>
              <p class="text-lg font-semibold text-gray-900">
                ${{ formatPrice(product.precio_base) }}
              </p>
              <p v-if="product.material" class="text-xs text-gray-500">{{ product.material }}</p>
            </div>
            
            <button
              class="btn-primary btn-sm"
              :disabled="!product.disponible"
              @click.stop="addToCart(product)"
            >
              {{ product.disponible ? 'Agregar' : 'No disponible' }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Vista de lista -->
    <div v-else class="space-y-4">
      <div
        v-for="product in products"
        :key="product.id"
        class="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow p-6 cursor-pointer"
        @click="goToProduct(product.id)"
      >
        <div class="flex items-center space-x-6">
          <div class="flex-shrink-0">
            <img
              :src="product.imagen_url || '/placeholder-furniture.jpg'"
              :alt="product.nombre"
              class="h-24 w-24 object-cover rounded-lg"
            />
          </div>
          
          <div class="flex-1 min-w-0">
            <div class="flex items-start justify-between">
              <div>
                <h3 class="text-lg font-medium text-gray-900 hover:text-primary-600 transition-colors">
                  {{ product.nombre }}
                </h3>
                <p class="text-sm text-gray-500">{{ product.categoria }}</p>
                <p class="mt-2 text-sm text-gray-600">{{ product.descripcion }}</p>
                
                <div class="mt-2 flex items-center space-x-4">
                  <span v-if="product.material" class="text-xs text-gray-500">
                    Material: {{ product.material }}
                  </span>
                  <span
                    class="badge"
                    :class="product.disponible ? 'badge-success' : 'badge-danger'"
                  >
                    {{ product.disponible ? 'Disponible' : 'No disponible' }}
                  </span>
                </div>
              </div>
              
              <div class="flex items-center space-x-4">
                <div class="text-right">
                  <p class="text-lg font-semibold text-gray-900">
                    ${{ formatPrice(product.precio_base) }}
                  </p>
                </div>
                
                <button
                  class="p-2 text-gray-400 hover:text-red-500 transition-colors"
                  @click.stop="toggleFavorite(product)"
                >
                  <svg
                    class="h-5 w-5"
                    :class="product.is_favorite ? 'text-red-500 fill-current' : ''"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                </button>
                
                <button
                  class="btn-primary"
                  :disabled="!product.disponible"
                  @click.stop="addToCart(product)"
                >
                  {{ product.disponible ? 'Agregar al carrito' : 'No disponible' }}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Sin resultados -->
    <div v-if="!isLoading && products.length === 0" class="text-center py-12">
      <svg class="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2M4 13h2m13-8l-4 4m0 0l-4-4m4 4V3" />
      </svg>
      <h3 class="mt-2 text-sm font-medium text-gray-900">No se encontraron productos</h3>
      <p class="mt-1 text-sm text-gray-500">Intenta ajustar los filtros de búsqueda.</p>
    </div>

    <!-- Paginación -->
    <div v-if="totalPages > 1" class="mt-8 flex items-center justify-between">
      <div class="flex-1 flex justify-between sm:hidden">
        <button
          :disabled="currentPage === 1"
          class="btn-secondary"
          @click="changePage(currentPage - 1)"
        >
          Anterior
        </button>
        <button
          :disabled="currentPage === totalPages"
          class="btn-secondary"
          @click="changePage(currentPage + 1)"
        >
          Siguiente
        </button>
      </div>
      
      <div class="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
        <div>
          <p class="text-sm text-gray-700">
            Mostrando
            <span class="font-medium">{{ (currentPage - 1) * perPage + 1 }}</span>
            a
            <span class="font-medium">{{ Math.min(currentPage * perPage, totalProducts) }}</span>
            de
            <span class="font-medium">{{ totalProducts }}</span>
            resultados
          </p>
        </div>
        
        <div>
          <nav class="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
            <button
              :disabled="currentPage === 1"
              class="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
              @click="changePage(currentPage - 1)"
            >
              <span class="sr-only">Anterior</span>
              <svg class="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clip-rule="evenodd" />
              </svg>
            </button>
            
            <button
              v-for="page in visiblePages"
              :key="page"
              :class="[
                'relative inline-flex items-center px-4 py-2 border text-sm font-medium',
                page === currentPage
                  ? 'z-10 bg-primary-50 border-primary-500 text-primary-600'
                  : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
              ]"
              @click="changePage(page)"
            >
              {{ page }}
            </button>
            
            <button
              :disabled="currentPage === totalPages"
              class="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
              @click="changePage(currentPage + 1)"
            >
              <span class="sr-only">Siguiente</span>
              <svg class="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clip-rule="evenodd" />
              </svg>
            </button>
          </nav>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useToast } from 'vue-toastification'
import api from '@/services/api'

const router = useRouter()
const toast = useToast()

// Estado reactivo
const products = ref([])
const categorias = ref([])
const materiales = ref([])
const isLoading = ref(true)
const viewMode = ref('grid')

// Paginación
const currentPage = ref(1)
const totalPages = ref(1)
const totalProducts = ref(0)
const perPage = ref(12)

// Filtros
const filters = reactive({
  search: '',
  categoria: '',
  material: '',
  sortBy: 'nombre_asc',
  precioMin: null,
  precioMax: null,
  disponible: false
})

// Debounce para búsqueda
let searchTimeout = null
const debouncedSearch = () => {
  clearTimeout(searchTimeout)
  searchTimeout = setTimeout(() => {
    applyFilters()
  }, 500)
}

// Páginas visibles en paginación
const visiblePages = computed(() => {
  const pages = []
  const start = Math.max(1, currentPage.value - 2)
  const end = Math.min(totalPages.value, start + 4)
  
  for (let i = start; i <= end; i++) {
    pages.push(i)
  }
  
  return pages
})

// Cargar productos
const loadProducts = async () => {
  try {
    isLoading.value = true
    
    const params = {
      page: currentPage.value,
      per_page: perPage.value,
      ...filters
    }
    
    // Limpiar parámetros vacíos
    Object.keys(params).forEach(key => {
      if (params[key] === '' || params[key] === null || params[key] === undefined) {
        delete params[key]
      }
    })
    
    const response = await api.get('/catalogo', { params })
    
    products.value = response.data.data
    currentPage.value = response.data.current_page
    totalPages.value = response.data.last_page
    totalProducts.value = response.data.total
    perPage.value = response.data.per_page
    
  } catch (error) {
    console.error('Error cargando productos:', error)
    toast.error('Error al cargar los productos')
  } finally {
    isLoading.value = false
  }
}

// Cargar filtros disponibles
const loadFilters = async () => {
  try {
    const response = await api.get('/catalogo/filters')
    categorias.value = response.data.categorias || []
    materiales.value = response.data.materiales || []
  } catch (error) {
    console.error('Error cargando filtros:', error)
  }
}

// Aplicar filtros
const applyFilters = () => {
  currentPage.value = 1
  loadProducts()
}

// Limpiar filtros
const clearFilters = () => {
  Object.keys(filters).forEach(key => {
    if (typeof filters[key] === 'boolean') {
      filters[key] = false
    } else if (typeof filters[key] === 'number') {
      filters[key] = null
    } else {
      filters[key] = ''
    }
  })
  filters.sortBy = 'nombre_asc'
  applyFilters()
}

// Cambiar página
const changePage = (page) => {
  if (page >= 1 && page <= totalPages.value) {
    currentPage.value = page
    loadProducts()
    
    // Scroll al top
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }
}

// Ir a producto
const goToProduct = (productId) => {
  router.push(`/catalogo/${productId}`)
}

// Toggle favorito
const toggleFavorite = async (product) => {
  try {
    if (product.is_favorite) {
      await api.delete(`/favoritos/${product.id}`)
      product.is_favorite = false
      toast.success('Producto removido de favoritos')
    } else {
      await api.post('/favoritos', { producto_id: product.id })
      product.is_favorite = true
      toast.success('Producto agregado a favoritos')
    }
  } catch (error) {
    console.error('Error al actualizar favorito:', error)
    toast.error('Error al actualizar favoritos')
  }
}

// Agregar al carrito
const addToCart = async (product) => {
  try {
    await api.post('/carrito', {
      producto_id: product.id,
      cantidad: 1
    })
    toast.success(`${product.nombre} agregado al carrito`)
  } catch (error) {
    console.error('Error al agregar al carrito:', error)
    toast.error('Error al agregar al carrito')
  }
}

// Formatear precio
const formatPrice = (price) => {
  return new Intl.NumberFormat('es-ES', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(price)
}

// Watchers
watch(() => filters.sortBy, () => {
  applyFilters()
})

// Cargar datos al montar
onMounted(() => {
  loadFilters()
  loadProducts()
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