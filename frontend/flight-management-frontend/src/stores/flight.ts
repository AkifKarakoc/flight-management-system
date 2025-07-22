import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { ElMessage } from 'element-plus'
import flightService from '@/services/flightService'
import { SUCCESS_MESSAGES, ERROR_MESSAGES } from '@/utils/constants'
import type {
  Flight,
  CreateFlightRequest,
  PaginatedResponse,
  ValidationResult,
  ConflictCheckResult,
  FlightStatus,
  FlightType
} from '@/types/index'


// Store Interface Types
interface FlightFilters {
  search: string
  airlineId: number | null
  originAirportId: number | null
  destinationAirportId: number | null
  flightDate: string
  status: FlightStatus | ''
  type: FlightType | ''
  sortBy: string
  sortDirection: 'asc' | 'desc'
}

interface FlightStats {
  totalFlights?: number
  activeFlights?: number
  delayedFlights?: number
  cancelledFlights?: number
  onTimePercentage?: number
  averageDelay?: number
    [key: string]: any
}

interface ActionLoading {
  [key: string]: boolean
}

interface UploadResult {
  successCount: number
  errorCount: number
  errors?: any[]
}

interface FlightValidation {
  valid: boolean
  errors: string[]
}

interface FlightConflicts {
  hasConflicts: boolean
  conflicts: any[]
}

interface SearchParams {
  page?: number
  size?: number
    [key: string]: any
}

