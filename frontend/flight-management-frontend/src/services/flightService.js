import api from './api'
import { API_ENDPOINTS, API_BASE_URLS } from '@/utils/constants'

class FlightService {
  constructor() {
    this.baseURL = API_BASE_URLS.FLIGHT_SERVICE
  }

  // Get all flights with filtering and pagination
  async getAll(params = {}) {
    try {
      const response = await api.client.get(`${this.baseURL}${API_ENDPOINTS.FLIGHTS}`, {
        params: {
          page: params.page || 0,
          size: params.size || 20,
          sort: params.sort || 'scheduledDeparture,desc',
          search: params.search || '',
          airlineId: params.airlineId || '',
          originAirportId: params.originAirportId || '',
          destinationAirportId: params.destinationAirportId || '',
          flightDate: params.flightDate || '',
          status: params.status || '',
          type: params.type || '',
          ...params.filters
        }
      })
      return response.data
    } catch (error) {
      console.error('Error fetching flights:', error)
      throw error
    }
  }

  // Get flight by ID
  async getById(id) {
    try {
      const response = await api.client.get(`${this.baseURL}${API_ENDPOINTS.FLIGHTS}/${id}`)
      return response.data
    } catch (error) {
      console.error('Error fetching flight:', error)
      throw error
    }
  }

  // Create new flight
  async create(flightData) {
    try {
      const response = await api.client.post(`${this.baseURL}${API_ENDPOINTS.FLIGHTS}`, flightData)
      return response.data
    } catch (error) {
      console.error('Error creating flight:', error)
      throw error
    }
  }

  // Update existing flight
  async update(id, flightData) {
    try {
      const response = await api.client.put(`${this.baseURL}${API_ENDPOINTS.FLIGHTS}/${id}`, flightData)
      return response.data
    } catch (error) {
      console.error('Error updating flight:', error)
      throw error
    }
  }

  // Delete flight
  async delete(id) {
    try {
      await api.client.delete(`${this.baseURL}${API_ENDPOINTS.FLIGHTS}/${id}`)
      return true
    } catch (error) {
      console.error('Error deleting flight:', error)
      throw error
    }
  }

