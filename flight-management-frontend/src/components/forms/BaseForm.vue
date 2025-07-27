<template>
  <div :class="formClass">
    <el-form
      ref="formRef"
      :model="formModel"
      :rules="formRules"
      :label-position="labelPosition"
      :label-width="labelWidth"
      :size="size"
      :disabled="disabled"
      :validate-on-rule-change="validateOnRuleChange"
      :hide-required-asterisk="hideRequiredAsterisk"
      :show-message="showMessage"
      :inline-message="inlineMessage"
      :status-icon="statusIcon"
      :require-asterisk-position="requireAsteriskPosition"
      @validate="handleValidate"
      @submit.prevent="handleSubmit"
    >
      <!-- Form content -->
      <div v-if="sections.length > 0" class="form-sections">
        <div
          v-for="(section, sectionIndex) in sections"
          :key="section.key || sectionIndex"
          :class="getSectionClass(section)"
        >
          <!-- Section header -->
          <div v-if="section.title || section.description" class="section-header">
            <h3 v-if="section.title" class="section-title">
              <component
                v-if="section.icon"
                :is="section.icon"
                class="section-icon"
              />
              {{ section.title }}
            </h3>
            <p v-if="section.description" class="section-description">
              {{ section.description }}
            </p>
          </div>

          <!-- Section fields -->
          <div :class="getFieldsLayoutClass(section)">
            <FormField
              v-for="field in section.fields"
              :key="field.key || field.prop"
              :field="field"
              :model="formModel"
              :disabled="disabled || field.disabled"
              :readonly="readonly || field.readonly"
              @change="handleFieldChange"
              @blur="handleFieldBlur"
              @focus="handleFieldFocus"
            />
          </div>
        </div>
      </div>

      <!-- Slot for custom content -->
      <slot :model="formModel" :form-ref="formRef" />

      <!-- Form actions -->
      <div v-if="showActions" class="form-actions">
        <slot name="actions" :model="formModel" :form-ref="formRef">
          <div class="action-buttons">
            <BaseButton
              v-if="showCancelButton"
              :disabled="submitting"
              @click="handleCancel"
            >
              {{ cancelText }}
            </BaseButton>

            <BaseButton
              v-if="showResetButton"
              :disabled="submitting || !hasChanges"
              @click="handleReset"
            >
              {{ resetText }}
            </BaseButton>

            <BaseButton
              v-if="showSubmitButton"
              type="primary"
              native-type="submit"
              :loading="submitting"
              :disabled="!canSubmit"
            >
              {{ submitText }}
            </BaseButton>
          </div>
        </slot>
      </div>
    </el-form>

    <!-- Form summary -->
    <div v-if="showSummary && validationSummary" class="form-summary">
      <el-alert
        :type="validationSummary.type"
        :title="validationSummary.title"
        :description="validationSummary.description"
        show-icon
        :closable="false"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, nextTick } from 'vue'
import { ElMessage } from 'element-plus'
import BaseButton from '@/components/ui/BaseButton.vue'
//import FormField from './FormField.vue'
import { deepClone, deepEqual } from '@/utils/helpers'

const props = defineProps({
  // Form model
  modelValue: {
    type: Object,
    required: true
  },

  // Form configuration
  sections: {
    type: Array,
    default: () => []
  },

  rules: {
    type: Object,
    default: () => ({})
  },

  // Form layout
  layout: {
    type: String,
    default: 'vertical',
    validator: (value) => ['vertical', 'horizontal', 'inline'].includes(value)
  },

  columns: {
    type: [Number, Object],
    default: 1
  },

  gap: {
    type: String,
    default: '24px'
  },

  // Element Plus props
  labelPosition: {
    type: String,
    default: 'top',
    validator: (value) => ['left', 'right', 'top'].includes(value)
  },

  labelWidth: {
    type: [String, Number],
    default: 'auto'
  },

  size: {
    type: String,
    default: 'default',
    validator: (value) => ['large', 'default', 'small'].includes(value)
  },

  disabled: {
    type: Boolean,
    default: false
  },

  readonly: {
    type: Boolean,
    default: false
  },

  validateOnRuleChange: {
    type: Boolean,
    default: true
  },

  hideRequiredAsterisk: {
    type: Boolean,
    default: false
  },

  showMessage: {
    type: Boolean,
    default: true
  },

  inlineMessage: {
    type: Boolean,
    default: false
  },

  statusIcon: {
    type: Boolean,
    default: false
  },

  requireAsteriskPosition: {
    type: String,
    default: 'left',
    validator: (value) => ['left', 'right'].includes(value)
  },

  // Form actions
  showActions: {
    type: Boolean,
    default: true
  },

  showSubmitButton: {
    type: Boolean,
    default: true
  },

  showCancelButton: {
    type: Boolean,
    default: false
  },

  showResetButton: {
    type: Boolean,
    default: false
  },

  submitText: {
    type: String,
    default: 'Kaydet'
  },

  cancelText: {
    type: String,
    default: 'İptal'
  },

  resetText: {
    type: String,
    default: 'Sıfırla'
  },

  // Validation
  validateOnSubmit: {
    type: Boolean,
    default: true
  },

  showSummary: {
    type: Boolean,
    default: false
  },

  // Loading state
  submitting: {
    type: Boolean,
    default: false
  },

  // Auto-save
  autoSave: {
    type: Boolean,
    default: false
  },

  autoSaveDelay: {
    type: Number,
    default: 3000
  }
})

