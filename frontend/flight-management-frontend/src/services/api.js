// src/services/api.js
import axios from 'axios'
import { ElMessage, ElMessageBox } from 'element-plus'
import router from '@/router'

// API Base URLs - Backend'ler hazır!
const API_BASE_URLS = {
  REFERENCE_MANAGER: 'http://localhost:8081',
  FLIGHT_SERVICE: 'http://localhost:8082',
  ARCHIVE_SERVICE: 'http://localhost:8083'
}

// Create axios instances for each service
const createClient = (baseURL) => {
  const client = axios.create({
    baseURL,
    timeout: 30000,
    headers: {
      'Content-Type': 'application/json'
    }
  })

  // Request interceptor - Add auth token
  client.interceptors.request.use(
    (config) => {
      const token = localStorage.getItem('auth_token')
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
  client.interceptors.response.use(
    (response) => {
      return response
    },
    (error) => {
      const { response } = error

      if (response) {
        switch (response.status) {
          case 401:
            ElMessage.error('Oturum süresi doldu, lütfen tekrar giriş yapın')
            localStorage.removeItem('auth_token')
            router.push('/login')
            break
          case 403:
            ElMessage.error('Bu işlem için yetkiniz bulunmuyor')
            break
          case 404:
            ElMessage.error('Kaynak bulunamadı')
            break
          case 422:
            if (response.data?.details) {
              // Validation errors
              Object.values(response.data.details).forEach(errors => {
                errors.forEach(error => ElMessage.error(error))
              })
            } else {
              ElMessage.error(response.data?.message || 'Validation hatası')
            }
            break
          case 500:
            ElMessage.error('Sunucu hatası, lütfen daha sonra tekrar deneyin')
            break
          default:
            ElMessage.error(response.data?.message || 'Bir hata oluştu')
        }
      } else {
        ElMessage.error('Bağlantı hatası, sunucuya ulaşılamıyor')
      }

      return Promise.reject(error)
    }
  )

  return client
}

// Service clients
const referenceClient = createClient(API_BASE_URLS.REFERENCE_MANAGER)
const flightClient = createClient(API_BASE_URLS.FLIGHT_SERVICE)
const archiveClient = createClient(API_BASE_URLS.ARCHIVE_SERVICE)

// API endpoints
export const API_ENDPOINTS = {
  // Authentication (Reference Manager)
  AUTH: {
    LOGIN: '/api/v1/auth/login',
    LOGOUT: '/api/v1/auth/logout',
    REFRESH: '/api/v1/auth/refresh',
    PROFILE: '/api/v1/auth/profile'
  },

  // Reference Manager (8081)
  AIRLINES: '/api/v1/airlines',
  AIRPORTS: '/api/v1/airports',
  AIRCRAFTS: '/api/v1/aircrafts',
  ROUTES: '/api/v1/routes',
  CREW_MEMBERS: '/api/v1/crew-members',

  // Flight Service (8082)
  FLIGHTS: '/api/v1/flights',
  FLIGHT_UPLOAD: '/api/v1/flights/upload',
  FLIGHT_STATS: '/api/v1/flights/stats',

  // Archive Service (8083)
  ARCHIVE_FLIGHTS: '/api/v1/archive/flights',
  ARCHIVE_STATS: '/api/v1/archive/stats',
  ARCHIVE_KPI: '/api/v1/kpi'
}

// Main API service
class ApiService {
  constructor() {
    this.reference = referenceClient
    this.flight = flightClient
    this.archive = archiveClient
  }

  // Authentication methods
  async login(credentials) {
    const response = await this.reference.post(API_ENDPOINTS.AUTH.LOGIN, credentials)
    const { accessToken } = response.data
    localStorage.setItem('auth_token', accessToken)
    return response.data
  }

  async logout() {
    try {
      await this.reference.post(API_ENDPOINTS.AUTH.LOGOUT)
    } finally {
      localStorage.removeItem('auth_token')
    }
  }

  async getProfile() {
    const response = await this.reference.get(API_ENDPOINTS.AUTH.PROFILE)
    return response.data
  }

  // Reference Manager methods
  async getAirlines(params = {}) {
    const response = await this.reference.get(API_ENDPOINTS.AIRLINES, { params })
    return response.data
  }

  async getAirports(params = {}) {
    const response = await this.reference.get(API_ENDPOINTS.AIRPORTS, { params })
    return response.data
  }

  async getAircrafts(params = {}) {
    const response = await this.reference.get(API_ENDPOINTS.AIRCRAFTS, { params })
    return response.data
  }

  // Flight Service methods
  async getFlights(params = {}) {
    const response = await this.flight.get(API_ENDPOINTS.FLIGHTS, { params })
    return response.data
  }

  async createFlight(flightData) {
    const response = await this.flight.post(API_ENDPOINTS.FLIGHTS, flightData)
    return response.data
  }

  async updateFlight(id, flightData) {
    const response = await this.flight.put(`${API_ENDPOINTS.FLIGHTS}/${id}`, flightData)
    return response.data
  }

  async deleteFlight(id) {
    const response = await this.flight.delete(`${API_ENDPOINTS.FLIGHTS}/${id}`)
    return response.data
  }

  async getFlightStats(params = {}) {
    const response = await this.flight.get(API_ENDPOINTS.FLIGHT_STATS, { params })
    return response.data
  }

  // Dashboard specific methods
  async getDashboardKpis() {
    try {
      // Get data from multiple sources
      const [flightStats, airlines, airports, aircrafts] = await Promise.all([
        this.flight.get(`${API_ENDPOINTS.FLIGHT_STATS}/daily`),
        this.reference.get(`${API_ENDPOINTS.AIRLINES}?page=0&size=1`),
        this.reference.get(`${API_ENDPOINTS.AIRPORTS}?page=0&size=1`),
        this.reference.get(`${API_ENDPOINTS.AIRCRAFTS}?page=0&size=1`)
      ])

      return {
        totalFlights: flightStats.data.totalFlights || 0,
        activeAirlines: airlines.data.totalElements || 0,
        totalAirports: airports.data.totalElements || 0,
        activeAircrafts: aircrafts.data.totalElements || 0
      }
    } catch (error) {
      console.error('Error fetching dashboard KPIs:', error)
      // Return mock data if backend fails
      return {
        totalFlights: 1247,
        activeAirlines: 23,
        totalAirports: 156,
        activeAircrafts: 89
      }
    }
  }

  async getFlightChartData(period = '7d') {
    try {
      const endDate = new Date()
      const startDate = new Date()

      switch (period) {
        case '7d':
          startDate.setDate(endDate.getDate() - 7)
          break
        case '30d':
          startDate.setDate(endDate.getDate() - 30)
          break
        case '90d':
          startDate.setDate(endDate.getDate() - 90)
          break
      }

      const response = await this.flight.get(`${API_ENDPOINTS.FLIGHT_STATS}/daily-chart`, {
        params: {
          startDate: startDate.toISOString().split('T')[0],
          endDate: endDate.toISOString().split('T')[0]
        }
      })

      return response.data
    } catch (error) {
      console.error('Error fetching flight chart data:', error)
      // Return mock data
      return this.generateMockChartData(period)
    }
  }

  async getFlightTypeDistribution() {
    try {
      const response = await this.flight.get(`${API_ENDPOINTS.FLIGHT_STATS}/type-distribution`)
      return response.data
    } catch (error) {
      console.error('Error fetching flight type distribution:', error)
      // Return mock data
      return [
        { type: 'PASSENGER', count: 145 },
        { type: 'CARGO', count: 89 },
        { type: 'DOMESTIC', count: 203 },
        { type: 'INTERNATIONAL', count: 167 }
      ]
    }
  }

  async getRecentFlights(limit = 5) {
    try {
      const response = await this.flight.get(`${API_ENDPOINTS.FLIGHTS}/recent`, {
        params: { limit }
      })
      return response.data
    } catch (error) {
      console.error('Error fetching recent flights:', error)
      return []
    }
  }

  // System health check
  async checkSystemHealth() {
    const services = []

    try {
      // Check Reference Manager
      await this.reference.get('/actuator/health')
      services.push({
        name: 'Reference Manager',
        status: 'online',
        url: API_BASE_URLS.REFERENCE_MANAGER
      })
    } catch (error) {
      services.push({
        name: 'Reference Manager',
        status: 'error',
        url: API_BASE_URLS.REFERENCE_MANAGER,
        error: error.message
      })
    }

    try {
      // Check Flight Service
      await this.flight.get('/actuator/health')
      services.push({
        name: 'Flight Service',
        status: 'online',
        url: API_BASE_URLS.FLIGHT_SERVICE
      })
    } catch (error) {
      services.push({
        name: 'Flight Service',
        status: 'error',
        url: API_BASE_URLS.FLIGHT_SERVICE,
        error: error.message
      })
    }

    try {
      // Check Archive Service
      await this.archive.get('/actuator/health')
      services.push({
        name: 'Archive Service',
        status: 'online',
        url: API_BASE_URLS.ARCHIVE_SERVICE
      })
    } catch (error) {
      services.push({
        name: 'Archive Service',
        status: 'error',
        url: API_BASE_URLS.ARCHIVE_SERVICE,
        error: error.message
      })
    }

    return services
  }

  // Mock data generator for development
  generateMockChartData(period) {
    const days = period === '7d' ? 7 : period === '30d' ? 30 : 90
    const dates = []
    const scheduled = []
    const completed = []
    const cancelled = []
    const delayed = []

    for (let i = days - 1; i >= 0; i--) {
      const date = new Date()
      date.setDate(date.getDate() - i)
      dates.push(date.toISOString().split('T')[0])

      const baseFlights = Math.floor(Math.random() * 50) + 30
      const scheduledCount = baseFlights
      const completedCount = Math.floor(scheduledCount * (0.8 + Math.random() * 0.15))
      const cancelledCount = Math.floor(scheduledCount * (Math.random() * 0.05))
      const delayedCount = scheduledCount - completedCount - cancelledCount

      scheduled.push(scheduledCount)
      completed.push(completedCount)
      cancelled.push(cancelledCount)
      delayed.push(delayedCount)
    }

    return { dates, scheduled, completed, cancelled, delayed }
  }
}

// Create singleton instance
export const apiService = new ApiService()

// Export individual clients for specific use cases
export { referenceClient, flightClient, archiveClient }

// Export default
export default apiService
