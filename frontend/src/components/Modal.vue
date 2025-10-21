<template>
  <teleport to="body">
    <transition
      enter-active-class="transition ease-out duration-300"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="transition ease-in duration-200"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div
        v-if="modelValue"
        class="modal-overlay"
        @click="handleOverlayClick"
      >
        <transition
          enter-active-class="transition ease-out duration-300"
          enter-from-class="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
          enter-to-class="opacity-100 translate-y-0 sm:scale-100"
          leave-active-class="transition ease-in duration-200"
          leave-from-class="opacity-100 translate-y-0 sm:scale-100"
          leave-to-class="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
        >
          <div
            v-if="modelValue"
            class="modal-container"
            :class="modalSizeClass"
            @click.stop
          >
            <!-- Header -->
            <div v-if="showHeader" class="modal-header">
              <div class="modal-title-section">
                <div v-if="icon" class="modal-icon" :class="iconColorClass">
                  <component :is="iconComponent" class="w-6 h-6" />
                </div>
                <div>
                  <h3 v-if="title" class="modal-title">
                    {{ title }}
                  </h3>
                  <p v-if="subtitle" class="modal-subtitle">
                    {{ subtitle }}
                  </p>
                </div>
              </div>
              
              <button
                v-if="closable"
                @click="close"
                class="modal-close-btn"
                type="button"
              >
                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <!-- Body -->
            <div class="modal-body" :class="bodyClass">
              <slot />
            </div>

            <!-- Footer -->
            <div v-if="showFooter" class="modal-footer" :class="footerClass">
              <slot name="footer">
                <div class="modal-default-footer">
                  <button
                    v-if="showCancelButton"
                    @click="cancel"
                    type="button"
                    class="btn-secondary"
                    :disabled="loading"
                  >
                    {{ cancelText }}
                  </button>
                  <button
                    v-if="showConfirmButton"
                    @click="confirm"
                    type="button"
                    class="btn-primary"
                    :class="confirmButtonClass"
                    :disabled="loading || confirmDisabled"
                  >
                    <svg
                      v-if="loading"
                      class="animate-spin -ml-1 mr-2 h-4 w-4"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                      <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    {{ loading ? loadingText : confirmText }}
                  </button>
                </div>
              </slot>
            </div>
          </div>
        </transition>
      </div>
    </transition>
  </teleport>
</template>

<script setup>
import { computed, onMounted, onUnmounted, h } from 'vue'

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false
  },
  title: {
    type: String,
    default: ''
  },
  subtitle: {
    type: String,
    default: ''
  },
  size: {
    type: String,
    default: 'md',
    validator: (value) => ['xs', 'sm', 'md', 'lg', 'xl', '2xl', 'full'].includes(value)
  },
  closable: {
    type: Boolean,
    default: true
  },
  closeOnOverlay: {
    type: Boolean,
    default: true
  },
  showHeader: {
    type: Boolean,
    default: true
  },
  showFooter: {
    type: Boolean,
    default: false
  },
  showCancelButton: {
    type: Boolean,
    default: true
  },
  showConfirmButton: {
    type: Boolean,
    default: true
  },
  cancelText: {
    type: String,
    default: 'Cancelar'
  },
  confirmText: {
    type: String,
    default: 'Confirmar'
  },
  loadingText: {
    type: String,
    default: 'Procesando...'
  },
  confirmType: {
    type: String,
    default: 'primary',
    validator: (value) => ['primary', 'danger', 'warning', 'success'].includes(value)
  },
  confirmDisabled: {
    type: Boolean,
    default: false
  },
  loading: {
    type: Boolean,
    default: false
  },
  icon: {
    type: String,
    default: ''
  },
  iconType: {
    type: String,
    default: 'info',
    validator: (value) => ['info', 'success', 'warning', 'error'].includes(value)
  },
  bodyClass: {
    type: String,
    default: ''
  },
  footerClass: {
    type: String,
    default: ''
  },
  persistent: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['update:modelValue', 'close', 'cancel', 'confirm'])

// Computed
const modalSizeClass = computed(() => {
  const sizeClasses = {
    xs: 'max-w-xs',
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
    full: 'max-w-full mx-4'
  }
  return sizeClasses[props.size] || sizeClasses.md
})

const confirmButtonClass = computed(() => {
  const typeClasses = {
    primary: 'btn-primary',
    danger: 'btn-danger',
    warning: 'btn-warning',
    success: 'btn-success'
  }
  return typeClasses[props.confirmType] || typeClasses.primary
})

const iconColorClass = computed(() => {
  const colorClasses = {
    info: 'text-blue-600 bg-blue-100',
    success: 'text-green-600 bg-green-100',
    warning: 'text-yellow-600 bg-yellow-100',
    error: 'text-red-600 bg-red-100'
  }
  return colorClasses[props.iconType] || colorClasses.info
})

