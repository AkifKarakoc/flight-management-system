import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import authService from '@/services/authService'
import { USER_ROLES } from '@/utils/constants'

export const useAuthStore = defineStore('auth', () => {
  // State
  const isAuthenticated = ref(false)
  const user = ref(null)
  const token = ref(null)
  const loading = ref(false)
  const initialized = ref(false)

  // Getters
  const isAdmin = computed(() => {
    // Spring Security genellikle 'ROLE_' önekini ekler.
    // Backend'den gelen roleler 'ROLE_ADMIN' formatında olabilir.
    const hasAdminRole =
      user.value?.roles?.includes(USER_ROLES.ADMIN) ||
      user.value?.roles?.includes('ROLE_ADMIN') ||
      false
    console.log('User roles:', user.value?.roles, 'Is admin:', hasAdminRole)
    return hasAdminRole
  })

  const isUser = computed(() => {
    return user.value?.roles?.includes(USER_ROLES.USER) ||
      user.value?.roles?.includes('ROLE_USER') ||
      false
  })

  const userRoles = computed(() => {
    return user.value?.roles || []
  })

  const userName = computed(() => {
    return user.value?.username || ''
  })

  // Actions
  const login = async (credentials) => {
    loading.value = true

    try {
      console.log('Attempting login with:', credentials.username) // Debug log

      const response = await authService.login(credentials)

      console.log('Login successful, response:', response) // Debug log

      // Store state'i güncelle
      token.value = response.token
      user.value = response.user
      isAuthenticated.value = true
      initialized.value = true

      console.log('Auth store updated:', {
        isAuthenticated: isAuthenticated.value,
        user: user.value,
        hasToken: !!token.value
      }) // Debug log

      return response
    } catch (error) {
      console.error('Login failed:', error) // Debug log
      // Error handling API service'de yapılıyor
      throw error
    } finally {
      loading.value = false
    }
  }

  const logout = async () => {
    loading.value = true

    try {
      await authService.logout()

      // Store state'i temizle
      token.value = null
      user.value = null
      isAuthenticated.value = false
      initialized.value = true
    } catch (error) {
      console.error('Logout error:', error)
    } finally {
      loading.value = false
    }
  }

  const checkAuth = () => {
    try {
      console.log('Checking authentication...') // Debug log

      // Önce geçersiz token'ları temizle
      authService.clearInvalidTokens()

      // Sayfa yenilendiğinde veya uygulama başlarken çalışır
      const isAuth = authService.isAuthenticated()

      console.log('Auth check result:', isAuth) // Debug log

      if (isAuth) {
        token.value = authService.getToken()
        user.value = authService.getCurrentUser()
        isAuthenticated.value = true

        console.log('Auth restored from localStorage:', {
          hasToken: !!token.value,
          user: user.value
        }) // Debug log
      } else {
        // Token geçersizse temizle
        token.value = null
        user.value = null
        isAuthenticated.value = false

        console.log('No valid auth found, clearing state') // Debug log
      }

      initialized.value = true
      return isAuth
    } catch (error) {
      console.error('Auth check error:', error)
      // Hata durumunda state'i temizle
      token.value = null
      user.value = null
      isAuthenticated.value = false
      initialized.value = true
      return false
    }
  }

  const hasRole = (role) => {
    return authService.hasRole(role)
  }

  const hasPermission = (permission) => {
    // Gelecekte daha detaylı permission sistemi için
    // Şu an sadece role tabanlı
    switch (permission) {
      case 'flight:create':
      case 'flight:update':
      case 'flight:delete':
      case 'airline:create':
      case 'airline:update':
      case 'airline:delete':
      case 'airport:create':
      case 'airport:update':
      case 'airport:delete':
        return isAdmin.value
      case 'flight:read':
      case 'airline:read':
      case 'airport:read':
        return isAuthenticated.value
      default:
        return false
    }
  }

  const validateToken = async () => {
    try {
      const response = await authService.validateToken()
      if (response.valid) {
        token.value = response.token
        user.value = response.user
        isAuthenticated.value = true
        return true
      } else {
        // Token geçersiz, temizle
        token.value = null
        user.value = null
        isAuthenticated.value = false
        return false
      }
    } catch (error) {
      // Token geçersiz, temizle
      token.value = null
      user.value = null
      isAuthenticated.value = false
      return false
    }
  }

  // Initialize auth state when store is created
  const initialize = () => {
    if (!initialized.value) {
      checkAuth()
    }
  }

  return {
    // State
    isAuthenticated,
    user,
    token,
    loading,
    initialized,

    // Getters
    isAdmin,
    isUser,
    userRoles,
    userName,

    // Actions
    login,
    logout,
    checkAuth,
    hasRole,
    hasPermission,
    validateToken,
    initialize
  }
})
