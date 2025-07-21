import axios from 'axios'
import { ElMessage } from 'element-plus'
import { useAuthStore } from '@/stores/auth'
import router from '@/router'

class ApiService {
  constructor() {
    this.client = axios.create({
      baseURL: import.meta.env.VITE_API_BASE_URL,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json'
      }
    })

    this.setupInterceptors()
  }

  setupInterceptors() {
    // Request interceptor - Add token
    this.client.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem('token')
        if (token) {
          config.headers.Authorization = `Bearer ${token}`
        }
        return config
      },
      (error) => {
        return Promise.reject(error)
      }
    )

    // Response interceptor - Handle errors
    this.client.interceptors.response.use(
      (response) => {
        return response.data
      },
      (error) => {
        const authStore = useAuthStore()

        // Handle specific error cases
        if (error.response) {
          switch (error.response.status) {
            case 401:
              // Unauthorized - redirect to login
              ElMessage.error('Oturum süreniz dolmuş. Lütfen tekrar giriş yapın.')
              authStore.logout()
              router.push('/login')
              break
            case 403:
              // Forbidden
              ElMessage.error('Bu işlem için yetkiniz bulunmuyor.')
              break
            case 404:
              // Not found
              ElMessage.error('İstenilen kaynak bulunamadı.')
              break
            case 422:
              // Validation error
              const validationErrors = error.response.data?.errors || {}
              const errorMessages = Object.values(validationErrors).flat()
              if (errorMessages.length > 0) {
                errorMessages.forEach(msg => ElMessage.error(msg))
              } else {
                ElMessage.error('Girilen bilgilerde hata var.')
              }
              break
            case 500:
              // Server error
              ElMessage.error('Sunucu hatası oluştu. Lütfen daha sonra tekrar deneyin.')
              break
            default:
              // Other errors
              ElMessage.error(error.response.data?.message || 'Beklenmeyen bir hata oluştu.')
          }
        } else if (error.request) {
          // Network error
          ElMessage.error('Sunucuya bağlanılamıyor. İnternet bağlantınızı kontrol edin.')
        } else {
          // Other error
          ElMessage.error('Beklenmeyen bir hata oluştu.')
        }

        return Promise.reject(error)
      }
    )
  }

  // HTTP Methods
  get(url, config = {}) {
    return this.client.get(url, config)
  }

  post(url, data, config = {}) {
    return this.client.post(url, data, config)
  }

  put(url, data, config = {}) {
    return this.client.put(url, data, config)
  }

  delete(url, config = {}) {
    return this.client.delete(url, config)
  }

  patch(url, data, config = {}) {
    return this.client.patch(url, data, config)
  }
}

export const api = new ApiService()
export default api