const iconComponent = computed(() => {
  const icons = {
    info: () => h('svg', {
      fill: 'none',
      stroke: 'currentColor',
      viewBox: '0 0 24 24'
    }, [
      h('path', {
        'stroke-linecap': 'round',
        'stroke-linejoin': 'round',
        'stroke-width': '2',
        d: 'M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z'
      })
    ]),
    success: () => h('svg', {
      fill: 'none',
      stroke: 'currentColor',
      viewBox: '0 0 24 24'
    }, [
      h('path', {
        'stroke-linecap': 'round',
        'stroke-linejoin': 'round',
        'stroke-width': '2',
        d: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z'
      })
    ]),
    warning: () => h('svg', {
      fill: 'none',
      stroke: 'currentColor',
      viewBox: '0 0 24 24'
    }, [
      h('path', {
        'stroke-linecap': 'round',
        'stroke-linejoin': 'round',
        'stroke-width': '2',
        d: 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z'
      })
    ]),
    error: () => h('svg', {
      fill: 'none',
      stroke: 'currentColor',
      viewBox: '0 0 24 24'
    }, [
      h('path', {
        'stroke-linecap': 'round',
        'stroke-linejoin': 'round',
        'stroke-width': '2',
        d: 'M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z'
      })
    ])
  }
  
  return icons[props.icon] || icons[props.iconType] || icons.info
})

// Methods
const close = () => {
  if (props.persistent && props.loading) return
  emit('update:modelValue', false)
  emit('close')
}

const cancel = () => {
  if (props.loading) return
  emit('cancel')
  close()
}

const confirm = () => {
  emit('confirm')
}

const handleOverlayClick = () => {
  if (props.closeOnOverlay && !props.persistent) {
    close()
  }
}

const handleEscapeKey = (event) => {
  if (event.key === 'Escape' && props.modelValue && props.closable && !props.persistent) {
    close()
  }
}

// Lifecycle
onMounted(() => {
  document.addEventListener('keydown', handleEscapeKey)
  
  // Prevent body scroll when modal is open
  if (props.modelValue) {
    document.body.style.overflow = 'hidden'
  }
})

onUnmounted(() => {
  document.removeEventListener('keydown', handleEscapeKey)
  document.body.style.overflow = ''
})

// Watch for modelValue changes to handle body scroll
const handleBodyScroll = (isOpen) => {
  if (isOpen) {
    document.body.style.overflow = 'hidden'
  } else {
    document.body.style.overflow = ''
  }
}

// Watch modelValue
const unwatchModelValue = computed(() => props.modelValue)
unwatchModelValue.value && handleBodyScroll(unwatchModelValue.value)
</script>

<style scoped>
.modal-overlay {
  @apply fixed inset-0 z-50 overflow-y-auto;
  background-color: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(4px);
}

.modal-container {
  @apply relative w-full mx-auto my-8 bg-white rounded-lg shadow-xl;
  min-height: calc(100vh - 4rem);
  display: flex;
  flex-direction: column;
  max-height: calc(100vh - 4rem);
}

@media (min-width: 640px) {
  .modal-container {
    min-height: auto;
    max-height: calc(100vh - 8rem);
    margin: 4rem auto;
  }
}

.modal-header {
  @apply flex items-start justify-between p-6 border-b border-gray-200;
}

.modal-title-section {
  @apply flex items-start space-x-3;
}

.modal-icon {
  @apply flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center;
}

.modal-title {
  @apply text-lg font-semibold text-gray-900;
}

.modal-subtitle {
  @apply mt-1 text-sm text-gray-600;
}

.modal-close-btn {
  @apply flex-shrink-0 p-1 text-gray-400 hover:text-gray-600 transition-colors rounded-md hover:bg-gray-100;
}

.modal-body {
  @apply flex-1 p-6 overflow-y-auto;
}

.modal-footer {
  @apply flex-shrink-0 px-6 py-4 border-t border-gray-200 bg-gray-50;
}

.modal-default-footer {
  @apply flex justify-end space-x-3;
}

/* Button styles */
.btn-primary {
  @apply px-4 py-2 bg-primary-600 text-white font-medium rounded-lg hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed;
}

.btn-secondary {
  @apply px-4 py-2 bg-white text-gray-700 font-medium rounded-lg border border-gray-300 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed;
}

.btn-danger {
  @apply px-4 py-2 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed;
}

.btn-warning {
  @apply px-4 py-2 bg-yellow-600 text-white font-medium rounded-lg hover:bg-yellow-700 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed;
}

.btn-success {
  @apply px-4 py-2 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed;
}
</style>