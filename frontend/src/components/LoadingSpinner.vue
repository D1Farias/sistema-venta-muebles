<template>
  <div class="loading-spinner" :class="containerClass">
    <div
      class="spinner"
      :class="spinnerClass"
      :style="{ width: size, height: size }"
    >
      <div class="spinner-inner"></div>
    </div>
    <p v-if="message" class="loading-message" :class="messageClass">
      {{ message }}
    </p>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  size: {
    type: String,
    default: '40px'
  },
  color: {
    type: String,
    default: 'primary'
  },
  message: {
    type: String,
    default: ''
  },
  overlay: {
    type: Boolean,
    default: false
  },
  center: {
    type: Boolean,
    default: true
  }
})

const containerClass = computed(() => ({
  'loading-overlay': props.overlay,
  'loading-center': props.center && !props.overlay,
  'loading-inline': !props.center && !props.overlay
}))

const spinnerClass = computed(() => ({
  'spinner-primary': props.color === 'primary',
  'spinner-white': props.color === 'white',
  'spinner-gray': props.color === 'gray'
}))

const messageClass = computed(() => ({
  'text-gray-600': props.color === 'primary' || props.color === 'gray',
  'text-white': props.color === 'white'
}))
</script>

<style scoped>
.loading-spinner {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.loading-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  z-index: 9999;
}

.loading-center {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
}

.loading-inline {
  display: inline-flex;
}

.spinner {
  position: relative;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

.spinner-inner {
  position: absolute;
  top: 2px;
  left: 2px;
  right: 2px;
  bottom: 2px;
  border-radius: 50%;
  border: 2px solid transparent;
}

.spinner-primary {
  border: 2px solid #e5e7eb;
}

.spinner-primary .spinner-inner {
  border-top-color: #3b82f6;
}

.spinner-white {
  border: 2px solid rgba(255, 255, 255, 0.3);
}

.spinner-white .spinner-inner {
  border-top-color: #ffffff;
}

.spinner-gray {
  border: 2px solid #f3f4f6;
}

.spinner-gray .spinner-inner {
  border-top-color: #6b7280;
}

.loading-message {
  margin-top: 12px;
  font-size: 14px;
  font-weight: 500;
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}
</style>