import apiService from './api'
import { API_ENDPOINTS, API_BASE_URLS } from '@/utils/constants'
import type {
  LoginCredentials,
  AuthResponse,
  User
} from '@/types'

// JWT Payload Interface
interface JWTPayload {
  sub: string // username
  roles: string
  exp: number
  iat: number
}

// User Info Interface for getUserInfo method
interface UserInfo {
  isAuthenticated: boolean
  user: User | null
  token: string | null
}

// Enhanced AuthResponse interface with optional refresh token
interface EnhancedAuthResponse extends AuthResponse {
  accessToken: string
  refreshToken?: string
  user: User
}

// Refresh Token Request Interface
interface RefreshTokenRequest {
  refreshToken: string
}

// Storage Keys as constants for type safety
const STORAGE_KEYS = {
  TOKEN: 'auth_token',
  USER: 'auth_user',
  REFRESH_TOKEN: 'refresh_token'
} as const

  class AuthService {
  private readonly tokenKey: string
  private readonly userKey: string
  private readonly refreshTokenKey: string

  constructor() {
    this.tokenKey = STORAGE_KEYS.TOKEN
    this.userKey = STORAGE_KEYS.USER
    this.refreshTokenKey = STORAGE_KEYS.REFRESH_TOKEN
  }

  // Authentication API calls
  async login(credentials: LoginCredentials): Promise<EnhancedAuthResponse> {
    try {
      // Auth endpoints are on Reference Manager Service
      const response = await apiService.reference.post<EnhancedAuthResponse>(
        API_ENDPOINTS.AUTH.LOGIN,
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

  async logout(): Promise<void> {
    try {
      // Call logout endpoint if token exists
      const token = this.getToken()
      if (token) {
        await apiService.reference.post(API_ENDPOINTS.AUTH.LOGOUT)
      }
    } catch (error: any) {
      console.warn('Logout API call failed:', error.message)
    } finally {
      // Always clear local storage
      this.clearAuth()
    }
  }

  async refreshToken(): Promise<string> {
    try {
      const refreshToken = this.getRefreshToken()
      if (!refreshToken) {
    throw new Error('No refresh token available')
  }

  const requestData: RefreshTokenRequest = { refreshToken }
  const response = await apiService.reference.post<EnhancedAuthResponse>(
    API_ENDPOINTS.AUTH.REFRESH,
      requestData
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

  async getCurrentUser(): Promise<User | null> {
    try {
      const response = await apiService.reference.get<User>(API_ENDPOINTS.AUTH.PROFILE)

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
  setToken(token: string): void {
    if (token) {
      localStorage.setItem(this.tokenKey, token)
    }
  }

  getToken(): string | null {
    return localStorage.getItem(this.tokenKey)
  }

  setRefreshToken(refreshToken: string): void {
    if (refreshToken) {
      localStorage.setItem(this.refreshTokenKey, refreshToken)
    }
  }

  getRefreshToken(): string | null {
    return localStorage.getItem(this.refreshTokenKey)
  }

  // User management
  setUser(user: User): void {
    if (user) {
      localStorage.setItem(this.userKey, JSON.stringify(user))
    }
  }

  getUser(): User | null {
    try {
      const userStr = localStorage.getItem(this.userKey)
      return userStr ? JSON.parse(userStr) as User : null
    } catch (error) {
      console.error('Error parsing user data:', error)
      return null
    }
  }

  // Clear all auth data
  clearAuth(): void {
    localStorage.removeItem(this.tokenKey)
    localStorage.removeItem(this.refreshTokenKey)
    localStorage.removeItem(this.userKey)
  }

  // Auth state checks
  isAuthenticated(): boolean {
    const token = this.getToken()
    if (!token) return false

    try {
      // Simple JWT expiry check
      const payload = JSON.parse(atob(token.split('.')[1])) as JWTPayload
      const currentTime = Date.now() / 1000

      return payload.exp > currentTime
    } catch (error) {
      console.warn('Invalid token format:', error)
      return false
    }
  }

  hasRole(role: string): boolean {
    const user = this.getUser()
    return user?.role?.includes(role) || false
  }

  hasPermission(permission: string): boolean {
    const user = this.getUser()
    return user?.permissions?.includes(permission) || false
  }

  // Helper methods
  getAuthHeader(): string | null {
    const token = this.getToken()
    return token ? `Bearer ${token}` : null
  }

  getUserInfo(): UserInfo {
    return {
      isAuthenticated: this.isAuthenticated(),
      user: this.getUser(),
      token: this.getToken()
    }
  }

  // Token parsing utilities
  parseToken(token: string): JWTPayload | null {
    try {
      const base64Payload = token.split('.')[1]
      const payload = JSON.parse(atob(base64Payload))
      return payload as JWTPayload
    } catch (error) {
      console.error('Error parsing JWT token:', error)
      return null
    }
  }

  getTokenExpirationTime(): Date | null {
    const token = this.getToken()
    if (!token) return null

    const payload = this.parseToken(token)
    if (!payload) return null

    return new Date(payload.exp * 1000)
  }

  isTokenExpired(): boolean {
    const expirationTime = this.getTokenExpirationTime()
    if (!expirationTime) return true

    return expirationTime.getTime() <= Date.now()
  }

  getTokenRemainingTime(): number {
    const expirationTime = this.getTokenExpirationTime()
    if (!expirationTime) return 0

    const remainingTime = expirationTime.getTime() - Date.now()
    return Math.max(0, remainingTime)
  }

  // Role and permission utilities
  getRolesFromToken(): string[] {
    const token = this.getToken()
    if (!token) return []

    const payload = this.parseToken(token)
    if (!payload || !payload.roles) return []

    return payload.roles.split(',').map(role => role.trim())
  }

  hasAnyRole(roles: string[]): boolean {
    const userRoles = this.getRolesFromToken()
    return roles.some(role => userRoles.includes(role))
  }

  hasAllRoles(roles: string[]): boolean {
    const userRoles = this.getRolesFromToken()
    return roles.every(role => userRoles.includes(role))
  }

  hasAnyPermission(permissions: string[]): boolean {
    return permissions.some(permission => this.hasPermission(permission))
  }

  hasAllPermissions(permissions: string[]): boolean {
    return permissions.every(permission => this.hasPermission(permission))
  }

  // Token validation
  validateTokenStructure(token: string): boolean {
    try {
      const parts = token.split('.')
      if (parts.length !== 3) {
        return false
      }

      // Try to parse header and payload
      JSON.parse(atob(parts[0]))
      JSON.parse(atob(parts[1]))

      return true
    } catch {
      return false
    }
  }

  // Auto refresh token utility
  shouldRefreshToken(): boolean {
    const remainingTime = this.getTokenRemainingTime()
    const fiveMinutes = 5 * 60 * 1000 // 5 minutes in milliseconds

    return remainingTime > 0 && remainingTime < fiveMinutes
  }

  // Update user profile (if API supports it)
  async updateProfile(profileData: Partial<User>): Promise<User | null> {
    try {
      // This would be implemented when profile update API is available
      const response = await apiService.reference.put<User>(
        `${API_ENDPOINTS.AUTH.PROFILE}`,
          profileData
      )

      if (response.data) {
    this.setUser(response.data)
    return response.data
  }

  return null
} catch (error) {
    console.error('Update profile error:', error)
    throw error
  }
}

  // Reset password (if API supports it)
  async resetPassword(email: string): Promise<boolean> {
    try {
      await apiService.reference.post('/api/v1/auth/reset-password', { email })
      return true
    } catch (error) {
      console.error('Reset password error:', error)
      return false
    }
  }

  // Change password (if API supports it)
  async changePassword(currentPassword: string, newPassword: string): Promise<boolean> {
    try {
      await apiService.reference.post('/api/v1/auth/change-password', {
        currentPassword,
        newPassword
      })
      return true
    } catch (error) {
      console.error('Change password error:', error)
      return false
    }
  }
}

// Create singleton instance
export const authService = new AuthService()
export default authService

// Export types for external use
export type {
  JWTPayload,
    UserInfo,
    EnhancedAuthResponse,
    RefreshTokenRequest
}
