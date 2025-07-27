import { flightAPI } from './api'
import { FLIGHT_STATUS } from '@/utils/constants'

class FlightService {

  // ========================
  // BASIC CRUD OPERATIONS
  // ========================

  async getAllFlights(params = {}) {
    const response = await flightAPI.get('/api/v1/flights', { params })
    return response.data
  }

  async getFlightById(id) {
    const response = await flightAPI.get(`/api/v1/flights/${id}`)
    return response.data
  }

  async createFlight(flightData) {
    const response = await flightAPI.post('/api/v1/flights', flightData)
    return response.data
  }

  async updateFlight(id, flightData) {
    const response = await flightAPI.put(`/api/v1/flights/${id}`, flightData)
    return response.data
  }

  async deleteFlight(id) {
    await flightAPI.delete(`/api/v1/flights/${id}`)
  }

  // ========================
  // FLIGHT STATUS MANAGEMENT
  // ========================

  async updateFlightStatus(id, status) {
    const response = await flightAPI.put(`/api/v1/flights/${id}/status`, null, {
      params: { status }
    })
    return response.data
  }

  async recordFlightDelay(id, delayMinutes, reason = null) {
    const response = await flightAPI.put(`/api/v1/flights/${id}/delay`, null, {
      params: { delayMinutes, reason }
    })
    return response.data
  }

  // ========================
  // FILTERING & SEARCH
  // ========================

  async getFlightsByDate(date) {
    const response = await flightAPI.get(`/api/v1/flights/date/${date}`)
    return response.data
  }

  async getFlightsByAirline(airlineId) {
    const response = await flightAPI.get(`/api/v1/flights/airline/${airlineId}`)
    return response.data
  }

  async getFlightsByAirport(airportId) {
    const response = await flightAPI.get(`/api/v1/flights/airport/${airportId}`)
    return response.data
  }

  async getFlightsByStatus(status) {
    const response = await flightAPI.get(`/api/v1/flights/status/${status}`)
    return response.data
  }

  async getDelayedFlights(minDelayMinutes = 15) {
    const response = await flightAPI.get('/api/v1/flights/delayed', {
      params: { minDelayMinutes }
    })
    return response.data
  }

  async getFlightsByRoute(routeId, date = null) {
    const params = date ? { date } : {}
    const response = await flightAPI.get(`/api/v1/flights/route/${routeId}`, { params })
    return response.data
  }

  async getFlightsByRoutePaged(routeId, params = {}) {
    const response = await flightAPI.get(`/api/v1/flights/route/${routeId}/paged`, { params })
    return response.data
  }

  // ========================
  // CONNECTING FLIGHTS
  // ========================

  async createConnectingFlight(connectingFlightData) {
    const response = await flightAPI.post('/api/v1/flights/connecting', connectingFlightData)
    return response.data
  }

  async getConnectingFlightDetails(mainFlightId) {
    const response = await flightAPI.get(`/api/v1/flights/connecting/${mainFlightId}`)
    return response.data
  }

  async getFlightSegments(mainFlightId) {
    const response = await flightAPI.get(`/api/v1/flights/${mainFlightId}/segments`)
    return response.data
  }

  async updateConnectingFlight(mainFlightId, connectingFlightData) {
    const response = await flightAPI.put(`/api/v1/flights/connecting/${mainFlightId}`, connectingFlightData)
    return response.data
  }

  async deleteConnectingFlight(mainFlightId) {
    await flightAPI.delete(`/api/v1/flights/connecting/${mainFlightId}`)
  }

  async getConnectingFlights(params = {}) {
    const response = await flightAPI.get('/api/v1/flights/connecting', { params })
    return response.data
  }

  async updateFlightSegment(segmentId, flightData) {
    const response = await flightAPI.put(`/api/v1/flights/segments/${segmentId}`, flightData)
    return response.data
  }

  async updateSegmentStatus(segmentId, status, reason = null) {
    const params = reason ? { status, reason } : { status }
    const response = await flightAPI.patch(`/api/v1/flights/segments/${segmentId}/status`, null, { params })
    return response.data
  }

  // ========================
  // BULK OPERATIONS
  // ========================

  async bulkStatusUpdate(flightIds, status, reason = null) {
    const params = reason ? { flightIds, status, reason } : { flightIds, status }
    const response = await flightAPI.post('/api/v1/flights/bulk-status-update', null, { params })
    return response.data
  }

  async bulkDeleteFlights(flightIds, force = false) {
    const params = { flightIds, force }
    const response = await flightAPI.delete('/api/v1/flights/bulk-delete', { params })
    return response.data
  }

  // ========================
  // SEARCH & FILTER
  // ========================

  async searchFlights(filters = {}) {
    const response = await flightAPI.get('/api/v1/flights/search', { params: filters })
    return response.data
  }

  async filterFlights(filters = {}) {
    const response = await flightAPI.get('/api/v1/flights/filter', { params: filters })
    return response.data
  }

  // ========================
  // STATISTICS & ANALYTICS
  // ========================

