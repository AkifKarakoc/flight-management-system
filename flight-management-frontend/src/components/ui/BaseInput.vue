<template>
  <div :class="wrapperClass">
    <!-- Label -->
    <label
      v-if="label"
      :for="inputId"
      :class="labelClass"
    >
      {{ label }}
      <span v-if="required" class="input-required">*</span>
    </label>

    <!-- Input field -->
    <el-input
      :id="inputId"
      v-model="inputValue"
      :type="type"
      :placeholder="placeholder"
      :disabled="disabled"
      :readonly="readonly"
      :clearable="clearable"
      :show-password="showPassword"
      :size="size"
      :prefix-icon="prefixIcon"
      :suffix-icon="suffixIcon"
      :rows="rows"
      :autosize="autosize"
      :autocomplete="autocomplete"
      :name="name"
      :max="max"
      :min="min"
      :step="step"
      :resize="resize"
      :autofocus="autofocus"
      :form="form"
      :tabindex="tabindex"
      :validate-event="validateEvent"
      :input-style="inputStyle"
      :class="inputClass"
      @input="handleInput"
      @change="handleChange"
      @focus="handleFocus"
      @blur="handleBlur"
      @clear="handleClear"
      @keydown="handleKeydown"
      @keyup="handleKeyup"
      @keypress="handleKeypress"
      v-bind="$attrs"
    >
      <!-- Prefix slot -->
      <template #prefix v-if="$slots.prefix">
        <slot name="prefix" />
      </template>

      <!-- Suffix slot -->
      <template #suffix v-if="$slots.suffix">
        <slot name="suffix" />
      </template>

      <!-- Prepend slot -->
      <template #prepend v-if="$slots.prepend">
        <slot name="prepend" />
      </template>

      <!-- Append slot -->
      <template #append v-if="$slots.append">
        <slot name="append" />
      </template>
    </el-input>

    <!-- Help text -->
    <div v-if="helpText" class="input-help">
      {{ helpText }}
    </div>

    <!-- Error message -->
    <div v-if="errorMessage" class="input-error">
      {{ errorMessage }}
    </div>

    <!-- Success message -->
    <div v-if="successMessage" class="input-success">
      {{ successMessage }}
    </div>

    <!-- Character counter -->
    <div
      v-if="showCounter && maxlength"
      :class="counterClass"
    >
      {{ characterCount }} / {{ maxlength }}
    </div>
  </div>
</template>

<script setup>
import { computed, ref, watch, defineProps, defineEmits, useAttrs } from 'vue'
import { debounce } from '@/utils/helpers'

