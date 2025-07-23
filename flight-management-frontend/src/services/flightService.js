import { flightAPI } from './api'
import { FLIGHT_STATUS } from '@/utils/constants'

class FlightService {

  // ========================
  // BASIC CRUD OPERATIONS
  // ========================

  async getAllFlights(params = {}) {
    const response = await flightAPI.get('/flights', { params })
    return response.data
  }

  async getFlightById(id) {
    const response = await flightAPI.get(`/flights/${id}`)
    return response.data
  }

  async createFlight(flightData) {
    const response = await flightAPI.post('/flights', flightData)
    return response.data
  }

  async updateFlight(id, flightData) {
    const response = await flightAPI.put(`/flights/${id}`, flightData)
    return response.data
  }

  async deleteFlight(id) {
    await flightAPI.delete(`/flights/${id}`)
  }

  // ========================
  // FLIGHT STATUS MANAGEMENT
  // ========================

  async updateFlightStatus(id, status) {
    const response = await flightAPI.put(`/flights/${id}/status`, null, {
      params: { status }
    })
    return response.data
  }

  async recordFlightDelay(id, delayMinutes, reason = null) {
    const response = await flightAPI.put(`/flights/${id}/delay`, null, {
      params: { delayMinutes, reason }
    })
    return response.data
  }

  // ========================
  // FILTERING & SEARCH
  // ========================

  async getFlightsByDate(date) {
    const response = await flightAPI.get(`/flights/date/${date}`)
    return response.data
  }

  async getFlightsByAirline(airlineId) {
    const response = await flightAPI.get(`/flights/airline/${airlineId}`)
    return response.data
  }

  async getFlightsByAirport(airportId) {
    const response = await flightAPI.get(`/flights/airport/${airportId}`)
    return response.data
  }

  async getFlightsByStatus(status) {
    const response = await flightAPI.get(`/flights/status/${status}`)
    return response.data
  }

  async getDelayedFlights(minDelayMinutes = 15) {
    const response = await flightAPI.get('/flights/delayed', {
      params: { minDelayMinutes }
    })
    return response.data
  }

  // ========================
  // CSV UPLOAD
  // ========================

  async uploadFlightsCSV(file) {
    const formData = new FormData()
    formData.append('file', file)

    const response = await flightAPI.post('/flights/upload-csv', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })

