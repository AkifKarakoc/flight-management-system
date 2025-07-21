import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { ElMessage } from 'element-plus'
import flightService from '@/services/flightService'
import { SUCCESS_MESSAGES, ERROR_MESSAGES } from '@/utils/constants'

export const useFlightStore = defineStore('flight', () => {
  // State
  const flights = ref([])
  const currentFlight = ref(null)
  const stats = ref({})
  const recentFlights = ref([])

  // Loading states
  const loading = ref(false)
  const statsLoading = ref(false)
  const uploadLoading = ref(false)
  const actionLoading = ref({})

  // Pagination
  const currentPage = ref(0)
  const pageSize = ref(20)
  const totalElements = ref(0)
  const totalPages = ref(0)

  // Filters
  const filters = ref({
    search: '',
    airlineId: null,
    originAirportId: null,
    destinationAirportId: null,
    flightDate: '',
    status: '',
    type: '',
    sortBy: 'scheduledDeparture',
    sortDirection: 'desc'
  })

  // Cache
  const lastFetch = ref(null)
  const cacheDuration = 2 * 60 * 1000 // 2 minutes

  // Computed
  const isLoading = computed(() => loading.value)
  const hasFlights = computed(() => flights.value.length > 0)
  const activeFlights = computed(() =>
    flights.value.filter(flight =>
      !['CANCELLED', 'ARRIVED'].includes(flight.status)
    )
  )

  const flightsByStatus = computed(() => {
    const grouped = {}
    flights.value.forEach(flight => {
      if (!grouped[flight.status]) {
        grouped[flight.status] = []
      }
      grouped[flight.status].push(flight)
    })
    return grouped
  })

  const flightsByAirline = computed(() => {
    const grouped = {}
    flights.value.forEach(flight => {
      const airlineId = flight.airlineId
      if (!grouped[airlineId]) {
        grouped[airlineId] = []
      }
      grouped[airlineId].push(flight)
    })
    return grouped
  })

  // Getters
  const getFlightById = computed(() => (id) => {
    return flights.value.find(flight => flight.id === id)
  })

  const getFlightsByAirline = computed(() => (airlineId) => {
    return flights.value.filter(flight => flight.airlineId === airlineId)
  })

  const getFlightsByRoute = computed(() => (originId, destinationId) => {
    return flights.value.filter(flight =>
      flight.originAirportId === originId &&
      flight.destinationAirportId === destinationId
    )
  })

  const getFlightsByStatus = computed(() => (status) => {
    return flights.value.filter(flight => flight.status === status)
  })

  // Actions
  async function fetchFlights(params = {}, force = false) {
    // Check cache
    if (!force && lastFetch.value && Date.now() - lastFetch.value < cacheDuration) {
      return flights.value
    }

    loading.value = true

    try {
      const queryParams = {
        page: params.page ?? currentPage.value,
        size: params.size ?? pageSize.value,
        ...filters.value,
        ...params
      }

      const response = await flightService.getAll(queryParams)

      // Handle paginated response
      if (response.content) {
        flights.value = response.content
        totalElements.value = response.totalElements
        totalPages.value = response.totalPages
        currentPage.value = response.number
      } else {
        flights.value = Array.isArray(response) ? response : []
      }

      lastFetch.value = Date.now()
      return flights.value

    } catch (error) {
      console.error('Error fetching flights:', error)
      ElMessage.error('Uçuşlar yüklenirken hata oluştu')
      throw error
    } finally {
      loading.value = false
    }
  }

  async function fetchFlightById(id, force = false) {
    // Check if already in cache
    if (!force && currentFlight.value?.id === id) {
      return currentFlight.value
    }

    loading.value = true

    try {
      const flight = await flightService.getById(id)
      currentFlight.value = flight

      // Update flight in list if exists
      const index = flights.value.findIndex(f => f.id === id)
      if (index !== -1) {
        flights.value[index] = flight
      }

      return flight

    } catch (error) {
      console.error('Error fetching flight:', error)
      ElMessage.error('Uçuş detayları yüklenirken hata oluştu')
      throw error
    } finally {
      loading.value = false
    }
  }

  async function createFlight(flightData) {
    loading.value = true

    try {
      const newFlight = await flightService.create(flightData)

      // Add to beginning of list
      flights.value.unshift(newFlight)
      totalElements.value++

      ElMessage.success(SUCCESS_MESSAGES.CREATED)
      return newFlight

    } catch (error) {
      console.error('Error creating flight:', error)

      if (error.response?.status === 409) {
        ElMessage.error('Bu uçuş numarası ve tarihte zaten bir uçuş mevcut')
      } else {
        ElMessage.error('Uçuş oluşturulurken hata oluştu')
      }

      throw error
    } finally {
      loading.value = false
    }
  }

  async function updateFlight(id, flightData) {
    loading.value = true

    try {
      const updatedFlight = await flightService.update(id, flightData)

      // Update in list
      const index = flights.value.findIndex(f => f.id === id)
      if (index !== -1) {
        flights.value[index] = updatedFlight
      }

      // Update current flight if it's the same
      if (currentFlight.value?.id === id) {
        currentFlight.value = updatedFlight
      }

      ElMessage.success(SUCCESS_MESSAGES.UPDATED)
      return updatedFlight

    } catch (error) {
      console.error('Error updating flight:', error)
      ElMessage.error('Uçuş güncellenirken hata oluştu')
      throw error
    } finally {
      loading.value = false
    }
  }

  async function deleteFlight(id) {
    loading.value = true

    try {
      await flightService.delete(id)

      // Remove from list
      const index = flights.value.findIndex(f => f.id === id)
      if (index !== -1) {
        flights.value.splice(index, 1)
        totalElements.value--
      }

      // Clear current flight if it's the same
      if (currentFlight.value?.id === id) {
        currentFlight.value = null
      }

      ElMessage.success(SUCCESS_MESSAGES.DELETED)

    } catch (error) {
      console.error('Error deleting flight:', error)
      ElMessage.error('Uçuş silinirken hata oluştu')
      throw error
    } finally {
      loading.value = false
    }
  }

  async function uploadFlights(file, options = {}) {
    uploadLoading.value = true

    try {
      const result = await flightService.uploadCsv(file, options)

      // Refresh flights list
      await fetchFlights({}, true)

      ElMessage.success(`${result.successCount} uçuş başarıyla yüklendi`)

      if (result.errorCount > 0) {
        ElMessage.warning(`${result.errorCount} uçuş yüklenemedi`)
      }

      return result

    } catch (error) {
      console.error('Error uploading flights:', error)
      ElMessage.error('Uçuş yüklemesi sırasında hata oluştu')
      throw error
    } finally {
      uploadLoading.value = false
    }
  }

  async function updateFlightStatus(id, status, notes = '') {
    const loadingKey = `status_${id}`
    actionLoading.value[loadingKey] = true

    try {
      const updatedFlight = await flightService.updateStatus(id, status, notes)

      // Update in list
      const index = flights.value.findIndex(f => f.id === id)
      if (index !== -1) {
        flights.value[index] = updatedFlight
      }

      // Update current flight if it's the same
      if (currentFlight.value?.id === id) {
        currentFlight.value = updatedFlight
      }

      ElMessage.success('Uçuş durumu güncellendi')
      return updatedFlight

    } catch (error) {
      console.error('Error updating flight status:', error)
      ElMessage.error('Uçuş durumu güncellenirken hata oluştu')
      throw error
    } finally {
      delete actionLoading.value[loadingKey]
    }
  }

  async function cancelFlight(id, reason = '') {
    const loadingKey = `cancel_${id}`
    actionLoading.value[loadingKey] = true

    try {
      const updatedFlight = await flightService.cancel(id, reason)

      // Update in list
      const index = flights.value.findIndex(f => f.id === id)
      if (index !== -1) {
        flights.value[index] = updatedFlight
      }

      ElMessage.success('Uçuş iptal edildi')
      return updatedFlight

    } catch (error) {
      console.error('Error cancelling flight:', error)
      ElMessage.error('Uçuş iptal edilirken hata oluştu')
      throw error
    } finally {
      delete actionLoading.value[loadingKey]
    }
  }

  async function delayFlight(id, newDepartureTime, reason = '') {
    const loadingKey = `delay_${id}`
    actionLoading.value[loadingKey] = true

    try {
      const updatedFlight = await flightService.delay(id, newDepartureTime, reason)

      // Update in list
      const index = flights.value.findIndex(f => f.id === id)
      if (index !== -1) {
        flights.value[index] = updatedFlight
      }

      ElMessage.success('Uçuş geciktirildi')
      return updatedFlight

    } catch (error) {
      console.error('Error delaying flight:', error)
      ElMessage.error('Uçuş geciktirilirken hata oluştu')
      throw error
    } finally {
      delete actionLoading.value[loadingKey]
    }
  }

  async function fetchStats(params = {}) {
    statsLoading.value = true

    try {
      const statsData = await flightService.getStats(params)
      stats.value = statsData
      return statsData

    } catch (error) {
      console.error('Error fetching flight stats:', error)
      ElMessage.error('İstatistikler yüklenirken hata oluştu')
      throw error
    } finally {
      statsLoading.value = false
    }
  }

  async function fetchRecentFlights(limit = 10) {
    try {
      const recent = await flightService.getRecent(limit)
      recentFlights.value = recent
      return recent

    } catch (error) {
      console.error('Error fetching recent flights:', error)
      ElMessage.error('Son uçuşlar yüklenirken hata oluştu')
      throw error
    }
  }

  async function searchFlights(query, searchFilters = {}) {
    loading.value = true

    try {
      const results = await flightService.search(query, searchFilters)
      return results

    } catch (error) {
      console.error('Error searching flights:', error)
      ElMessage.error('Uçuş arama sırasında hata oluştu')
      throw error
    } finally {
      loading.value = false
    }
  }

  async function validateFlight(flightData) {
    try {
      const validation = await flightService.validate(flightData)
      return validation

    } catch (error) {
      console.error('Error validating flight:', error)
      throw error
    }
  }

  async function checkConflicts(flightData) {
    try {
      const conflicts = await flightService.checkConflicts(flightData)
      return conflicts

    } catch (error) {
      console.error('Error checking conflicts:', error)
      throw error
    }
  }

  async function exportFlights(exportFilters = {}) {
    loading.value = true

    try {
      const blob = await flightService.exportCsv(exportFilters)

      // Create download link
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `flights_${new Date().toISOString().split('T')[0]}.csv`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)

      ElMessage.success('Uçuşlar başarıyla dışa aktarıldı')

    } catch (error) {
      console.error('Error exporting flights:', error)
      ElMessage.error('Dışa aktarma sırasında hata oluştu')
      throw error
    } finally {
      loading.value = false
    }
  }

  async function downloadTemplate() {
    try {
      const blob = await flightService.getTemplate()

      // Create download link
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = 'flight_upload_template.csv'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)

      ElMessage.success('Şablon dosyası indirildi')

    } catch (error) {
      console.error('Error downloading template:', error)
      ElMessage.error('Şablon dosyası indirilirken hata oluştu')
      throw error
    }
  }

  // Filter management
  function setFilters(newFilters) {
    filters.value = { ...filters.value, ...newFilters }
  }

  function resetFilters() {
    filters.value = {
      search: '',
      airlineId: null,
      originAirportId: null,
      destinationAirportId: null,
      flightDate: '',
      status: '',
      type: '',
      sortBy: 'scheduledDeparture',
      sortDirection: 'desc'
    }
  }

  function setCurrentPage(page) {
    currentPage.value = page
  }

  function setPageSize(size) {
    pageSize.value = size
    currentPage.value = 0 // Reset to first page
  }

  // Cache management
  function invalidateCache() {
    lastFetch.value = null
  }

  function clearFlights() {
    flights.value = []
    currentFlight.value = null
    totalElements.value = 0
    totalPages.value = 0
    currentPage.value = 0
  }

  function clearCurrentFlight() {
    currentFlight.value = null
  }

  // Utility functions
  function isActionLoading(action, id) {
    return actionLoading.value[`${action}_${id}`] || false
  }

  function getFlightStatusText(status) {
    const statusMap = {
      'SCHEDULED': 'Planlandı',
      'BOARDING': 'Biniş',
      'DEPARTED': 'Kalktı',
      'IN_FLIGHT': 'Uçuşta',
      'ARRIVED': 'İndi',
      'CANCELLED': 'İptal',
      'DELAYED': 'Gecikti'
    }
    return statusMap[status] || status
  }

  function getFlightTypeText(type) {
    const typeMap = {
      'PASSENGER': 'Yolcu',
      'CARGO': 'Kargo',
      'DOMESTIC': 'İç Hat',
      'INTERNATIONAL': 'Dış Hat'
    }
    return typeMap[type] || type
  }

  return {
    // State
    flights,
    currentFlight,
    stats,
    recentFlights,
    loading,
    statsLoading,
    uploadLoading,
    actionLoading,
    currentPage,
    pageSize,
    totalElements,
    totalPages,
    filters,
    lastFetch,

    // Computed
    isLoading,
    hasFlights,
    activeFlights,
    flightsByStatus,
    flightsByAirline,
    getFlightById,
    getFlightsByAirline,
    getFlightsByRoute,
    getFlightsByStatus,

    // Actions
    fetchFlights,
    fetchFlightById,
    createFlight,
    updateFlight,
    deleteFlight,
    uploadFlights,
    updateFlightStatus,
    cancelFlight,
    delayFlight,
    fetchStats,
    fetchRecentFlights,
    searchFlights,
    validateFlight,
    checkConflicts,
    exportFlights,
    downloadTemplate,
    setFilters,
    resetFilters,
    setCurrentPage,
    setPageSize,
    invalidateCache,
    clearFlights,
    clearCurrentFlight,
    isActionLoading,
    getFlightStatusText,
    getFlightTypeText
  }
})
