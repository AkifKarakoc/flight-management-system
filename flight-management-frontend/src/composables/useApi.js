import { ref, reactive, computed, onUnmounted } from 'vue'
import { ElMessage } from 'element-plus'
import { parseApiError, logError, debounce } from '@/utils/helpers'

/**
 * Composable for API operations with advanced features
 * @param {Object} service - API service instance
 * @param {Object} options - Configuration options
 */
export function useApi(service, options = {}) {
  // ========================
  // REACTIVE STATE
  // ========================

  const loading = ref(false)
  const error = ref(null)
  const data = ref(null)
  const lastRequest = ref(null)
  const requestId = ref(0)

  // Advanced state
  const retryCount = ref(0)
  const cache = reactive(new Map())
  const abortController = ref(null)
  const requestQueue = reactive([])

  // Configuration with defaults
  const config = reactive({
    autoErrorHandling: true,
    autoSuccessMessage: false,
    retryAttempts: 3,
    retryDelay: 1000,
    cacheEnabled: false,
    cacheTTL: 5 * 60 * 1000, // 5 minutes
    debounceDelay: 0,
    ...options
  })

  // ========================
  // COMPUTED PROPERTIES
  // ========================

  const isLoading = computed(() => loading.value)
  const hasError = computed(() => !!error.value)
  const hasData = computed(() => !!data.value)
  const canRetry = computed(() => retryCount.value < config.retryAttempts)
  const requestsInQueue = computed(() => requestQueue.length)

  // ========================
  // CORE METHODS
  // ========================

  /**
   * Execute API request
   */
  const execute = async (method, ...args) => {
    const currentRequestId = ++requestId.value

    // Cancel previous request if ongoing
    if (abortController.value) {
      abortController.value.abort()
    }

    // Create new abort controller
    abortController.value = new AbortController()

    // Cache key generation
    const cacheKey = config.cacheEnabled ?
      generateCacheKey(method, args) : null

    // Check cache first
    if (cacheKey && cache.has(cacheKey)) {
      const cachedItem = cache.get(cacheKey)
      if (isCacheValid(cachedItem)) {
        data.value = cachedItem.data
        return cachedItem.data
      } else {
        cache.delete(cacheKey)
      }
    }

    // Start request
    loading.value = true
    error.value = null
    lastRequest.value = { method, args, timestamp: Date.now() }

    try {
      // Add request to queue
      const queueItem = { id: currentRequestId, method, args, timestamp: Date.now() }
      requestQueue.push(queueItem)

      // Execute the service method
      const result = await service[method](...args, {
        signal: abortController.value.signal
      })

      // Check if this is still the latest request
      if (currentRequestId === requestId.value) {
        data.value = result
        error.value = null
        retryCount.value = 0

        // Cache the result
        if (cacheKey) {
          cache.set(cacheKey, {
            data: result,
            timestamp: Date.now(),
            ttl: config.cacheTTL
          })
        }

        // Show success message if configured
        if (config.autoSuccessMessage) {
          ElMessage.success(config.successMessage || 'İşlem başarılı')
        }
      }

      return result

    } catch (err) {
      // Check if this is still the latest request
      if (currentRequestId === requestId.value) {
        // Skip error handling for aborted requests
        if (err.name === 'AbortError') {
          return
        }

        error.value = err

        // Auto retry logic
        if (canRetry.value && shouldRetry(err)) {
          retryCount.value++
          const delay = calculateRetryDelay(retryCount.value)

          if (config.onRetry) {
            config.onRetry(retryCount.value, delay)
          }

          await new Promise(resolve => setTimeout(resolve, delay))
          return execute(method, ...args)
        }

        // Handle error
        if (config.autoErrorHandling) {
          handleError(err)
        }

        // Log error
        logError('useApi', err, { method, args })
      }

      throw err

    } finally {
      // Clean up only if this is still the latest request
      if (currentRequestId === requestId.value) {
        loading.value = false
        abortController.value = null

        // Remove from queue
        const queueIndex = requestQueue.findIndex(item => item.id === currentRequestId)
        if (queueIndex > -1) {
          requestQueue.splice(queueIndex, 1)
        }
      }
    }
  }

  /**
   * Debounced execute function
   */
  const debouncedExecute = config.debounceDelay > 0 ?
    debounce(execute, config.debounceDelay) : execute

  /**
   * Retry last failed request
   */
  const retry = async () => {
    if (!lastRequest.value || !canRetry.value) {
      return
    }

    const { method, args } = lastRequest.value
    return execute(method, ...args)
  }

  /**
   * Cancel current request
   */
  const cancel = () => {
    if (abortController.value) {
      abortController.value.abort()
      abortController.value = null
    }

    loading.value = false
    error.value = null
  }

  /**
   * Reset state
   */
  const reset = () => {
    cancel()
    data.value = null
    error.value = null
    retryCount.value = 0
    lastRequest.value = null
  }

  /**
   * Refresh/re-execute last request
   */
  const refresh = async () => {
    if (!lastRequest.value) return

    const { method, args } = lastRequest.value
    return execute(method, ...args)
  }

  // ========================
  // SPECIALIZED METHODS
  // ========================

  /**
   * Execute GET request with caching
   */
  const get = async (endpoint, params = {}) => {
    return execute('get', endpoint, { params })
  }

  /**
   * Execute POST request
   */
  const post = async (endpoint, data, config = {}) => {
    return execute('post', endpoint, data, config)
  }

  /**
   * Execute PUT request
   */
  const put = async (endpoint, data, config = {}) => {
    return execute('put', endpoint, data, config)
  }

  /**
   * Execute DELETE request
   */
  const del = async (endpoint, config = {}) => {
    return execute('delete', endpoint, config)
  }

  /**
   * Execute PATCH request
   */
  const patch = async (endpoint, data, config = {}) => {
    return execute('patch', endpoint, data, config)
  }

  /**
   * Upload file
   */
  const upload = async (endpoint, file, options = {}) => {
    const formData = new FormData()
    formData.append('file', file)

    Object.keys(options.fields || {}).forEach(key => {
      formData.append(key, options.fields[key])
    })

    return execute('post', endpoint, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress: options.onProgress,
      ...options.config
    })
  }

  /**
   * Download file
   */
  const download = async (endpoint, filename, options = {}) => {
    try {
      const response = await execute('get', endpoint, {
        responseType: 'blob',
        onDownloadProgress: options.onProgress,
        ...options.config
      })

      // Create download link
      const url = window.URL.createObjectURL(new Blob([response]))
      const link = document.createElement('a')
      link.href = url
      link.download = filename
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)

      return response
    } catch (err) {
      throw err
    }
  }

  // ========================
  // UTILITY METHODS
  // ========================

  function generateCacheKey(method, args) {
    return `${method}:${JSON.stringify(args)}`
  }

  function isCacheValid(cacheItem) {
    const now = Date.now()
    return (now - cacheItem.timestamp) < cacheItem.ttl
  }

  function shouldRetry(error) {
    // Don't retry on client errors (4xx)
    if (error.response?.status >= 400 && error.response?.status < 500) {
      return false
    }

    // Retry on network errors and server errors (5xx)
    return !error.response || error.response.status >= 500
  }

  function calculateRetryDelay(attempt) {
    // Exponential backoff with jitter
    const baseDelay = config.retryDelay
    const exponentialDelay = baseDelay * Math.pow(2, attempt - 1)
    const jitter = Math.random() * 0.1 * exponentialDelay
    return Math.min(exponentialDelay + jitter, 10000) // Max 10 seconds
  }

  function handleError(error) {
    const errorInfo = parseApiError(error)

    // Custom error messages
    if (config.errorMessages) {
      const customMessage = config.errorMessages[errorInfo.status] ||
        config.errorMessages.default
      if (customMessage) {
        ElMessage.error(customMessage)
        return
      }
    }

    // Default error handling
    ElMessage.error(errorInfo.message)
  }

  // ========================
  // CACHE MANAGEMENT
  // ========================

  const clearCache = () => {
    cache.clear()
  }

  const invalidateCache = (pattern) => {
    if (typeof pattern === 'string') {
      cache.delete(pattern)
    } else if (pattern instanceof RegExp) {
      Array.from(cache.keys()).forEach(key => {
        if (pattern.test(key)) {
          cache.delete(key)
        }
      })
    }
  }

  const getCacheStats = () => {
    return {
      size: cache.size,
      keys: Array.from(cache.keys()),
      memory: JSON.stringify(Array.from(cache.entries())).length
    }
  }

  // ========================
  // LIFECYCLE
  // ========================

  onUnmounted(() => {
    cancel()
    clearCache()
  })

  // ========================
  // RETURN API
  // ========================

  return {
    // State
    loading: isLoading,
    error,
    data,
    retryCount,
    canRetry,
    hasError,
    hasData,
    requestsInQueue,

    // Core methods
    execute: config.debounceDelay > 0 ? debouncedExecute : execute,
    retry,
    cancel,
    reset,
    refresh,

    // HTTP methods
    get,
    post,
    put,
    delete: del,
    patch,

    // File operations
    upload,
    download,

    // Cache management
    clearCache,
    invalidateCache,
    getCacheStats,

    // Configuration
    config
  }
}

