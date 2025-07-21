import { ElMessage, ElMessageBox } from 'element-plus'
import { SUCCESS_MESSAGES } from './constants'

// Async helpers
export const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms))

export const retry = async (fn, retries = 3, delay = 1000) => {
  try {
    return await fn()
  } catch (error) {
    if (retries > 0) {
      await new Promise(resolve => setTimeout(resolve, delay))
      return retry(fn, retries - 1, delay)
    }
    throw error
  }
}

// Confirm dialog helper
export const confirmAction = async (message, title = 'Onay', type = 'warning') => {
  try {
    await ElMessageBox.confirm(message, title, {
      confirmButtonText: 'Evet',
      cancelButtonText: 'Hayır',
      type
    })
    return true
  } catch (error) {
    return false
  }
}

// Success message helpers
export const showSuccess = (message = SUCCESS_MESSAGES.SAVED) => {
  ElMessage.success(message)
}

export const showError = (message) => {
  ElMessage.error(message)
}

export const showWarning = (message) => {
  ElMessage.warning(message)
}

export const showInfo = (message) => {
  ElMessage.info(message)
}

// Array helpers
export const groupBy = (array, key) => {
  return array.reduce((groups, item) => {
    const group = item[key]
    if (!groups[group]) {
      groups[group] = []
    }
    groups[group].push(item)
    return groups
  }, {})
}

export const sortBy = (array, key, direction = 'asc') => {
  return [...array].sort((a, b) => {
    const aVal = a[key]
    const bVal = b[key]

    if (direction === 'asc') {
      return aVal > bVal ? 1 : aVal < bVal ? -1 : 0
    } else {
      return aVal < bVal ? 1 : aVal > bVal ? -1 : 0
    }
  })
}

export const uniqueBy = (array, key) => {
  const seen = new Set()
  return array.filter(item => {
    const value = item[key]
    if (seen.has(value)) {
      return false
    }
    seen.add(value)
    return true
  })
}

// Object helpers
export const deepClone = (obj) => {
  return JSON.parse(JSON.stringify(obj))
}

export const isEmpty = (value) => {
  if (value === null || value === undefined) return true
  if (typeof value === 'string') return value.trim() === ''
  if (Array.isArray(value)) return value.length === 0
  if (typeof value === 'object') return Object.keys(value).length === 0
  return false
}

export const omit = (obj, keys) => {
  const keysToOmit = Array.isArray(keys) ? keys : [keys]
  const result = {}

  for (const [key, value] of Object.entries(obj)) {
    if (!keysToOmit.includes(key)) {
      result[key] = value
    }
  }

  return result
}

export const pick = (obj, keys) => {
  const keysToPick = Array.isArray(keys) ? keys : [keys]
  const result = {}

  for (const key of keysToPick) {
    if (key in obj) {
      result[key] = obj[key]
    }
  }

  return result
}

// String helpers
export const capitalize = (str) => {
  if (!str) return ''
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase()
}

export const camelToKebab = (str) => {
  return str.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase()
}

export const kebabToCamel = (str) => {
  return str.replace(/-([a-z])/g, (match, letter) => letter.toUpperCase())
}

export const truncate = (str, length = 50, suffix = '...') => {
  if (!str) return ''
  if (str.length <= length) return str
  return str.substring(0, length) + suffix
}

// URL helpers
export const buildQueryString = (params) => {
  const searchParams = new URLSearchParams()

  for (const [key, value] of Object.entries(params)) {
    if (value !== null && value !== undefined && value !== '') {
      searchParams.append(key, value)
    }
  }

  return searchParams.toString()
}

export const parseQueryString = (queryString) => {
  const params = new URLSearchParams(queryString)
  const result = {}

  for (const [key, value] of params.entries()) {
    result[key] = value
  }

  return result
}

// File helpers
export const downloadFile = (blob, filename) => {
  const url = window.URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  window.URL.revokeObjectURL(url)
}

export const readFileAsText = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result)
    reader.onerror = () => reject(reader.error)
    reader.readAsText(file)
  })
}

export const readFileAsDataURL = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result)
    reader.onerror = () => reject(reader.error)
    reader.readAsDataURL(file)
  })
}

// Local storage helpers
export const storage = {
  get: (key, defaultValue = null) => {
    try {
      const item = localStorage.getItem(key)
      return item ? JSON.parse(item) : defaultValue
    } catch (error) {
      console.warn('Error reading from localStorage:', error)
      return defaultValue
    }
  },

  set: (key, value) => {
    try {
      localStorage.setItem(key, JSON.stringify(value))
    } catch (error) {
      console.warn('Error writing to localStorage:', error)
    }
  },

  remove: (key) => {
    try {
      localStorage.removeItem(key)
    } catch (error) {
      console.warn('Error removing from localStorage:', error)
    }
  },

  clear: () => {
    try {
      localStorage.clear()
    } catch (error) {
      console.warn('Error clearing localStorage:', error)
    }
  }
}

// Debounce helper
export const debounce = (func, wait) => {
  let timeout
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout)
      func(...args)
    }
    clearTimeout(timeout)
    timeout = setTimeout(later, wait)
  }
}

// Throttle helper
export const throttle = (func, limit) => {
  let inThrottle
  return function(...args) {
    if (!inThrottle) {
      func.apply(this, args)
      inThrottle = true
      setTimeout(() => inThrottle = false, limit)
    }
  }
}

// Generate random ID
export const generateId = () => {
  return Math.random().toString(36).substr(2, 9)
}

// Check if device is mobile
export const isMobile = () => {
  return window.innerWidth <= 768
}

// Copy to clipboard
export const copyToClipboard = async (text) => {
  try {
    await navigator.clipboard.writeText(text)
    showSuccess('Panoya kopyalandı')
    return true
  } catch (error) {
    console.warn('Clipboard API failed, using fallback')

    // Fallback method
    const textArea = document.createElement('textarea')
    textArea.value = text
    document.body.appendChild(textArea)
    textArea.select()

    try {
      document.execCommand('copy')
      showSuccess('Panoya kopyalandı')
      return true
    } catch (fallbackError) {
      showError('Kopyalama başarısız')
      return false
    } finally {
      document.body.removeChild(textArea)
    }
  }
}
