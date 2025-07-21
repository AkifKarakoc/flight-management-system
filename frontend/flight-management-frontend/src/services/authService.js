import api from './api'

export const authService = {
  async login(credentials) {
    const response = await api.post('/auth/login', credentials)
    return response
  },

  async logout() {
    try {
      await api.post('/auth/logout')
    } catch (error) {
      // Ignore logout errors
      console.warn('Logout error:', error)
    }
  },

  async refreshToken() {
    const response = await api.post('/auth/refresh')
    return response
  },

  async verifyToken() {
    const response = await api.get('/auth/verify')
    return response
  },

  async forgotPassword(email) {
    const response = await api.post('/auth/forgot-password', { email })
    return response
  },

  async resetPassword(token, password) {
    const response = await api.post('/auth/reset-password', { token, password })
    return response
  }
}
