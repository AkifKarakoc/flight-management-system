import axios from 'axios'
import { ElMessage } from 'element-plus'
import { API_BASE_URLS, STORAGE_KEYS, HTTP_STATUS } from '@/utils/constants'

// Axios instances for each service
const referenceAPI = axios.create({
  baseURL: API_BASE_URLS.REFERENCE,
  timeout: 10000,
})

const flightAPI = axios.create({
  baseURL: API_BASE_URLS.FLIGHT,
  timeout: 10000,
})

const archiveAPI = axios.create({
  baseURL: API_BASE_URLS.ARCHIVE,
  timeout: 10000,
})

// Request interceptor - otomatik token ekleme
const requestInterceptor = (config) => {
  const token = localStorage.getItem(STORAGE_KEYS.TOKEN)
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }

  // Loading state'i buraya eklenebilir
  config.metadata = { startTime: new Date() }

  return config
}

// Response interceptor - error handling
const responseInterceptor = (response) => {
  // Response time log
  const endTime = new Date()
  const duration = endTime - response.config.metadata.startTime
  console.debug(`API Call: ${response.config.method?.toUpperCase()} ${response.config.url} - ${duration}ms`)

  return response
}

const errorInterceptor = (error) => {
  const { response, config } = error

  // Network error
  if (!response) {
    ElMessage.error('Ağ bağlantısı hatası. Lütfen internet bağlantınızı kontrol edin.')
    return Promise.reject(error)
  }

  const { status, data } = response

  switch (status) {
    case HTTP_STATUS.UNAUTHORIZED:
      // Token süresi dolmuş veya geçersiz
      localStorage.removeItem(STORAGE_KEYS.TOKEN)
      localStorage.removeItem(STORAGE_KEYS.USER)

      // Login sayfasına yönlendir (router import etmemek için window.location kullanıyoruz)
      if (window.location.pathname !== '/login') {
        ElMessage.error('Oturum süreniz dolmuş. Lütfen tekrar giriş yapın.')
        window.location.href = '/login'
      }
      break

    case HTTP_STATUS.FORBIDDEN:
      ElMessage.error('Bu işlemi gerçekleştirmek için yetkiniz bulunmuyor.')
      break

    case HTTP_STATUS.NOT_FOUND:
      ElMessage.error('İstenen kaynak bulunamadı.')
      break

    case HTTP_STATUS.INTERNAL_SERVER_ERROR:
      ElMessage.error(data?.message || 'Sunucu hatası oluştu. Lütfen daha sonra tekrar deneyin.')
      break

    case HTTP_STATUS.BAD_REQUEST:
      // Form validasyon hatalarını göster
      if (data?.message) {
        ElMessage.error(data.message)
      } else if (data?.errors && Array.isArray(data.errors)) {
        data.errors.forEach(err => ElMessage.error(err))
      } else {
        ElMessage.error('Geçersiz istek. Lütfen girdiğiniz bilgileri kontrol edin.')
      }
      break

    default:
      ElMessage.error(data?.message || `Beklenmeyen hata oluştu (${status})`)
  }

  return Promise.reject(error)
}

// Apply interceptors to all API instances
[referenceAPI, flightAPI, archiveAPI].forEach(api => {
  api.interceptors.request.use(requestInterceptor)
  api.interceptors.response.use(responseInterceptor, errorInterceptor)
})

// Export API instances
export { referenceAPI, flightAPI, archiveAPI }

// Export default for backwards compatibility
export default referenceAPI
