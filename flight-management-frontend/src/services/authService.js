import { referenceAPI } from './api'
import { STORAGE_KEYS, REFERENCE_API_ENDPOINTS } from '@/utils/constants'

class AuthService {

  /**
   * Kullanıcı girişi
   * @param {Object} credentials - { username, password }
   * @returns {Promise<Object>} Token ve kullanıcı bilgileri
   */
  async login(credentials) {
    try {
      const response = await referenceAPI.post(
        REFERENCE_API_ENDPOINTS.AUTH.LOGIN,
        credentials
      )
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
    this.clearAuthData()

    // Opsiyonel: Backend'e logout isteği gönderilebilir
    // await referenceAPI.post('/auth/logout')
  }

  /**
   * Auth verilerini temizle
   */
  clearAuthData() {
    localStorage.removeItem(STORAGE_KEYS.TOKEN)
    localStorage.removeItem(STORAGE_KEYS.USER)
  }

  /**
   * Geçersiz token'ları temizle ve auth durumunu sıfırla
   */
  clearInvalidTokens() {
    try {
      const token = localStorage.getItem(STORAGE_KEYS.TOKEN)
      if (token) {
        // Token format kontrolü
        if (typeof token !== 'string' || token.trim() === '') {
          this.clearAuthData()
          return
        }
        
        // JWT format kontrolü
        const parts = token.split('.')
        if (parts.length !== 3) {
          this.clearAuthData()
          return
        }
        
        // Token'ı test et
        this.extractUserFromToken(token)
      }
    } catch (error) {
      console.log('Clearing invalid token from localStorage:', error.message)
      this.clearAuthData()
    }
  }

  /**
   * Mevcut token'ın geçerli olup olmadığını kontrol et
   * @returns {boolean}
   */
  isAuthenticated() {
    try {
      const token = localStorage.getItem(STORAGE_KEYS.TOKEN)
      if (!token) return false

      // Token format kontrolü
      if (typeof token !== 'string' || token.trim() === '') {
        this.clearAuthData()
        return false
      }

      // JWT format kontrolü
      const parts = token.split('.')
      if (parts.length !== 3) {
        this.clearAuthData()
        return false
      }

      const payload = this.extractUserFromToken(token)
      const currentTime = Date.now() / 1000

      // Token süresi dolmuş mu?
      return payload.exp > currentTime
    } catch (error) {
      console.error('Token validation error:', error)
      // Token geçersizse localStorage'dan temizle
      this.clearAuthData()
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
    return this.hasRole('ADMIN')
  }

  /**
   * JWT token'dan kullanıcı bilgilerini çıkar
   * @param {string} token
   * @returns {Object}
   */
  extractUserFromToken(token) {
    try {
      // Token kontrolü
      if (!token || typeof token !== 'string') {
        throw new Error('Invalid token: token is null, undefined, or not a string')
      }

      // Token boş mu kontrol et
      if (token.trim() === '') {
        throw new Error('Invalid token: token is empty')
      }

      // JWT token format kontrolü: header.payload.signature
      const parts = token.split('.')
      if (parts.length !== 3) {
        throw new Error(`Invalid token format: expected 3 parts, got ${parts.length}`)
      }

      const base64Url = parts[1]
      if (!base64Url) {
        throw new Error('Invalid token: missing payload')
      }

      // Base64 decode kontrolü
      try {
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/')
        const jsonPayload = decodeURIComponent(
          atob(base64)
            .split('')
            .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
            .join('')
        )

        const payload = JSON.parse(jsonPayload)

        // Gerekli alanları kontrol et
        if (!payload.sub) {
          throw new Error('Invalid token: missing subject (sub)')
        }

        return {
          username: payload.sub,
          roles: payload.roles ? payload.roles.split(',') : [],
          exp: payload.exp,
          iat: payload.iat
        }
      } catch (decodeError) {
        throw new Error(`Token decode failed: ${decodeError.message}`)
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

  /**
   * Token'ı backend'de doğrula
   * @returns {Promise<Object>}
   */
  async validateToken() {
    try {
      const token = this.getToken()
      if (!token) {
        return { valid: false }
      }

      // Backend'de token doğrulama endpoint'i varsa kullan
      // Şu an için local validation yapıyoruz
      const payload = this.extractUserFromToken(token)
      const currentTime = Date.now() / 1000

      if (payload.exp > currentTime) {
        return {
          valid: true,
          token: token,
          user: this.getCurrentUser()
        }
      } else {
        // Token süresi dolmuş, temizle
        this.clearAuthData()
        return { valid: false }
      }
    } catch (error) {
      console.error('Token validation error:', error)
      // Token geçersiz, temizle
      this.clearAuthData()
      return { valid: false }
    }
  }
}

// Singleton instance
const authService = new AuthService()
export default authService
