/**
 * Debug utility for identifying common issues
 */

// Debug flags
const DEBUG_MODE = import.meta.env.DEV
const DEBUG_LEVELS = {
  ERROR: 0,
  WARN: 1,
  INFO: 2,
  DEBUG: 3
}

let currentDebugLevel = DEBUG_MODE ? DEBUG_LEVELS.DEBUG : DEBUG_LEVELS.ERROR

/**
 * Set debug level
 */
export function setDebugLevel(level) {
  currentDebugLevel = level
}

/**
 * Debug logger
 */
export function debug(level, category, message, data = null) {
  if (level <= currentDebugLevel) {
    const timestamp = new Date().toISOString()
    const prefix = `[${timestamp}] [${category}]`
    
    switch (level) {
      case DEBUG_LEVELS.ERROR:
        console.error(prefix, message, data)
        break
      case DEBUG_LEVELS.WARN:
        console.warn(prefix, message, data)
        break
      case DEBUG_LEVELS.INFO:
        console.info(prefix, message, data)
        break
      case DEBUG_LEVELS.DEBUG:
        console.log(prefix, message, data)
        break
    }
  }
}

/**
 * Check for common issues
 */
export function checkForIssues() {
  debug(DEBUG_LEVELS.INFO, 'DEBUG', 'Checking for common issues...')

  // Check localStorage
  try {
    localStorage.setItem('debug_test', 'test')
    localStorage.removeItem('debug_test')
    debug(DEBUG_LEVELS.DEBUG, 'DEBUG', 'localStorage is working')
  } catch (error) {
    debug(DEBUG_LEVELS.ERROR, 'DEBUG', 'localStorage is not available', error)
  }

  // Check sessionStorage
  try {
    sessionStorage.setItem('debug_test', 'test')
    sessionStorage.removeItem('debug_test')
    debug(DEBUG_LEVELS.DEBUG, 'DEBUG', 'sessionStorage is working')
  } catch (error) {
    debug(DEBUG_LEVELS.ERROR, 'DEBUG', 'sessionStorage is not available', error)
  }

  // Check network connectivity
  if (navigator.onLine) {
    debug(DEBUG_LEVELS.DEBUG, 'DEBUG', 'Network is online')
  } else {
    debug(DEBUG_LEVELS.WARN, 'DEBUG', 'Network is offline')
  }

  // Check browser features
  const features = {
    localStorage: !!window.localStorage,
    sessionStorage: !!window.sessionStorage,
    webSocket: !!window.WebSocket,
    fetch: !!window.fetch,
    promise: !!window.Promise,
    async: typeof async function() {} === 'function'
  }

  debug(DEBUG_LEVELS.INFO, 'DEBUG', 'Browser features check', features)

  // Note: Console override removed to prevent infinite loops
  // Console errors and warnings will be logged normally
}

/**
 * Performance monitoring
 */
export function monitorPerformance() {
  if (!DEBUG_MODE) return

  // Monitor page load time
  window.addEventListener('load', () => {
    const loadTime = performance.timing.loadEventEnd - performance.timing.navigationStart
    debug(DEBUG_LEVELS.INFO, 'PERFORMANCE', `Page load time: ${loadTime}ms`)
  })

  // Monitor memory usage
  if (performance.memory) {
    setInterval(() => {
      const memory = performance.memory
      debug(DEBUG_LEVELS.DEBUG, 'PERFORMANCE', 'Memory usage', {
        used: Math.round(memory.usedJSHeapSize / 1048576) + 'MB',
        total: Math.round(memory.totalJSHeapSize / 1048576) + 'MB',
        limit: Math.round(memory.jsHeapSizeLimit / 1048576) + 'MB'
      })
    }, 30000) // Every 30 seconds
  }
}

/**
 * API monitoring
 */
export function monitorAPI() {
  if (!DEBUG_MODE) return

  // Monitor fetch requests
  const originalFetch = window.fetch
  window.fetch = function(...args) {
    const startTime = performance.now()
    const url = args[0]
    
    debug(DEBUG_LEVELS.DEBUG, 'API', `Request started: ${url}`)
    
    return originalFetch.apply(this, args).then(response => {
      const endTime = performance.now()
      const duration = Math.round(endTime - startTime)
      
      debug(DEBUG_LEVELS.DEBUG, 'API', `Request completed: ${url} (${duration}ms)`, {
        status: response.status,
        statusText: response.statusText
      })
      
      return response
    }).catch(error => {
      const endTime = performance.now()
      const duration = Math.round(endTime - startTime)
      
      debug(DEBUG_LEVELS.ERROR, 'API', `Request failed: ${url} (${duration}ms)`, error)
      throw error
    })
  }
}

/**
 * Initialize debugging
 */
export function initDebug() {
  if (!DEBUG_MODE) return

  debug(DEBUG_LEVELS.INFO, 'DEBUG', 'Initializing debug mode')
  
  checkForIssues()
  monitorPerformance()
  monitorAPI()
  
  // Expose debug functions globally in development
  window.$debug = {
    setLevel: setDebugLevel,
    checkIssues: checkForIssues,
    log: debug
  }
  
  debug(DEBUG_LEVELS.INFO, 'DEBUG', 'Debug mode initialized')
}

// Auto-initialize in development
if (DEBUG_MODE) {
  initDebug()
} 