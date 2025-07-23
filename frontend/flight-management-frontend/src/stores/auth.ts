import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import authService from '@/services/authService'
import router from '@/router/index.ts'
import { SUCCESS_MESSAGES, ERROR_MESSAGES } from '@/utils/constants'
import type {
  User,
  LoginCredentials,
  AuthResponse
} from '@/types/index'

export const useAuthStore = defineStore('auth', () => {
  // State
  const user = ref<User | null>(null)
  const token = ref<string | null>(null)
  const refreshToken = ref<string | null>(null)
  const loading = ref<boolean>(false)
  const loginLoading = ref<boolean>(false)
  const sessionTimeout = ref<NodeJS.Timeout | null>(null)

  // Computed
  const isAuthenticated = computed((): boolean => {
    // Token varsa ve geçerli süresi varsa authenticated
    const currentToken = token.value || authService.getToken()
    if (!currentToken) return false

    return authService.isAuthenticated()
  })

  const userInfo = computed((): User | null => {
    return user.value || authService.getUser()
  })

  const userRoles = computed((): string[] => {
    return userInfo.value?.roles || []
  })

  const userPermissions = computed((): string[] => {
    return userInfo.value?.permissions || []
  })

  const isAdmin = computed((): boolean => {
    return userRoles.value.includes('ADMIN') || userRoles.value.includes('ROLE_ADMIN')
  })

  const isUser = computed((): boolean => {
    return userRoles.value.includes('USER') || userRoles.value.includes('ROLE_USER')
  })

  // Session management methods
  function startSessionTimeout(): void {
    clearSessionTimeout()

    // Token'dan expiry time al
    const currentToken = token.value || authService.getToken()
    if (!currentToken) return

    try {
      const payload = authService.parseToken(currentToken)
      if (!payload) return

      const expiresIn = payload.exp * 1000 - Date.now() - (5 * 60 * 1000) // 5 dakika önceden uyar

      if (expiresIn > 0) {
        sessionTimeout.value = setTimeout(() => {
          ElMessageBox.confirm(
            'Oturumunuz yakında sona erecek. Devam etmek istiyor musunuz?',
            'Oturum Uyarısı',
            {
              confirmButtonText: 'Evet, devam et',
              cancelButtonText: 'Çıkış yap',
              type: 'warning',
              beforeClose: async (action, instance, done) => {
                if (action === 'confirm') {
                  try {
                    // Token yenileme işlemi
                    await refreshAuthToken()
                    done()
                  } catch (error) {
                    console.error('Token refresh failed:', error)
                    await logout()
                    done()
                  }
                } else {
                  await logout()
                  done()
                }
              }
            }
          ).catch(() => {
            // Cancel pressed or dismissed
            logout()
          })
        }, expiresIn)
      }
    } catch (error) {
      console.error('Error setting session timeout:', error)
    }
  }

  function clearSessionTimeout(): void {
    if (sessionTimeout.value) {
      clearTimeout(sessionTimeout.value)
      sessionTimeout.value = null
    }
  }

  // Enhanced logout with session cleanup
  async function logout(): Promise<void> {
    try {
      loading.value = true
      clearSessionTimeout()

      // API'ye logout isteği gönder
      await authService.logout()

      // Store state'i temizle
      token.value = null
      refreshToken.value = null
      user.value = null

      ElMessage.success('Güvenli bir şekilde çıkış yaptınız')

      // Login sayfasına yönlendir
      await router.push('/auth/login')
    } catch (error: any) {
      console.error('Logout error:', error)
      // Hata olsa bile state'i temizle
      token.value = null
      refreshToken.value = null
      user.value = null
      authService.clearAuth()
      await router.push('/auth/login')
    } finally {
      loading.value = false
    }
  }

  // Enhanced login with session management
  async function login(credentials: LoginCredentials): Promise<AuthResponse> {
    console.log('Auth store login called with:', credentials)

    if (!credentials) {
      throw new Error('Credentials are required')
    }

    loginLoading.value = true

    try {
      const response = await authService.login(credentials)
      console.log('Auth service response:', response)

      // Update store state
      token.value = response.accessToken || response.token
      refreshToken.value = response.refreshToken || null
      user.value = response.user

      // Session timeout başlat
      startSessionTimeout()

      ElMessage.success(SUCCESS_MESSAGES.LOGIN || 'Başarıyla giriş yaptınız')

      // Redirect to dashboard or intended route
      const redirectPath = router.currentRoute.value.query.redirect as string || '/dashboard'
      await router.push(redirectPath)

      return response
    } catch (error: any) {
      console.error('Login failed:', error)

      // Handle different error types
      if (error.response?.status === 401) {
        ElMessage.error('Kullanıcı adı veya şifre hatalı')
      } else if (error.response?.status === 423) {
        ElMessage.error('Hesabınız kilitlenmiş. Lütfen sistem yöneticisi ile iletişime geçin.')
      } else if (error.response?.status === 429) {
        ElMessage.error('Çok fazla giriş denemesi. Lütfen daha sonra tekrar deneyin.')
      } else {
        ElMessage.error(error.message || 'Giriş yapılamadı. Lütfen tekrar deneyin.')
      }

      throw error
    } finally {
      loginLoading.value = false
    }
  }

  // Token refresh method
  async function refreshAuthToken(): Promise<void> {
    try {
      const newToken = await authService.refreshToken()
      token.value = newToken
      // Yeni token ile session timeout'u yeniden başlat
      startSessionTimeout()
    } catch (error) {
      console.error('Token refresh failed:', error)
      await logout()
      throw error
    }
  }

  // Initialize authentication on app start
  async function initializeAuth(): Promise<void> {
    try {
      loading.value = true

      // localStorage'dan token al
      const storedToken = authService.getToken()
      const storedUser = authService.getUser()

      if (!storedToken) {
        console.log('No stored token found')
        return
      }

      // Token geçerli mi kontrol et
      if (!authService.isAuthenticated()) {
        console.log('Stored token is invalid or expired')
        authService.clearAuth()
        return
      }

      // Store state'i güncelle
      token.value = storedToken
      user.value = storedUser
      refreshToken.value = authService.getRefreshToken()

      // Session timeout başlat
      startSessionTimeout()

      console.log('Authentication initialized successfully')
    } catch (error) {
      console.error('Error initializing auth:', error)
      authService.clearAuth()
    } finally {
      loading.value = false
    }
  }

  // Force logout - session expired
  async function forceLogout(reason: string = 'Oturumunuz sona erdi'): Promise<void> {
    ElMessage.warning(reason)
    await logout()
  }

  // Check authentication status
  function checkAuthStatus(): boolean {
    if (!isAuthenticated.value) {
      forceLogout('Oturumunuz geçersiz. Lütfen tekrar giriş yapın.')
      return false
    }
    return true
  }

  // Utility methods
  function hasRole(role: string): boolean {
    return userRoles.value.includes(role)
  }

  function hasPermission(permission: string): boolean {
    return userPermissions.value.includes(permission)
  }

  // Clear all data on browser close
  function cleanup(): void {
    clearSessionTimeout()
  }

  return {
    // State
    user,
    token,
    refreshToken,
    loading,
    loginLoading,

    // Computed
    isAuthenticated,
    userInfo,
    userRoles,
    userPermissions,
    isAdmin,
    isUser,

    // Actions
    login,
    logout,
    forceLogout,
    initializeAuth,
    refreshAuthToken,
    checkAuthStatus,
    hasRole,
    hasPermission,
    cleanup,
    startSessionTimeout,
    clearSessionTimeout
  }
})
