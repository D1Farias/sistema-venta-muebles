<template>
  <div class="home-page">
    <!-- API Status Indicator -->
    <div class="fixed top-4 right-4 z-50">
      <div v-if="apiStatus.testing" class="bg-yellow-500 text-white px-4 py-2 rounded-lg shadow-lg flex items-center">
        <svg class="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        Probando conexión...
      </div>
      <div v-else-if="apiStatus.connected" class="bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg flex items-center">
        <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
        </svg>
        Conectado a Xano
      </div>
      <div v-else-if="apiStatus.error" class="bg-red-500 text-white px-4 py-2 rounded-lg shadow-lg flex items-center cursor-pointer" @click="testXanoConnection">
        <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
        </svg>
        Error de conexión (click para reintentar)
      </div>
    </div>

    <!-- Hero Section -->
    <section class="hero-section bg-blue-600 text-white py-20">
      <div class="container mx-auto px-4">
        <div class="text-center">
          <h1 class="text-4xl md:text-6xl font-bold mb-6">
            Muebles Únicos Diseñados
            <span class="text-blue-300">con Inteligencia Artificial</span>
          </h1>
          <p class="text-xl md:text-2xl mb-8 text-gray-200">
            Descubre muebles personalizados que se adaptan perfectamente a tu espacio y estilo.
          </p>
          <div class="flex flex-col sm:flex-row gap-4 justify-center">
            <router-link to="/recomendaciones" class="bg-white text-blue-600 px-8 py-4 rounded-lg font-semibold hover:bg-gray-100 transition-colors">
              Obtener Recomendación IA
            </router-link>
            <router-link to="/catalogo" class="bg-transparent text-white px-8 py-4 rounded-lg font-semibold border-2 border-white hover:bg-white hover:text-blue-600 transition-colors">
              Ver Catálogo
            </router-link>
          </div>
        </div>
      </div>
    </section>

    <!-- Features Section -->
    <section class="py-20 bg-gray-50">
      <div class="container mx-auto px-4">
        <div class="text-center mb-16">
          <h2 class="text-3xl md:text-4xl font-bold mb-4">¿Por qué elegir MueblesCorp?</h2>
          <p class="text-xl text-gray-600">
            Combinamos la artesanía tradicional con tecnología de vanguardia
          </p>
        </div>

        <div class="grid md:grid-cols-3 gap-8">
          <div class="text-center p-6 bg-white rounded-lg shadow-md">
            <div class="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
            </div>
            <h3 class="text-xl font-semibold mb-2">Recomendaciones IA</h3>
            <p class="text-gray-600">
              Nuestra inteligencia artificial analiza tu espacio y preferencias para sugerir muebles perfectos
            </p>
          </div>

          <div class="text-center p-6 bg-white rounded-lg shadow-md">
            <div class="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zM21 5a2 2 0 00-2-2h-4a2 2 0 00-2 2v12a4 4 0 004 4h4a2 2 0 002-2V5z" />
              </svg>
            </div>
            <h3 class="text-xl font-semibold mb-2">Personalización Total</h3>
            <p class="text-gray-600">
              Adapta cada mueble a tus necesidades específicas: dimensiones, materiales y acabados
            </p>
          </div>

          <div class="text-center p-6 bg-white rounded-lg shadow-md">
            <div class="w-16 h-16 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
              </svg>
            </div>
            <h3 class="text-xl font-semibold mb-2">Calidad Premium</h3>
            <p class="text-gray-600">
              Materiales de primera calidad y artesanos expertos garantizan durabilidad y belleza
            </p>
          </div>
        </div>
      </div>
    </section>

    <!-- CTA Section -->
    <section class="py-20 bg-blue-600 text-white">
      <div class="container mx-auto px-4 text-center">
        <h2 class="text-3xl md:text-4xl font-bold mb-4">¿Listo para Transformar tu Espacio?</h2>
        <p class="text-xl mb-8 max-w-2xl mx-auto">
          Únete a miles de clientes satisfechos y descubre el poder de la personalización con IA
        </p>
        <div class="flex flex-col sm:flex-row gap-4 justify-center">
          <router-link to="/recomendaciones" class="bg-white text-blue-600 px-8 py-4 rounded-lg font-semibold hover:bg-gray-100 transition-colors">
            Obtener Recomendación Gratuita
          </router-link>
          <router-link to="/catalogo" class="bg-transparent text-white px-8 py-4 rounded-lg font-semibold border-2 border-white hover:bg-white hover:text-blue-600 transition-colors">
            Explorar Catálogo
          </router-link>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { catalogAPI } from '@/services/api'
import { useToast } from 'vue-toastification'

const toast = useToast()

// Estado básico
const stats = ref({
  productos: 500,
  clientes: 1200,
  recomendaciones: 2500
})

const apiStatus = ref({
  connected: false,
  testing: false,
  error: null
})

// Función para probar la conexión con Xano
const testXanoConnection = async () => {
  apiStatus.value.testing = true
  apiStatus.value.error = null
  
  try {
    console.log('🔄 Probando conexión con Xano...')
    console.log('URL de API:', import.meta.env.VITE_API_BASE_URL)
    
    // Primero, intentar una llamada básica para verificar conectividad
    console.log('📡 Intentando llamada básica a la API...')
    
    // Intentar obtener productos del catálogo
    const response = await catalogAPI.getProducts({ limit: 1 })
    
    console.log('✅ Conexión exitosa con Xano!')
    console.log('📊 Respuesta completa:', response)
    console.log('📦 Datos recibidos:', response.data)
    
    apiStatus.value.connected = true
    toast.success('✅ Conexión con Xano establecida correctamente')
    
    // Actualizar estadísticas si hay datos
    if (response.data && Array.isArray(response.data)) {
      stats.value.productos = response.data.length > 0 ? 500 : 0
    }
    
  } catch (error) {
    console.error('❌ Error conectando con Xano:', error)
    apiStatus.value.connected = false
    
    let errorMessage = 'Error desconocido'
    
    if (error.response) {
      // El servidor respondió con un código de error
      console.error('📋 Detalles del error:')
      console.error('  - Status:', error.response.status)
      console.error('  - Status Text:', error.response.statusText)
      console.error('  - Headers:', error.response.headers)
      console.error('  - Data:', error.response.data)
      
      errorMessage = `Error ${error.response.status}: ${error.response.statusText}`
      if (error.response.data?.message) {
        errorMessage += ` - ${error.response.data.message}`
      }
      
      toast.error(`❌ ${errorMessage}`)
      
    } else if (error.request) {
      // La petición se hizo pero no se recibió respuesta
      console.error('📡 No se recibió respuesta del servidor')
      console.error('  - Request:', error.request)
      
      errorMessage = 'No se pudo conectar con el servidor de Xano. Verifica la URL y tu conexión a internet.'
      toast.error(`❌ ${errorMessage}`)
      
    } else {
      // Error en la configuración de la petición
      console.error('⚙️ Error de configuración:', error.message)
      errorMessage = `Error de configuración: ${error.message}`
      toast.error(`❌ ${errorMessage}`)
    }
    
    apiStatus.value.error = errorMessage
    
  } finally {
    apiStatus.value.testing = false
  }
}

// Lifecycle
onMounted(() => {
  console.log('HomeView montado correctamente')
  // Probar conexión automáticamente al cargar
  testXanoConnection()
})
</script>

<style scoped>
.home-page {
  min-height: 100vh;
}
</style>