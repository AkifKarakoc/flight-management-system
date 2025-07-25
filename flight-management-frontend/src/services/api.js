import axios from 'axios'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  API_BASE_URL,
  HTTP_STATUS,
  STORAGE_KEYS,
  REFERENCE_API_ENDPOINTS,
  FLIGHT_API_ENDPOINTS
} from '@/utils/constants'
import { getStorageItem, setStorageItem, removeStorageItem, parseApiError, logError } from '@/utils/helpers'

// ========================
// REQUEST/RESPONSE INTERCEPTOR UTILITIES
// ========================

/**
 * Request queue for managing concurrent requests
 */
class RequestQueue {
  constructor() {
    this.queue = new Map()
    this.retryQueue = new Map()
  }

  /**
   * Generate unique key for request deduplication
   */
  generateKey(config) {
    const { method, url, params, data } = config
    return `${method}:${url}:${JSON.stringify(params)}:${JSON.stringify(data)}`
  }

  /**
   * Add request to queue
   */
  add(config) {
    const key = this.generateKey(config)

    if (this.queue.has(key)) {
      return this.queue.get(key)
    }

    const promise = new Promise((resolve, reject) => {
      config._resolve = resolve
      config._reject = reject
    })

    this.queue.set(key, promise)
    return promise
  }

  /**
   * Resolve request in queue
   */
  resolve(config, response) {
    const key = this.generateKey(config)
    const promise = this.queue.get(key)

    if (promise && config._resolve) {
      config._resolve(response)
      this.queue.delete(key)
    }
  }

  /**
   * Reject request in queue
   */
  reject(config, error) {
    const key = this.generateKey(config)
    const promise = this.queue.get(key)

    if (promise && config._reject) {
      config._reject(error)
      this.queue.delete(key)
    }
  }

  /**
   * Clear all queued requests
   */
  clear() {
    this.queue.clear()
    this.retryQueue.clear()
  }
}

const requestQueue = new RequestQueue()

// ========================
// API CLIENT FACTORY
// ========================

/**
 * Create axios instance with common configuration
 */
function createApiClient(baseURL, options = {}) {
  const client = axios.create({
    baseURL,
    timeout: options.timeout || 30000,
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      ...options.headers
    },
    // Enable request/response compression
    decompress: true,
    // Maximum response size (10MB)
    maxContentLength: 10 * 1024 * 1024,
    maxBodyLength: 10 * 1024 * 1024,
    ...options
  })

  // Request interceptor
  client.interceptors.request.use(
    (config) => {
      // Add authentication token
      const token = getStorageItem(STORAGE_KEYS.AUTH_TOKEN)
      if (token) {
        config.headers.Authorization = `Bearer ${token}`
      }

      // Add request timestamp for monitoring
      config.metadata = {
        startTime: Date.now(),
        retryCount: config.retryCount || 0
      }

      // Request deduplication
      if (config.deduplicate !== false && ['GET'].includes(config.method?.toUpperCase())) {
        const existingRequest = requestQueue.add(config)
        if (existingRequest !== undefined) {
          return Promise.reject({
            __CANCEL__: true,
            message: 'Duplicate request',
            config
          })
        }
      }

      // Log request in development
      if (import.meta.env.MODE === 'development') {
        console.log(`🚀 ${config.method?.toUpperCase()} ${config.url}`, {
          params: config.params,
          data: config.data
        })
      }

      return config
    },
    (error) => {
      logError('API Request Interceptor', error)
      return Promise.reject(error)
    }
  )

  // Response interceptor
  client.interceptors.response.use(
    (response) => {
      const { config } = response

      // Calculate request duration
      if (config.metadata) {
        const duration = Date.now() - config.metadata.startTime
        response.metadata = {
          ...config.metadata,
          duration
        }

        // Log slow requests
        if (duration > 3000) {
          console.warn(`🐌 Slow request: ${config.method?.toUpperCase()} ${config.url} (${duration}ms)`)
        }
      }

      // Resolve queued requests
      requestQueue.resolve(config, response)

      // Log response in development
      if (import.meta.env.MODE === 'development') {
        console.log(`✅ ${config.method?.toUpperCase()} ${config.url}`, {
          status: response.status,
          duration: response.metadata?.duration,
          data: response.data
        })
      }

      return response
    },
    async (error) => {
      const { config, response } = error

      // Handle cancelled requests
      if (error.__CANCEL__) {
        return requestQueue.queue.get(requestQueue.generateKey(config))
      }

      // Reject queued requests
      if (config) {
        requestQueue.reject(config, error)
      }

      // Calculate request duration for failed requests
      if (config?.metadata) {
        const duration = Date.now() - config.metadata.startTime
        error.metadata = {
          ...config.metadata,
          duration
        }
      }

      // Log error in development
      if (import.meta.env.MODE === 'development') {
        console.error(`❌ ${config?.method?.toUpperCase()} ${config?.url}`, {
          status: response?.status,
          duration: error.metadata?.duration,
          error: error.message
        })
      }

      // Handle specific error cases
      if (response) {
        const { status } = response

        switch (status) {
          case HTTP_STATUS.UNAUTHORIZED:
            await handleUnauthorized()
            break

          case HTTP_STATUS.FORBIDDEN:
            handleForbidden()
            break

          case HTTP_STATUS.NOT_FOUND:
            handleNotFound(config)
            break

          case HTTP_STATUS.INTERNAL_SERVER_ERROR:
            handleServerError(error)
            break

          default:
            // Retry logic for specific status codes
            if (shouldRetry(error)) {
              return retryRequest(client, config)
            }
        }
      } else {
        // Network error
        handleNetworkError(error)
      }

      // Log error for monitoring
      logError('API Response Error', error, {
        url: config?.url,
        method: config?.method,
        status: response?.status
      })

      return Promise.reject(error)
    }
  )

  return client
}

