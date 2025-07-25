<template>
  <el-dialog
    v-model="dialogVisible"
    :title="title"
    :width="modalWidth"
    :fullscreen="fullscreen"
    :top="top"
    :modal="modal"
    :modal-class="modalClass"
    :lock-scroll="lockScroll"
    :open-delay="openDelay"
    :close-delay="closeDelay"
    :close-on-click-modal="closeOnClickModal"
    :close-on-press-escape="closeOnPressEscape"
    :show-close="showClose"
    :before-close="handleBeforeClose"
    :center="center"
    :destroy-on-close="destroyOnClose"
    :class="dialogClass"
    @open="handleOpen"
    @opened="handleOpened"
    @close="handleClose"
    @closed="handleClosed"
    v-bind="$attrs"
  >
    <!-- Header slot -->
    <template #header v-if="$slots.header || customHeader">
      <slot name="header">
        <div class="modal-header">
          <div class="modal-title-wrapper">
            <component
              v-if="titleIcon"
              :is="titleIcon"
              class="modal-title-icon"
            />
            <span class="modal-title">{{ title }}</span>
          </div>
          <div v-if="headerActions" class="modal-header-actions">
            <BaseButton
              v-for="action in headerActions"
              :key="action.key"
              :type="action.type || 'default'"
              :size="action.size || 'small'"
              :icon="action.icon"
              :loading="action.loading"
              :disabled="action.disabled"
              @click="action.handler"
            >
              {{ action.label }}
            </BaseButton>
          </div>
        </div>
      </slot>
    </template>

    <!-- Body content -->
    <div :class="bodyClass">
      <slot />
    </div>

    <!-- Footer slot -->
    <template #footer v-if="$slots.footer || showDefaultFooter">
      <slot name="footer">
        <div class="modal-footer">
          <div class="modal-footer-left">
            <slot name="footer-left" />
          </div>
          <div class="modal-footer-right">
            <BaseButton
              v-if="showCancelButton"
              :size="buttonSize"
              :loading="cancelLoading"
              :disabled="cancelDisabled"
              @click="handleCancel"
            >
              {{ cancelText }}
            </BaseButton>
            <BaseButton
              v-if="showConfirmButton"
              :type="confirmType"
              :size="buttonSize"
              :loading="confirmLoading"
              :disabled="confirmDisabled"
              @click="handleConfirm"
            >
              {{ confirmText }}
            </BaseButton>
          </div>
        </div>
      </slot>
    </template>
  </el-dialog>
</template>

<script setup>
import { computed, ref, watch, defineProps, defineEmits } from 'vue'
import BaseButton from './BaseButton.vue'

const props = defineProps({
  // Element Plus props
  modelValue: {
    type: Boolean,
    default: false
  },
  title: {
    type: String,
    default: ''
  },
  width: {
    type: [String, Number],
    default: '50%'
  },
  fullscreen: {
    type: Boolean,
    default: false
  },
  top: {
    type: String,
    default: '15vh'
  },
  modal: {
    type: Boolean,
    default: true
  },
  lockScroll: {
    type: Boolean,
    default: true
  },
  openDelay: {
    type: Number,
    default: 0
  },
  closeDelay: {
    type: Number,
    default: 0
  },
  closeOnClickModal: {
    type: Boolean,
    default: true
  },
  closeOnPressEscape: {
    type: Boolean,
    default: true
  },
  showClose: {
    type: Boolean,
    default: true
  },
  center: {
    type: Boolean,
    default: false
  },
  destroyOnClose: {
    type: Boolean,
    default: false
  },

  // Custom props
  size: {
    type: String,
    default: 'default',
    validator: (value) => ['small', 'default', 'large', 'extra-large'].includes(value)
  },
  variant: {
    type: String,
    default: 'default',
    validator: (value) => ['default', 'form', 'confirmation', 'info'].includes(value)
  },
  titleIcon: {
    type: [String, Object],
    default: null
  },
  customHeader: {
    type: Boolean,
    default: false
  },
  headerActions: {
    type: Array,
    default: () => []
  },
  bodyPadding: {
    type: String,
    default: 'default',
    validator: (value) => ['none', 'small', 'default', 'large'].includes(value)
  },

  // Footer props
  showDefaultFooter: {
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
    default: 'İptal'
  },
  confirmText: {
    type: String,
    default: 'Tamam'
  },
  confirmType: {
    type: String,
    default: 'primary'
  },
  buttonSize: {
    type: String,
    default: 'default'
  },
  confirmLoading: {
    type: Boolean,
    default: false
  },
  cancelLoading: {
    type: Boolean,
    default: false
  },
  confirmDisabled: {
    type: Boolean,
    default: false
  },
  cancelDisabled: {
    type: Boolean,
    default: false
  },

  // Advanced props
  persistent: {
    type: Boolean,
    default: false
  },
  scrollable: {
    type: Boolean,
    default: false
  },
  maxHeight: {
    type: String,
    default: null
  }
})

const emit = defineEmits([
  'update:modelValue',
  'open',
  'opened',
  'close',
  'closed',
  'confirm',
  'cancel',
  'before-close'
])

// Local state
const dialogVisible = ref(props.modelValue)

// Watch for external changes
watch(() => props.modelValue, (newValue) => {
  dialogVisible.value = newValue
})

watch(dialogVisible, (newValue) => {
  emit('update:modelValue', newValue)
})

