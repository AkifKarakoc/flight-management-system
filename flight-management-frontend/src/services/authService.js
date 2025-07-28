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
      console.log('🔐 Starting login process...')
      console.log('📡 API Endpoint:', REFERENCE_API_ENDPOINTS.AUTH.LOGIN)
      console.log('📊 Credentials:', { username: credentials.username, password: '***' })
      console.log('🌐 Base URL:', referenceAPI.defaults.baseURL)
      console.log('⏱️ Timeout:', referenceAPI.defaults.timeout)
      console.log('🔧 Full config:', referenceAPI.defaults)

      // Timeout süresini artır
      console.log('🚀 Making API call with fetch...')
      
      // Axios yerine fetch kullan
      const response = await fetch('/api/v1/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(credentials)
      })
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const responseData = await response.json()
      console.log('✅ Fetch response successful:', responseData)
      
      // Axios response format'ına uygun hale getir
      const axiosResponse = {
        data: responseData,
        status: response.status,
        statusText: response.statusText,
        headers: response.headers
      }

      console.log('✅ Login API call successful!')
      console.log('📥 Full response:', axiosResponse)
      console.log('📊 Response status:', axiosResponse.status)
      console.log('📦 Response data:', axiosResponse.data)

      // Backend response format: { token, tokenType, expiresIn }
      // NOT: accessToken değil, direkt token
      const { token, tokenType, expiresIn } = axiosResponse.data

      console.log('🔑 Extracted token:', token ? 'Present' : 'Missing')
      console.log('🏷️ Token type:', tokenType)
      console.log('⏰ Expires in:', expiresIn)

      // Token'ı localStorage'a kaydet (raw string olarak)
      localStorage.setItem(STORAGE_KEYS.TOKEN, token)

      // Kullanıcı bilgilerini token'dan çıkar ve kaydet
      const userInfo = this.extractUserFromToken(token)
      localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(userInfo))

      return {
        token: token,
        tokenType: tokenType || 'Bearer',
        expiresIn: expiresIn || 86400,
        user: userInfo
      }
    } catch (error) {
      console.error('❌ Login error occurred!')
      console.error('🔍 Error details:', error)
      console.error('📡 Request config:', error.config)
      console.error('📥 Response data:', error.response?.data)
      console.error('📊 Response status:', error.response?.status)
      console.error('🌐 Response headers:', error.response?.headers)
      console.error('🔗 Error code:', error.code)
      console.error('📝 Error message:', error.message)
      console.error('⏰ Error timestamp:', new Date().toISOString())
      
      // Network error details
      if (error.code === 'ECONNABORTED') {
        console.error('⏱️ Request timeout - server not responding')
      } else if (error.code === 'ERR_NETWORK') {
        console.error('🌐 Network error - check server status')
      } else if (error.code === 'ERR_BAD_REQUEST') {
        console.error('📡 Bad request - check request format')
      }

      // API error mesajını frontend'e geçir
      if (error.response?.data?.message) {
        console.error('💬 Backend error message:', error.response.data.message)
        throw new Error(error.response.data.message)
      } else if (error.response?.status === 401) {
        console.error('🔒 Unauthorized - Invalid credentials')
        throw new Error('Kullanıcı adı veya şifre hatalı')
      } else if (error.response?.status >= 500) {
        console.error('🖥️ Server error')
        throw new Error('Sunucu hatası. Lütfen daha sonra tekrar deneyin.')
      } else if (!error.response) {
        console.error('🌐 Network error - No response received')
        console.error('🔧 This could be CORS, server not running, or connectivity issue')
        throw new Error('Bağlantı hatası. Sunucu çalışıyor mu kontrol edin.')
      }
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
    return this.hasRole('ROLE_ADMIN')
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

        // Backend JWT payload format'ına göre user bilgilerini çıkar
        const roles = payload.roles
          ? (Array.isArray(payload.roles) ? payload.roles : [payload.roles])
          : []

        console.log('🎭 Raw roles from token:', payload.roles)
        console.log('🎭 Processed roles:', roles)

        return {
          username: payload.sub,
          roles: roles,
          exp: payload.exp,
          iat: payload.iat
        }
      } catch (decodeError) {
        throw new Error(`Token decode error: ${decodeError.message}`)
      }

    } catch (error) {
      console.error('extractUserFromToken error:', error)
      throw error
    }
  }

  /**
   * Token validation (API çağrısı ile)
   * @returns {Promise<Object>}
   */
  async validateToken() {
    try {
      const token = this.getToken()
      if (!token) {
        throw new Error('No token available')
      }

      // Backend'de token validation endpoint'i varsa kullan
      // Şu an için local validation yapıyoruz
      const isValid = this.isAuthenticated()

      if (isValid) {
        return {
          valid: true,
          token: token,
          user: this.getCurrentUser()
        }
      } else {
        return {
          valid: false,
          token: null,
          user: null
        }
      }
    } catch (error) {
      console.error('Token validation error:', error)
      return {
        valid: false,
        token: null,
        user: null
      }
    }
  }
}

export default new AuthService()