// ========================
// ERROR HANDLERS
// ========================

async function handleUnauthorized() {
  // Try to refresh token
  const refreshToken = getStorageItem(STORAGE_KEYS.REFRESH_TOKEN)

  if (refreshToken) {
    try {
      const response = await refreshAuthToken(refreshToken)
      setStorageItem(STORAGE_KEYS.AUTH_TOKEN, response.data.accessToken)
      setStorageItem(STORAGE_KEYS.REFRESH_TOKEN, response.data.refreshToken)
      return // Token refreshed, request will be retried
    } catch (refreshError) {
      // Refresh failed, logout user
      await logoutUser()
    }
  } else {
    await logoutUser()
  }
}

function handleForbidden() {
  ElMessage.error('Bu işlem için yetkiniz bulunmuyor')
  // Optionally redirect to forbidden page
  // router.push('/403')
}

function handleNotFound(config) {
  if (config?.showNotFoundMessage !== false) {
    ElMessage.error('İstenen kaynak bulunamadı')
  }
}

function handleServerError(error) {
  const errorInfo = parseApiError(error)
  ElMessage.error(`Sunucu hatası: ${errorInfo.message}`)
}

function handleNetworkError(error) {
  if (navigator.onLine === false) {
    ElMessage.error('İnternet bağlantınızı kontrol edin')
  } else {
    ElMessage.error('Bağlantı hatası oluştu')
  }
}

// ========================
// RETRY LOGIC
// ========================

function shouldRetry(error) {
  const { config, response } = error

  // Don't retry if explicitly disabled
  if (config?.retry === false) return false

  // Don't retry if max attempts reached
  const maxRetries = config?.retryCount || 3
  const currentRetry = config?.metadata?.retryCount || 0
  if (currentRetry >= maxRetries) return false

  // Retry on network errors or specific status codes
  if (!response) return true

  const retryableStatusCodes = [408, 429, 500, 502, 503, 504]
  return retryableStatusCodes.includes(response.status)
}

async function retryRequest(client, config) {
  const delay = calculateRetryDelay(config.metadata?.retryCount || 0)

  await new Promise(resolve => setTimeout(resolve, delay))

  // Increment retry count
  config.metadata = {
    ...config.metadata,
    retryCount: (config.metadata?.retryCount || 0) + 1
  }

  return client.request(config)
}

function calculateRetryDelay(retryCount) {
  // Exponential backoff: 1s, 2s, 4s, 8s...
  return Math.min(1000 * Math.pow(2, retryCount), 10000)
}

// ========================
// AUTH HELPERS
// ========================

async function refreshAuthToken(refreshToken) {
  // Create a separate client for auth requests to avoid circular dependencies
  const authClient = axios.create({
    baseURL: API_BASE_URL.REFERENCE_MANAGER,
    timeout: 10000
  })

  return authClient.post(REFERENCE_API_ENDPOINTS.AUTH.REFRESH, {
    refreshToken
  })
}