    return response.data
  }

  // ========================
  // STATISTICS & DASHBOARD
  // ========================

  async getFlightCountByDate(date) {
    const response = await flightAPI.get(`/flights/stats/count/date/${date}`)
    return response.data
  }

  async getFlightCountByAirlineAndDate(airlineId, date) {
    const response = await flightAPI.get(`/flights/stats/count/airline/${airlineId}/date/${date}`)
    return response.data
  }

  async getFlightCountByStatusAndDate(status, date) {
    const response = await flightAPI.get(`/flights/stats/count/status/${status}/date/${date}`)
    return response.data
  }

  async getDashboardStats(date) {
    const response = await flightAPI.get(`/flights/stats/dashboard/${date}`)
    return response.data
  }

  async getChartData(startDate, endDate) {
    const response = await flightAPI.get('/flights/stats/chart-data', {
      params: { start: startDate, end: endDate }
    })
    return response.data
  }

  async getFlightTypeDistribution() {
    const response = await flightAPI.get('/flights/stats/type-distribution')
    return response.data
  }

  // ========================
  // UTILITY METHODS
  // ========================

  /**
   * Get today's flights with status breakdown
   */
  async getTodayFlights() {
    const today = new Date().toISOString().split('T')[0]
    return await this.getFlightsByDate(today)
  }

  /**
   * Get flight status statistics for today
   */
  async getTodayFlightStats() {
    const today = new Date().toISOString().split('T')[0]

    try {
      const [totalCount, scheduledCount, departedCount, arrivedCount, delayedCount, cancelledCount] = await Promise.all([
        this.getFlightCountByDate(today),
        this.getFlightCountByStatusAndDate(FLIGHT_STATUS.SCHEDULED, today),
        this.getFlightCountByStatusAndDate(FLIGHT_STATUS.DEPARTED, today),
        this.getFlightCountByStatusAndDate(FLIGHT_STATUS.ARRIVED, today),
        this.getFlightCountByStatusAndDate(FLIGHT_STATUS.DELAYED, today),
        this.getFlightCountByStatusAndDate(FLIGHT_STATUS.CANCELLED, today)
      ])

      return {
        total: totalCount,
        scheduled: scheduledCount,
        departed: departedCount,
        arrived: arrivedCount,
        delayed: delayedCount,
        cancelled: cancelledCount
      }
    } catch (error) {
      console.error('Error fetching today flight stats:', error)
      return {
        total: 0,
        scheduled: 0,
        departed: 0,
        arrived: 0,
        delayed: 0,
        cancelled: 0
      }
    }
  }

  /**
   * Get flight statistics for dashboard
   */
  async getDashboardKPIs() {
    try {
      const today = new Date().toISOString().split('T')[0]
      const stats = await this.getDashboardStats(today)

      return {
        scheduledFlights: stats.scheduledFlights || 0,
        activeFlights: (stats.departedFlights || 0) - (stats.arrivedFlights || 0),
        completedFlights: stats.arrivedFlights || 0,
        delayedFlights: stats.delayedFlights || 0,
        onTimePerformance: stats.onTimePerformance || 0,
        cancellationRate: stats.cancellationRate || 0
      }
    } catch (error) {
      console.error('Error fetching dashboard KPIs:', error)
      return {
        scheduledFlights: 0,
        activeFlights: 0,
        completedFlights: 0,
        delayedFlights: 0,
        onTimePerformance: 0,
        cancellationRate: 0
      }
    }
  }

  /**
   * Search flights with filters
   */
  async searchFlights(filters = {}) {
    const {
      flightNumber,
      airlineId,
      originAirportId,
      destinationAirportId,
      status,
      startDate,
      endDate,
      page = 0,
      size = 20,
      sort
    } = filters

    const params = {}

    if (flightNumber) params.flightNumber = flightNumber
    if (airlineId) params.airlineId = airlineId
    if (originAirportId) params.originAirportId = originAirportId
    if (destinationAirportId) params.destinationAirportId = destinationAirportId
    if (status) params.status = status
    if (startDate) params.startDate = startDate
    if (endDate) params.endDate = endDate
    if (page !== undefined) params.page = page
    if (size !== undefined) params.size = size
    if (sort) params.sort = sort

    const response = await flightAPI.get('/flights/search', { params })
    return response.data
  }

  /**
   * Validate flight data before submission
   */
  validateFlightData(flightData) {
    const errors = []

    if (!flightData.flightNumber?.trim()) {
      errors.push('Uçuş numarası gereklidir')
    }

    if (!flightData.airlineId) {
      errors.push('Havayolu seçimi gereklidir')
    }

    if (!flightData.aircraftId) {
      errors.push('Uçak seçimi gereklidir')
    }

    if (!flightData.originAirportId) {
      errors.push('Kalkış havalimanı seçimi gereklidir')
    }

    if (!flightData.destinationAirportId) {
      errors.push('Varış havalimanı seçimi gereklidir')
    }

    if (flightData.originAirportId === flightData.destinationAirportId) {
      errors.push('Kalkış ve varış havalimanı aynı olamaz')
    }

    if (!flightData.flightDate) {
      errors.push('Uçuş tarihi gereklidir')
    }

    if (!flightData.scheduledDeparture) {
      errors.push('Planlanan kalkış zamanı gereklidir')
    }

    if (!flightData.scheduledArrival) {
      errors.push('Planlanan varış zamanı gereklidir')
    }

    if (flightData.scheduledDeparture && flightData.scheduledArrival) {
      const departure = new Date(flightData.scheduledDeparture)
      const arrival = new Date(flightData.scheduledArrival)

      if (arrival <= departure) {
        errors.push('Varış zamanı kalkış zamanından sonra olmalıdır')
      }
    }

    if (!flightData.type) {
      errors.push('Uçuş tipi seçimi gereklidir')
    }

    return errors
  }
}

// Singleton instance
const flightService = new FlightService()
export default flightService