/**
 * Specialized composable for paginated API requests
 */
export function usePaginatedApi(service, options = {}) {
  const api = useApi(service, options)

  // Pagination state
  const pagination = reactive({
    page: 0,
    size: 20,
    total: 0,
    totalPages: 0,
    hasNext: false,
    hasPrevious: false
  })

  const filters = ref({})
  const sortConfig = ref({ prop: '', order: '' })

  /**
   * Load page with current filters and sorting
   */
  const loadPage = async (page = pagination.page) => {
    const params = {
      page,
      size: pagination.size,
      ...filters.value
    }

    if (sortConfig.value.prop) {
      params.sort = `${sortConfig.value.prop},${sortConfig.value.order}`
    }

    try {
      const response = await api.execute('getAllPaginated', params)

      // Update pagination state
      Object.assign(pagination, {
        page: response.page || page,
        size: response.size || pagination.size,
        total: response.totalElements || response.total || 0,
        totalPages: response.totalPages || Math.ceil((response.totalElements || 0) / pagination.size),
        hasNext: !response.last,
        hasPrevious: !response.first
      })

      return response.content || response.data || []
    } catch (error) {
      throw error
    }
  }

  /**
   * Navigate to specific page
   */
  const goToPage = (page) => {
    if (page >= 0 && page < pagination.totalPages) {
      return loadPage(page)
    }
  }

  /**
   * Navigate to next page
   */
  const nextPage = () => {
    if (pagination.hasNext) {
      return loadPage(pagination.page + 1)
    }
  }

  /**
   * Navigate to previous page
   */
  const previousPage = () => {
    if (pagination.hasPrevious) {
      return loadPage(pagination.page - 1)
    }
  }

  /**
   * Change page size
   */
  const changePageSize = (size) => {
    pagination.size = size
    pagination.page = 0
    return loadPage(0)
  }

  /**
   * Apply filters
   */
  const applyFilters = (newFilters) => {
    Object.assign(filters.value, newFilters)
    pagination.page = 0
    return loadPage(0)
  }

  /**
   * Clear filters
   */
  const clearFilters = () => {
    filters.value = {}
    pagination.page = 0
    return loadPage(0)
  }

  /**
   * Apply sorting
   */
  const applySorting = (prop, order) => {
    sortConfig.value = { prop, order }
    pagination.page = 0
    return loadPage(0)
  }

  return {
    ...api,

    // Pagination state
    pagination,
    filters,
    sortConfig,

    // Pagination methods
    loadPage,
    goToPage,
    nextPage,
    previousPage,
    changePageSize,

    // Filter and sort methods
    applyFilters,
    clearFilters,
    applySorting
  }
}