// Computed properties
const modalWidth = computed(() => {
  if (props.fullscreen) return '100%'

  const sizeMap = {
    small: '400px',
    default: '50%',
    large: '70%',
    'extra-large': '90%'
  }

  return props.width || sizeMap[props.size]
})

const modalClass = computed(() => {
  const classes = []

  if (props.variant !== 'default') {
    classes.push(`modal-${props.variant}`)
  }

  if (props.scrollable) {
    classes.push('modal-scrollable')
  }

  return classes.join(' ')
})

const dialogClass = computed(() => {
  const classes = ['base-modal']

  if (props.size !== 'default') {
    classes.push(`modal-${props.size}`)
  }

  if (props.persistent) {
    classes.push('modal-persistent')
  }

  return classes.join(' ')
})

const bodyClass = computed(() => {
  const classes = ['modal-body']

  if (props.bodyPadding !== 'default') {
    classes.push(`modal-body-${props.bodyPadding}`)
  }

  if (props.scrollable && props.maxHeight) {
    classes.push('modal-body-scrollable')
  }

  return classes.join(' ')
})

// Event handlers
const handleBeforeClose = (done) => {
  if (props.persistent) {
    emit('before-close', done)
    return
  }

  emit('before-close', done)
  done()
}

const handleOpen = () => {
  emit('open')
}

const handleOpened = () => {
  emit('opened')
}

const handleClose = () => {
  emit('close')
}

const handleClosed = () => {
  emit('closed')
}

const handleConfirm = () => {
  emit('confirm')
}

const handleCancel = () => {
  emit('cancel')
  if (!props.persistent) {
    dialogVisible.value = false
  }
}

// Methods for external access
const close = () => {
  dialogVisible.value = false
}

const open = () => {
  dialogVisible.value = true
}

defineExpose({
  close,
  open
})
</script>

<style scoped>
/* Modal header */
.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
}

.modal-title-wrapper {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1;
}

.modal-title-icon {
  width: 20px;
  height: 20px;
  color: var(--el-color-primary);
}

.modal-title {
  font-size: 18px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.modal-header-actions {
  display: flex;
  gap: 8px;
}

/* Modal body */
.modal-body {
  position: relative;
}

.modal-body-none {
  padding: 0;
}

.modal-body-small {
  padding: 12px;
}

.modal-body-large {
  padding: 32px;
}

.modal-body-scrollable {
  max-height: v-bind(maxHeight);
  overflow-y: auto;
  scroll-behavior: smooth;
}

/* Custom scrollbar */
.modal-body-scrollable::-webkit-scrollbar {
  width: 6px;
}

.modal-body-scrollable::-webkit-scrollbar-track {
  background: var(--el-fill-color-light);
  border-radius: 3px;
}

.modal-body-scrollable::-webkit-scrollbar-thumb {
  background: var(--el-border-color);
  border-radius: 3px;
}

.modal-body-scrollable::-webkit-scrollbar-thumb:hover {
  background: var(--el-border-color-dark);
}

/* Modal footer */
.modal-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
  margin-top: 24px;
}

.modal-footer-left {
  flex: 1;
}

.modal-footer-right {
  display: flex;
  gap: 12px;
}

/* Modal variants */
:deep(.modal-form .el-dialog__header) {
  background-color: var(--el-color-primary-light-9);
  margin: 0;
  padding: 20px 24px;
}

:deep(.modal-confirmation .el-dialog__header) {
  background-color: var(--el-color-warning-light-9);
  margin: 0;
  padding: 20px 24px;
}

:deep(.modal-info .el-dialog__header) {
  background-color: var(--el-color-info-light-9);
  margin: 0;
  padding: 20px 24px;
}

/* Modal sizes */
:deep(.modal-small .el-dialog) {
  max-width: 400px;
}

:deep(.modal-large .el-dialog) {
  max-width: 1000px;
}

:deep(.modal-extra-large .el-dialog) {
  max-width: 1200px;
}

/* Scrollable modal */
:deep(.modal-scrollable .el-dialog__body) {
  max-height: 60vh;
  overflow-y: auto;
}

/* Persistent modal effects */
.modal-persistent {
  pointer-events: none;
}

:deep(.modal-persistent .el-dialog) {
  pointer-events: auto;
}

/* Responsive design */
@media (max-width: 768px) {
  :deep(.base-modal .el-dialog) {
    width: 95% !important;
    margin: 0 auto;
  }

  .modal-header {
    flex-direction: column;
    align-items: stretch;
    gap: 12px;
  }

  .modal-footer {
    flex-direction: column-reverse;
    gap: 12px;
  }

  .modal-footer-right {
    justify-content: stretch;
  }

  .modal-footer-right .el-button {
    flex: 1;
  }

  :deep(.modal-scrollable .el-dialog__body) {
    max-height: 50vh;
  }
}

/* Animation improvements */
:deep(.el-dialog) {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

:deep(.el-overlay-dialog) {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

/* Focus management */
:deep(.el-dialog__header) {
  outline: none;
}

:deep(.el-dialog__body) {
  outline: none;
}

/* Loading state */
.modal-body.loading {
  position: relative;
  pointer-events: none;
  opacity: 0.7;
}

.modal-body.loading::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(255, 255, 255, 0.8);
  z-index: 1000;
}
</style>
