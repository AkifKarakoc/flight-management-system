import { ref, reactive, watch } from 'vue'
import { deepEqual } from '@/utils/helpers'

/**
 * @description A composable for managing form state, validation, and submission
 * @param {Object} options - The options for the form
 * @param {Object} options.initialData - The initial data for the form
 * @param {Object} options.rules - The validation rules for the form
 * @param {Function} options.onSubmit - The function to call when the form is submitted
 * @returns {Object} - The form state and methods
 */
export function useForm({
  initialData = {},
  rules = {},
  onSubmit = () => {}
}) {
  const form = reactive({ ...initialData })
  const validationRules = reactive({ ...rules })
  const isDirty = ref(false)
  const isSubmitting = ref(false)
  const errors = ref({})

  // Watch for changes to the form to set the dirty state
  watch(
    () => form,
    (newData) => {
      isDirty.value = !deepEqual(newData, initialData)
    },
    { deep: true }
  )

  const handleSubmit = async () => {
    isSubmitting.value = true
    errors.value = {}

    // Perform validation here (basic example)
    const validate = () => {
      let isValid = true
      for (const key in validationRules) {
        for (const rule of validationRules[key]) {
          if (rule.required && !form[key]) {
            errors.value[key] = rule.message || `${key} is required`
            isValid = false
            break
          }
        }
      }
      return isValid
    }

    if (validate()) {
      try {
        await onSubmit(form)
      } catch (e) {
        console.error('Form submission error:', e)
      } finally {
        isSubmitting.value = false
      }
    } else {
      isSubmitting.value = false
    }
  }

  const resetForm = () => {
    Object.assign(form, initialData)
    isDirty.value = false
    errors.value = {}
  }

  return {
    form,
    rules: validationRules,
    isDirty,
    isSubmitting,
    errors,
    handleSubmit,
    resetForm
  }
}
