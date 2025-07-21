import api from './api'
import { API_ENDPOINTS, API_BASE_URLS } from '@/utils/constants'

class AuthService {
  constructor() {
    this.tokenKey = 'auth_token'
    this.userKey = 'auth_user'
    this.refreshTokenKey = 'refresh_token'
  }

  // Authentication API calls
  async login(credentials) {
    try {
      // Auth endpoints are on Reference Manager Service
      const response = await api.client.post(
        `${API_BASE_URLS.REFERENCE_MANAGER}${API_ENDPOINTS.AUTH.LOGIN}`,
        credentials
      )

      if (response.data?.accessToken) {
        this.setToken(response.data.accessToken)

        // Store refresh token if provided
        if (response.data.refreshToken) {
          this.setRefreshToken(response.data.refreshToken)
        }

        // Store user info if provided
        if (response.data.user) {
          this.setUser(response.data.user)
        }

        return response.data
      }

      throw new Error('Invalid response format')
    } catch (error) {
      console.error('Login error:', error)
      throw error
    }
  }

  async logout() {
    try {
      // Call logout endpoint if token exists
      const token = this.getToken()
      if (token) {
        await api.client.post(
          `${API_BASE_URLS.REFERENCE_MANAGER}${API_ENDPOINTS.AUTH.LOGOUT}`
        )
      }
    } catch (error) {
      console.warn('Logout API call failed:', error.message)
    } finally {
      // Always clear local storage
      this.clearAuth()
    }
  }

  async refreshToken() {
    try {
      const refreshToken = this.getRefreshToken()
      if (!refreshToken) {
        throw new Error('No refresh token available')
      }

      const response = await api.client.post(
        `${API_BASE_URLS.REFERENCE_MANAGER}${API_ENDPOINTS.AUTH.REFRESH}`,
        { refreshToken }
      )

      if (response.data?.accessToken) {
        this.setToken(response.data.accessToken)

        if (response.data.refreshToken) {
          this.setRefreshToken(response.data.refreshToken)
        }

        return response.data.accessToken
      }

      throw new Error('Invalid refresh response')
    } catch (error) {
      this.clearAuth()
      throw error
    }
  }

  async getCurrentUser() {
    try {
      const response = await api.get(
        `${API_BASE_URLS.REFERENCE_MANAGER}${API_ENDPOINTS.AUTH.PROFILE}`
      )

      if (response.data) {
        this.setUser(response.data)
        return response.data
      }

      return null
    } catch (error) {
      console.error('Get current user error:', error)
      return null
    }
  }

  // Token management
  setToken(token) {
    if (token) {
      localStorage.setItem(this.tokenKey, token)
    }
  }

  getToken() {
    return localStorage.getItem(this.tokenKey)
  }

  setRefreshToken(refreshToken) {
    if (refreshToken) {
      localStorage.setItem(this.refreshTokenKey, refreshToken)
    }
  }

  getRefreshToken() {
    return localStorage.getItem(this.refreshTokenKey)
  }

  // User management
  setUser(user) {
    if (user) {
      localStorage.setItem(this.userKey, JSON.stringify(user))
    }
  }

  getUser() {
    try {
      const userStr = localStorage.getItem(this.userKey)
      return userStr ? JSON.parse(userStr) : null
    } catch (error) {
      console.error('Error parsing user data:', error)
      return null
    }
  }

  // Clear all auth data
  clearAuth() {
    localStorage.removeItem(this.tokenKey)
    localStorage.removeItem(this.refreshTokenKey)
    localStorage.removeItem(this.userKey)
  }

  // Auth state checks
  isAuthenticated() {
    const token = this.getToken()
    if (!token) return false

    try {
      // Simple JWT expiry check (optional)
      const payload = JSON.parse(atob(token.split('.')[1]))
      const currentTime = Date.now() / 1000

      return payload.exp > currentTime
    } catch (error) {
      console.warn('Invalid token format:', error)
      return false
    }
  }

  hasRole(role) {
    const user = this.getUser()
    return user?.roles?.includes(role) || false
  }

  hasPermission(permission) {
    const user = this.getUser()
    return user?.permissions?.includes(permission) || false
  }

  // Helper methods
  getAuthHeader() {
    const token = this.getToken()
    return token ? `Bearer ${token}` : null
  }

  getUserInfo() {
    return {
      isAuthenticated: this.isAuthenticated(),
      user: this.getUser(),
      token: this.getToken()
    }
  }
}

// Create singleton instance
export const authService = new AuthService()
export default authService
