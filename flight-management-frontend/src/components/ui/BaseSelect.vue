<template>
  <div :class="wrapperClass">
    <!-- Label -->
    <label
      v-if="label"
      :for="selectId"
      :class="labelClass"
    >
      {{ label }}
      <span v-if="required" class="select-required">*</span>
    </label>

    <!-- Select field -->
    <el-select
      :id="selectId"
      v-model="selectedValue"
      :placeholder="placeholder"
      :disabled="disabled"
      :clearable="clearable"
      :filterable="filterable"
      :allow-create="allowCreate"
      :multiple="multiple"
      :multiple-limit="multipleLimit"
      :size="size"
      :collapse-tags="collapseTags"
      :collapse-tags-tooltip="collapseTagsTooltip"
      :max-collapse-tags="maxCollapseTags"
      :loading="loading"
      :loading-text="loadingText"
      :no-match-text="noMatchText"
      :no-data-text="noDataText"
      :popper-class="popperClass"
      :reserve-keyword="reserveKeyword"
      :default-first-option="defaultFirstOption"
      :teleported="teleported"
      :persistent="persistent"
      :automatic-dropdown="automaticDropdown"
      :fit-input-width="fitInputWidth"
      :suffix-icon="suffixIcon"
      :tag-type="tagType"
      :validate-event="validateEvent"
      :remote="remote"
      :remote-method="remoteMethod"
      :remote-show-suffix="remoteShowSuffix"
      :class="selectClass"
      @change="handleChange"
      @visible-change="handleVisibleChange"
      @remove-tag="handleRemoveTag"
      @clear="handleClear"
      @blur="handleBlur"
      @focus="handleFocus"
      v-bind="$attrs"
    >
      <!-- Options from props -->
      <el-option
        v-for="option in normalizedOptions"
        :key="getOptionKey(option)"
        :label="getOptionLabel(option)"
        :value="getOptionValue(option)"
        :disabled="getOptionDisabled(option)"
        :class="getOptionClass(option)"
      >
        <!-- Custom option content -->
        <template v-if="$slots.option">
          <slot name="option" :option="option" />
        </template>
        <template v-else-if="optionTemplate">
          <div v-html="renderOptionTemplate(option)" />
        </template>
        <template v-else>
          <div class="option-content">
            <component
              v-if="option.icon"
              :is="option.icon"
              class="option-icon"
            />
            <span class="option-label">{{ getOptionLabel(option) }}</span>
            <span v-if="option.description" class="option-description">
              {{ option.description }}
            </span>
          </div>
        </template>
      </el-option>

      <!-- Slot for custom options -->
      <template v-if="$slots.default">
        <slot />
      </template>

      <!-- Empty slot -->
      <template #empty v-if="$slots.empty">
        <slot name="empty" />
      </template>

      <!-- Loading slot -->
      <template #loading v-if="$slots.loading">
        <slot name="loading" />
      </template>

      <!-- Prefix slot -->
      <template #prefix v-if="$slots.prefix">
        <slot name="prefix" />
      </template>
    </el-select>

    <!-- Help text -->
    <div v-if="helpText" class="select-help">
      {{ helpText }}
    </div>

    <!-- Error message -->
    <div v-if="errorMessage" class="select-error">
      {{ errorMessage }}
    </div>

    <!-- Success message -->
    <div v-if="successMessage" class="select-success">
      {{ successMessage }}
    </div>

    <!-- Selected items display for multiple -->
    <div
      v-if="multiple && showSelectedInfo && selectedValue?.length > 0"
      class="select-selected-info"
    >
      {{ selectedValue.length }} öğe seçili
    </div>
  </div>
</template>

<script setup>
import { computed, ref, watch, defineProps, defineEmits, onMounted } from 'vue'
import { debounce } from '@/utils/helpers'

