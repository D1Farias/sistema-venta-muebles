<template>
  <div class="product-card group">
    <!-- Imagen del producto -->
    <div class="product-image-container">
      <img
        :src="product.imagen_url || '/placeholder-product.jpg'"
        :alt="product.nombre"
        class="product-image"
        @error="handleImageError"
      />
      
      <!-- Overlay con acciones -->
      <div class="product-overlay">
        <div class="product-actions">
          <button
            @click="toggleFavorite"
            class="action-btn"
            :class="{ 'text-red-500': isFavorite, 'text-white': !isFavorite }"
            :title="isFavorite ? 'Quitar de favoritos' : 'Agregar a favoritos'"
          >
            <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
            </svg>
          </button>
          
          <button
            @click="viewProduct"
            class="action-btn text-white"
            title="Ver detalles"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
          </button>
          
          <button
            @click="addToCart"
            class="action-btn text-white"
            title="Agregar al carrito"
            :disabled="!product.disponible"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-1.5 6M7 13l-1.5 6m0 0h9m-9 0h9" />
            </svg>
          </button>
        </div>
      </div>

      <!-- Badges -->
      <div class="product-badges">
        <span v-if="product.nuevo" class="badge badge-new">Nuevo</span>
        <span v-if="product.oferta" class="badge badge-sale">Oferta</span>
        <span v-if="!product.disponible" class="badge badge-unavailable">Agotado</span>
        <span v-if="product.personalizable" class="badge badge-custom">Personalizable</span>
      </div>
    </div>

    <!-- Información del producto -->
    <div class="product-info">
      <div class="product-category">
        {{ product.categoria?.nombre || 'Sin categoría' }}
      </div>
      
      <h3 class="product-title" @click="viewProduct">
        {{ product.nombre }}
      </h3>
      
      <p class="product-description">
        {{ truncatedDescription }}
      </p>

      <!-- Materiales -->
      <div v-if="product.materiales && product.materiales.length > 0" class="product-materials">
        <span
          v-for="material in product.materiales.slice(0, 3)"
          :key="material.id"
          class="material-tag"
        >
          {{ material.nombre }}
        </span>
        <span v-if="product.materiales.length > 3" class="material-more">
          +{{ product.materiales.length - 3 }} más
        </span>
      </div>

      <!-- Dimensiones -->
      <div v-if="product.dimensiones" class="product-dimensions">
        <svg class="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
        </svg>
        <span>{{ formatDimensions(product.dimensiones) }}</span>
      </div>

      <!-- Precio y acciones -->
      <div class="product-footer">
        <div class="product-pricing">
          <span v-if="product.precio_oferta" class="price-original">
            ${{ formatPrice(product.precio) }}
          </span>
          <span class="price-current">
            ${{ formatPrice(product.precio_oferta || product.precio) }}
          </span>
        </div>

        <div class="product-footer-actions">
          <button
            @click="addToCart"
            class="btn-add-cart"
            :disabled="!product.disponible"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            {{ product.disponible ? 'Agregar' : 'Agotado' }}
          </button>
        </div>
      </div>

      <!-- Rating -->
      <div v-if="product.rating" class="product-rating">
        <div class="stars">
          <svg
            v-for="star in 5"
            :key="star"
            class="star"
            :class="{ 'star-filled': star <= Math.round(product.rating) }"
            fill="currentColor"
            viewBox="0 0 24 24"
          >
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
          </svg>
        </div>
        <span class="rating-text">
          {{ product.rating.toFixed(1) }} ({{ product.reviews_count || 0 }})
        </span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useToast } from 'vue-toastification'
import { useAuthStore } from '@/stores/auth'
import api from '@/services/api'

const props = defineProps({
  product: {
    type: Object,
    required: true
  },
  showActions: {
    type: Boolean,
    default: true
  }
})

const emit = defineEmits(['favorite-toggled', 'added-to-cart'])

const router = useRouter()
const toast = useToast()
const authStore = useAuthStore()

// Estado
const isFavorite = ref(props.product.es_favorito || false)
const isAddingToCart = ref(false)

// Computed
const truncatedDescription = computed(() => {
  if (!props.product.descripcion) return ''
  return props.product.descripcion.length > 100
    ? props.product.descripcion.substring(0, 100) + '...'
    : props.product.descripcion
})

// Métodos
const handleImageError = (event) => {
  event.target.src = '/placeholder-product.jpg'
}

