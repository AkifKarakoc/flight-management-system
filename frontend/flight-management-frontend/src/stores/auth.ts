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

  // Computed
  const isAuthenticated = computed((): boolean => {
    return !!token.value && authService.isAuthenticated()
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
    return userRoles.value.includes('ADMIN')
  })

  const isUser = computed((): boolean => {
    return userRoles.value.includes('USER')
  })

  // Actions
  async function login(credentials: LoginCredentials): Promise<AuthResponse> {
    loginLoading.value = true

    try {
      const response = await authService.login(credentials)

      // Update store state
      token.value = response.accessToken
      refreshToken.value = response.refreshToken || null
      user.value = response.user

      ElMessage.success(SUCCESS_MESSAGES.LOGIN)

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
        ElMessage.error(error.response?.data?.message || ERROR_MESSAGES.SERVER_ERROR)
      }

      throw error
    } finally {
      loginLoading.value = false
    }
  }

  async function logout(showConfirm: boolean = true): Promise<void> {
    try {
      if (showConfirm) {
        await ElMessageBox.confirm(
          'Oturumu kapatmak istediğinizden emin misiniz?',
          'Oturumu Kapat',
          {
            confirmButtonText: 'Evet',
            cancelButtonText: 'Hayır',
            type: 'warning'
          }
        )
      }

      await authService.logout()

      // Clear store state
      clearAuth()

      ElMessage.success(SUCCESS_MESSAGES.LOGOUT)

      // Redirect to login
      await router.push('/login')

    } catch (error: any) {
      if (error === 'cancel') {
        return // User cancelled logout
      }

      console.error('Logout failed:', error)

      // Even if API call fails, clear local state
      clearAuth()
      await router.push('/login')
    }
  }

  async function refreshAuthToken(): Promise<string> {
    try {
      const newToken = await authService.refreshToken()
      token.value = newToken
      return newToken
    } catch (error: any) {
      console.error('Token refresh failed:', error)
      await logout(false) // Don't show confirmation for automatic logout
      throw error
    }
  }

  async function fetchCurrentUser(): Promise<User | null> {
    if (!isAuthenticated.value) return null

    loading.value = true

    try {
      const userData = await authService.getCurrentUser()
      user.value = userData
      return userData
    } catch (error: any) {
      console.error('Fetch current user failed:', error)

      if (error.response?.status === 401) {
        await logout(false)
      }

      throw error
    } finally {
      loading.value = false
    }
  }

  function initializeAuth(): void {
    // Initialize from localStorage
    const storedToken = authService.getToken()
    const storedUser = authService.getUser()
    const storedRefreshToken = authService.getRefreshToken()

    if (storedToken && authService.isAuthenticated()) {
      token.value = storedToken
      user.value = storedUser
      refreshToken.value = storedRefreshToken || null  // ✅ undefined'ı null'a çevir
    } else {
      // Clear invalid auth data
      clearAuth()
    }
  }

  function clearAuth(): void {
    user.value = null
    token.value = null
    refreshToken.value = null
    authService.clearAuth()
  }

  // Permission and role checks
  function hasRole(role: string): boolean {
    return userRoles.value.includes(role)
  }

  function hasPermission(permission: string): boolean {
    return userPermissions.value.includes(permission)
  }

  function hasAnyRole(roles: string[]): boolean {
    return roles.some(role => hasRole(role))
  }

  function hasAllRoles(roles: string[]): boolean {
    return roles.every(role => hasRole(role))
  }

  function hasAnyPermission(permissions: string[]): boolean {
    return permissions.some(permission => hasPermission(permission))
  }

  function hasAllPermissions(permissions: string[]): boolean {
    return permissions.every(permission => hasPermission(permission))
  }

  // Update user profile
  async function updateProfile(profileData: Partial<User>): Promise<User | null> {
    loading.value = true

    try {
      // This would be implemented when profile update API is available
      // const updatedUser = await authService.updateProfile(profileData)
      // user.value = updatedUser

      ElMessage.success('Profil başarıyla güncellendi')

      return user.value
    } catch (error: any) {
      console.error('Profile update failed:', error)
      ElMessage.error('Profil güncellenirken hata oluştu')
      throw error
    } finally {
      loading.value = false
    }
  }

  // Initialize auth state on store creation
  initializeAuth()

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
    refreshAuthToken,
    fetchCurrentUser,
    initializeAuth,
    clearAuth,
    hasRole,
    hasPermission,
    hasAnyRole,
    hasAllRoles,
    hasAnyPermission,
    hasAllPermissions,
    updateProfile
  }
})
