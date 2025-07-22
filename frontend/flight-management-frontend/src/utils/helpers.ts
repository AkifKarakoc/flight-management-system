import { ElMessage, ElMessageBox } from 'element-plus'
import { SUCCESS_MESSAGES } from './constants.js'

// Type definitions
type MessageType = 'success' | 'warning' | 'info' | 'error'
type SortDirection = 'asc' | 'desc'

// Async helpers
export const delay = (ms: number): Promise<void> => new Promise(resolve => setTimeout(resolve, ms))

export const retry = async <T>(
    fn: () => Promise<T>,
  retries: number = 3,
  delayMs: number = 1000
): Promise<T> => {
  try {
    return await fn()
  } catch (error) {
    if (retries > 0) {
      await new Promise(resolve => setTimeout(resolve, delayMs))
      return retry(fn, retries - 1, delayMs)
    }
    throw error
  }
}

// Confirm dialog helper
export const confirmAction = async (
  message: string,
  title: string = 'Onay',
  type: MessageType = 'warning'
): Promise<boolean> => {
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
export const showSuccess = (message: string = SUCCESS_MESSAGES.CREATED): void => {
  ElMessage.success(message)
}

export const showError = (message: string): void => {
  ElMessage.error(message)
}

export const showWarning = (message: string): void => {
  ElMessage.warning(message)
}

export const showInfo = (message: string): void => {
  ElMessage.info(message)
}

// Array helpers
export const groupBy = <T>(array: T[], key: keyof T): Record<string, T[]> => {
  return array.reduce((groups, item) => {
    const group = String(item[key])
    if (!groups[group]) {
      groups[group] = []
    }
    groups[group].push(item)
    return groups
  }, {} as Record<string, T[]>)
}

export const sortBy = <T>(
  array: T[],
  key: keyof T,
  direction: SortDirection = 'asc'
): T[] => {
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

export const uniqueBy = <T>(array: T[], key: keyof T): T[] => {
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
export const deepClone = <T>(obj: T): T => {
  return JSON.parse(JSON.stringify(obj))
}

export const isEmpty = (value: any): boolean => {
  if (value === null || value === undefined) return true
  if (typeof value === 'string') return value.trim() === ''
  if (Array.isArray(value)) return value.length === 0
  if (typeof value === 'object') return Object.keys(value).length === 0
  return false
}

export const omit = <T extends Record<string, any>, K extends keyof T>(
  obj: T,
  keys: K | K[]
): Omit<T, K> => {
  const keysToOmit = Array.isArray(keys) ? keys : [keys]
  const result = {} as Omit<T, K>

  for (const [key, value] of Object.entries(obj)) {
    if (!keysToOmit.includes(key as K)) {
      (result as any)[key] = value
    }
  }

  return result
}

export const pick = <T extends Record<string, any>, K extends keyof T>(
  obj: T,
  keys: K | K[]
): Pick<T, K> => {
  const keysToPick = Array.isArray(keys) ? keys : [keys]
  const result = {} as Pick<T, K>

  for (const key of keysToPick) {
    if (key in obj) {
      result[key] = obj[key]
    }
  }

  return result
}

// String helpers
export const capitalize = (str: string): string => {
  if (!str) return ''
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase()
}

export const camelToKebab = (str: string): string => {
  return str.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase()
}

export const kebabToCamel = (str: string): string => {
  return str.replace(/-([a-z])/g, (match, letter) => letter.toUpperCase())
}

export const truncate = (str: string, length: number = 50, suffix: string = '...'): string => {
  if (!str) return ''
  if (str.length <= length) return str
  return str.substring(0, length) + suffix
}

// URL helpers
export const buildQueryString = (params: Record<string, any>): string => {
  const searchParams = new URLSearchParams()

  for (const [key, value] of Object.entries(params)) {
    if (value !== null && value !== undefined && value !== '') {
      searchParams.append(key, String(value))
    }
  }

  return searchParams.toString()
}

export const parseQueryString = (queryString: string): Record<string, string> => {
  const params = new URLSearchParams(queryString)
  const result: Record<string, string> = {}

  for (const [key, value] of params.entries()) {
    result[key] = value
  }

  return result
}

// File helpers
export const downloadFile = (blob: Blob, filename: string): void => {
  const url = window.URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  window.URL.revokeObjectURL(url)
}

export const readFileAsText = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = () => reject(reader.error)
    reader.readAsText(file)
  })
}

export const readFileAsDataURL = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = () => reject(reader.error)
    reader.readAsDataURL(file)
  })
}

// Local storage helpers
export const storage = {
  get: <T>(key: string, defaultValue: T | null = null): T | null => {
  try {
    const item = localStorage.getItem(key)
    return item ? JSON.parse(item) : defaultValue
  } catch (error) {
    console.warn('Error reading from localStorage:', error)
    return defaultValue
  }
},

set: (key: string, value: any): void => {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch (error) {
    console.warn('Error writing to localStorage:', error)
  }
},

remove: (key: string): void => {
  try {
    localStorage.removeItem(key)
  } catch (error) {
    console.warn('Error removing from localStorage:', error)
  }
},

clear: (): void => {
  try {
    localStorage.clear()
  } catch (error) {
    console.warn('Error clearing localStorage:', error)
  }
}
}

// Debounce helper
export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void => {
  let timeout: NodeJS.Timeout
  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      clearTimeout(timeout)
      func(...args)
    }
    clearTimeout(timeout)
    timeout = setTimeout(later, wait)
  }
}

// Throttle helper
export const throttle = <T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void => {
  let inThrottle: boolean
  return function(...args: Parameters<T>) {
    if (!inThrottle) {
      func.apply(this, args)
      inThrottle = true
      setTimeout(() => inThrottle = false, limit)
    }
  }
}

// Generate random ID
export const generateId = (): string => {
  return Math.random().toString(36).substr(2, 9)
}

// Check if device is mobile
export const isMobile = (): boolean => {
  return window.innerWidth <= 768
}

// Copy to clipboard
export const copyToClipboard = async (text: string): Promise<boolean> => {
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