const emit = defineEmits([
  'update:modelValue',
  'submit',
  'cancel',
  'reset',
  'validate',
  'field-change',
  'field-blur',
  'field-focus',
  'auto-save'
])

// Form reference
const formRef = ref(null)

// Internal form model
const formModel = ref(deepClone(props.modelValue))

// Original data for change detection
const originalData = ref(deepClone(props.modelValue))

// Validation state
const validationErrors = ref({})
const isValid = ref(true)

// Auto-save timer
let autoSaveTimer = null

// Computed properties
const formClass = computed(() => {
  const classes = ['base-form']

  if (props.layout !== 'vertical') {
    classes.push(`form-${props.layout}`)
  }

  if (props.disabled) {
    classes.push('form-disabled')
  }

  if (props.readonly) {
    classes.push('form-readonly')
  }

  return classes.join(' ')
})

const formRules = computed(() => {
  const rules = { ...props.rules }

  // Add rules from section fields
  props.sections.forEach(section => {
    section.fields?.forEach(field => {
      if (field.rules) {
        rules[field.prop] = field.rules
      }
    })
  })

  return rules
})

const hasChanges = computed(() => {
  return !deepEqual(formModel.value, originalData.value)
})

const canSubmit = computed(() => {
  return isValid.value && hasChanges.value && !props.submitting
})

const validationSummary = computed(() => {
  const errorCount = Object.keys(validationErrors.value).length

  if (errorCount === 0) {
    if (hasChanges.value) {
      return {
        type: 'info',
        title: 'Form hazır',
        description: 'Değişiklikler kaydedilmeye hazır'
      }
    }
    return null
  }

  return {
    type: 'error',
    title: `${errorCount} validation hatası`,
    description: 'Lütfen hataları düzeltin ve tekrar deneyin'
  }
})

// Methods
const getSectionClass = (section) => {
  const classes = ['form-section']

  if (section.class) {
    classes.push(section.class)
  }

  if (section.collapsible) {
    classes.push('section-collapsible')
  }

  return classes.join(' ')
}

const getFieldsLayoutClass = (section) => {
  const classes = ['section-fields']

  // Determine columns
  const columns = section.columns || props.columns

  if (typeof columns === 'number' && columns > 1) {
    classes.push('fields-grid')
    return classes.join(' ')
  }

  if (typeof columns === 'object') {
    classes.push('fields-responsive-grid')
    return classes.join(' ')
  }

  return classes.join(' ')
}

const handleSubmit = async () => {
  if (props.validateOnSubmit) {
    const valid = await validate()
    if (!valid) {
      ElMessage.error('Lütfen form hatalarını düzeltin')
      return
    }
  }

  emit('submit', deepClone(formModel.value))
}

const handleCancel = () => {
  emit('cancel')
}

const handleReset = () => {
  formModel.value = deepClone(originalData.value)
  clearValidation()
  emit('reset')
}

const handleValidate = (prop, isValid, message) => {
  if (isValid) {
    delete validationErrors.value[prop]
  } else {
    validationErrors.value[prop] = message
  }

  updateValidationState()
  emit('validate', prop, isValid, message)
}

const handleFieldChange = (prop, value, oldValue) => {
  formModel.value[prop] = value
  emit('update:modelValue', formModel.value)
  emit('field-change', prop, value, oldValue)

  // Auto-save functionality
  if (props.autoSave) {
    clearTimeout(autoSaveTimer)
    autoSaveTimer = setTimeout(() => {
      emit('auto-save', deepClone(formModel.value))
    }, props.autoSaveDelay)
  }
}

const handleFieldBlur = (prop, value) => {
  emit('field-blur', prop, value)
}

const handleFieldFocus = (prop, value) => {
  emit('field-focus', prop, value)
}

const updateValidationState = () => {
  isValid.value = Object.keys(validationErrors.value).length === 0
}

// Public methods (exposed)
const validate = async () => {
  try {
    await formRef.value?.validate()
    return true
  } catch (error) {
    return false
  }
}

const validateField = (prop) => {
  return formRef.value?.validateField(prop)
}

const clearValidation = (props) => {
  formRef.value?.clearValidate(props)

  if (props) {
    if (Array.isArray(props)) {
      props.forEach(prop => delete validationErrors.value[prop])
    } else {
      delete validationErrors.value[props]
    }
  } else {
    validationErrors.value = {}
  }

  updateValidationState()
}

const scrollToField = (prop) => {
  const fieldElement = document.querySelector(`[data-field="${prop}"]`)
  if (fieldElement) {
    fieldElement.scrollIntoView({
      behavior: 'smooth',
      block: 'center'
    })
  }
}

const scrollToFirstError = () => {
  const firstErrorProp = Object.keys(validationErrors.value)[0]
  if (firstErrorProp) {
    scrollToField(firstErrorProp)
  }
}

