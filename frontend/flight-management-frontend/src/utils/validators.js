import { ERROR_MESSAGES, VALIDATION_RULES } from './constants'

// Common validators for Element Plus forms
export const validators = {
  required: (message = ERROR_MESSAGES.REQUIRED) => ({
    required: true,
    message,
    trigger: 'blur'
  }),

  email: (message = ERROR_MESSAGES.EMAIL_INVALID) => ({
    type: 'email',
    message,
    trigger: 'blur'
  }),

  minLength: (min, message) => ({
    min,
    message: message || ERROR_MESSAGES.MIN_LENGTH(min),
    trigger: 'blur'
  }),

  maxLength: (max, message) => ({
    max,
    message: message || ERROR_MESSAGES.MAX_LENGTH(max),
    trigger: 'blur'
  }),

  pattern: (pattern, message) => ({
    pattern,
    message,
    trigger: 'blur'
  }),

  flightNumber: (message = ERROR_MESSAGES.FLIGHT_NUMBER_INVALID) => ({
    pattern: VALIDATION_RULES.FLIGHT_NUMBER,
    message,
    trigger: 'blur'
  }),

  icaoCode: (message = ERROR_MESSAGES.ICAO_INVALID) => ({
    pattern: VALIDATION_RULES.ICAO_CODE,
    message,
    trigger: 'blur'
  }),

  iataCode: (message = ERROR_MESSAGES.IATA_INVALID) => ({
    pattern: VALIDATION_RULES.IATA_CODE,
    message,
    trigger: 'blur'
  }),

  phone: (message = ERROR_MESSAGES.PHONE_INVALID) => ({
    pattern: VALIDATION_RULES.PHONE,
    message,
    trigger: 'blur'
  }),

  number: (min, max) => ({
    type: 'number',
    min,
    max,
    message: `${min} ile ${max} arasında bir sayı girin`,
    trigger: 'blur'
  }),

  positiveNumber: (message = 'Pozitif bir sayı girin') => ({
    validator: (rule, value, callback) => {
      if (value !== undefined && value !== null && value <= 0) {
        callback(new Error(message))
      } else {
        callback()
      }
    },
    trigger: 'blur'
  }),

  custom: (validator, message) => ({
    validator: (rule, value, callback) => {
      if (!validator(value)) {
        callback(new Error(message))
      } else {
        callback()
      }
    },
    trigger: 'blur'
  })
}

// Form validation helpers
export const validateForm = async (formRef) => {
  if (!formRef) return false

  try {
    await formRef.validate()
    return true
  } catch (error) {
    return false
  }
}

export const resetForm = (formRef) => {
  if (formRef) {
    formRef.resetFields()
  }
}

// Custom validation functions
export const isValidFlightNumber = (flightNumber) => {
  return VALIDATION_RULES.FLIGHT_NUMBER.test(flightNumber)
}

export const isValidICAO = (code) => {
  return VALIDATION_RULES.ICAO_CODE.test(code)
}

export const isValidIATA = (code) => {
  return VALIDATION_RULES.IATA_CODE.test(code)
}

export const isValidEmail = (email) => {
  return VALIDATION_RULES.EMAIL.test(email)
}

export const isValidPhone = (phone) => {
  return VALIDATION_RULES.PHONE.test(phone)
}
