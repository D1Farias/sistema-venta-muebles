import { createApp } from 'vue'
import { createPinia } from 'pinia'
import Toast from 'vue-toastification'

import App from './App.vue'
import router from './router'

// Estilos
import './assets/css/main.css'
import 'vue-toastification/dist/index.css'

const app = createApp(App)

// Configuración de Pinia (store)
app.use(createPinia())

// Configuración del router
app.use(router)

// Configuración de vue-toastification
app.use(Toast, {
  position: 'top-right',
  timeout: 5000,
  closeOnClick: true,
  pauseOnFocusLoss: true,
  pauseOnHover: true,
  draggable: true,
  draggablePercent: 0.6,
  showCloseButtonOnHover: false,
  hideProgressBar: false,
  closeButton: 'button',
  icon: true,
  rtl: false
})

app.mount('#app')