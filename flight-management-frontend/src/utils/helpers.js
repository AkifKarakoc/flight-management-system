import { STORAGE_KEYS, CACHE_KEYS, CACHE_TTL, NOTIFICATION_TYPES } from './constants'
import { formatDate, formatDateTime } from './formatters'

// ========================
// LOCAL STORAGE HELPERS
// ========================

/**
 * Local storage'a veri kaydetme
 * @param {string} key - Anahtar
 * @param {any} value - Değer
 */
export const setStorageItem = (key, value) => {
  try {
    const serializedValue = JSON.stringify(value)
    localStorage.setItem(key, serializedValue)
  } catch (error) {
    console.error('localStorage setItem error:', error)
  }
}

/**
 * Local storage'dan veri okuma
 * @param {string} key - Anahtar
 * @param {any} defaultValue - Varsayılan değer
 * @returns {any} Okunan değer
 */
export const getStorageItem = (key, defaultValue = null) => {
  try {
    const item = localStorage.getItem(key)
    return item ? JSON.parse(item) : defaultValue
  } catch (error) {
    console.error('localStorage getItem error:', error)
    return defaultValue
  }
}

/**
 * Local storage'dan veri silme
 * @param {string} key - Anahtar
 */
export const removeStorageItem = (key) => {
  try {
    localStorage.removeItem(key)
  } catch (error) {
    console.error('localStorage removeItem error:', error)
  }
}

/**
 * Local storage'ı temizleme
 */
export const clearStorage = () => {
  try {
    localStorage.clear()
  } catch (error) {
    console.error('localStorage clear error:', error)
  }
}

// ========================
// CACHE HELPERS
// ========================

/**
 * Cache'e veri kaydetme (TTL ile)
 * @param {string} key - Cache anahtarı
 * @param {any} data - Kaydedilecek veri
 * @param {number} ttl - TTL (saniye, opsiyonel)
 */
export const setCacheItem = (key, data, ttl = CACHE_TTL.REFERENCE_DATA) => {
  const cacheItem = {
    data,
    timestamp: Date.now(),
    ttl: ttl * 1000 // Convert to milliseconds
  }
  setStorageItem(`cache_${key}`, cacheItem)
}

/**
 * Cache'den veri okuma
 * @param {string} key - Cache anahtarı
 * @returns {any|null} Cache'deki veri veya null
 */
export const getCacheItem = (key) => {
  const cacheItem = getStorageItem(`cache_${key}`)

  if (!cacheItem) return null

  const now = Date.now()
  const isExpired = (now - cacheItem.timestamp) > cacheItem.ttl

  if (isExpired) {
    removeCacheItem(key)
    return null
  }

  return cacheItem.data
}

/**
 * Cache'den veri silme
 * @param {string} key - Cache anahtarı
 */
export const removeCacheItem = (key) => {
  removeStorageItem(`cache_${key}`)
}

/**
 * Tüm cache'i temizleme
 */
export const clearCache = () => {
  Object.values(CACHE_KEYS).forEach(key => {
    removeCacheItem(key)
  })
}

/**
 * Cache'in geçerli olup olmadığını kontrol etme
 * @param {string} key - Cache anahtarı
 * @returns {boolean} Cache geçerli mi?
 */
export const isCacheValid = (key) => {
  return getCacheItem(key) !== null
}

// ========================
// URL HELPERS
// ========================

/**
 * Query parametrelerini object'e dönüştürme
 * @param {string} queryString - Query string
 * @returns {object} Query parametreleri
 */
export const parseQueryParams = (queryString) => {
  const params = new URLSearchParams(queryString)
  const result = {}

  for (const [key, value] of params) {
    result[key] = value
  }

  return result
}

/**
 * Object'i query string'e dönüştürme
 * @param {object} params - Parametreler
 * @returns {string} Query string
 */
export const buildQueryString = (params) => {
  const filteredParams = Object.entries(params)
    .filter(([key, value]) => value !== null && value !== undefined && value !== '')
    .reduce((acc, [key, value]) => {
      acc[key] = value
      return acc
    }, {})

  return new URLSearchParams(filteredParams).toString()
}

/**
 * URL'e query parametrelerini ekleme
 * @param {string} baseUrl - Ana URL
 * @param {object} params - Parametreler
 * @returns {string} Parametreli URL
 */
