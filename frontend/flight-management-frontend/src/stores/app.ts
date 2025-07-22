import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

// Types
interface Notification {
  id: number
  type: 'success' | 'warning' | 'error' | 'info'
  title: string
  message: string
  timestamp: Date
  read: boolean
  persistent?: boolean
  actions?: Array<{
    label: string
    action: string
    type?: 'primary' | 'success' | 'warning' | 'danger'
  }>
}

interface Breadcrumb {
  title: string
  path?: string
  icon?: string
}

interface AppError {
  id: number
  timestamp: Date
  message: string
  code: string
  stack?: string
  handled: boolean
  type?: 'javascript' | 'promise' | 'api' | 'network'
  filename?: string
  lineno?: number
  colno?: number
  reason?: any
}

interface WindowSize {
  width: number
  height: number
}

interface AppSettings {
  showBreadcrumb: boolean
  showPageHeader: boolean
  showFooter: boolean
  animationEnabled: boolean
  autoSaveEnabled: boolean
  compactMode: boolean
  tablePageSize: number
  dateFormat: string
  timeFormat: string
}

interface CacheConfig {
  enabled: boolean
  ttl: number
  maxSize: number
}

type DeviceType = 'mobile' | 'tablet' | 'desktop'
type ThemeType = 'light' | 'dark' | 'auto'
type LanguageType = 'tr' | 'en'

