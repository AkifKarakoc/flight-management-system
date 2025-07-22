// src/services/api.ts
import axios, {
  type AxiosInstance,
  type AxiosRequestConfig,
  type AxiosResponse,
  type AxiosError,
  type InternalAxiosRequestConfig
} from 'axios'
import { ElMessage } from 'element-plus'
import router from '@/router'
import type {
  LoginCredentials,
  AuthResponse,
  User,
  Airline,
  Airport,
  Aircraft,
  Route,
  CrewMember,
  Flight,
  CreateFlightRequest,
  ApiResponse,
  PaginatedResponse,
  KpiData
} from '@/types'

// API Base URLs - Backend'ler hazır!
const API_BASE_URLS = {
  REFERENCE_MANAGER: 'http://localhost:8081',
  FLIGHT_SERVICE: 'http://localhost:8082',
  ARCHIVE_SERVICE: 'http://localhost:8083'
} as const

// API Client Configuration Interface
interface ApiClientConfig {
  baseURL: string
  timeout: number
  headers: Record<string, string>
}

// Create axios instances for each service
const createClient = (baseURL: string): AxiosInstance => {
  const config: ApiClientConfig = {
    baseURL,
    timeout: 30000,
    headers: {
      'Content-Type': 'application/json'
    }
  }

  const client = axios.create(config)

  // Request interceptor - Add auth token
  client.interceptors.request.use(
    (config: InternalAxiosRequestConfig) => {
      const token = localStorage.getItem('auth_token')
      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`
      }
      return config
    },
    (error: AxiosError) => {
      return Promise.reject(error)
    }
  )

  // Response interceptor - Handle errors
  client.interceptors.response.use(
    (response: AxiosResponse) => {
      return response
    },
    (error: AxiosError<ErrorResponse>) => {  // ✅ Generic type ekleyin
      const { response } = error

      if (response) {
        switch (response.status) {
          case 401:
            ElMessage.error('Oturum süresi doldu, lütfen tekrar giriş yapın')
            localStorage.removeItem('auth_token')
            router.push('/auth/login')
            break
          case 403:
            ElMessage.error('Bu işlem için yetkiniz bulunmuyor')
            break
          case 404:
            ElMessage.error('Kaynak bulunamadı')
            break
          case 422:
            if (response.data?.details) {
              // ✅ Type-safe validation errors
              Object.values(response.data.details).forEach((errors: string[]) => {
                errors.forEach((error: string) => ElMessage.error(error))
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
  FLIGHT_UPLOAD: '/api/v1/flights/upload-csv',
  FLIGHT_STATS: '/api/v1/flights/stats',

  // Archive Service (8083)
  ARCHIVE_FLIGHTS: '/api/v1/archive/flights',
  ARCHIVE_STATS: '/api/v1/archive/stats',
  ARCHIVE_KPI: '/api/v1/kpi'
} as const

// Chart Data Interfaces
interface FlightChartData {
  dates: string[]
  scheduled: number[]
  completed: number[]
  cancelled: number[]
  delayed: number[]
}

interface FlightTypeDistribution {
  type: string
  count: number
}

interface RecentFlightData {
  id: number
  flightNumber: string
  origin: string
  destination: string
  status: string
  scheduledDeparture: string
}

interface SystemHealthService {
  name: string
  status: 'online' | 'error'
  url: string
  error?: string
}

interface DashboardKpis {
  totalFlights: number
  activeAirlines: number
  totalAirports: number
  activeAircrafts: number
}
interface ErrorDetails {
  [field: string]: string[]
}

interface ErrorResponse {
  message?: string
  details?: ErrorDetails
}

// Query Parameters Interfaces
interface GetRequestParams {
  [key: string]: string | number | boolean | undefined
}

interface PaginationParams {
  page?: number
  size?: number
  sort?: string
  order?: 'asc' | 'desc'
  search?: string
}

// Main API service
class ApiService {
  public reference: AxiosInstance
  public flight: AxiosInstance
  public archive: AxiosInstance

  constructor() {
    this.reference = referenceClient
    this.flight = flightClient
    this.archive = archiveClient
  }

  // Authentication methods
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    const response = await this.reference.post<AuthResponse>(API_ENDPOINTS.AUTH.LOGIN, credentials)
    const { accessToken } = response.data
    localStorage.setItem('auth_token', accessToken)
    return response.data
  }

  async logout(): Promise<void> {
    try {
      await this.reference.post(API_ENDPOINTS.AUTH.LOGOUT)
    } finally {
      localStorage.removeItem('auth_token')
    }
  }

  async getProfile(): Promise<User> {
    const response = await this.reference.get<User>(API_ENDPOINTS.AUTH.PROFILE)
    return response.data
  }

  // Reference Manager methods
  async getAirlines(params: GetRequestParams = {}): Promise<PaginatedResponse<Airline>> {
    const response = await this.reference.get<PaginatedResponse<Airline>>(API_ENDPOINTS.AIRLINES, { params })
    return response.data
  }

  async getAirports(params: GetRequestParams = {}): Promise<PaginatedResponse<Airport>> {
    const response = await this.reference.get<PaginatedResponse<Airport>>(API_ENDPOINTS.AIRPORTS, { params })
    return response.data
  }

  async getAircrafts(params: GetRequestParams = {}): Promise<PaginatedResponse<Aircraft>> {
    const response = await this.reference.get<PaginatedResponse<Aircraft>>(API_ENDPOINTS.AIRCRAFTS, { params })
    return response.data
  }

  async getRoutes(params: GetRequestParams = {}): Promise<PaginatedResponse<Route>> {
    const response = await this.reference.get<PaginatedResponse<Route>>(API_ENDPOINTS.ROUTES, { params })
    return response.data
  }

  async getCrewMembers(params: GetRequestParams = {}): Promise<PaginatedResponse<CrewMember>> {
    const response = await this.reference.get<PaginatedResponse<CrewMember>>(API_ENDPOINTS.CREW_MEMBERS, { params })
    return response.data
  }

  // Flight Service methods
  async getFlights(params: GetRequestParams = {}): Promise<PaginatedResponse<Flight>> {
    const response = await this.flight.get<PaginatedResponse<Flight>>(API_ENDPOINTS.FLIGHTS, { params })
    return response.data
  }

  async createFlight(flightData: CreateFlightRequest): Promise<Flight> {
    const response = await this.flight.post<Flight>(API_ENDPOINTS.FLIGHTS, flightData)
    return response.data
  }

  async updateFlight(id: number, flightData: Partial<CreateFlightRequest>): Promise<Flight> {
    const response = await this.flight.put<Flight>(`${API_ENDPOINTS.FLIGHTS}/${id}`, flightData)
    return response.data
  }

  async deleteFlight(id: number): Promise<void> {
    await this.flight.delete(`${API_ENDPOINTS.FLIGHTS}/${id}`)
  }

  async getFlightStats(params: GetRequestParams = {}): Promise<any> {
    const response = await this.flight.get(API_ENDPOINTS.FLIGHT_STATS, { params })
    return response.data
  }

  // Dashboard specific methods
  async getDashboardKpis(): Promise<DashboardKpis> {
    try {
      const today = new Date().toISOString().split('T')[0];
      // Get data from multiple sources
      const [flightStats, airlines, airports, aircrafts] = await Promise.all([
        this.flight.get(`${API_ENDPOINTS.FLIGHT_STATS}/summary/${today}`),
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

  async getFlightChartData(period: '7d' | '30d' | '90d' = '7d'): Promise<FlightChartData> {
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

      const response = await this.flight.get<FlightChartData>(`${API_ENDPOINTS.FLIGHT_STATS}/daily-chart`, {
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

  async getFlightTypeDistribution(): Promise<FlightTypeDistribution[]> {
    try {
      const response = await this.flight.get<FlightTypeDistribution[]>(`${API_ENDPOINTS.FLIGHT_STATS}/type-distribution`)
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

  async getRecentFlights(limit: number = 5): Promise<RecentFlightData[]> {
    try {
      const response = await this.archive.get<RecentFlightData[]>(`${API_ENDPOINTS.ARCHIVE_FLIGHTS}/recent`, {
        params: { limit }
      })
      return response.data
    } catch (error) {
      console.error('Error fetching recent flights:', error)
      return []
    }
  }

  // System health check
  async checkSystemHealth(): Promise<SystemHealthService[]> {
    const services: SystemHealthService[] = []

    try {
      // Check Reference Manager
      await this.reference.get('/actuator/health')
      services.push({
        name: 'Reference Manager',
        status: 'online',
        url: API_BASE_URLS.REFERENCE_MANAGER
      })
    } catch (error: any) {
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
    } catch (error: any) {
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
    } catch (error: any) {
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
  generateMockChartData(period: '7d' | '30d' | '90d'): FlightChartData {
    const days = period === '7d' ? 7 : period === '30d' ? 30 : 90
    const dates: string[] = []
    const scheduled: number[] = []
    const completed: number[] = []
    const cancelled: number[] = []
    const delayed: number[] = []

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

  // File upload method
  async uploadFile(file: File, endpoint: string): Promise<any> {
    const formData = new FormData()
    formData.append('file', file)

    const response = await this.flight.post(endpoint, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })

    return response.data
  }

  // Generic CRUD methods
  async get<T>(endpoint: string, params?: GetRequestParams): Promise<T> {
    const response = await this.reference.get<T>(endpoint, { params })
    return response.data
  }

  async post<T>(endpoint: string, data: any): Promise<T> {
    const response = await this.reference.post<T>(endpoint, data)
    return response.data
  }

  async put<T>(endpoint: string, data: any): Promise<T> {
    const response = await this.reference.put<T>(endpoint, data)
    return response.data
  }

  async delete(endpoint: string): Promise<void> {
    await this.reference.delete(endpoint)
  }
}

// Create singleton instance
export const apiService = new ApiService()

// Export individual clients for specific use cases
export { referenceClient, flightClient, archiveClient }

// Export API Base URLs for external use
export { API_BASE_URLS }

// Export default
export default apiService