export const useFlightStore = defineStore('flight', () => {
  // State
  const flights = ref<Flight[]>([])
  const currentFlight = ref<Flight | null>(null)
  const stats = ref<FlightStats>({})
  const recentFlights = ref<Flight[]>([])

  // Loading states
  const loading = ref<boolean>(false)
  const statsLoading = ref<boolean>(false)
  const uploadLoading = ref<boolean>(false)
  const actionLoading = ref<ActionLoading>({})

  // Pagination
  const currentPage = ref<number>(0)
  const pageSize = ref<number>(20)
  const totalElements = ref<number>(0)
  const totalPages = ref<number>(0)

  // Filters
  const filters = ref<FlightFilters>({
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
  const lastFetch = ref<number | null>(null)
  const cacheDuration = 2 * 60 * 1000 // 2 minutes

  // Computed
  const isLoading = computed((): boolean => loading.value)
  const hasFlights = computed((): boolean => flights.value.length > 0)

  const activeFlights = computed((): Flight[] =>
  flights.value.filter(flight =>
    !['CANCELLED', 'ARRIVED'].includes(flight.status || '')
  )
)

  const flightsByStatus = computed((): Record<string, Flight[]> => {
    const grouped: Record<string, Flight[]> = {}
    flights.value.forEach(flight => {
      const status = flight.status || 'UNKNOWN'
      if (!grouped[status]) {
        grouped[status] = []
      }
      grouped[status].push(flight)
    })
    return grouped
  })

  const flightsByAirline = computed((): Record<number, Flight[]> => {
    const grouped: Record<number, Flight[]> = {}
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
  const getFlightById = computed(() => (id: number): Flight | undefined => {
    return flights.value.find(flight => flight.id === id)
  })

  const getFlightsByAirline = computed(() => (airlineId: number): Flight[] => {
    return flights.value.filter(flight => flight.airlineId === airlineId)
  })

  const getFlightsByRoute = computed(() => (originId: number, destinationId: number): Flight[] => {
    return flights.value.filter(flight =>
      flight.originAirportId === originId &&
      flight.destinationAirportId === destinationId
    )
  })

  const getFlightsByStatus = computed(() => (status: FlightStatus): Flight[] => {
    return flights.value.filter(flight => flight.status === status)
  })

  // Actions
  async function fetchFlights(params: SearchParams = {}, force: boolean = false): Promise<PaginatedResponse<Flight>> {
    // Check cache
    if (!force && lastFetch.value && Date.now() - lastFetch.value < cacheDuration) {
      // Cache'den dönerken PaginatedResponse formatında döndür
      return {
        content: flights.value,
        totalElements: totalElements.value,
        totalPages: totalPages.value,
        number: currentPage.value,
        size: pageSize.value,
        first: currentPage.value === 0,
        last: currentPage.value === totalPages.value - 1,
        empty: flights.value.length === 0
      }
    }

    loading.value = true

    try {
      const queryParams = {
        page: params.page ?? currentPage.value,
        size: params.size ?? pageSize.value,
        search: filters.value.search,
        airlineId: filters.value.airlineId,
        originAirportId: filters.value.originAirportId,
        destinationAirportId: filters.value.destinationAirportId,
        flightDate: filters.value.flightDate,
        status: filters.value.status,
        type: filters.value.type,
        sortBy: filters.value.sortBy,
        sortDirection: filters.value.sortDirection
      } as any

      const response: PaginatedResponse<Flight> = await flightService.getAll(queryParams)

      // Handle paginated response
      flights.value = response.content
      totalElements.value = response.totalElements
      totalPages.value = response.totalPages
      currentPage.value = response.number

      lastFetch.value = Date.now()
      return response  // ✅ PaginatedResponse döndür

    } catch (error: any) {
      console.error('Error fetching flights:', error)
      ElMessage.error('Uçuşlar yüklenirken hata oluştu')
      throw error
    } finally {
      loading.value = false
    }
  }

  async function fetchFlightById(id: number, force: boolean = false): Promise<Flight> {
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

    } catch (error: any) {
      console.error('Error fetching flight:', error)
      ElMessage.error('Uçuş detayları yüklenirken hata oluştu')
      throw error
    } finally {
      loading.value = false
    }
  }

  async function createFlight(flightData: CreateFlightRequest): Promise<Flight> {
    loading.value = true

    try {
      const newFlight = await flightService.create(flightData)

      // Add to beginning of list
      flights.value.unshift(newFlight)
      totalElements.value++

      ElMessage.success(SUCCESS_MESSAGES.CREATED)
      return newFlight

    } catch (error: any) {
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

  async function updateFlight(id: number, flightData: Partial<CreateFlightRequest>): Promise<Flight> {
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

    } catch (error: any) {
      console.error('Error updating flight:', error)
      ElMessage.error('Uçuş güncellenirken hata oluştu')
      throw error
    } finally {
      loading.value = false
    }
  }

  async function deleteFlight(id: number): Promise<void> {
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

    } catch (error: any) {
      console.error('Error deleting flight:', error)
      ElMessage.error('Uçuş silinirken hata oluştu')
      throw error
    } finally {
      loading.value = false
    }
  }

  async function uploadFlights(file: File, options: Record<string, any> = {}): Promise<UploadResult> {
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

    } catch (error: any) {
      console.error('Error uploading flights:', error)
      ElMessage.error('Uçuş yüklemesi sırasında hata oluştu')
      throw error
    } finally {
      uploadLoading.value = false
    }
  }

  async function updateFlightStatus(id: number, status: FlightStatus, notes: string = ''): Promise<Flight> {
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

    } catch (error: any) {
      console.error('Error updating flight status:', error)
      ElMessage.error('Uçuş durumu güncellenirken hata oluştu')
      throw error
    } finally {
      delete actionLoading.value[loadingKey]
    }
  }

  async function cancelFlight(id: number, reason: string = ''): Promise<Flight> {
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

    } catch (error: any) {
      console.error('Error cancelling flight:', error)
      ElMessage.error('Uçuş iptal edilirken hata oluştu')
      throw error
    } finally {
      delete actionLoading.value[loadingKey]
    }
  }

  async function delayFlight(id: number, newDepartureTime: string, reason: string = ''): Promise<Flight> {
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

    } catch (error: any) {
      console.error('Error delaying flight:', error)
      ElMessage.error('Uçuş geciktirilirken hata oluştu')
      throw error
    } finally {
      delete actionLoading.value[loadingKey]
    }
  }

  async function fetchStats(params: Record<string, any> = {}): Promise<FlightStats> {
    statsLoading.value = true

    try {
      const statsData = await flightService.getStats(params)
      stats.value = statsData
      return statsData

    } catch (error: any) {
      console.error('Error fetching flight stats:', error)
      ElMessage.error('İstatistikler yüklenirken hata oluştu')
      throw error
    } finally {
      statsLoading.value = false
    }
  }

  async function fetchRecentFlights(limit: number = 10): Promise<Flight[]> {
    try {
      const recent = await flightService.getRecent(limit)
      recentFlights.value = recent
      return recent

    } catch (error: any) {
      console.error('Error fetching recent flights:', error)
      ElMessage.error('Son uçuşlar yüklenirken hata oluştu')
      throw error
    }
  }

  async function searchFlights(query: string, searchFilters: Record<string, any> = {}): Promise<PaginatedResponse<Flight>> {
    loading.value = true

    try {
      const results = await flightService.search(query, searchFilters)

      // Service'den gelen sonucu PaginatedResponse formatına dönüştür
      if (Array.isArray(results)) {
        // Eğer results bir array ise, PaginatedResponse formatına çevir
        return {
          content: results,
          totalElements: results.length,
          totalPages: 1,
          number: 0,
          size: results.length,
          first: true,
          last: true,
          empty: results.length === 0
        }
      } else {
        // Eğer zaten PaginatedResponse formatındaysa direkt döndür
        return results
      }

    } catch (error: any) {
      console.error('Error searching flights:', error)
      ElMessage.error('Uçuş arama sırasında hata oluştu')
      throw error
    } finally {
      loading.value = false
    }
  }

  async function validateFlight(flightData: CreateFlightRequest): Promise<ValidationResult> {
    try {
      const validation = await flightService.validate(flightData)
      return {
        valid: validation.valid,
        errors: validation.errors || []  // ✅ Type uyumu sağla
      } as ValidationResult
    } catch (error: any) {
      console.error('Error validating flight:', error)
      throw error
    }
  }

  async function checkConflicts(flightData: CreateFlightRequest): Promise<ConflictCheckResult> {
    try {
      const conflicts = await flightService.checkConflicts(flightData)
      return {
        hasConflict: conflicts.hasConflict ?? false,  // ✅ hasConflicts yerine hasConflict
        conflicts: conflicts.conflicts || []
      } as ConflictCheckResult
    } catch (error: any) {
      console.error('Error checking conflicts:', error)
      throw error
    }
  }

  async function exportFlights(exportFilters: Record<string, any> = {}): Promise<void> {
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

    } catch (error: any) {
      console.error('Error exporting flights:', error)
      ElMessage.error('Dışa aktarma sırasında hata oluştu')
      throw error
    } finally {
      loading.value = false
    }
  }

  async function downloadTemplate(): Promise<void> {
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

    } catch (error: any) {
      console.error('Error downloading template:', error)
      ElMessage.error('Şablon dosyası indirilirken hata oluştu')
      throw error
    }
  }

  // Filter management
  function setFilters(newFilters: Partial<FlightFilters>): void {
    filters.value = { ...filters.value, ...newFilters }
  }

  function resetFilters(): void {
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

  function setCurrentPage(page: number): void {
    currentPage.value = page
  }

  function setPageSize(size: number): void {
    pageSize.value = size
    currentPage.value = 0 // Reset to first page
  }

  // Cache management
  function invalidateCache(): void {
    lastFetch.value = null
  }

  function clearFlights(): void {
    flights.value = []
    currentFlight.value = null
    totalElements.value = 0
    totalPages.value = 0
    currentPage.value = 0
  }

  function clearCurrentFlight(): void {
    currentFlight.value = null
  }

  // Utility functions
  function isActionLoading(action: string, id: number): boolean {
    return actionLoading.value[`${action}_${id}`] || false
  }

  function getFlightStatusText(status: FlightStatus): string {
    const statusMap: Record<FlightStatus, string> = {
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

  function getFlightTypeText(type: FlightType): string {
    const typeMap: Record<FlightType, string> = {
      'PASSENGER': 'Yolcu',
      'CARGO': 'Kargo',
      'POSITIONING': 'Pozisyon',
      'FERRY': 'Ferry',
      'TRAINING': 'Eğitim'
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
