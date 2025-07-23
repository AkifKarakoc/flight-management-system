import apiService from './api'
import { API_ENDPOINTS } from '@/utils/constants'
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
  REFRESH_TOKEN: 'refresh_token',
  LOGIN_TIME: 'login_time',
  LAST_ACTIVITY: 'last_activity'
} as const

class AuthService {
  private readonly tokenKey: string
  private readonly userKey: string
  private readonly refreshTokenKey: string
  private readonly loginTimeKey: string
  private readonly lastActivityKey: string
  private readonly maxSessionTime: number = 8 * 60 * 60 * 1000 // 8 saat
  private readonly tokenRefreshThreshold: number = 5 * 60 * 1000 // 5 dakika

  constructor() {
    this.tokenKey = STORAGE_KEYS.TOKEN
    this.userKey = STORAGE_KEYS.USER
    this.refreshTokenKey = STORAGE_KEYS.REFRESH_TOKEN
    this.loginTimeKey = STORAGE_KEYS.LOGIN_TIME
    this.lastActivityKey = STORAGE_KEYS.LAST_ACTIVITY
  }

  // Enhanced login with session tracking
  async login(credentials: LoginCredentials): Promise<EnhancedAuthResponse> {
    console.log('AuthService login called with:', credentials)

    if (!credentials || !credentials.username || !credentials.password) {
      throw new Error('Username and password are required')
    }

    try {
      const response = await apiService.reference.post<any>(
        API_ENDPOINTS.AUTH.LOGIN,
        credentials
      )

      console.log('Backend response:', response.data)

      if (response.data?.accessToken) {
        const token = response.data.accessToken

        // Store token and session info
        this.setToken(token)
        this.setLoginTime()
        this.updateLastActivity()

        // Parse user from token or use provided user
        let user: User
        if (response.data.user) {
          user = response.data.user
        } else {
          const payload = this.parseToken(token)
          if (payload) {
            user = {
              id: payload.sub,
              username: payload.sub,
              email: `${payload.sub}@flightmanagement.com`,
              role: payload.roles || 'USER',
              roles: payload.roles ? [payload.roles] : ['USER'],
              permissions: [],
              isActive: true
            }
          } else {
            throw new Error('Invalid token format')
          }
        }

        // Store refresh token if provided
        if (response.data.refreshToken) {
          this.setRefreshToken(response.data.refreshToken)
        }

        // Store user info
        this.setUser(user)

        return {
          token: "",
          accessToken: token,
          refreshToken: response.data.refreshToken,
          tokenType: response.data.tokenType || 'Bearer',
          expiresIn: response.data.expiresIn || 86400,
          user: user
        }
      }

      throw new Error('Invalid response format')
    } catch (error) {
      console.error('Login error:', error)
      throw error
    }
  }

  // Enhanced logout with cleanup
  async logout(): Promise<void> {
    try {
      const token = this.getToken()
      if (token) {
        await apiService.reference.post(API_ENDPOINTS.AUTH.LOGOUT)
      }
    } catch (error: any) {
      console.warn('Logout API call failed:', error.message)
    } finally {
      this.clearAuth()

      // Multiple tab sync - diğer tab'lere logout signal gönder
      localStorage.setItem('auth_force_logout', Date.now().toString())
      setTimeout(() => {
        localStorage.removeItem('auth_force_logout')
      }, 1000)
    }
  }

  // Enhanced token refresh
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
        this.updateLastActivity()

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

  // Token management with enhanced security
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

  // Session time tracking
  setLoginTime(): void {
    localStorage.setItem(this.loginTimeKey, Date.now().toString())
  }

  getLoginTime(): number | null {
    const loginTime = localStorage.getItem(this.loginTimeKey)
    return loginTime ? parseInt(loginTime) : null
  }

  updateLastActivity(): void {
    localStorage.setItem(this.lastActivityKey, Date.now().toString())
  }

  getLastActivity(): number | null {
    const lastActivity = localStorage.getItem(this.lastActivityKey)
    return lastActivity ? parseInt(lastActivity) : null
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

  // Enhanced clear auth with session data
  clearAuth(): void {
    localStorage.removeItem(this.tokenKey)
    localStorage.removeItem(this.refreshTokenKey)
    localStorage.removeItem(this.userKey)
    localStorage.removeItem(this.loginTimeKey)
    localStorage.removeItem(this.lastActivityKey)
  }

  // Enhanced authentication check
  isAuthenticated(): boolean {
    const token = this.getToken()
    if (!token) return false

    try {
      // Token format kontrolü
      const payload = this.parseToken(token)
      if (!payload) return false

      const currentTime = Date.now() / 1000

      // Token expired kontrolü
      if (payload.exp <= currentTime) {
        console.log('Token expired')
        this.clearAuth()
        return false
      }

      // Session time kontrolü
      const loginTime = this.getLoginTime()
      if (loginTime && (Date.now() - loginTime) > this.maxSessionTime) {
        console.log('Session exceeded maximum time')
        this.clearAuth()
        return false
      }

      // Last activity kontrolü (opsiyonel)
      const lastActivity = this.getLastActivity()
      if (lastActivity && (Date.now() - lastActivity) > (30 * 60 * 1000)) { // 30 dakika
        console.log('Session inactive too long')
        this.clearAuth()
        return false
      }

      // Activity güncelle
      this.updateLastActivity()

      return true
    } catch (error) {
      console.warn('Invalid token format:', error)
      this.clearAuth()
      return false
    }
  }

  // Token expiry check
  isTokenExpiringSoon(): boolean {
    const token = this.getToken()
    if (!token) return false

    try {
      const payload = this.parseToken(token)
      if (!payload) return false

      const currentTime = Date.now() / 1000
      const timeToExpiry = (payload.exp - currentTime) * 1000

      return timeToExpiry <= this.tokenRefreshThreshold
    } catch (error) {
      return false
    }
  }

  // Current user with session validation
  async getCurrentUser(): Promise<User | null> {
    try {
      if (!this.isAuthenticated()) {
        return null
      }

      const response = await apiService.reference.get<User>(API_ENDPOINTS.AUTH.PROFILE)

      if (response.data) {
        this.setUser(response.data)
        this.updateLastActivity()
        return response.data
      }

      return null
    } catch (error) {
      console.error('Get current user error:', error)
      if ((error as any)?.response?.status === 401) {
        this.clearAuth()
      }
      return null
    }
  }

  // Role and permission checks
  hasRole(role: string): boolean {
    const user = this.getUser()
    return user?.role?.includes(role) || user?.roles?.includes(role) || false
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
      if (!base64Payload) return null

      const payload = JSON.parse(atob(base64Payload))
      return payload as JWTPayload
    } catch (error) {
      console.error('Error parsing token:', error)
      return null
    }
  }

  // Session validation
  validateSession(): boolean {
    if (!this.isAuthenticated()) {
      this.clearAuth()
      return false
    }

    // Token expiry check
    if (this.isTokenExpiringSoon()) {
      console.log('Token is expiring soon, should refresh')
      // Burada refresh token işlemi tetiklenebilir
    }

    return true
  }
}

export default new AuthService()
