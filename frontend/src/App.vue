<template>
  <!-- Contenedor principal de la aplicación con altura mínima completa -->
  <div id="app" class="min-h-screen bg-gray-50">
    <!-- Barra de navegación - Se oculta en páginas de autenticación -->
    <NavBar v-if="!isAuthPage" />
    
    <!-- Contenido principal - Agrega padding-top cuando hay navbar -->
    <main :class="{ 'pt-16': !isAuthPage }">
      <!-- Router view donde se renderizan las diferentes páginas -->
      <router-view />
    </main>
    
    <!-- Footer - Se oculta en páginas de autenticación -->
    <AppFooter v-if="!isAuthPage" />
  </div>
</template>

<script>
// Importaciones de Vue y composables
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { useLoadingStore } from '@/stores/loading'

// Importaciones de componentes
import NavBar from '@/components/NavBar.vue'
import AppFooter from '@/components/FooterComponent.vue'

export default {
  name: 'App', // Nombre del componente raíz
  
  // Registro de componentes utilizados
  components: {
    NavBar,     // Barra de navegación principal
    AppFooter   // Footer de la aplicación
  },
  
  // Composition API setup function
  setup() {
    // Acceso a la ruta actual
    const route = useRoute()
    
    // Acceso al store de loading global
    const loadingStore = useLoadingStore()
    
    // Lista de páginas donde no se muestra la navegación ni footer
    const authPages = ['login', 'register', 'forgot-password', 'reset-password']
    
    // Computed que determina si estamos en una página de autenticación
    const isAuthPage = computed(() => {
      return authPages.includes(route.name)
    })
    
    // Computed que obtiene el estado de loading global
    const isLoading = computed(() => loadingStore.isLoading)
    
    // Retorna las propiedades reactivas para el template
    return {
      isAuthPage,  // Booleano para mostrar/ocultar navbar y footer
      isLoading    // Estado de carga global
    }
  }
}
</script>

<style>
/* ===== ESTILOS GLOBALES ===== */
#app {
  /* Stack de fuentes modernas con fallbacks */
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  /* Suavizado de fuentes para mejor legibilidad */
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

/* ===== SCROLLBAR PERSONALIZADO ===== */
::-webkit-scrollbar {
  width: 8px; /* Ancho del scrollbar */
}

::-webkit-scrollbar-track {
  background: #f1f1f1; /* Color de fondo del track */
}

::-webkit-scrollbar-thumb {
  background: #c1c1c1;  /* Color del thumb */
  border-radius: 4px;   /* Bordes redondeados */
}

::-webkit-scrollbar-thumb:hover {
  background: #a8a8a8; /* Color al hacer hover */
}

/* ===== TRANSICIONES DE ROUTER ===== */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease; /* Transición suave de opacidad */
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0; /* Estado inicial/final de la transición */
}

/* ===== CLASES DE UTILIDAD REUTILIZABLES ===== */

/* Botón primario - Acción principal */
.btn-primary {
  @apply bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200;
}

/* Botón secundario - Acción secundaria */
.btn-secondary {
  @apply bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium py-2 px-4 rounded-lg transition-colors duration-200;
}

/* Botón de peligro - Acciones destructivas */
.btn-danger {
  @apply bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200;
}

/* Campo de entrada estándar */
.input-field {
  @apply w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent;
}

/* Tarjeta base para contenido */
.card {
  @apply bg-white rounded-lg shadow-md p-6;
}
</style>