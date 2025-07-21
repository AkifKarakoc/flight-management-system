import api from './api'
import { API_ENDPOINTS, API_BASE_URLS } from '@/utils/constants'

class FlightService {
  constructor() {
    this.baseURL = API_BASE_URLS.FLIGHT_SERVICE
  }

  // Create a flight service API client with base URL
  createClient() {
    return {
      get: (url, config = {}) => api.client.get(`${this.baseURL}${url}`, config),
      post: (url, data, config = {}) => api.client.post(`${this.baseURL}${url}`, data, config),
      put: (url, data, config = {}) => api.client.put(`${this.baseURL}${url}`, data, config),
      delete: (url, config = {}) => api.client.delete(`${this.baseURL}${url}`, config),
      patch: (url, data, config = {}) => api.client.patch(`${this.baseURL}${url}`, data, config)
    }
  }

  // Flight CRUD Operations
  async getAllFlights(params = {}) {
    const client = this.createClient()
    return client.get(API_ENDPOINTS.FLIGHTS, { params })
  }

  async getFlightById(id) {
    const client = this.createClient()
    return client.get(`${API_ENDPOINTS.FLIGHTS}/${id}`)
  }

  async createFlight(flightData) {
    const client = this.createClient()
    return client.post(API_ENDPOINTS.FLIGHTS, flightData)
  }

  async updateFlight(id, flightData) {
    const client = this.createClient()
    return client.put(`${API_ENDPOINTS.FLIGHTS}/${id}`, flightData)
  }

  async deleteFlight(id) {
    const client = this.createClient()
    return client.delete(`${API_ENDPOINTS.FLIGHTS}/${id}`)
  }

  // Flight Search and Filtering
  async getFlightsByDate(date, params = {}) {
    const client = this.createClient()
    return client.get(`${API_ENDPOINTS.FLIGHTS}/date/${date}`, { params })
  }

  async getFlightsByAirline(airlineId, params = {}) {
    const client = this.createClient()
    return client.get(`${API_ENDPOINTS.FLIGHTS}/airline/${airlineId}`, { params })
  }

  async getFlightsByAirport(airportId, params = {}) {
    const client = this.createClient()
    return client.get(`${API_ENDPOINTS.FLIGHTS}/airport/${airportId}`, { params })
  }

  async getFlightsByStatus(status, params = {}) {
    const client = this.createClient()
    return client.get(`${API_ENDPOINTS.FLIGHTS}/status/${status}`, { params })
  }

  async getDelayedFlights(minDelayMinutes = 30, params = {}) {
    const client = this.createClient()
    return client.get(`${API_ENDPOINTS.FLIGHTS}/delayed`, {
      params: { minDelayMinutes, ...params }
    })
  }

  async searchFlights(searchQuery, params = {}) {
    const client = this.createClient()
    return client.get(`${API_ENDPOINTS.FLIGHTS}/search`, {
      params: { q: searchQuery, ...params }
    })
  }

  // Flight Status Management
  async updateFlightStatus(id, status, note = '') {
    const client = this.createClient()
    return client.put(`${API_ENDPOINTS.FLIGHTS}/${id}/status`, null, {
      params: { status, note }
    })
  }

  async updateActualDeparture(id, actualDeparture) {
    const client = this.createClient()
    return client.put(`${API_ENDPOINTS.FLIGHTS}/${id}/actual-departure`, {
      actualDeparture
    })
  }

  async updateActualArrival(id, actualArrival) {
    const client = this.createClient()
    return client.put(`${API_ENDPOINTS.FLIGHTS}/${id}/actual-arrival`, {
      actualArrival
    })
  }

