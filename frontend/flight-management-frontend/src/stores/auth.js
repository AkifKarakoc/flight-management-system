import { defineStore } from 'pinia'
import { authService } from '@/services/authService'

export const useAuthStore = defineStore('auth', {
  state: () => ({
    token: localStorage.getItem('token'),
    user: JSON.parse(localStorage.getItem('user') || 'null'),
    isAuthenticated: !!localStorage.getItem('token'),
    loading: false
  }),

  getters: {
    userName: (state) => {
      if (!state.user) return ''
      return `${state.user.firstName} ${state.user.lastName}`
    },
    userRole: (state) => state.user?.role || '',
    isAdmin: (state) => state.user?.role === 'ADMIN'
  },

  actions: {
    async login(credentials) {
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

    logout() {
      this.token = null
      this.user = null
      this.isAuthenticated = false

      // Clear localStorage
      localStorage.removeItem('token')
      localStorage.removeItem('user')
    },

    async refreshToken() {
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

    async checkAuth() {
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