export const buildUrl = (baseUrl, params = {}) => {
  const queryString = buildQueryString(params)
  return queryString ? `${baseUrl}?${queryString}` : baseUrl
}

// ========================
// ARRAY HELPERS
// ========================

/**
 * Array'i unique değerlere göre filtreleme
 * @param {Array} array - Filtrelenecek array
 * @param {string|Function} key - Unique key veya function
 * @returns {Array} Filtrelenmiş array
 */
export const uniqueBy = (array, key) => {
  const seen = new Set()
  return array.filter(item => {
    const keyValue = typeof key === 'function' ? key(item) : item[key]
    if (seen.has(keyValue)) {
      return false
    }
    seen.add(keyValue)
    return true
  })
}

/**
 * Array'i gruplama
 * @param {Array} array - Gruplenecek array
 * @param {string|Function} key - Gruplama anahtarı
 * @returns {object} Gruplenmiş object
 */
export const groupBy = (array, key) => {
  return array.reduce((groups, item) => {
    const groupKey = typeof key === 'function' ? key(item) : item[key]
    if (!groups[groupKey]) {
      groups[groupKey] = []
    }
    groups[groupKey].push(item)
    return groups
  }, {})
}

/**
 * Array'den rastgele eleman seçme
 * @param {Array} array - Array
 * @returns {any} Rastgele eleman
 */
export const randomItem = (array) => {
  return array[Math.floor(Math.random() * array.length)]
}

/**
 * Array'i karıştırma (shuffle)
 * @param {Array} array - Karıştırılacak array
 * @returns {Array} Karıştırılmış array
 */
export const shuffle = (array) => {
  const shuffled = [...array]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  return shuffled
}

/**
 * Deep equality check for two objects
 * @param {any} obj1
 * @param {any} obj2
 * @returns {boolean}
 */
export const deepEqual = (obj1, obj2) => {
  if (obj1 === obj2) return true

  if (obj1 === null || obj1 === undefined || obj2 === null || obj2 === undefined) {
    return obj1 === obj2
  }

  if (obj1.constructor !== obj2.constructor) return false

  if (Array.isArray(obj1)) {
    if (obj1.length !== obj2.length) return false
    for (let i = 0; i < obj1.length; i++) {
      if (!deepEqual(obj1[i], obj2[i])) return false
    }
    return true
  }

  if (typeof obj1 === 'object') {
    const keys1 = Object.keys(obj1)
    const keys2 = Object.keys(obj2)
    if (keys1.length !== keys2.length) return false
    for (const key of keys1) {
      if (!keys2.includes(key) || !deepEqual(obj1[key], obj2[key])) return false
    }
    return true
  }

  return false
}

// ========================
// OBJECT HELPERS
// ========================

/**
 * Deep clone objesi
 * @param {any} obj - Klonlanacak obje
 * @returns {any} Klonlanmış obje
 */
export const deepClone = (obj) => {
  if (obj === null || typeof obj !== 'object') return obj
  if (obj instanceof Date) return new Date(obj.getTime())
  if (obj instanceof Array) return obj.map(item => deepClone(item))

  const cloned = {}
  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      cloned[key] = deepClone(obj[key])
    }
  }
  return cloned
}

/**
 * Object'leri deep merge etme
 * @param {object} target - Hedef obje
 * @param {...object} sources - Kaynak objeler
 * @returns {object} Merge edilmiş obje
 */
export const deepMerge = (target, ...sources) => {
  if (!sources.length) return target
  const source = sources.shift()

  if (isObject(target) && isObject(source)) {
    for (const key in source) {
      if (isObject(source[key])) {
        if (!target[key]) Object.assign(target, { [key]: {} })
        deepMerge(target[key], source[key])
      } else {
        Object.assign(target, { [key]: source[key] })
      }
    }
  }

  return deepMerge(target, ...sources)
}

/**
 * Obje olup olmadığını kontrol etme
 * @param {any} item - Kontrol edilecek item
 * @returns {boolean} Obje mi?
 */
export const isObject = (item) => {
  return item && typeof item === 'object' && !Array.isArray(item)
}