  // Bulk Operations
  async uploadFlights(csvFile, options = {}) {
    const client = this.createClient()
    const formData = new FormData()
    formData.append('file', csvFile)

    // Add options to form data
    Object.keys(options).forEach(key => {
      formData.append(key, options[key])
    })

    return client.post(API_ENDPOINTS.FLIGHT_UPLOAD, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })
  }

  async bulkUpdateStatus(flightIds, status, note = '') {
    const client = this.createClient()
    return client.put(`${API_ENDPOINTS.FLIGHTS}/bulk/status`, {
      flightIds,
      status,
      note
    })
  }

  async bulkDelete(flightIds) {
    const client = this.createClient()
    return client.delete(`${API_ENDPOINTS.FLIGHTS}/bulk`, {
      data: { flightIds }
    })
  }

  // Statistics and Reports
  async getFlightStats(date = null) {
    const client = this.createClient()
    const url = date
      ? `${API_ENDPOINTS.FLIGHT_STATS}/dashboard/${date}`
      : `${API_ENDPOINTS.FLIGHT_STATS}/dashboard`
    return client.get(url)
  }

  async getFlightCountByDate(date) {
    const client = this.createClient()
    return client.get(`${API_ENDPOINTS.FLIGHT_STATS}/count/date/${date}`)
  }

  async getFlightCountByAirline(airlineId, date = null) {
    const client = this.createClient()
    const url = date
      ? `${API_ENDPOINTS.FLIGHT_STATS}/count/airline/${airlineId}/date/${date}`
      : `${API_ENDPOINTS.FLIGHT_STATS}/count/airline/${airlineId}`
    return client.get(url)
  }

  async getFlightCountByStatus(status, date = null) {
    const client = this.createClient()
    const url = date
      ? `${API_ENDPOINTS.FLIGHT_STATS}/count/status/${status}/date/${date}`
      : `${API_ENDPOINTS.FLIGHT_STATS}/count/status/${status}`
    return client.get(url)
  }

  async getMonthlyStats(year, month) {
    const client = this.createClient()
    return client.get(`${API_ENDPOINTS.FLIGHT_STATS}/monthly/${year}/${month}`)
  }

  async getAirlinePerformance(startDate, endDate) {
    const client = this.createClient()
    return client.get(`${API_ENDPOINTS.FLIGHT_STATS}/airline-performance`, {
      params: { startDate, endDate }
    })
  }

  // Real-time Updates
  async getRecentUpdates(limit = 10) {
    const client = this.createClient()
    return client.get(`${API_ENDPOINTS.FLIGHTS}/recent-updates`, {
      params: { limit }
    })
  }

  // Export Functions
  async exportFlights(params = {}, format = 'csv') {
    const client = this.createClient()
    return client.get(`${API_ENDPOINTS.FLIGHTS}/export`, {
      params: { ...params, format },
      responseType: 'blob'
    })
  }

  async exportFlightReport(startDate, endDate, format = 'pdf') {
    const client = this.createClient()
    return client.get(`${API_ENDPOINTS.FLIGHTS}/report/export`, {
      params: { startDate, endDate, format },
      responseType: 'blob'
    })
  }

  // Validation Helper
  async validateFlightData(flightData) {
    const client = this.createClient()
    return client.post(`${API_ENDPOINTS.FLIGHTS}/validate`, flightData)
  }

  // Archive Service Integration
  async getArchivedFlights(params = {}) {
    return api.client.get(`${API_BASE_URLS.ARCHIVE_SERVICE}${API_ENDPOINTS.ARCHIVE_FLIGHTS}`, {
      params
    })
  }

  async getRecentArchivedFlights(limit = 10) {
    return api.client.get(`${API_BASE_URLS.ARCHIVE_SERVICE}${API_ENDPOINTS.ARCHIVE_FLIGHTS}/recent`, {
      params: { limit }
    })
  }

  // Helper Methods
  formatFlightNumber(flightNumber) {
    // Format: TK1234 -> TK 1234
    return flightNumber.replace(/([A-Z]+)(\d+)/, '$1 $2')
  }

  calculateFlightDuration(departure, arrival) {
    const departureTime = new Date(departure)
    const arrivalTime = new Date(arrival)
    const duration = arrivalTime - departureTime

    const hours = Math.floor(duration / (1000 * 60 * 60))
    const minutes = Math.floor((duration % (1000 * 60 * 60)) / (1000 * 60))

    return {
      totalMinutes: Math.floor(duration / (1000 * 60)),
      hours,
      minutes,
      formatted: `${hours}s ${minutes}dk`
    }
  }

  calculateDelay(scheduledTime, actualTime) {
    if (!actualTime) return null

    const scheduled = new Date(scheduledTime)
    const actual = new Date(actualTime)
    const delay = actual - scheduled

    if (delay <= 0) return null

    const minutes = Math.floor(delay / (1000 * 60))
    const hours = Math.floor(minutes / 60)
    const remainingMinutes = minutes % 60

    return {
      totalMinutes: minutes,
      hours,
      minutes: remainingMinutes,
      formatted: hours > 0 ? `${hours}s ${remainingMinutes}dk` : `${minutes}dk`
    }
  }

  getFlightStatusColor(status) {
    const colors = {
      'SCHEDULED': '#909399',
      'BOARDING': '#E6A23C',
      'DEPARTED': '#409EFF',
      'IN_FLIGHT': '#409EFF',
      'ARRIVED': '#67C23A',
      'CANCELLED': '#F56C6C',
      'DELAYED': '#E6A23C'
    }
    return colors[status] || '#909399'
  }

  getFlightStatusText(status) {
    const texts = {
      'SCHEDULED': 'Planlandı',
      'BOARDING': 'Boarding',
      'DEPARTED': 'Kalktı',
      'IN_FLIGHT': 'Uçuşta',
      'ARRIVED': 'Vardı',
      'CANCELLED': 'İptal',
      'DELAYED': 'Gecikmeli'
    }
    return texts[status] || status
  }

  getFlightTypeText(type) {
    const types = {
      'PASSENGER': 'Yolcu',
      'CARGO': 'Kargo',
      'DOMESTIC': 'İç Hat',
      'INTERNATIONAL': 'Dış Hat'
    }
    return types[type] || type
  }

  // Real-time WebSocket connection helper
  createWebSocketConnection(onMessage, onError = null) {
    const wsUrl = `ws://localhost:8082/ws/flights`
    const socket = new WebSocket(wsUrl)

    socket.onopen = () => {
      console.log('Flight WebSocket connected')
    }

    socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data)
        onMessage(data)
      } catch (error) {
        console.error('WebSocket message parsing error:', error)
      }
    }

    socket.onerror = (error) => {
      console.error('Flight WebSocket error:', error)
      if (onError) onError(error)
    }

    socket.onclose = () => {
      console.log('Flight WebSocket disconnected')
    }

    return socket
  }
}

// Create singleton instance
export const flightService = new FlightService()
export default flightService