/**
 * Specialized composable for bulk operations
 */
export function useBulkApi(service, options = {}) {
  const api = useApi(service, options)

  const bulkProgress = ref(0)
  const bulkResults = ref({ success: [], failed: [] })
  const batchSize = ref(options.batchSize || 10)

  /**
   * Execute bulk operation
   */
  const executeBulk = async (method, items, onProgress = null) => {
    bulkProgress.value = 0
    bulkResults.value = { success: [], failed: [] }

    const batches = []
    for (let i = 0; i < items.length; i += batchSize.value) {
      batches.push(items.slice(i, i + batchSize.value))
    }

    let processedCount = 0

    for (const batch of batches) {
      const batchPromises = batch.map(async (item, index) => {
        try {
          const result = await api.execute(method, item)
          bulkResults.value.success.push({ item, result })
          return { success: true, item, result }
        } catch (error) {
          bulkResults.value.failed.push({ item, error })
          return { success: false, item, error }
        }
      })

      await Promise.allSettled(batchPromises)

      processedCount += batch.length
      bulkProgress.value = Math.round((processedCount / items.length) * 100)

      if (onProgress) {
        onProgress(bulkProgress.value, processedCount, items.length)
      }
    }

    return bulkResults.value
  }

  return {
    ...api,
    bulkProgress,
    bulkResults,
    batchSize,
    executeBulk
  }
}

export default useApi
