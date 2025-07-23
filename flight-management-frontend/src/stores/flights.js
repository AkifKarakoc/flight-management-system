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
      const allFlights = await flightService.getAllFlights()

      if (!allFlights || !Array.isArray(allFlights)) {
        console.error('Invalid flights data received:', allFlights)
        flights.value = []
        pagination.value.total = 0
        pagination.value.totalPages = 0
        return []
      }

      // Apply sorting if provided
      let sortedFlights = [...allFlights]
      if (params.sort) {
        const sortField = params.sort.startsWith('-') ? params.sort.slice(1) : params.sort
        const sortDirection = params.sort.startsWith('-') ? 'desc' : 'asc'

        sortedFlights.sort((a, b) => {
          const aVal = a[sortField]
          const bVal = b[sortField]

          if (sortDirection === 'asc') {
            return aVal > bVal ? 1 : -1
          } else {
            return aVal < bVal ? 1 : -1
          }
        })
      }

      console.log('Total flights loaded:', sortedFlights.length)
      console.log('Current page:', pagination.value.page, 'Size:', pagination.value.size)

      // Client-side pagination
      const total = sortedFlights.length
      const startIndex = pagination.value.page * pagination.value.size
      const endIndex = startIndex + pagination.value.size
      flights.value = sortedFlights.slice(startIndex, endIndex)

      pagination.value.total = total
      pagination.value.totalPages = Math.ceil(total / pagination.value.size)

      console.log('Flights after pagination:', flights.value.length)
      console.log('Pagination:', pagination.value)

      return flights.value
    } catch (error) {
      console.error('Error loading flights:', error)
      flights.value = []
      pagination.value.total = 0
      pagination.value.totalPages = 0
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
      // Clean up empty values
      const cleanFilters = {}
      Object.keys(searchFilters).forEach(key => {
        if (searchFilters[key] !== '' && searchFilters[key] !== null && searchFilters[key] !== undefined) {
          cleanFilters[key] = searchFilters[key]
        }
      })

      // Store current filters
      filters.value = { ...filters.value, ...cleanFilters }

      const response = await flightService.searchFlights({
        ...cleanFilters,
        page: pagination.value.page,
        size: pagination.value.size
      })

      if (response && response.content) {
        flights.value = response.content
        pagination.value.total = response.totalElements || 0
        pagination.value.totalPages = response.totalPages || 0
      } else if (Array.isArray(response)) {
        flights.value = response
        pagination.value.total = response.length
        pagination.value.totalPages = Math.ceil(response.length / pagination.value.size)
      } else {
        flights.value = []
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
  const setPage = async (page) => {
    console.log('setPage called with:', page)
    pagination.value.page = page

    // Aktif filtre var mı kontrol et
    const hasActiveFilters = Object.keys(filters.value).some(key =>
      filters.value[key] !== '' && filters.value[key] !== null && filters.value[key] !== undefined
    )

    console.log('Has active filters:', hasActiveFilters, 'Filters:', filters.value)

    if (hasActiveFilters) {
      // Filtreler varsa search kullan
      console.log('Using searchFlights')
      await searchFlights(filters.value)
    } else {
      // Filtre yoksa normal load
      console.log('Using loadFlights')
      await loadFlights()
    }
  }

  const setPageSize = async (size) => {
    pagination.value.size = size
    pagination.value.page = 0 // Reset to first page

    // Aktif filtre var mı kontrol et
    const hasActiveFilters = Object.keys(filters.value).some(key =>
      filters.value[key] !== '' && filters.value[key] !== null && filters.value[key] !== undefined
    )

    if (hasActiveFilters) {
      // Filtreler varsa search kullan
      await searchFlights(filters.value)
    } else {
      // Filtre yoksa normal load
      await loadFlights()
    }
  }

  const nextPage = async () => {
    if (pagination.value.page < pagination.value.totalPages - 1) {
      await setPage(pagination.value.page + 1)
    }
  }

  const prevPage = async () => {
    if (pagination.value.page > 0) {
      await setPage(pagination.value.page - 1)
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
    console.log('refreshFlights called')

    // Filtreleri temizle ve ilk sayfaya dön
    clearFilters()

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