  async getFlightCounts(date = null) {
    const params = date ? { date } : {}
    const response = await flightAPI.get('/api/v1/flights/count', { params })
    return response.data
  }

  async getFlightStats() {
    const response = await flightAPI.get('/api/v1/flights/stats')
    return response.data
  }

  async getSystemInfo() {
    const response = await flightAPI.get('/api/v1/flights/system-info')
    return response.data
  }

  async getMigrationStatus() {
    const response = await flightAPI.get('/api/v1/flights/migration-status')
    return response.data
  }

  // ========================
  // CSV UPLOAD
  // ========================

  async uploadFlightsCSV(file) {
    const formData = new FormData()
    formData.append('file', file)

    const response = await flightAPI.post('/api/v1/flights/upload-csv', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })

    return response.data
  }

  async validateCsv(file) {
    const formData = new FormData()
    formData.append('file', file)

    const response = await flightAPI.post('/api/v1/flights/validate-csv', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })

    return response.data
  }

  async getCsvTemplate() {
    const response = await flightAPI.get('/api/v1/flights/csv-template')
    return response.data
  }

  // ========================
  // ROUTE INFORMATION
  // ========================

  async getFlightRouteInfo(flightId) {
    const response = await flightAPI.get(`/api/v1/flights/${flightId}/route-info`)
    return response.data
  }

  // ========================
  // HEALTH CHECK
  // ========================

  async healthCheck() {
    const response = await flightAPI.get('/api/v1/flights/health')
    return response.data
  }

  // ========================
  // LEGACY METHODS (for backward compatibility)
  // ========================

  async getFlightCountByDate(date) {
    const counts = await this.getFlightCounts(date)
    return counts.totalFlights || 0
  }

  async getFlightCountByAirlineAndDate(airlineId, date) {
    const flights = await this.getFlightsByAirline(airlineId)
    return flights.filter(f => f.flightDate === date).length
  }

  async getFlightCountByStatusAndDate(status, date) {
    const flights = await this.getFlightsByStatus(status)
    return flights.filter(f => f.flightDate === date).length
  }

  async getDashboardStats(date) {
    const [counts, delayedFlights] = await Promise.all([
      this.getFlightCounts(date),
      this.getDelayedFlights(15)
    ])

    return {
      totalFlights: counts.totalFlights || 0,
      scheduledFlights: counts.scheduledFlights || 0,
      departedFlights: counts.departedFlights || 0,
      arrivedFlights: counts.arrivedFlights || 0,
      cancelledFlights: counts.cancelledFlights || 0,
      delayedFlights: delayedFlights.length,
      onTimePercentage: counts.onTimePercentage || 0
    }
  }

  async getChartData(startDate, endDate) {
    // This would need to be implemented based on backend analytics endpoints
    const response = await flightAPI.get('/api/v1/flights/stats/chart', {
      params: { startDate, endDate }
    })
    return response.data
  }

  async getFlightTypeDistribution() {
    const response = await flightAPI.get('/api/v1/flights/stats/type-distribution')
    return response.data
  }

  async getTodayFlights() {
    const today = new Date().toISOString().split('T')[0]
    return this.getFlightsByDate(today)
  }

  async getTodayFlightStats() {
    const today = new Date().toISOString().split('T')[0]
    return this.getDashboardStats(today)
  }

  async getDashboardKPIs() {
    const today = new Date().toISOString().split('T')[0]
    const [counts, delayedFlights, stats] = await Promise.all([
      this.getFlightCounts(today),
      this.getDelayedFlights(15),
      this.getFlightStats()
    ])

    return {
      totalFlights: counts.totalFlights || 0,
      activeFlights: counts.activeFlights || 0,
      delayedFlights: delayedFlights.length,
      onTimePercentage: counts.onTimePercentage || 0,
      averageDelay: stats.averageDelay || 0,
      completionRate: stats.completionRate || 0
    }
  }

  // ========================
  // VALIDATION
  // ========================

  validateFlightData(flightData) {
    const errors = []

    if (!flightData.flightNumber) {
      errors.push('Flight number is required')
    } else if (!/^[A-Z]{2}\d{1,4}$/.test(flightData.flightNumber)) {
      errors.push('Flight number must be in format: TK123')
    }

    if (!flightData.airlineId) {
      errors.push('Airline is required')
    }

    if (!flightData.aircraftId) {
      errors.push('Aircraft is required')
    }

    if (!flightData.routeId) {
      errors.push('Route is required')
    }

    if (!flightData.flightDate) {
      errors.push('Flight date is required')
    }

    if (!flightData.scheduledDeparture) {
      errors.push('Scheduled departure is required')
    }

    if (!flightData.scheduledArrival) {
      errors.push('Scheduled arrival is required')
    }

    if (!flightData.type) {
      errors.push('Flight type is required')
    }

    if (flightData.scheduledDeparture && flightData.scheduledArrival) {
      const departure = new Date(flightData.scheduledDeparture)
      const arrival = new Date(flightData.scheduledArrival)
      if (arrival <= departure) {
        errors.push('Arrival time must be after departure time')
      }
    }

    return errors
  }
}

export default new FlightService()
