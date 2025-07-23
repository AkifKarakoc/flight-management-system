import { referenceAPI } from './api'
import { STORAGE_KEYS } from '@/utils/constants'

class AuthService {

  /**
   * Kullanıcı girişi
   * @param {Object} credentials - { username, password }
   * @returns {Promise<Object>} Token ve kullanıcı bilgileri
   */
  async login(credentials) {
    try {
      const response = await referenceAPI.post('/auth/login', credentials)
      const { accessToken, tokenType, expiresIn } = response.data

      // Token'ı localStorage'a kaydet
      localStorage.setItem(STORAGE_KEYS.TOKEN, accessToken)

      // Kullanıcı bilgilerini token'dan çıkar ve kaydet
      const userInfo = this.extractUserFromToken(accessToken)
      localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(userInfo))

      return {
        token: accessToken,
        tokenType,
        expiresIn,
        user: userInfo
      }
    } catch (error) {
      console.error('Login error:', error)
      throw error
    }
  }

  /**
   * Kullanıcı çıkışı
   */
  logout() {
    localStorage.removeItem(STORAGE_KEYS.TOKEN)
    localStorage.removeItem(STORAGE_KEYS.USER)

    // Opsiyonel: Backend'e logout isteği gönderilebilir
    // await referenceAPI.post('/auth/logout')
  }

  /**
   * Mevcut token'ın geçerli olup olmadığını kontrol et
   * @returns {boolean}
   */
  isAuthenticated() {
    const token = localStorage.getItem(STORAGE_KEYS.TOKEN)
    if (!token) return false

    try {
      const payload = this.extractUserFromToken(token)
      const currentTime = Date.now() / 1000

      // Token süresi dolmuş mu?
      return payload.exp > currentTime
    } catch (error) {
      console.error('Token validation error:', error)
      return false
    }
  }

  /**
   * Mevcut kullanıcı bilgilerini getir
   * @returns {Object|null}
   */
  getCurrentUser() {
    const userStr = localStorage.getItem(STORAGE_KEYS.USER)
    if (!userStr) return null

    try {
      return JSON.parse(userStr)
    } catch (error) {
      console.error('User data parse error:', error)
      return null
    }
  }

  /**
   * Mevcut token'ı getir
   * @returns {string|null}
   */
  getToken() {
    return localStorage.getItem(STORAGE_KEYS.TOKEN)
  }

  /**
   * Kullanıcının belirli bir yetkiye sahip olup olmadığını kontrol et
   * @param {string} role - ROLE_ADMIN, ROLE_USER
   * @returns {boolean}
   */
  hasRole(role) {
    const user = this.getCurrentUser()
    if (!user || !user.roles) return false

    return user.roles.includes(role)
  }

  /**
   * Kullanıcının admin olup olmadığını kontrol et
   * @returns {boolean}
   */
  isAdmin() {
    return this.hasRole('ROLE_ADMIN')
  }

  /**
   * JWT token'dan kullanıcı bilgilerini çıkar
   * @param {string} token
   * @returns {Object}
   */
  extractUserFromToken(token) {
    try {
      // JWT token format: header.payload.signature
      const base64Url = token.split('.')[1]
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/')
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split('')
          .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      )

      const payload = JSON.parse(jsonPayload)

      return {
        username: payload.sub,
        roles: payload.roles ? payload.roles.split(',') : [],
        exp: payload.exp,
        iat: payload.iat
      }
    } catch (error) {
      console.error('Token decode error:', error)
      throw new Error('Invalid token format')
    }
  }

  /**
   * Token yenileme (şu an backend'de yok ama gelecekte eklenebilir)
   * @returns {Promise<Object>}
   */
  async refreshToken() {
    // Bu özellik backend'de implement edildiğinde aktif edilecek
    throw new Error('Token refresh not implemented yet')
  }
}

// Singleton instance
const authService = new AuthService()
export default authService
