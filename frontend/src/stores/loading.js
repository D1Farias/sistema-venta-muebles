import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useLoadingStore = defineStore('loading', () => {
  // Estado
  const isLoading = ref(false)
  const loadingMessage = ref('')
  const loadingCount = ref(0)
  
  // Acciones
  const startLoading = (message = 'Cargando...') => {
    loadingCount.value++
    loadingMessage.value = message
    isLoading.value = true
  }
  
  const stopLoading = () => {
    loadingCount.value = Math.max(0, loadingCount.value - 1)
    
    if (loadingCount.value === 0) {
      isLoading.value = false
      loadingMessage.value = ''
    }
  }
  
  const forceStopLoading = () => {
    loadingCount.value = 0
    isLoading.value = false
    loadingMessage.value = ''
  }
  
  return {
    // Estado
    isLoading,
    loadingMessage,
    loadingCount,
    
    // Acciones
    startLoading,
    stopLoading,
    forceStopLoading
  }
})