const setFieldValue = (prop, value) => {
  formModel.value[prop] = value
  emit('update:modelValue', formModel.value)
}

const getFieldValue = (prop) => {
  return formModel.value[prop]
}

const resetForm = (newData = null) => {
  const data = newData || originalData.value
  formModel.value = deepClone(data)
  originalData.value = deepClone(data)
  clearValidation()
  emit('update:modelValue', formModel.value)
}

const isDirty = () => {
  return hasChanges.value
}

const getValidationState = () => {
  return {
    isValid: isValid.value,
    errors: { ...validationErrors.value },
    errorCount: Object.keys(validationErrors.value).length
  }
}

// Watch for external model changes
watch(() => props.modelValue, (newValue) => {
  if (!deepEqual(newValue, formModel.value)) {
    formModel.value = deepClone(newValue)
  }
}, { deep: true })

// Cleanup
onMounted(() => {
  // Set initial validation state
  nextTick(() => {
    updateValidationState()
  })
})

// Expose public methods
defineExpose({
  validate,
  validateField,
  clearValidation,
  scrollToField,
  scrollToFirstError,
  setFieldValue,
  getFieldValue,
  resetForm,
  isDirty,
  getValidationState,
  formRef
})
</script>

<style scoped>
.base-form {
  width: 100%;
}

/* Form layouts */
.form-inline {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  align-items: flex-start;
}

.form-horizontal :deep(.el-form-item) {
  display: flex;
  align-items: center;
  margin-bottom: 18px;
}

.form-horizontal :deep(.el-form-item__label) {
  flex-shrink: 0;
  text-align: right;
  padding-right: 12px;
}

.form-horizontal :deep(.el-form-item__content) {
  flex: 1;
  margin-left: 0 !important;
}

/* Form sections */
.form-sections {
  display: flex;
  flex-direction: column;
  gap: 32px;
}

.form-section {
  position: relative;
}

.section-header {
  margin-bottom: 24px;
  padding-bottom: 16px;
  border-bottom: 1px solid var(--el-border-color-lighter);
}

.section-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 18px;
  font-weight: 600;
  color: var(--el-text-color-primary);
  margin: 0 0 8px 0;
  line-height: 1.4;
}

.section-icon {
  width: 20px;
  height: 20px;
  color: var(--el-color-primary);
}

.section-description {
  font-size: 14px;
  color: var(--el-text-color-regular);
  margin: 0;
  line-height: 1.5;
}

/* Field layouts */
.section-fields {
  display: flex;
  flex-direction: column;
  gap: v-bind(gap);
}

.fields-grid {
  display: grid;
  grid-template-columns: repeat(v-bind('typeof columns === "number" ? columns : 1'), 1fr);
  gap: v-bind(gap);
  align-items: start;
}

.fields-responsive-grid {
  display: grid;
  gap: v-bind(gap);
  align-items: start;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
}

/* Form actions */
.form-actions {
  margin-top: 32px;
  padding-top: 24px;
  border-top: 1px solid var(--el-border-color-lighter);
}

.action-buttons {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

/* Form summary */
.form-summary {
  margin-top: 16px;
}

/* Form states */
.form-disabled {
  opacity: 0.6;
  pointer-events: none;
}

.form-readonly :deep(.el-input__wrapper),
.form-readonly :deep(.el-textarea__inner),
.form-readonly :deep(.el-select .el-input__wrapper) {
  background-color: var(--el-fill-color-light);
  cursor: not-allowed;
}

/* Responsive design */
@media (max-width: 768px) {
  .form-sections {
    gap: 24px;
  }

  .section-header {
    margin-bottom: 16px;
    padding-bottom: 12px;
  }

  .section-title {
    font-size: 16px;
  }

  .fields-grid {
    grid-template-columns: 1fr;
    gap: 16px;
  }

  .fields-responsive-grid {
    grid-template-columns: 1fr;
    gap: 16px;
  }

  .action-buttons {
    flex-direction: column-reverse;
  }

  .action-buttons .el-button {
    width: 100%;
  }

  .form-horizontal {
    display: block;
  }

  .form-horizontal :deep(.el-form-item) {
    display: block;
    margin-bottom: 16px;
  }

  .form-horizontal :deep(.el-form-item__label) {
    text-align: left;
    padding-right: 0;
    padding-bottom: 4px;
  }
}

/* Focus states */
:deep(.el-form-item.is-focused) {
  z-index: 1;
}

/* Validation states */
:deep(.el-form-item.is-error) {
  margin-bottom: 22px;
}

:deep(.el-form-item.is-success .el-input__wrapper) {
  border-color: var(--el-color-success);
}

/* Animation */
.form-sections,
.form-section {
  animation: slideIn 0.3s ease-out;
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* High contrast mode */
@media (prefers-contrast: more) {
  .section-header {
    border-bottom-width: 2px;
  }

  .form-actions {
    border-top-width: 2px;
  }
}

/* Print styles */
@media print {
  .form-actions {
    display: none;
  }

  .form-summary {
    display: none;
  }

  .section-header {
    border-bottom: 1px solid #000;
  }
}
</style>
