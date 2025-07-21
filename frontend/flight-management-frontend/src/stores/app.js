import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useAppStore = defineStore('app', () => {
  // State
  const sidebarCollapsed = ref(false)
  const loading = ref(false)
  const pageLoading = ref(false)
  const globalLoading = ref(false)
  const notifications = ref([])
  const breadcrumbs = ref([])
  const pageTitle = ref('')
  const theme = ref('light')
  const language = ref('tr')
  const deviceType = ref('desktop')
  const windowSize = ref({ width: window.innerWidth, height: window.innerHeight })

  // UI Settings
  const settings = ref({
    showBreadcrumb: true,
    showPageHeader: true,
    showFooter: true,
    animationEnabled: true,
    autoSaveEnabled: true,
    compactMode: false,
    tablePageSize: 20,
    dateFormat: 'DD.MM.YYYY',
    timeFormat: 'HH:mm'
  })

  // Cache settings
  const cache = ref({
    enabled: true,
    ttl: 5 * 60 * 1000, // 5 minutes
    maxSize: 100
  })

  // WebSocket connections
  const websockets = ref(new Map())

  // Error state
  const errors = ref([])
  const lastError = ref(null)

  // Computed
  const isMobile = computed(() => {
    return deviceType.value === 'mobile' || windowSize.value.width < 768
  })

  const isTablet = computed(() => {
    return deviceType.value === 'tablet' || (windowSize.value.width >= 768 && windowSize.value.width < 1024)
  })

  const isDesktop = computed(() => {
    return deviceType.value === 'desktop' || windowSize.value.width >= 1024
  })

  const unreadNotifications = computed(() => {
    return notifications.value.filter(n => !n.read).length
  })

  const hasErrors = computed(() => {
    return errors.value.length > 0
  })

  const isLoading = computed(() => {
    return loading.value || pageLoading.value || globalLoading.value
  })

  // Actions
  function toggleSidebar() {
    sidebarCollapsed.value = !sidebarCollapsed.value
    // Save to localStorage
    localStorage.setItem('sidebar_collapsed', sidebarCollapsed.value.toString())
  }

  function setSidebarCollapsed(collapsed) {
    sidebarCollapsed.value = collapsed
    localStorage.setItem('sidebar_collapsed', collapsed.toString())
  }

  function setLoading(isLoading) {
    loading.value = isLoading
  }

  function setPageLoading(isLoading) {
    pageLoading.value = isLoading
  }

  function setGlobalLoading(isLoading) {
    globalLoading.value = isLoading
  }

  function setPageTitle(title) {
    pageTitle.value = title
    document.title = title ? `${title} - Flight Management` : 'Flight Management'
  }

  function setBreadcrumbs(breadcrumbItems) {
    breadcrumbs.value = breadcrumbItems
  }

  function addNotification(notification) {
    const newNotification = {
      id: Date.now() + Math.random(),
      timestamp: new Date(),
      read: false,
      ...notification
    }
    notifications.value.unshift(newNotification)

    // Limit notifications count
    if (notifications.value.length > 50) {
      notifications.value = notifications.value.slice(0, 50)
    }
  }

  function markNotificationAsRead(notificationId) {
    const notification = notifications.value.find(n => n.id === notificationId)
    if (notification) {
      notification.read = true
    }
  }

  function markAllNotificationsAsRead() {
    notifications.value.forEach(notification => {
      notification.read = true
    })
  }

  function removeNotification(notificationId) {
    const index = notifications.value.findIndex(n => n.id === notificationId)
    if (index > -1) {
      notifications.value.splice(index, 1)
    }
  }

  function clearNotifications() {
    notifications.value = []
  }

  function addError(error) {
    const errorObject = {
      id: Date.now() + Math.random(),
      timestamp: new Date(),
      message: error.message || 'Bilinmeyen hata',
      code: error.code || 'UNKNOWN',
      stack: error.stack,
      handled: false,
      ...error
    }

    errors.value.push(errorObject)
    lastError.value = errorObject

    // Add as notification
    addNotification({
      type: 'error',
      title: 'Hata',
      message: errorObject.message
    })
  }

  function clearErrors() {
    errors.value = []
    lastError.value = null
  }

  function removeError(errorId) {
    const index = errors.value.findIndex(e => e.id === errorId)
    if (index > -1) {
      errors.value.splice(index, 1)
    }
  }

  function updateSettings(newSettings) {
    settings.value = { ...settings.value, ...newSettings }
    localStorage.setItem('app_settings', JSON.stringify(settings.value))
  }

  function setTheme(newTheme) {
    theme.value = newTheme
    document.documentElement.setAttribute('data-theme', newTheme)
    localStorage.setItem('app_theme', newTheme)
  }

  function setLanguage(newLanguage) {
    language.value = newLanguage
    localStorage.setItem('app_language', newLanguage)
  }

  function updateWindowSize(size) {
    windowSize.value = size

    // Update device type based on window size
    if (size.width < 768) {
      deviceType.value = 'mobile'
    } else if (size.width < 1024) {
      deviceType.value = 'tablet'
    } else {
      deviceType.value = 'desktop'
    }
  }

  // WebSocket management
  function addWebSocket(key, socket) {
    websockets.value.set(key, socket)
  }

  function removeWebSocket(key) {
    const socket = websockets.value.get(key)
    if (socket) {
      socket.close()
      websockets.value.delete(key)
    }
  }

  function closeAllWebSockets() {
    websockets.value.forEach((socket, key) => {
      socket.close()
    })
    websockets.value.clear()
  }

  // Cache management
  function setCacheConfig(config) {
    cache.value = { ...cache.value, ...config }
  }

  // Initialize app state
  function initializeApp() {
    // Load from localStorage
    const savedSidebarState = localStorage.getItem('sidebar_collapsed')
    if (savedSidebarState !== null) {
      sidebarCollapsed.value = savedSidebarState === 'true'
    }

    const savedTheme = localStorage.getItem('app_theme')
    if (savedTheme) {
      setTheme(savedTheme)
    }

    const savedLanguage = localStorage.getItem('app_language')
    if (savedLanguage) {
      language.value = savedLanguage
    }

    const savedSettings = localStorage.getItem('app_settings')
    if (savedSettings) {
      try {
        settings.value = { ...settings.value, ...JSON.parse(savedSettings) }
      } catch (error) {
        console.warn('Failed to parse saved settings:', error)
      }
    }

    // Set up window resize listener
    const handleResize = () => {
      updateWindowSize({
        width: window.innerWidth,
        height: window.innerHeight
      })
    }

    window.addEventListener('resize', handleResize)
    handleResize() // Initial call

    // Set up error handling
    window.addEventListener('error', (event) => {
      addError({
        message: event.message,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        type: 'javascript'
      })
    })

    window.addEventListener('unhandledrejection', (event) => {
      addError({
        message: event.reason?.message || 'Unhandled promise rejection',
        type: 'promise',
        reason: event.reason
      })
    })
  }

  // Cleanup
  function cleanup() {
    closeAllWebSockets()
    clearNotifications()
    clearErrors()
  }

  return {
    // State
    sidebarCollapsed,
    loading,
    pageLoading,
    globalLoading,
    notifications,
    breadcrumbs,
    pageTitle,
    theme,
    language,
    deviceType,
    windowSize,
    settings,
    cache,
    websockets,
    errors,
    lastError,

    // Computed
    isMobile,
    isTablet,
    isDesktop,
    unreadNotifications,
    hasErrors,
    isLoading,

    // Actions
    toggleSidebar,
    setSidebarCollapsed,
    setLoading,
    setPageLoading,
    setGlobalLoading,
    setPageTitle,
    setBreadcrumbs,
    addNotification,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    removeNotification,
    clearNotifications,
    addError,
    clearErrors,
    removeError,
    updateSettings,
    setTheme,
    setLanguage,
    updateWindowSize,
    addWebSocket,
    removeWebSocket,
    closeAllWebSockets,
    setCacheConfig,
    initializeApp,
    cleanup
  }
})