/**
 * Nested object'ten değer alma
 * @param {object} obj - Obje
 * @param {string} path - Path (dot notation)
 * @param {any} defaultValue - Varsayılan değer
 * @returns {any} Değer
 */
export const get = (obj, path, defaultValue = undefined) => {
  const keys = path.split('.')
  let result = obj

  for (const key of keys) {
    if (result && typeof result === 'object' && key in result) {
      result = result[key]
    } else {
      return defaultValue
    }
  }

  return result
}

/**
 * Nested object'e değer atama
 * @param {object} obj - Obje
 * @param {string} path - Path (dot notation)
 * @param {any} value - Atanacak değer
 */
export const set = (obj, path, value) => {
  const keys = path.split('.')
  const lastKey = keys.pop()
  let current = obj

  for (const key of keys) {
    if (!(key in current) || typeof current[key] !== 'object') {
      current[key] = {}
    }
    current = current[key]
  }

  current[lastKey] = value
}

// ========================
// STRING HELPERS
// ========================

/**
 * String'i kebab-case'e dönüştürme
 * @param {string} str - String
 * @returns {string} Kebab-case string
 */
export const kebabCase = (str) => {
  return str
    .replace(/([a-z])([A-Z])/g, '$1-$2')
    .replace(/[\s_]+/g, '-')
    .toLowerCase()
}

/**
 * String'i camelCase'e dönüştürme
 * @param {string} str - String
 * @returns {string} CamelCase string
 */
export const camelCase = (str) => {
  return str
    .replace(/(?:^\w|[A-Z]|\b\w)/g, (word, index) => {
      return index === 0 ? word.toLowerCase() : word.toUpperCase()
    })
    .replace(/\s+/g, '')
}

/**
 * String'i capitalize etme
 * @param {string} str - String
 * @returns {string} Capitalize edilmiş string
 */
export const capitalize = (str) => {
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase()
}

/**
 * String'i truncate etme
 * @param {string} str - String
 * @param {number} length - Maksimum uzunluk
 * @param {string} suffix - Ek (varsayılan: '...')
 * @returns {string} Truncate edilmiş string
 */
export const truncate = (str, length, suffix = '...') => {
  if (str.length <= length) return str
  return str.substring(0, length) + suffix
}

// ========================
// FILE HELPERS
// ========================

/**
 * Dosya uzantısını alma
 * @param {string} filename - Dosya adı
 * @returns {string} Uzantı
 */
export const getFileExtension = (filename) => {
  return filename.slice((filename.lastIndexOf('.') - 1 >>> 0) + 2)
}

/**
 * Dosya adından uzantıyı çıkarma
 * @param {string} filename - Dosya adı
 * @returns {string} Uzantısız dosya adı
 */
export const getFilenameWithoutExtension = (filename) => {
  return filename.substring(0, filename.lastIndexOf('.')) || filename
}

/**
 * MIME type'dan dosya uzantısı alma
 * @param {string} mimeType - MIME type
 * @returns {string} Uzantı
 */
export const getExtensionFromMimeType = (mimeType) => {
  const mimeMap = {
    'text/csv': 'csv',
    'application/vnd.ms-excel': 'xls',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'xlsx',
    'application/pdf': 'pdf',
    'image/jpeg': 'jpg',
    'image/png': 'png'
  }
  return mimeMap[mimeType] || ''
}

// ========================
// NOTIFICATION HELPERS
// ========================

/**
 * Başarı bildirimi gösterme
 * @param {string} message - Mesaj
 * @param {string} title - Başlık
 */
export const showSuccessNotification = (message, title = 'Başarılı') => {
  // ElMessage kullanımı için - component'lerde inject edilecek
  return {
    type: NOTIFICATION_TYPES.SUCCESS,
    title,
    message
  }
}

/**
 * Hata bildirimi gösterme
 * @param {string} message - Mesaj
 * @param {string} title - Başlık
 */
export const showErrorNotification = (message, title = 'Hata') => {
  return {
    type: NOTIFICATION_TYPES.ERROR,
    title,
    message
  }
}

/**
 * Uyarı bildirimi gösterme
 * @param {string} message - Mesaj
 * @param {string} title - Başlık
 */
export const showWarningNotification = (message, title = 'Uyarı') => {
  return {
    type: NOTIFICATION_TYPES.WARNING,
    title,
    message
  }
}

