import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { ElMessage } from 'element-plus'

interface AppTheme {
  mode: 'light' | 'dark'
  primaryColor: string
}

interface AppSettings {
  language: 'tr' | 'en'
  timezone: string
  dateFormat: string
  autoSave: boolean
  notifications: boolean
}

interface SystemStatus {
  services: Record<string, 'UP' | 'DOWN' | 'UNKNOWN'>
  lastCheck: Date | null
  isHealthy: boolean
}

export const useAppStore = defineStore('app', () => {
  // State
  const loading = ref(false)
  const sidebarCollapsed = ref(false)
  const theme = ref<AppTheme>({
    mode: 'light',
    primaryColor: '#409EFF'
  })

  const settings = ref<AppSettings>({
    language: 'tr',
    timezone: 'Europe/Istanbul',
    dateFormat: 'DD/MM/YYYY',
    autoSave: true,
    notifications: true
  })

  const systemStatus = ref<SystemStatus>({
    services: {
      'reference-manager': 'UNKNOWN',
      'flight-service': 'UNKNOWN',
      'archive-manager': 'UNKNOWN',
      'kafka': 'UNKNOWN',
      'redis': 'UNKNOWN'
    },
    lastCheck: null,
    isHealthy: false
  })

  const notifications = ref<any[]>([])
  const breadcrumbs = ref<any[]>([])

  // Computed
  const isDarkMode = computed(() => theme.value.mode === 'dark')

  const healthyServices = computed(() => {
    return Object.values(systemStatus.value.services).filter(status => status === 'UP').length
  })

  const totalServices = computed(() => {
    return Object.keys(systemStatus.value.services).length
  })

  const systemHealthPercentage = computed(() => {
    return Math.round((healthyServices.value / totalServices.value) * 100)
  })

  // Actions
  function toggleSidebar() {
    sidebarCollapsed.value = !sidebarCollapsed.value
    saveSidebarState()
  }

  function setSidebarCollapsed(collapsed: boolean) {
    sidebarCollapsed.value = collapsed
    saveSidebarState()
  }

  function saveSidebarState() {
    try {
      localStorage.setItem('app_sidebar_collapsed', JSON.stringify(sidebarCollapsed.value))
    } catch (error) {
      console.error('Error saving sidebar state:', error)
    }
  }

  function loadSidebarState() {
    try {
      const saved = localStorage.getItem('app_sidebar_collapsed')
      if (saved !== null) {
        sidebarCollapsed.value = JSON.parse(saved)
      }
    } catch (error) {
      console.error('Error loading sidebar state:', error)
      sidebarCollapsed.value = false
    }
  }

  function toggleTheme() {
    theme.value.mode = theme.value.mode === 'light' ? 'dark' : 'light'
    applyTheme()
    saveTheme()
  }

  function setTheme(mode: 'light' | 'dark') {
    theme.value.mode = mode
    applyTheme()
    saveTheme()
  }

  function applyTheme() {
    const html = document.documentElement

    if (theme.value.mode === 'dark') {
      html.classList.add('dark')
    } else {
      html.classList.remove('dark')
    }

    // Apply primary color
    html.style.setProperty('--el-color-primary', theme.value.primaryColor)
  }

  function saveTheme() {
    try {
      localStorage.setItem('app_theme', JSON.stringify(theme.value))
    } catch (error) {
      console.error('Error saving theme:', error)
    }
  }

  function loadTheme() {
    try {
      const saved = localStorage.getItem('app_theme')
      if (saved) {
        theme.value = { ...theme.value, ...JSON.parse(saved) }
      }
    } catch (error) {
      console.error('Error loading theme:', error)
    }
    applyTheme()
  }

  function updateSettings(newSettings: Partial<AppSettings>) {
    settings.value = { ...settings.value, ...newSettings }
    saveSettings()
  }

  function saveSettings() {
    try {
      localStorage.setItem('app_settings', JSON.stringify(settings.value))
    } catch (error) {
      console.error('Error saving settings:', error)
    }
  }

  function loadSettings() {
    try {
      const saved = localStorage.getItem('app_settings')
      if (saved) {
        settings.value = { ...settings.value, ...JSON.parse(saved) }
      }
    } catch (error) {
      console.error('Error loading settings:', error)
    }
  }

  async function checkSystemStatus() {
    try {
      loading.value = true

      // Mock API calls - replace with actual service health checks
      const serviceChecks = {
        'reference-manager': checkService('http://localhost:8081/actuator/health'),
        'flight-service': checkService('http://localhost:8082/actuator/health'),
        'archive-manager': checkService('http://localhost:8083/actuator/health'),
        'kafka': checkKafkaStatus(),
        'redis': checkRedisStatus()
      }

      // Wait for all service checks
      const results = await Promise.allSettled(Object.entries(serviceChecks).map(
        async ([service, promise]) => {
          try {
            const status = await promise
            return { service, status: status ? 'UP' : 'DOWN' }
          } catch {
            return { service, status: 'DOWN' }
          }
        }
      ))

      // Update system status
      results.forEach(result => {
        if (result.status === 'fulfilled') {
          systemStatus.value.services[result.value.service] = result.value.status as 'UP' | 'DOWN'
        }
      })

      systemStatus.value.lastCheck = new Date()
      systemStatus.value.isHealthy = healthyServices.value >= totalServices.value * 0.8 // 80% healthy threshold

      console.log('System status updated:', systemStatus.value)

    } catch (error) {
      console.error('Error checking system status:', error)
      ElMessage.error('Sistem durumu kontrol edilirken hata oluştu')
    } finally {
      loading.value = false
    }
  }

  // Mock service check functions
  async function checkService(url: string): Promise<boolean> {
    try {
      // In real implementation, make actual HTTP calls
      // const response = await fetch(`${url}`, { method: 'GET', timeout: 5000 })
      // return response.ok

      // Mock random responses for demo
      return Math.random() > 0.2 // 80% success rate
    } catch {
      return false
    }
  }

  async function checkKafkaStatus(): Promise<boolean> {
    try {
      // Mock Kafka check - replace with actual implementation
      return Math.random() > 0.5 // 50% success rate for demo
    } catch {
      return false
    }
  }

  async function checkRedisStatus(): Promise<boolean> {
    try {
      // Mock Redis check - replace with actual implementation
      return Math.random() > 0.1 // 90% success rate for demo
    } catch {
      return false
    }
  }

  function addNotification(notification: {
    type: 'success' | 'warning' | 'error' | 'info'
    title: string
    message: string
    duration?: number
  }) {
    const id = Date.now()
    const newNotification = {
      id,
      ...notification,
      createdAt: new Date(),
      read: false
    }

    notifications.value.unshift(newNotification)

    // Auto-remove after duration
    if (notification.duration !== 0) {
      setTimeout(() => {
        removeNotification(id)
      }, notification.duration || 5000)
    }

    return id
  }

  function removeNotification(id: number) {
    const index = notifications.value.findIndex(n => n.id === id)
    if (index > -1) {
      notifications.value.splice(index, 1)
    }
  }

  function markNotificationAsRead(id: number) {
    const notification = notifications.value.find(n => n.id === id)
    if (notification) {
      notification.read = true
    }
  }

  function clearAllNotifications() {
    notifications.value = []
  }

  function setBreadcrumbs(items: any[]) {
    breadcrumbs.value = items
  }

  function addBreadcrumb(item: any) {
    breadcrumbs.value.push(item)
  }

  function clearBreadcrumbs() {
    breadcrumbs.value = []
  }

  async function initializeApp() {
    try {
      console.log('🚀 Initializing app store...')

      // Load saved preferences
      loadSidebarState()
      loadTheme()
      loadSettings()

      // Check system status
      await checkSystemStatus()

      // Set up periodic health checks
      setInterval(checkSystemStatus, 30000) // Every 30 seconds

      console.log('✅ App store initialized successfully')

    } catch (error) {
      console.error('❌ Error initializing app store:', error)
      throw error
    }
  }

  function cleanup() {
    // Save current state
    saveSidebarState()
    saveTheme()
    saveSettings()

    console.log('🧹 App store cleanup completed')
  }

  // Utility functions
  function formatFileSize(bytes: number): string {
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    if (bytes === 0) return '0 Bytes'
    const i = Math.floor(Math.log(bytes) / Math.log(1024))
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i]
  }

  function debounce<T extends (...args: any[]) => any>(
    func: T,
    wait: number
  ): (...args: Parameters<T>) => void {
    let timeout: NodeJS.Timeout
    return (...args: Parameters<T>) => {
      clearTimeout(timeout)
      timeout = setTimeout(() => func(...args), wait)
    }
  }

  return {
    // State
    loading,
    sidebarCollapsed,
    theme,
    settings,
    systemStatus,
    notifications,
    breadcrumbs,

    // Computed
    isDarkMode,
    healthyServices,
    totalServices,
    systemHealthPercentage,

    // Actions
    toggleSidebar,
    setSidebarCollapsed,
    toggleTheme,
    setTheme,
    updateSettings,
    checkSystemStatus,
    addNotification,
    removeNotification,
    markNotificationAsRead,
    clearAllNotifications,
    setBreadcrumbs,
    addBreadcrumb,
    clearBreadcrumbs,
    initializeApp,
    cleanup,

    // Utilities
    formatFileSize,
    debounce
  }
})