const formatPrice = (price) => {
  return new Intl.NumberFormat('es-ES', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(price)
}

const formatDimensions = (dimensions) => {
  if (typeof dimensions === 'string') {
    return dimensions
  }
  if (typeof dimensions === 'object') {
    const { largo, ancho, alto } = dimensions
    return `${largo}×${ancho}×${alto} cm`
  }
  return ''
}

const viewProduct = () => {
  router.push(`/catalogo/${props.product.id}`)
}

const toggleFavorite = async () => {
  if (!authStore.isAuthenticated) {
    toast.warning('Debes iniciar sesión para agregar favoritos')
    router.push('/auth/login')
    return
  }

  try {
    if (isFavorite.value) {
      await api.delete(`/productos/${props.product.id}/favorito`)
      toast.success('Producto removido de favoritos')
    } else {
      await api.post(`/productos/${props.product.id}/favorito`)
      toast.success('Producto agregado a favoritos')
    }
    
    isFavorite.value = !isFavorite.value
    emit('favorite-toggled', {
      productId: props.product.id,
      isFavorite: isFavorite.value
    })
  } catch (error) {
    console.error('Error toggling favorite:', error)
    toast.error('Error al actualizar favoritos')
  }
}

const addToCart = async () => {
  if (!authStore.isAuthenticated) {
    toast.warning('Debes iniciar sesión para agregar productos al carrito')
    router.push('/auth/login')
    return
  }

  if (!props.product.disponible) {
    toast.warning('Este producto no está disponible')
    return
  }

  isAddingToCart.value = true

  try {
    await api.post('/carrito/agregar', {
      producto_id: props.product.id,
      cantidad: 1
    })

    toast.success('Producto agregado al carrito')
    emit('added-to-cart', {
      productId: props.product.id,
      product: props.product
    })
  } catch (error) {
    console.error('Error adding to cart:', error)
    
    if (error.response?.status === 409) {
      toast.warning('Este producto ya está en tu carrito')
    } else {
      toast.error('Error al agregar producto al carrito')
    }
  } finally {
    isAddingToCart.value = false
  }
}
</script>

<style scoped>
.product-card {
  @apply bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden transition-all duration-300 hover:shadow-lg hover:border-gray-300;
}

.product-image-container {
  @apply relative overflow-hidden bg-gray-100;
  aspect-ratio: 4/3;
}

.product-image {
  @apply w-full h-full object-cover transition-transform duration-300 group-hover:scale-105;
}

.product-overlay {
  @apply absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition-all duration-300 flex items-center justify-center opacity-0 group-hover:opacity-100;
}

.product-actions {
  @apply flex space-x-2;
}

.action-btn {
  @apply p-2 bg-black bg-opacity-50 rounded-full hover:bg-opacity-70 transition-all duration-200 backdrop-blur-sm;
}

.product-badges {
  @apply absolute top-3 left-3 flex flex-col space-y-1;
}

.badge {
  @apply px-2 py-1 text-xs font-semibold rounded-full;
}

.badge-new {
  @apply bg-green-500 text-white;
}

.badge-sale {
  @apply bg-red-500 text-white;
}

.badge-unavailable {
  @apply bg-gray-500 text-white;
}

.badge-custom {
  @apply bg-blue-500 text-white;
}

.product-info {
  @apply p-4 space-y-3;
}

.product-category {
  @apply text-xs font-medium text-primary-600 uppercase tracking-wide;
}

.product-title {
  @apply text-lg font-semibold text-gray-900 cursor-pointer hover:text-primary-600 transition-colors line-clamp-2;
}

.product-description {
  @apply text-sm text-gray-600 line-clamp-2;
}

.product-materials {
  @apply flex flex-wrap gap-1;
}

.material-tag {
  @apply px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded-full;
}

.material-more {
  @apply px-2 py-1 text-xs bg-gray-200 text-gray-600 rounded-full;
}

.product-dimensions {
  @apply flex items-center space-x-1 text-sm text-gray-500;
}

.product-footer {
  @apply flex items-center justify-between;
}

.product-pricing {
  @apply flex flex-col;
}

.price-original {
  @apply text-sm text-gray-500 line-through;
}

.price-current {
  @apply text-lg font-bold text-gray-900;
}

.product-footer-actions {
  @apply flex space-x-2;
}

.btn-add-cart {
  @apply flex items-center space-x-1 px-3 py-2 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed;
}

.product-rating {
  @apply flex items-center justify-between text-sm;
}

.stars {
  @apply flex space-x-1;
}

.star {
  @apply w-4 h-4 text-gray-300;
}

.star-filled {
  @apply text-yellow-400;
}

.rating-text {
  @apply text-gray-600;
}

/* Utilidades */
.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>