/**
 * Bilgi bildirimi gösterme
 * @param {string} message - Mesaj
 * @param {string} title - Başlık
 */
export const showInfoNotification = (message, title = 'Bilgi') => {
  return {
    type: NOTIFICATION_TYPES.INFO,
    title,
    message
  }
}

// ========================
// DEBOUNCE & THROTTLE
// ========================

/**
 * Debounce fonksiyonu
 * @param {Function} func - Debounce edilecek fonksiyon
 * @param {number} wait - Bekleme süresi (ms)
 * @returns {Function} Debounce edilmiş fonksiyon
 */
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

/**
 * Throttle fonksiyonu
 * @param {Function} func - Throttle edilecek fonksiyon
 * @param {number} limit - Limit süresi (ms)
 * @returns {Function} Throttle edilmiş fonksiyon
 */
export const throttle = (func, limit) => {
  let inThrottle
  return function executedFunction(...args) {
    if (!inThrottle) {
      func.apply(this, args)
      inThrottle = true
      setTimeout(() => inThrottle = false, limit)
    }
  }
}

// ========================
// ERROR HANDLING
// ========================

/**
 * API hatasını parse etme
 * @param {Error} error - Hata objesi
 * @returns {object} Parse edilmiş hata
 */
export const parseApiError = (error) => {
  const defaultError = {
    message: 'Bilinmeyen bir hata oluştu',
    status: 500,
    details: null
  }

  if (!error.response) {
    return {
      ...defaultError,
      message: 'Bağlantı hatası: Sunucuya ulaşılamıyor'
    }
  }

  const { status, data } = error.response

  return {
    message: data?.message || data?.error || defaultError.message,
    status,
    details: data?.validationErrors || data?.details || null
  }
}

/**
 * Hata loglaması
 * @param {string} context - Context bilgisi
 * @param {Error} error - Hata objesi
 * @param {any} additionalData - Ek veriler
 */
export const logError = (context, error, additionalData = null) => {
  const errorInfo = {
    context,
    message: error.message,
    stack: error.stack,
    timestamp: new Date().toISOString(),
    url: window.location.href,
    userAgent: navigator.userAgent,
    additionalData
  }

  console.error('Application Error:', errorInfo)

  // Production'da error tracking service'e gönderebilir
  // Örn: Sentry, LogRocket vs.
}

// ========================
// PAGINATION HELPERS
// ========================

/**
 * Pagination bilgilerini hesaplama
 * @param {number} total - Toplam kayıt sayısı
 * @param {number} page - Mevcut sayfa (0-based)
 * @param {number} size - Sayfa boyutu
 * @returns {object} Pagination bilgileri
 */
export const calculatePagination = (total, page, size) => {
  const totalPages = Math.ceil(total / size)
  const hasNext = page < totalPages - 1
  const hasPrevious = page > 0
  const isFirst = page === 0
  const isLast = page === totalPages - 1

  return {
    total,
    page,
    size,
    totalPages,
    hasNext,
    hasPrevious,
    isFirst,
    isLast,
    startItem: page * size + 1,
    endItem: Math.min((page + 1) * size, total)
  }
}

// ========================
// DATE UTILITIES
// ========================

/**
 * Tarih aralığı oluşturma
 * @param {number} days - Gün sayısı
 * @param {Date} startDate - Başlangıç tarihi (opsiyonel)
 * @returns {object} Tarih aralığı
 */
export const createDateRange = (days, startDate = new Date()) => {
  const start = new Date(startDate)
  start.setHours(0, 0, 0, 0)

  const end = new Date(start)
  end.setDate(end.getDate() + days - 1)
  end.setHours(23, 59, 59, 999)

  return {
    start: start.toISOString(),
    end: end.toISOString(),
    startFormatted: formatDate(start),
    endFormatted: formatDate(end)
  }
}

/**
 * İki tarih arasındaki gün farkını hesaplama
 * @param {Date|string} date1 - İlk tarih
 * @param {Date|string} date2 - İkinci tarih
 * @returns {number} Gün farkı
 */
export const daysDifference = (date1, date2) => {
  const d1 = new Date(date1)
  const d2 = new Date(date2)
  const diffTime = Math.abs(d2 - d1)
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
}