export const useAppStore = defineStore('app', () => {
  // State
  const sidebarCollapsed = ref<boolean>(false)
  const loading = ref<boolean>(false)
  const pageLoading = ref<boolean>(false)
  const globalLoading = ref<boolean>(false)
  const notifications = ref<Notification[]>([])
  const breadcrumbs = ref<Breadcrumb[]>([])
  const pageTitle = ref<string>('')
  const theme = ref<ThemeType>('light')
  const language = ref<LanguageType>('tr')
  const deviceType = ref<DeviceType>('desktop')
  const windowSize = ref<WindowSize>({
    width: typeof window !== 'undefined' ? window.innerWidth : 1024,
    height: typeof window !== 'undefined' ? window.innerHeight : 768
  })
  let resizeHandler: (() => void) | null = null

  // UI Settings
  const settings = ref<AppSettings>({
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
  const cache = ref<CacheConfig>({
    enabled: true,
    ttl: 5 * 60 * 1000, // 5 minutes
    maxSize: 100
  })

  // WebSocket connections
  const websockets = ref<Map<string, WebSocket>>(new Map())

  // Error state
  const errors = ref<AppError[]>([])
  const lastError = ref<AppError | null>(null)

  // Computed
  const isMobile = computed<boolean>(() => {
    return deviceType.value === 'mobile' || windowSize.value.width < 768
  })

  const isTablet = computed<boolean>(() => {
    return deviceType.value === 'tablet' || (windowSize.value.width >= 768 && windowSize.value.width < 1024)
  })

  const isDesktop = computed<boolean>(() => {
    return deviceType.value === 'desktop' || windowSize.value.width >= 1024
  })

  const unreadNotifications = computed<number>(() => {
    return notifications.value.filter(n => !n.read).length
  })

  const hasErrors = computed<boolean>(() => {
    return errors.value.length > 0
  })

  const isLoading = computed<boolean>(() => {
    return loading.value || pageLoading.value || globalLoading.value
  })

  // Actions
  function toggleSidebar(): void {
    sidebarCollapsed.value = !sidebarCollapsed.value
    // Save to localStorage
    if (typeof window !== 'undefined') {
      localStorage.setItem('sidebar_collapsed', sidebarCollapsed.value.toString())
    }
  }

  function setSidebarCollapsed(collapsed: boolean): void {
    sidebarCollapsed.value = collapsed
    if (typeof window !== 'undefined') {
      localStorage.setItem('sidebar_collapsed', collapsed.toString())
    }
  }

  function setLoading(isLoading: boolean): void {
    loading.value = isLoading
  }

  function setPageLoading(isLoading: boolean): void {
    pageLoading.value = isLoading
  }

  function setGlobalLoading(isLoading: boolean): void {
    globalLoading.value = isLoading
  }

  function setPageTitle(title: string): void {
    pageTitle.value = title
    if (typeof document !== 'undefined') {
      document.title = title ? `${title} - Flight Management` : 'Flight Management'
    }
  }

  function setBreadcrumbs(breadcrumbItems: Breadcrumb[]): void {
    breadcrumbs.value = breadcrumbItems
  }

  function addNotification(notification: Omit<Notification, 'id' | 'timestamp' | 'read'>): void {
    const newNotification: Notification = {
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

  function markNotificationAsRead(notificationId: number): void {
    const notification = notifications.value.find(n => n.id === notificationId)
    if (notification) {
      notification.read = true
    }
  }

  function markAllNotificationsAsRead(): void {
    notifications.value.forEach(notification => {
      notification.read = true
    })
  }

  function removeNotification(notificationId: number): void {
    const index = notifications.value.findIndex(n => n.id === notificationId)
    if (index > -1) {
      notifications.value.splice(index, 1)
    }
  }

  function clearNotifications(): void {
    notifications.value = []
  }

  function addError(error: Partial<AppError> & { message: string }): void {
    const errorObject: AppError = {
      id: Date.now() + Math.random(),
      timestamp: new Date(),
      handled: false,
      code: 'UNKNOWN',
      ...error, // Önce error'dan gelen değerleri al
      // Sonra gerekli default'ları override et
      message: error.message || 'Bilinmeyen hata'
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

  function clearErrors(): void {
    errors.value = []
    lastError.value = null
  }

  function removeError(errorId: number): void {
    const index = errors.value.findIndex(e => e.id === errorId)
    if (index > -1) {
      errors.value.splice(index, 1)
    }
  }

  function updateSettings(newSettings: Partial<AppSettings>): void {
    settings.value = { ...settings.value, ...newSettings }
    if (typeof window !== 'undefined') {
      localStorage.setItem('app_settings', JSON.stringify(settings.value))
    }
  }

  function setTheme(newTheme: ThemeType): void {
    theme.value = newTheme
    if (typeof document !== 'undefined') {
      document.documentElement.setAttribute('data-theme', newTheme)
    }
    if (typeof window !== 'undefined') {
      localStorage.setItem('app_theme', newTheme)
    }
  }

  function setLanguage(newLanguage: LanguageType): void {
    language.value = newLanguage
    if (typeof window !== 'undefined') {
      localStorage.setItem('app_language', newLanguage)
    }
  }

  function updateWindowSize(size: WindowSize): void {
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
  function addWebSocket(key: string, socket: WebSocket): void {
    websockets.value.set(key, socket)
  }

  function removeWebSocket(key: string): void {
    const socket = websockets.value.get(key)
    if (socket) {
      socket.close()
      websockets.value.delete(key)
    }
  }

  function closeAllWebSockets(): void {
    websockets.value.forEach((socket, key) => {
      socket.close()
    })
    websockets.value.clear()
  }

  // Cache management
  function setCacheConfig(config: Partial<CacheConfig>): void {
    cache.value = { ...cache.value, ...config }
  }

  // Initialize app state
  function initializeApp(): void {
    if (typeof window === 'undefined') return

    // Load from localStorage
    const savedSidebarState = localStorage.getItem('sidebar_collapsed')
    if (savedSidebarState !== null) {
      sidebarCollapsed.value = savedSidebarState === 'true'
    }

    const savedTheme = localStorage.getItem('app_theme') as ThemeType
    if (savedTheme) {
      setTheme(savedTheme)
    }

    const savedLanguage = localStorage.getItem('app_language') as LanguageType
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
    const handleResize = (): void => {
      updateWindowSize({
        width: window.innerWidth,
        height: window.innerHeight
      })
    }

    window.addEventListener('resize', handleResize)
    handleResize() // Initial call

    // Set up error handling
    window.addEventListener('error', (event: ErrorEvent) => {
      addError({
        message: event.message,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        type: 'javascript'
      })
    })

    window.addEventListener('unhandledrejection', (event: PromiseRejectionEvent) => {
      addError({
        message: event.reason?.message || 'Unhandled promise rejection',
        type: 'promise',
        reason: event.reason
      })
    })
  }

  // Advanced state management
  function resetToDefaults(): void {
    sidebarCollapsed.value = false
    theme.value = 'light'
    language.value = 'tr'
    settings.value = {
      showBreadcrumb: true,
      showPageHeader: true,
      showFooter: true,
      animationEnabled: true,
      autoSaveEnabled: true,
      compactMode: false,
      tablePageSize: 20,
      dateFormat: 'DD.MM.YYYY',
      timeFormat: 'HH:mm'
    }

    if (typeof window !== 'undefined') {
      localStorage.removeItem('sidebar_collapsed')
      localStorage.removeItem('app_theme')
      localStorage.removeItem('app_language')
      localStorage.removeItem('app_settings')
    }
  }

  function exportSettings(): string {
    return JSON.stringify({
      sidebarCollapsed: sidebarCollapsed.value,
      theme: theme.value,
      language: language.value,
      settings: settings.value
    }, null, 2)
  }

  function importSettings(settingsJson: string): void {
    try {
      const imported = JSON.parse(settingsJson)

      if (typeof imported.sidebarCollapsed === 'boolean') {
        setSidebarCollapsed(imported.sidebarCollapsed)
      }

      if (imported.theme) {
        setTheme(imported.theme)
      }

      if (imported.language) {
        setLanguage(imported.language)
      }

      if (imported.settings) {
        updateSettings(imported.settings)
      }
    } catch (error) {
      addError({
        message: 'Settings import failed: Invalid JSON format',
        code: 'IMPORT_ERROR',
        type: 'api'
      })
    }
  }

  // Performance monitoring
  function trackPerformance(metricName: string, value: number, unit: 'ms' | 'kb' | 'count' = 'ms'): void {
    if (typeof window !== 'undefined' && 'performance' in window) {
      // This could be extended to send metrics to a monitoring service
      console.log(`Performance Metric - ${metricName}: ${value}${unit}`)
    }
  }

  // Cleanup
  function cleanup(): void {
    closeAllWebSockets()
    clearNotifications()
    clearErrors()

    if (typeof window !== 'undefined' && resizeHandler) {
      window.removeEventListener('resize', resizeHandler)
      resizeHandler = null
    }
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
    resetToDefaults,
    exportSettings,
    importSettings,
    trackPerformance,
    cleanup
  }
})

// Export types for external use
export type {
  Notification,
    Breadcrumb,
    AppError,
    WindowSize,
    AppSettings,
    CacheConfig,
    DeviceType,
    ThemeType,
    LanguageType
}
