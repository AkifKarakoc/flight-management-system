import { VALIDATION_MESSAGES } from './constants.js'

// Type definitions
interface ValidationRule {
  required?: boolean
  type?: string
  min?: number
  max?: number
  pattern?: RegExp
  message: string
  trigger: string
  validator?: (rule: any, value: any, callback: (error?: Error) => void) => void
}

interface FormInstance {
  validate: () => Promise<void>
    resetFields: () => void
}

type ValidatorFunction = (value: any) => boolean

// Validation rules - these would typically come from constants
const VALIDATION_RULES = {
  FLIGHT_NUMBER: /^[A-Z]{2}\d{3,4}$/,
  ICAO_CODE: /^[A-Z]{4}$/,
  IATA_CODE: /^[A-Z]{3}$/,
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  PHONE: /^(\+90|0)?[5]\d{9}$/
}

// Error messages for backwards compatibility
const ERROR_MESSAGES = {
  REQUIRED: VALIDATION_MESSAGES.REQUIRED,
  EMAIL_INVALID: VALIDATION_MESSAGES.EMAIL,
  FLIGHT_NUMBER_INVALID: VALIDATION_MESSAGES.FLIGHT_NUMBER,
  ICAO_INVALID: 'Geçerli bir ICAO kodu girin (4 harf)',
  IATA_INVALID: 'Geçerli bir IATA kodu girin (3 harf)',
  PHONE_INVALID: VALIDATION_MESSAGES.PHONE,
  MIN_LENGTH: (min: number) => `En az ${min} karakter olmalıdır`,
  MAX_LENGTH: (max: number) => `En fazla ${max} karakter olabilir`
}

// Common validators for Element Plus forms
export const validators = {
  required: (message: string = ERROR_MESSAGES.REQUIRED): ValidationRule => ({
  required: true,
  message,
  trigger: 'blur'
}),

  email: (message: string = ERROR_MESSAGES.EMAIL_INVALID): ValidationRule => ({
  type: 'email',
  message,
  trigger: 'blur'
}),

  minLength: (min: number, message?: string): ValidationRule => ({
  min,
  message: message || ERROR_MESSAGES.MIN_LENGTH(min),
  trigger: 'blur'
}),

  maxLength: (max: number, message?: string): ValidationRule => ({
  max,
  message: message || ERROR_MESSAGES.MAX_LENGTH(max),
  trigger: 'blur'
}),

  pattern: (pattern: RegExp, message: string): ValidationRule => ({
  pattern,
  message,
  trigger: 'blur'
}),

  flightNumber: (message: string = ERROR_MESSAGES.FLIGHT_NUMBER_INVALID): ValidationRule => ({
  pattern: VALIDATION_RULES.FLIGHT_NUMBER,
  message,
  trigger: 'blur'
}),

  icaoCode: (message: string = ERROR_MESSAGES.ICAO_INVALID): ValidationRule => ({
  pattern: VALIDATION_RULES.ICAO_CODE,
  message,
  trigger: 'blur'
}),

  iataCode: (message: string = ERROR_MESSAGES.IATA_INVALID): ValidationRule => ({
  pattern: VALIDATION_RULES.IATA_CODE,
  message,
  trigger: 'blur'
}),

  phone: (message: string = ERROR_MESSAGES.PHONE_INVALID): ValidationRule => ({
  pattern: VALIDATION_RULES.PHONE,
  message,
  trigger: 'blur'
}),

  number: (min: number, max: number): ValidationRule => ({
  type: 'number',
  min,
  max,
  message: `${min} ile ${max} arasında bir sayı girin`,
  trigger: 'blur'
}),

  positiveNumber: (message: string = 'Pozitif bir sayı girin'): ValidationRule => ({
  validator: (rule: any, value: any, callback: (error?: Error) => void) => {
  if (value !== undefined && value !== null && value <= 0) {
    callback(new Error(message))
  } else {
    callback()
  }
},
trigger: 'blur'
}),

custom: (validator: ValidatorFunction, message: string): ValidationRule => ({
  validator: (rule: any, value: any, callback: (error?: Error) => void) => {
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
export const validateForm = async (formRef: FormInstance | null): Promise<boolean> => {
  if (!formRef) return false

  try {
    await formRef.validate()
    return true
  } catch (error) {
    return false
  }
}

export const resetForm = (formRef: FormInstance | null): void => {
  if (formRef) {
    formRef.resetFields()
  }
}

// Custom validation functions
export const isValidFlightNumber = (flightNumber: string): boolean => {
  return VALIDATION_RULES.FLIGHT_NUMBER.test(flightNumber)
}

export const isValidICAO = (code: string): boolean => {
  return VALIDATION_RULES.ICAO_CODE.test(code)
}

export const isValidIATA = (code: string): boolean => {
  return VALIDATION_RULES.IATA_CODE.test(code)
}

export const isValidEmail = (email: string): boolean => {
  return VALIDATION_RULES.EMAIL.test(email)
}

export const isValidPhone = (phone: string): boolean => {
  return VALIDATION_RULES.PHONE.test(phone)
}
