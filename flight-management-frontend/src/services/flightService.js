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
    try {
      const response = await flightAPI.get(`/flights/stats/dashboard/${date}`)
      return response.data
    } catch (error) {
      // Endpoint mevcut değilse temel stats'i manuel olarak hesapla
      console.warn('Dashboard endpoint not available, calculating basic stats')

      try {
        const [scheduled, departed, arrived, delayed, cancelled] = await Promise.all([
          this.getFlightCountByStatusAndDate('SCHEDULED', date),
          this.getFlightCountByStatusAndDate('DEPARTED', date),
          this.getFlightCountByStatusAndDate('ARRIVED', date),
          this.getFlightCountByStatusAndDate('DELAYED', date),
          this.getFlightCountByStatusAndDate('CANCELLED', date)
        ])

        const total = scheduled + departed + arrived + delayed + cancelled

        return {
          totalFlights: total,
          scheduledFlights: scheduled,
          departedFlights: departed,
          arrivedFlights: arrived,
          delayedFlights: delayed,
          cancelledFlights: cancelled,
          onTimePerformance: total > 0 ? ((total - delayed) / total * 100) : 0,
          cancellationRate: total > 0 ? (cancelled / total * 100) : 0
        }
      } catch (fallbackError) {
        console.error('Error in fallback stats calculation:', fallbackError)
        throw error
      }
    }
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
        scheduledFlights: stats.scheduled || stats.scheduledFlights || 0,
        activeFlights: (stats.departed || stats.departedFlights || 0) - (stats.arrived || stats.arrivedFlights || 0),
        completedFlights: stats.arrived || stats.arrivedFlights || 0,
        delayedFlights: stats.delayed || stats.delayedFlights || 0,
        onTimePerformance: stats.onTimePerformance || 0,
        cancellationRate: stats.cancellationRate || 0
      }
    } catch (error) {
      console.error('Error fetching dashboard KPIs:', error)

      // Fallback: Tüm uçuşları say
      try {
        console.log('Trying fallback: getting all flights')
        const allFlights = await this.getAllFlights()
        console.log('All flights count:', allFlights?.length || 0)

        return {
          scheduledFlights: allFlights?.length || 0,
          activeFlights: 0,
          completedFlights: 0,
          delayedFlights: 0,
          onTimePerformance: 0,
          cancellationRate: 0
        }
      } catch (fallbackError) {
        console.error('Fallback also failed:', fallbackError)
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
  }

  /**
   * Search flights with filters
   */
  /**
   * Search flights with filters using existing endpoints
   */
  async searchFlights(filters = {}) {
    const {
      flightNumber,
      airlineId,
      originAirportId,
      destinationAirportId,
      status,
      flightDate,
      page = 0,
      size = 20
    } = filters

    try {
      let flights = []

      // Filtreleme öncelik sırası:
      // 1. Tarih filtresine göre getir (en spesifik)
      if (flightDate) {
        flights = await this.getFlightsByDate(flightDate)
      }
      // 2. Havayolu filtresine göre getir
      else if (airlineId) {
        flights = await this.getFlightsByAirline(parseInt(airlineId))
      }
      // 3. Havaalanı filtresine göre getir
      else if (originAirportId || destinationAirportId) {
        const airportId = originAirportId || destinationAirportId
        flights = await this.getFlightsByAirport(parseInt(airportId))
      }
      // 4. Durum filtresine göre getir
      else if (status) {
        const statusArray = status.split(',')
        if (statusArray.length === 1) {
          flights = await this.getFlightsByStatus(statusArray[0])
        } else {
          // Multiple status - get all and filter client-side
          flights = await this.getAllFlights()
          flights = flights.filter(flight => statusArray.includes(flight.status))
        }
      }
      // 5. Hiç filtre yoksa tümünü getir
      else {
        flights = await this.getAllFlights()
      }

      // Client-side filtering for additional filters
      if (flightNumber) {
        flights = flights.filter(flight =>
          flight.flightNumber?.toLowerCase().includes(flightNumber.toLowerCase())
        )
      }

      // Havayolu filtresi - eğer tarih ile beraber kullanılıyorsa
      if (airlineId && flightDate) {
        flights = flights.filter(flight => flight.airlineId === parseInt(airlineId))
      }

      // Origin/Destination airport filters - diğer filtrelerle beraber kullanılıyorsa
      if (originAirportId && (flightDate || airlineId || status)) {
        flights = flights.filter(flight => flight.originAirportId === parseInt(originAirportId))
      }

      if (destinationAirportId && (flightDate || airlineId || status)) {
        flights = flights.filter(flight => flight.destinationAirportId === parseInt(destinationAirportId))
      }

      // Status filter - diğer filtrelerle beraber kullanılıyorsa
      if (status && (flightDate || airlineId)) {
        const statusArray = status.split(',')
        flights = flights.filter(flight => statusArray.includes(flight.status))
      }

      // Client-side pagination
      const total = flights.length
      const startIndex = page * size
      const endIndex = startIndex + size
      const paginatedFlights = flights.slice(startIndex, endIndex)

      return {
        content: paginatedFlights,
        totalElements: total,
        totalPages: Math.ceil(total / size),
        size: size,
        number: page
      }

    } catch (error) {
      console.error('Error searching flights:', error)
      throw error
    }
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
