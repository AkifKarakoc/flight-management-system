import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import flightService from '@/services/flightService'

export const useFlightStore = defineStore('flights', () => {
  // State
  const flights = ref([])
  const currentFlight = ref(null)
  const loading = ref(false)
  const kpiData = ref({
    scheduledFlights: 0,
    activeFlights: 0,
    completedFlights: 0,
    delayedFlights: 0,
    onTimePerformance: 0,
    cancellationRate: 0
  })

  // Pagination & Filtering
  const pagination = ref({
    page: 0,
    size: 20,
    total: 0,
    totalPages: 0
  })

  const filters = ref({
    flightNumber: '',
    airlineId: null,
    originAirportId: null,
    destinationAirportId: null,
    status: '',
    startDate: '',
    endDate: ''
  })

  // Getters
  const flightsList = computed(() => flights.value)

  const flightsByStatus = computed(() => {
    const grouped = {}
    flights.value.forEach(flight => {
      const status = flight.status || 'UNKNOWN'
      if (!grouped[status]) {
        grouped[status] = []
      }
      grouped[status].push(flight)
    })
    return grouped
  })

  const todayFlights = computed(() => {
    const today = new Date().toISOString().split('T')[0]
    return flights.value.filter(flight =>
      flight.flightDate === today
    )
  })

  // Actions - Basic CRUD
  const loadFlights = async (params = {}) => {
    loading.value = true
    try {
      const response = await flightService.getAllFlights({
        page: pagination.value.page,
        size: pagination.value.size,
        ...params
      })

      // Handle both paginated and non-paginated responses
      if (response.content) {
        flights.value = response.content
        pagination.value.total = response.totalElements
        pagination.value.totalPages = response.totalPages
      } else {
        flights.value = response || []
        pagination.value.total = flights.value.length
        pagination.value.totalPages = Math.ceil(flights.value.length / pagination.value.size)
      }

      return flights.value
    } catch (error) {
      console.error('Error loading flights:', error)
      flights.value = []
      return []
    } finally {
      loading.value = false
    }
  }

  const loadFlightById = async (id) => {
    loading.value = true
    try {
      const flight = await flightService.getFlightById(id)
      currentFlight.value = flight
      return flight
    } catch (error) {
      console.error('Error loading flight:', error)
      currentFlight.value = null
      throw error
    } finally {
      loading.value = false
    }
  }

  const createFlight = async (flightData) => {
    loading.value = true
    try {
      const newFlight = await flightService.createFlight(flightData)
      flights.value.unshift(newFlight)
      return newFlight
    } catch (error) {
      console.error('Error creating flight:', error)
      throw error
    } finally {
      loading.value = false
    }
  }

  const updateFlight = async (id, flightData) => {
    loading.value = true
    try {
      const updatedFlight = await flightService.updateFlight(id, flightData)
      const index = flights.value.findIndex(f => f.id === id)
      if (index !== -1) {
        flights.value[index] = updatedFlight
      }
      if (currentFlight.value?.id === id) {
        currentFlight.value = updatedFlight
      }
      return updatedFlight
    } catch (error) {
      console.error('Error updating flight:', error)
      throw error
    } finally {
      loading.value = false
    }
  }

  const deleteFlight = async (id) => {
    loading.value = true
    try {
      await flightService.deleteFlight(id)
      flights.value = flights.value.filter(f => f.id !== id)
      if (currentFlight.value?.id === id) {
        currentFlight.value = null
      }
    } catch (error) {
      console.error('Error deleting flight:', error)
      throw error
    } finally {
      loading.value = false
    }
  }

  // Actions - Status Management
  const updateFlightStatus = async (id, status) => {
    try {
      const updatedFlight = await flightService.updateFlightStatus(id, status)
      const index = flights.value.findIndex(f => f.id === id)
      if (index !== -1) {
        flights.value[index] = updatedFlight
      }
      if (currentFlight.value?.id === id) {
        currentFlight.value = updatedFlight
      }
      return updatedFlight
    } catch (error) {
      console.error('Error updating flight status:', error)
      throw error
    }
  }

  const recordFlightDelay = async (id, delayMinutes, reason) => {
    try {
      const updatedFlight = await flightService.recordFlightDelay(id, delayMinutes, reason)
      const index = flights.value.findIndex(f => f.id === id)
      if (index !== -1) {
        flights.value[index] = updatedFlight
      }
      if (currentFlight.value?.id === id) {
        currentFlight.value = updatedFlight
      }
      return updatedFlight
    } catch (error) {
      console.error('Error recording flight delay:', error)
      throw error
    }
  }

  // Actions - Filtering & Search
  const searchFlights = async (searchFilters = {}) => {
    loading.value = true
    try {
      const mergedFilters = { ...filters.value, ...searchFilters }
      const response = await flightService.searchFlights({
        ...mergedFilters,
        page: pagination.value.page,
        size: pagination.value.size
      })

      if (response.content) {
        flights.value = response.content
        pagination.value.total = response.totalElements
        pagination.value.totalPages = response.totalPages
      } else {
        flights.value = response || []
      }

      return flights.value
    } catch (error) {
      console.error('Error searching flights:', error)
      flights.value = []
      return []
    } finally {
      loading.value = false
    }
  }

  const loadFlightsByDate = async (date) => {
    loading.value = true
    try {
      const dateFlights = await flightService.getFlightsByDate(date)
      flights.value = dateFlights || []
      return flights.value
    } catch (error) {
      console.error('Error loading flights by date:', error)
      flights.value = []
      return []
    } finally {
      loading.value = false
    }
  }

  const loadDelayedFlights = async (minDelayMinutes = 15) => {
    loading.value = true
    try {
      const delayedFlights = await flightService.getDelayedFlights(minDelayMinutes)
      flights.value = delayedFlights || []
      return flights.value
    } catch (error) {
      console.error('Error loading delayed flights:', error)
      flights.value = []
      return []
    } finally {
      loading.value = false
    }
  }

  // Actions - CSV Upload
  const uploadFlightsCSV = async (file) => {
    loading.value = true
    try {
      const result = await flightService.uploadFlightsCSV(file)
      // Refresh flights list after upload
      await loadFlights()
      return result
    } catch (error) {
      console.error('Error uploading flights CSV:', error)
      throw error
    } finally {
      loading.value = false
    }
  }

  // Actions - Dashboard & KPIs
  const loadDashboardKPIs = async () => {
    try {
      const kpis = await flightService.getDashboardKPIs()
      kpiData.value = kpis
      return kpis
    } catch (error) {
      console.error('Error loading dashboard KPIs:', error)
      kpiData.value = {
        scheduledFlights: 0,
        activeFlights: 0,
        completedFlights: 0,
        delayedFlights: 0,
        onTimePerformance: 0,
        cancellationRate: 0
      }
      return kpiData.value
    }
  }

  const loadFlightStats = async (date = null) => {
    try {
      const targetDate = date || new Date().toISOString().split('T')[0]
      const stats = await flightService.getTodayFlightStats()
      return stats
    } catch (error) {
      console.error('Error loading flight stats:', error)
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

  // Actions - Pagination
  const setPage = (page) => {
    pagination.value.page = page
  }

  const setPageSize = (size) => {
    pagination.value.size = size
    pagination.value.page = 0 // Reset to first page
  }

  const nextPage = () => {
    if (pagination.value.page < pagination.value.totalPages - 1) {
      pagination.value.page++
    }
  }

  const prevPage = () => {
    if (pagination.value.page > 0) {
      pagination.value.page--
    }
  }

  // Actions - Filters
  const setFilters = (newFilters) => {
    filters.value = { ...filters.value, ...newFilters }
    pagination.value.page = 0 // Reset to first page when filtering
  }

  const clearFilters = () => {
    filters.value = {
      flightNumber: '',
      airlineId: null,
      originAirportId: null,
      destinationAirportId: null,
      status: '',
      startDate: '',
      endDate: ''
    }
    pagination.value.page = 0
  }

  // Utility Actions
  const refreshFlights = async () => {
    return await loadFlights()
  }

  const clearCurrentFlight = () => {
    currentFlight.value = null
  }

  const validateFlightData = (flightData) => {
    return flightService.validateFlightData(flightData)
  }

  // Real-time updates (will be connected to WebSocket)
  const handleFlightUpdate = (updatedFlight) => {
    const index = flights.value.findIndex(f => f.id === updatedFlight.id)
    if (index !== -1) {
      flights.value[index] = updatedFlight
    }
    if (currentFlight.value?.id === updatedFlight.id) {
      currentFlight.value = updatedFlight
    }
  }

  const handleFlightCreate = (newFlight) => {
    flights.value.unshift(newFlight)
  }

  const handleFlightDelete = (flightId) => {
    flights.value = flights.value.filter(f => f.id !== flightId)
    if (currentFlight.value?.id === flightId) {
      currentFlight.value = null
    }
  }

  return {
    // State
    flights,
    currentFlight,
    loading,
    kpiData,
    pagination,
    filters,

    // Getters
    flightsList,
    flightsByStatus,
    todayFlights,

    // Actions - Basic CRUD
    loadFlights,
    loadFlightById,
    createFlight,
    updateFlight,
    deleteFlight,

    // Actions - Status Management
    updateFlightStatus,
    recordFlightDelay,

    // Actions - Filtering & Search
    searchFlights,
    loadFlightsByDate,
    loadDelayedFlights,

    // Actions - CSV Upload
    uploadFlightsCSV,

    // Actions - Dashboard & KPIs
    loadDashboardKPIs,
    loadFlightStats,

    // Actions - Pagination
    setPage,
    setPageSize,
    nextPage,
    prevPage,

    // Actions - Filters
    setFilters,
    clearFilters,

    // Utility Actions
    refreshFlights,
    clearCurrentFlight,
    validateFlightData,

    // Real-time handlers
    handleFlightUpdate,
    handleFlightCreate,
    handleFlightDelete
  }
})