const props = defineProps({
  // v-model
  modelValue: {
    type: [String, Number],
    default: ''
  },

  // Element Plus props
  type: {
    type: String,
    default: 'text',
    validator: (value) => [
      'text', 'number', 'email', 'password', 'tel', 'url', 'search',
      'textarea', 'date', 'datetime-local', 'time', 'month', 'week'
    ].includes(value)
  },
  placeholder: {
    type: String,
    default: ''
  },
  disabled: {
    type: Boolean,
    default: false
  },
  readonly: {
    type: Boolean,
    default: false
  },
  clearable: {
    type: Boolean,
    default: false
  },
  showPassword: {
    type: Boolean,
    default: false
  },
  size: {
    type: String,
    default: 'default',
    validator: (value) => ['large', 'default', 'small'].includes(value)
  },
  prefixIcon: {
    type: [String, Object],
    default: null
  },
  suffixIcon: {
    type: [String, Object],
    default: null
  },
  rows: {
    type: Number,
    default: 2
  },
  autosize: {
    type: [Boolean, Object],
    default: false
  },
  autocomplete: {
    type: String,
    default: 'off'
  },
  name: {
    type: String,
    default: null
  },
  max: {
    type: [String, Number],
    default: null
  },
  min: {
    type: [String, Number],
    default: null
  },
  step: {
    type: [String, Number],
    default: null
  },
  resize: {
    type: String,
    default: null,
    validator: (value) => !value || ['none', 'both', 'horizontal', 'vertical'].includes(value)
  },
  autofocus: {
    type: Boolean,
    default: false
  },
  form: {
    type: String,
    default: null
  },
  tabindex: {
    type: [String, Number],
    default: null
  },
  validateEvent: {
    type: Boolean,
    default: true
  },
  inputStyle: {
    type: Object,
    default: () => ({})
  },

  // Custom props
  label: {
    type: String,
    default: null
  },
  required: {
    type: Boolean,
    default: false
  },
  helpText: {
    type: String,
    default: null
  },
  errorMessage: {
    type: String,
    default: null
  },
  successMessage: {
    type: String,
    default: null
  },
  variant: {
    type: String,
    default: 'default',
    validator: (value) => ['default', 'outlined', 'filled', 'borderless'].includes(value)
  },
  density: {
    type: String,
    default: 'default',
    validator: (value) => ['compact', 'default', 'comfortable'].includes(value)
  },
  maxlength: {
    type: [String, Number],
    default: null
  },
  showCounter: {
    type: Boolean,
    default: false
  },
  debounceDelay: {
    type: Number,
    default: 0
  },
  uppercase: {
    type: Boolean,
    default: false
  },
  lowercase: {
    type: Boolean,
    default: false
  },
  mask: {
    type: String,
    default: null
  },
  loading: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits([
  'update:modelValue',
  'input',
  'change',
  'focus',
  'blur',
  'clear',
  'keydown',
  'keyup',
  'keypress',
  'enter'
])

const attrs = useAttrs()

// Local state
const inputValue = ref(props.modelValue)
const isFocused = ref(false)
const inputId = ref(`input-${Math.random().toString(36).substr(2, 9)}`)

// Watch for external changes
watch(() => props.modelValue, (newValue) => {
  inputValue.value = newValue
})

// Debounced input handler
const debouncedInput = props.debounceDelay > 0
  ? debounce((value) => {
    emit('update:modelValue', value)
    emit('input', value)
  }, props.debounceDelay)
  : null

// Computed properties
const wrapperClass = computed(() => {
  const classes = ['base-input']

  if (props.variant !== 'default') {
    classes.push(`input-${props.variant}`)
  }

  if (props.density !== 'default') {
    classes.push(`input-${props.density}`)
  }

  if (props.errorMessage) {
    classes.push('input-has-error')
  }

  if (props.successMessage) {
    classes.push('input-has-success')
  }

  if (props.disabled) {
    classes.push('input-disabled')
  }

  if (props.readonly) {
    classes.push('input-readonly')
  }

  if (isFocused.value) {
    classes.push('input-focused')
  }

  if (props.loading) {
    classes.push('input-loading')
  }

  return classes.join(' ')
})

const labelClass = computed(() => {
  const classes = ['input-label']

  if (props.required) {
    classes.push('input-label-required')
  }

  if (props.disabled) {
    classes.push('input-label-disabled')
  }

  return classes.join(' ')
})

const inputClass = computed(() => {
  const classes = []

  if (props.errorMessage) {
    classes.push('input-error-state')
  }

  if (props.successMessage) {
    classes.push('input-success-state')
  }

  return classes.join(' ')
})

const counterClass = computed(() => {
  const classes = ['input-counter']

  if (props.maxlength && characterCount.value > props.maxlength) {
    classes.push('input-counter-error')
  }

  return classes.join(' ')
})

const characterCount = computed(() => {
  return String(inputValue.value || '').length
})

// Event handlers
const handleInput = (value) => {
  // Apply text transformations
  if (props.uppercase) {
    value = value.toUpperCase()
  } else if (props.lowercase) {
    value = value.toLowerCase()
  }

  // Apply mask if provided
  if (props.mask) {
    value = applyMask(value, props.mask)
  }

  inputValue.value = value

  if (props.debounceDelay > 0 && debouncedInput) {
    debouncedInput(value)
  } else {
    emit('update:modelValue', value)
    emit('input', value)
  }
}

const handleChange = (value) => {
  emit('change', value)
}

const handleFocus = (event) => {
  isFocused.value = true
  emit('focus', event)
}

const handleBlur = (event) => {
  isFocused.value = false
  emit('blur', event)
}

const handleClear = () => {
  inputValue.value = ''
  emit('update:modelValue', '')
  emit('clear')
}

const handleKeydown = (event) => {
  emit('keydown', event)
}

const handleKeyup = (event) => {
  emit('keyup', event)
}

const handleKeypress = (event) => {
  // Enter key handling
  if (event.key === 'Enter') {
    emit('enter', event)
  }

  emit('keypress', event)
}

// Utility methods
const applyMask = (value, mask) => {
  // Simple mask implementation
  // Mask format: 9 = number, A = letter, * = any character
  if (!mask || !value) return value

  let maskedValue = ''
  let valueIndex = 0

  for (let i = 0; i < mask.length && valueIndex < value.length; i++) {
    const maskChar = mask[i]
    const valueChar = value[valueIndex]

    if (maskChar === '9') {
      if (/\d/.test(valueChar)) {
        maskedValue += valueChar
        valueIndex++
      } else {
        break
      }
    } else if (maskChar === 'A') {
      if (/[a-zA-Z]/.test(valueChar)) {
        maskedValue += valueChar
        valueIndex++
      } else {
        break
      }
    } else if (maskChar === '*') {
      maskedValue += valueChar
      valueIndex++
    } else {
      maskedValue += maskChar
    }
  }

  return maskedValue
}

// Methods for external access
const focus = () => {
  const inputElement = document.getElementById(inputId.value)
  if (inputElement) {
    inputElement.focus()
  }
}

const blur = () => {
  const inputElement = document.getElementById(inputId.value)
  if (inputElement) {
    inputElement.blur()
  }
}

const select = () => {
  const inputElement = document.getElementById(inputId.value)
  if (inputElement) {
    inputElement.select()
  }
}

defineExpose({
  focus,
  blur,
  select
})
</script>

<style scoped>
.base-input {
  margin-bottom: 16px;
}

/* Label styles */
.input-label {
  display: block;
  font-size: 14px;
  font-weight: 500;
  color: var(--el-text-color-primary);
  margin-bottom: 6px;
  line-height: 1.4;
}

.input-label-required {
  position: relative;
}

.input-required {
  color: var(--el-color-danger);
  margin-left: 2px;
}

.input-label-disabled {
  color: var(--el-text-color-disabled);
}

/* Input variants */
.input-outlined :deep(.el-input__wrapper) {
  border: 2px solid var(--el-border-color);
  border-radius: 8px;
  background-color: transparent;
}

.input-outlined :deep(.el-input__wrapper:hover) {
  border-color: var(--el-color-primary);
}

.input-outlined.input-focused :deep(.el-input__wrapper) {
  border-color: var(--el-color-primary);
  box-shadow: 0 0 0 2px var(--el-color-primary-light-8);
}

.input-filled :deep(.el-input__wrapper) {
  background-color: var(--el-fill-color-light);
  border: none;
  border-bottom: 2px solid var(--el-border-color);
  border-radius: 4px 4px 0 0;
}

.input-filled :deep(.el-input__wrapper:hover) {
  background-color: var(--el-fill-color);
  border-bottom-color: var(--el-color-primary);
}

.input-filled.input-focused :deep(.el-input__wrapper) {
  background-color: var(--el-fill-color);
  border-bottom-color: var(--el-color-primary);
}

.input-borderless :deep(.el-input__wrapper) {
  border: none;
  background-color: transparent;
  box-shadow: none;
}

.input-borderless :deep(.el-input__wrapper:hover),
.input-borderless :deep(.el-input__wrapper:focus) {
  box-shadow: none;
}

/* Density variants */
.input-compact :deep(.el-input__wrapper) {
  padding: 4px 8px;
  min-height: 32px;
}

.input-compact .input-label {
  font-size: 12px;
  margin-bottom: 4px;
}

.input-comfortable :deep(.el-input__wrapper) {
  padding: 12px 16px;
  min-height: 48px;
}

.input-comfortable .input-label {
  font-size: 16px;
  margin-bottom: 8px;
}

/* State styles */
.input-has-error :deep(.el-input__wrapper) {
  border-color: var(--el-color-danger);
}

.input-has-error :deep(.el-input__wrapper:hover),
.input-has-error.input-focused :deep(.el-input__wrapper) {
  border-color: var(--el-color-danger);
  box-shadow: 0 0 0 2px var(--el-color-danger-light-8);
}

.input-has-success :deep(.el-input__wrapper) {
  border-color: var(--el-color-success);
}

.input-has-success :deep(.el-input__wrapper:hover),
.input-has-success.input-focused :deep(.el-input__wrapper) {
  border-color: var(--el-color-success);
  box-shadow: 0 0 0 2px var(--el-color-success-light-8);
}

.input-disabled {
  opacity: 0.6;
  pointer-events: none;
}

.input-readonly :deep(.el-input__wrapper) {
  background-color: var(--el-fill-color-light);
}

.input-loading :deep(.el-input__wrapper) {
  position: relative;
}

.input-loading :deep(.el-input__wrapper)::after {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(
    90deg,
    transparent,
    rgba(255, 255, 255, 0.6),
    transparent
  );
  animation: loading 1.5s infinite;
}

@keyframes loading {
  0% { transform: translateX(-100%); }
  100% { transform: translateX(100%); }
}

/* Help text */
.input-help {
  font-size: 12px;
  color: var(--el-text-color-regular);
  margin-top: 4px;
  line-height: 1.4;
}

/* Error message */
.input-error {
  font-size: 12px;
  color: var(--el-color-danger);
  margin-top: 4px;
  line-height: 1.4;
  display: flex;
  align-items: center;
  gap: 4px;
}

.input-error::before {
  content: '⚠';
  font-size: 14px;
}

/* Success message */
.input-success {
  font-size: 12px;
  color: var(--el-color-success);
  margin-top: 4px;
  line-height: 1.4;
  display: flex;
  align-items: center;
  gap: 4px;
}

.input-success::before {
  content: '✓';
  font-size: 14px;
}

/* Character counter */
.input-counter {
  font-size: 11px;
  color: var(--el-text-color-placeholder);
  text-align: right;
  margin-top: 2px;
}

.input-counter-error {
  color: var(--el-color-danger);
}

/* Focus improvements */
:deep(.el-input__wrapper:focus-within) {
  outline: 2px solid var(--el-color-primary);
  outline-offset: 2px;
}

/* Responsive design */
@media (max-width: 768px) {
  .base-input {
    margin-bottom: 12px;
  }

  .input-label {
    font-size: 13px;
  }

  :deep(.el-input__wrapper) {
    font-size: 16px; /* Prevent zoom on iOS */
  }
}

/* High contrast mode */
@media (prefers-contrast: high) {
  .input-label {
    font-weight: 600;
  }

  :deep(.el-input__wrapper) {
    border-width: 2px;
  }
}

/* Reduced motion */
@media (prefers-reduced-motion: reduce) {
  :deep(.el-input__wrapper),
  .input-loading :deep(.el-input__wrapper)::after {
    transition: none;
    animation: none;
  }
}

/* Dark mode adjustments */
@media (prefers-color-scheme: dark) {
  .input-filled :deep(.el-input__wrapper) {
    background-color: var(--el-fill-color-darker);
  }

  .input-readonly :deep(.el-input__wrapper) {
    background-color: var(--el-fill-color-darker);
  }
}
</style>
