import { defineStore } from 'pinia'
import { authService } from '@/services/authService'
import type { User, LoginCredentials, AuthResponse } from '@/types'

interface AuthState {
  token: string | null
  user: User | null
  isAuthenticated: boolean
  loading: boolean
}

export const useAuthStore = defineStore('auth', {
  state: (): AuthState => ({
    token: localStorage.getItem('token'),
    user: JSON.parse(localStorage.getItem('user') || 'null'),
    isAuthenticated: !!localStorage.getItem('token'),
    loading: false
  }),

  getters: {
    userName: (state): string => {
      if (!state.user) return ''
      return `${state.user.firstName} ${state.user.lastName}`
    },
    userRole: (state): string => state.user?.role || '',
    isAdmin: (state): boolean => state.user?.role === 'ADMIN'
  },

  actions: {
    async login(credentials: LoginCredentials): Promise<AuthResponse> {
      this.loading = true
      try {
        const response = await authService.login(credentials)

        this.token = response.token
        this.user = response.user
        this.isAuthenticated = true

        // Store in localStorage
        localStorage.setItem('token', this.token)
        localStorage.setItem('user', JSON.stringify(this.user))

        return response
      } catch (error) {
        this.logout()
        throw error
      } finally {
        this.loading = false
      }
    },

    logout(): void {
      this.token = null
      this.user = null
      this.isAuthenticated = false

      // Clear localStorage
      localStorage.removeItem('token')
      localStorage.removeItem('user')
    },

    async refreshToken(): Promise<AuthResponse> {
      try {
        const response = await authService.refreshToken()
        this.token = response.token
        localStorage.setItem('token', this.token)
        return response
      } catch (error) {
        this.logout()
        throw error
      }
    },

    async checkAuth(): Promise<void> {
      if (this.token && this.user) {
        try {
          // Verify token is still valid
          await authService.verifyToken()
          this.isAuthenticated = true
        } catch (error) {
          this.logout()
        }
      }
    }
  }
})