const props = defineProps({
  // v-model
  modelValue: {
    type: [String, Number, Array, Object],
    default: null
  },

  // Element Plus props
  placeholder: {
    type: String,
    default: '请选择'
  },
  disabled: {
    type: Boolean,
    default: false
  },
  clearable: {
    type: Boolean,
    default: false
  },
  filterable: {
    type: Boolean,
    default: false
  },
  allowCreate: {
    type: Boolean,
    default: false
  },
  multiple: {
    type: Boolean,
    default: false
  },
  multipleLimit: {
    type: Number,
    default: 0
  },
  size: {
    type: String,
    default: 'default',
    validator: (value) => ['large', 'default', 'small'].includes(value)
  },
  collapseTags: {
    type: Boolean,
    default: false
  },
  collapseTagsTooltip: {
    type: Boolean,
    default: false
  },
  maxCollapseTags: {
    type: Number,
    default: 1
  },
  loading: {
    type: Boolean,
    default: false
  },
  loadingText: {
    type: String,
    default: 'Yükleniyor...'
  },
  noMatchText: {
    type: String,
    default: 'Eşleşen veri bulunamadı'
  },
  noDataText: {
    type: String,
    default: 'Veri yok'
  },
  popperClass: {
    type: String,
    default: ''
  },
  reserveKeyword: {
    type: Boolean,
    default: true
  },
  defaultFirstOption: {
    type: Boolean,
    default: false
  },
  teleported: {
    type: Boolean,
    default: true
  },
  persistent: {
    type: Boolean,
    default: true
  },
  automaticDropdown: {
    type: Boolean,
    default: false
  },
  fitInputWidth: {
    type: Boolean,
    default: false
  },
  suffixIcon: {
    type: [String, Object],
    default: null
  },
  tagType: {
    type: String,
    default: 'info'
  },
  validateEvent: {
    type: Boolean,
    default: true
  },
  remote: {
    type: Boolean,
    default: false
  },
  remoteMethod: {
    type: Function,
    default: null
  },
  remoteShowSuffix: {
    type: Boolean,
    default: false
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

  // Options
  options: {
    type: Array,
    default: () => []
  },
  valueKey: {
    type: String,
    default: 'value'
  },
  labelKey: {
    type: String,
    default: 'label'
  },
  disabledKey: {
    type: String,
    default: 'disabled'
  },

  // Advanced options
  optionTemplate: {
    type: String,
    default: null
  },
  groupBy: {
    type: String,
    default: null
  },
  searchable: {
    type: Boolean,
    default: false
  },
  searchKeys: {
    type: Array,
    default: () => ['label']
  },
  searchDelay: {
    type: Number,
    default: 300
  },

  // Display options
  showSelectedInfo: {
    type: Boolean,
    default: false
  },
  emptyText: {
    type: String,
    default: 'Seçenek bulunamadı'
  },

  // Async loading
  asyncLoad: {
    type: Function,
    default: null
  },
  asyncSearch: {
    type: Function,
    default: null
  },

  // Validation
  minSelected: {
    type: Number,
    default: 0
  },
  maxSelected: {
    type: Number,
    default: Infinity
  }
})

const emit = defineEmits([
  'update:modelValue',
  'change',
  'visible-change',
  'remove-tag',
  'clear',
  'blur',
  'focus',
  'search'
])

// Local state
const selectedValue = ref(props.modelValue)
const isFocused = ref(false)
const selectId = ref(`select-${Math.random().toString(36).substr(2, 9)}`)
const internalOptions = ref([])
const searchQuery = ref('')

// Watch for external changes
watch(() => props.modelValue, (newValue) => {
  selectedValue.value = newValue
})

watch(selectedValue, (newValue) => {
  emit('update:modelValue', newValue)
})

// Watch for options changes
watch(() => props.options, (newOptions) => {
  internalOptions.value = [...newOptions]
}, { immediate: true })

// Debounced search
const debouncedSearch = debounce(async (query) => {
  if (props.asyncSearch) {
    try {
      const results = await props.asyncSearch(query)
      internalOptions.value = results
    } catch (error) {
      console.error('Async search error:', error)
    }
  }
  emit('search', query)
}, props.searchDelay)

// Computed properties
const wrapperClass = computed(() => {
  const classes = ['base-select']

  if (props.variant !== 'default') {
    classes.push(`select-${props.variant}`)
  }

  if (props.density !== 'default') {
    classes.push(`select-${props.density}`)
  }

  if (props.errorMessage) {
    classes.push('select-has-error')
  }

  if (props.successMessage) {
    classes.push('select-has-success')
  }

  if (props.disabled) {
    classes.push('select-disabled')
  }

  if (isFocused.value) {
    classes.push('select-focused')
  }

  if (props.loading) {
    classes.push('select-loading')
  }

  return classes.join(' ')
})

const labelClass = computed(() => {
  const classes = ['select-label']

  if (props.required) {
    classes.push('select-label-required')
  }

  if (props.disabled) {
    classes.push('select-label-disabled')
  }

  return classes.join(' ')
})

const selectClass = computed(() => {
  const classes = []

  if (props.errorMessage) {
    classes.push('select-error-state')
  }

  if (props.successMessage) {
    classes.push('select-success-state')
  }

  return classes.join(' ')
})

const normalizedOptions = computed(() => {
  let options = internalOptions.value

  // Apply search filter if searchable
  if (props.searchable && searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    options = options.filter(option => {
      return props.searchKeys.some(key => {
        const value = getNestedValue(option, key)
        return String(value).toLowerCase().includes(query)
      })
    })
  }

  // Group options if groupBy is specified
  if (props.groupBy) {
    // Group implementation would go here
    // For now, return as is
  }

  return options
})

// Utility methods
const getOptionKey = (option) => {
  if (typeof option === 'object') {
    return option.id || option[props.valueKey] || option[props.labelKey]
  }
  return option
}

const getOptionValue = (option) => {
  if (typeof option === 'object') {
    return option[props.valueKey]
  }
  return option
}

const getOptionLabel = (option) => {
  if (typeof option === 'object') {
    return option[props.labelKey]
  }
  return option
}

const getOptionDisabled = (option) => {
  if (typeof option === 'object') {
    return option[props.disabledKey] || false
  }
  return false
}

const getOptionClass = (option) => {
  const classes = ['select-option']

  if (getOptionDisabled(option)) {
    classes.push('select-option-disabled')
  }

  if (option.class) {
    classes.push(option.class)
  }

  return classes.join(' ')
}

const getNestedValue = (obj, path) => {
  return path.split('.').reduce((current, key) => current?.[key], obj)
}

const renderOptionTemplate = (option) => {
  if (!props.optionTemplate) return getOptionLabel(option)

  // Simple template rendering
  return props.optionTemplate
    .replace(/\{\{(\w+)\}\}/g, (match, key) => {
      return getNestedValue(option, key) || ''
    })
}

// Event handlers
const handleChange = (value) => {
  // Validation for multiple select
  if (props.multiple && Array.isArray(value)) {
    if (value.length < props.minSelected) {
      // Handle minimum selection validation
      return
    }
    if (value.length > props.maxSelected) {
      // Handle maximum selection validation
      return
    }
  }

  selectedValue.value = value
  emit('change', value)
}

const handleVisibleChange = (visible) => {
  isFocused.value = visible
  emit('visible-change', visible)
}

const handleRemoveTag = (value) => {
  emit('remove-tag', value)
}

const handleClear = () => {
  selectedValue.value = props.multiple ? [] : null
  emit('clear')
}

const handleBlur = (event) => {
  isFocused.value = false
  emit('blur', event)
}

const handleFocus = (event) => {
  isFocused.value = true
  emit('focus', event)
}

const handleSearch = (query) => {
  searchQuery.value = query
  if (props.asyncSearch) {
    debouncedSearch(query)
  }
}

// Methods for external access
const focus = () => {
  const selectElement = document.getElementById(selectId.value)
  if (selectElement) {
    selectElement.focus()
  }
}

const blur = () => {
  const selectElement = document.getElementById(selectId.value)
  if (selectElement) {
    selectElement.blur()
  }
}

// Load initial data
onMounted(async () => {
  if (props.asyncLoad) {
    try {
      const data = await props.asyncLoad()
      internalOptions.value = data
    } catch (error) {
      console.error('Async load error:', error)
    }
  }
})

defineExpose({
  focus,
  blur
})
</script>

<style scoped>
.base-select {
  margin-bottom: 16px;
}

/* Label styles */
.select-label {
  display: block;
  font-size: 14px;
  font-weight: 500;
  color: var(--el-text-color-primary);
  margin-bottom: 6px;
  line-height: 1.4;
}

.select-label-required {
  position: relative;
}

.select-required {
  color: var(--el-color-danger);
  margin-left: 2px;
}

.select-label-disabled {
  color: var(--el-text-color-disabled);
}

/* Select variants */
.select-outlined :deep(.el-select .el-input .el-input__wrapper) {
  border: 2px solid var(--el-border-color);
  border-radius: 8px;
  background-color: transparent;
}

.select-outlined :deep(.el-select .el-input .el-input__wrapper:hover) {
  border-color: var(--el-color-primary);
}

.select-outlined.select-focused :deep(.el-select .el-input .el-input__wrapper) {
  border-color: var(--el-color-primary);
  box-shadow: 0 0 0 2px var(--el-color-primary-light-8);
}

.select-filled :deep(.el-select .el-input .el-input__wrapper) {
  background-color: var(--el-fill-color-light);
  border: none;
  border-bottom: 2px solid var(--el-border-color);
  border-radius: 4px 4px 0 0;
}

.select-filled :deep(.el-select .el-input .el-input__wrapper:hover) {
  background-color: var(--el-fill-color);
  border-bottom-color: var(--el-color-primary);
}

.select-filled.select-focused :deep(.el-select .el-input .el-input__wrapper) {
  background-color: var(--el-fill-color);
  border-bottom-color: var(--el-color-primary);
}

.select-borderless :deep(.el-select .el-input .el-input__wrapper) {
  border: none;
  background-color: transparent;
  box-shadow: none;
}

/* Density variants */
.select-compact :deep(.el-select .el-input .el-input__wrapper) {
  padding: 4px 8px;
  min-height: 32px;
}

.select-compact .select-label {
  font-size: 12px;
  margin-bottom: 4px;
}

.select-comfortable :deep(.el-select .el-input .el-input__wrapper) {
  padding: 12px 16px;
  min-height: 48px;
}

.select-comfortable .select-label {
  font-size: 16px;
  margin-bottom: 8px;
}

/* State styles */
.select-has-error :deep(.el-select .el-input .el-input__wrapper) {
  border-color: var(--el-color-danger);
}

.select-has-error :deep(.el-select .el-input .el-input__wrapper:hover),
.select-has-error.select-focused :deep(.el-select .el-input .el-input__wrapper) {
  border-color: var(--el-color-danger);
  box-shadow: 0 0 0 2px var(--el-color-danger-light-8);
}

.select-has-success :deep(.el-select .el-input .el-input__wrapper) {
  border-color: var(--el-color-success);
}

.select-has-success :deep(.el-select .el-input .el-input__wrapper:hover),
.select-has-success.select-focused :deep(.el-select .el-input .el-input__wrapper) {
  border-color: var(--el-color-success);
  box-shadow: 0 0 0 2px var(--el-color-success-light-8);
}

.select-disabled {
  opacity: 0.6;
  pointer-events: none;
}

.select-loading :deep(.el-select .el-input .el-input__wrapper) {
  position: relative;
}

/* Option content styles */
.option-content {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
}

.option-icon {
  width: 16px;
  height: 16px;
  flex-shrink: 0;
}

.option-label {
  flex: 1;
  font-weight: 500;
}

.option-description {
  font-size: 12px;
  color: var(--el-text-color-regular);
  flex-shrink: 0;
}

.select-option-disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Help text */
.select-help {
  font-size: 12px;
  color: var(--el-text-color-regular);
  margin-top: 4px;
  line-height: 1.4;
}

/* Error message */
.select-error {
  font-size: 12px;
  color: var(--el-color-danger);
  margin-top: 4px;
  line-height: 1.4;
  display: flex;
  align-items: center;
  gap: 4px;
}

.select-error::before {
  content: '⚠';
  font-size: 14px;
}

/* Success message */
.select-success {
  font-size: 12px;
  color: var(--el-color-success);
  margin-top: 4px;
  line-height: 1.4;
  display: flex;
  align-items: center;
  gap: 4px;
}

.select-success::before {
  content: '✓';
  font-size: 14px;
}

/* Selected info */
.select-selected-info {
  font-size: 12px;
  color: var(--el-text-color-regular);
  margin-top: 4px;
  padding: 4px 8px;
  background-color: var(--el-fill-color-light);
  border-radius: 4px;
  text-align: center;
}

/* Multiple tags styling */
:deep(.el-select .el-select__tags .el-tag) {
  background-color: var(--el-color-primary-light-8);
  border-color: var(--el-color-primary-light-6);
  color: var(--el-color-primary);
}

/* Dropdown styling */
:deep(.el-select-dropdown) {
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

:deep(.el-select-dropdown .el-select-dropdown__item) {
  padding: 8px 12px;
  border-radius: 4px;
  margin: 2px 4px;
}

:deep(.el-select-dropdown .el-select-dropdown__item:hover) {
  background-color: var(--el-color-primary-light-9);
}

:deep(.el-select-dropdown .el-select-dropdown__item.selected) {
  background-color: var(--el-color-primary-light-8);
  color: var(--el-color-primary);
  font-weight: 600;
}

/* Focus improvements */
:deep(.el-select:focus-within) {
  outline: 2px solid var(--el-color-primary);
  outline-offset: 2px;
}

/* Responsive design */
@media (max-width: 768px) {
  .base-select {
    margin-bottom: 12px;
  }

  .select-label {
    font-size: 13px;
  }

  :deep(.el-select .el-input .el-input__wrapper) {
    font-size: 16px; /* Prevent zoom on iOS */
  }
}

/* High contrast mode */
@media (prefers-contrast: high) {
  .select-label {
    font-weight: 600;
  }

  :deep(.el-select .el-input .el-input__wrapper) {
    border-width: 2px;
  }
}

/* Dark mode adjustments */
@media (prefers-color-scheme: dark) {
  .select-filled :deep(.el-select .el-input .el-input__wrapper) {
    background-color: var(--el-fill-color-darker);
  }

  :deep(.el-select-dropdown) {
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  }
}
</style>