async function logoutUser() {
  removeStorageItem(STORAGE_KEYS.AUTH_TOKEN)
  removeStorageItem(STORAGE_KEYS.REFRESH_TOKEN)

  // Clear request queue
  requestQueue.clear()

  // Redirect to login
  if (window.location.pathname !== '/login') {
    window.location.href = '/login'
  }
}

// ========================
// API CLIENTS
// ========================

/**
 * Reference Manager API Client (Port 8081)
 */
export const referenceAPI = createApiClient(API_BASE_URL.REFERENCE_MANAGER, {
  timeout: 15000,
  headers: {
    'X-Service': 'reference-manager'
  }
})

/**
 * Flight Service API Client (Port 8082)
 */
export const flightAPI = createApiClient(API_BASE_URL.FLIGHT_SERVICE, {
  timeout: 20000,
  headers: {
    'X-Service': 'flight-service'
  }
})

/**
 * Archive Service API Client (Port 8083)
 */
export const archiveAPI = createApiClient(API_BASE_URL.ARCHIVE_SERVICE, {
  timeout: 30000,
  headers: {
    'X-Service': 'archive-service'
  }
})

// ========================
// UTILITY FUNCTIONS
// ========================

/**
 * Create request with file upload support
 */
export function createUploadRequest(client, url, file, options = {}) {
  const formData = new FormData()
  formData.append('file', file)

  // Add additional fields
  Object.keys(options.fields || {}).forEach(key => {
    formData.append(key, options.fields[key])
  })

  return client.post(url, formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    },
    timeout: options.timeout || 60000,
    onUploadProgress: options.onProgress,
    ...options.config
  })
}

/**
 * Create request with download support
 */
export function createDownloadRequest(client, url, options = {}) {
  return client.get(url, {
    responseType: 'blob',
    timeout: options.timeout || 60000,
    onDownloadProgress: options.onProgress,
    ...options.config
  })
}

/**
 * Create paginated request
 */
export function createPaginatedRequest(client, url, params = {}) {
  const { page = 0, size = 20, sort, ...otherParams } = params

  return client.get(url, {
    params: {
      page,
      size,
      sort,
      ...otherParams
    }
  })
}

/**
 * Create bulk request
 */
export function createBulkRequest(client, url, items, options = {}) {
  const batchSize = options.batchSize || 100
  const batches = []

  for (let i = 0; i < items.length; i += batchSize) {
    batches.push(items.slice(i, i + batchSize))
  }

  return Promise.allSettled(
    batches.map(batch =>
      client.post(url, batch, options.config)
    )
  )
}

/**
 * Health check helper
 */
export async function checkApiHealth() {
  const healthChecks = [
    { name: 'Reference Manager', client: referenceAPI, endpoint: '/actuator/health' },
    { name: 'Flight Service', client: flightAPI, endpoint: '/actuator/health' },
    { name: 'Archive Service', client: archiveAPI, endpoint: '/actuator/health' }
  ]

  const results = await Promise.allSettled(
    healthChecks.map(async ({ name, client, endpoint }) => {
      try {
        const response = await client.get(endpoint, { timeout: 5000 })
        return { name, status: 'healthy', response: response.data }
      } catch (error) {
        return { name, status: 'unhealthy', error: error.message }
      }
    })
  )

  return results.map((result, index) => ({
    ...healthChecks[index],
    ...result.value
  }))
}

/**
 * Cancel all pending requests
 */
export function cancelAllRequests() {
  requestQueue.clear()
}

// ========================
// DEVELOPMENT HELPERS
// ========================

if (import.meta.env.MODE === 'development') {
  // Expose API clients globally for debugging
  window.__API_CLIENTS__ = {
    referenceAPI,
    flightAPI,
    archiveAPI,
    utils: {
      checkApiHealth,
      cancelAllRequests,
      requestQueue
    }
  }

  // Log API performance stats
  setInterval(() => {
    const queueSize = requestQueue.queue.size
    if (queueSize > 0) {
      console.log(`📊 Active requests: ${queueSize}`)
    }
  }, 10000)
}

export default {
  referenceAPI,
  flightAPI,
  archiveAPI,
  createUploadRequest,
  createDownloadRequest,
  createPaginatedRequest,
  createBulkRequest,
  checkApiHealth,
  cancelAllRequests
}