  // Bulk upload flights from CSV
  async uploadCsv(file, options = {}) {
    try {
      const formData = new FormData()
      formData.append('file', file)

      if (options.skipValidation) {
        formData.append('skipValidation', 'true')
      }
      if (options.overwriteExisting) {
        formData.append('overwriteExisting', 'true')
      }

      const response = await api.client.post(
        `${this.baseURL}${API_ENDPOINTS.FLIGHT_UPLOAD}`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data'
          },
          timeout: 60000 // 60 seconds for file upload
        }
      )
      return response.data
    } catch (error) {
      console.error('Error uploading CSV:', error)
      throw error
    }
  }

  // Get flight statistics
  async getStats(params = {}) {
    try {
      const response = await api.client.get(`${this.baseURL}${API_ENDPOINTS.FLIGHT_STATS}`, {
        params: {
          startDate: params.startDate || '',
          endDate: params.endDate || '',
          airlineId: params.airlineId || '',
          type: params.type || '',
          groupBy: params.groupBy || 'day'
        }
      })
      return response.data
    } catch (error) {
      console.error('Error fetching flight stats:', error)
      throw error
    }
  }

  // Search flights
  async search(query, filters = {}) {
    try {
      const response = await api.client.get(`${this.baseURL}${API_ENDPOINTS.FLIGHTS}/search`, {
        params: {
          q: query,
          ...filters
        }
      })
      return response.data
    } catch (error) {
      console.error('Error searching flights:', error)
      throw error
    }
  }

  // Get flights by airline
  async getByAirline(airlineId, params = {}) {
    try {
      const response = await api.client.get(
        `${this.baseURL}${API_ENDPOINTS.FLIGHTS}/airline/${airlineId}`,
        { params }
      )
      return response.data
    } catch (error) {
      console.error('Error fetching flights by airline:', error)
      throw error
    }
  }

  // Get flights by route
  async getByRoute(originAirportId, destinationAirportId, params = {}) {
    try {
      const response = await api.client.get(
        `${this.baseURL}${API_ENDPOINTS.FLIGHTS}/route`,
        {
          params: {
            originAirportId,
            destinationAirportId,
            ...params
          }
        }
      )
      return response.data
    } catch (error) {
      console.error('Error fetching flights by route:', error)
      throw error
    }
  }

  // Get flights by aircraft
  async getByAircraft(aircraftId, params = {}) {
    try {
      const response = await api.client.get(
        `${this.baseURL}${API_ENDPOINTS.FLIGHTS}/aircraft/${aircraftId}`,
        { params }
      )
      return response.data
    } catch (error) {
      console.error('Error fetching flights by aircraft:', error)
      throw error
    }
  }

  // Get recent flights
  async getRecent(limit = 10) {
    try {
      const response = await api.client.get(`${this.baseURL}${API_ENDPOINTS.FLIGHTS}/recent`, {
        params: { limit }
      })
      return response.data
    } catch (error) {
      console.error('Error fetching recent flights:', error)
      throw error
    }
  }

  // Update flight status
  async updateStatus(id, status, notes = '') {
    try {
      const response = await api.client.patch(
        `${this.baseURL}${API_ENDPOINTS.FLIGHTS}/${id}/status`,
        { status, notes }
      )
      return response.data
    } catch (error) {
      console.error('Error updating flight status:', error)
      throw error
    }
  }

  // Cancel flight
  async cancel(id, reason = '') {
    try {
      const response = await api.client.patch(
        `${this.baseURL}${API_ENDPOINTS.FLIGHTS}/${id}/cancel`,
        { reason }
      )
      return response.data
    } catch (error) {
      console.error('Error cancelling flight:', error)
      throw error
    }
  }

  // Delay flight
  async delay(id, newDepartureTime, reason = '') {
    try {
      const response = await api.client.patch(
        `${this.baseURL}${API_ENDPOINTS.FLIGHTS}/${id}/delay`,
        {
          newDepartureTime,
          reason
        }
      )
      return response.data
    } catch (error) {
      console.error('Error delaying flight:', error)
      throw error
    }
  }

  // Get flight history/logs
  async getHistory(id) {
    try {
      const response = await api.client.get(`${this.baseURL}${API_ENDPOINTS.FLIGHTS}/${id}/history`)
      return response.data
    } catch (error) {
      console.error('Error fetching flight history:', error)
      throw error
    }
  }

  // Validate flight data
  async validate(flightData) {
    try {
      const response = await api.client.post(
        `${this.baseURL}${API_ENDPOINTS.FLIGHTS}/validate`,
        flightData
      )
      return response.data
    } catch (error) {
      console.error('Error validating flight data:', error)
      throw error
    }
  }

  // Check flight conflicts
  async checkConflicts(flightData) {
    try {
      const response = await api.client.post(
        `${this.baseURL}${API_ENDPOINTS.FLIGHTS}/check-conflicts`,
        flightData
      )
      return response.data
    } catch (error) {
      console.error('Error checking flight conflicts:', error)
      throw error
    }
  }

  // Get available time slots for aircraft
  async getAvailableSlots(aircraftId, date) {
    try {
      const response = await api.client.get(
        `${this.baseURL}${API_ENDPOINTS.FLIGHTS}/available-slots`,
        {
          params: { aircraftId, date }
        }
      )
      return response.data
    } catch (error) {
      console.error('Error fetching available slots:', error)
      throw error
    }
  }

  // Export flights to CSV
  async exportCsv(filters = {}) {
    try {
      const response = await api.client.get(
        `${this.baseURL}${API_ENDPOINTS.FLIGHTS}/export`,
        {
          params: filters,
          responseType: 'blob'
        }
      )
      return response.data
    } catch (error) {
      console.error('Error exporting flights:', error)
      throw error
    }
  }

  // Get flight template for CSV upload
  async getTemplate() {
    try {
      const response = await api.client.get(
        `${this.baseURL}${API_ENDPOINTS.FLIGHTS}/template`,
        { responseType: 'blob' }
      )
      return response.data
    } catch (error) {
      console.error('Error downloading template:', error)
      throw error
    }
  }
}

// Create and export singleton instance
export const flightService = new FlightService()
export default flightService
