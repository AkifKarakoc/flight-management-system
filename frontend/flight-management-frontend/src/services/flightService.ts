import apiService from './api'
import { API_ENDPOINTS, API_BASE_URLS } from '@/utils/constants'
import type {
  Flight,
  CreateFlightRequest,
  PaginatedResponse,
  SearchParams
} from '@/types'

// Flight-specific types
interface FlightSearchParams extends SearchParams {
  airlineId?: number | string
  originAirportId?: number | string
  destinationAirportId?: number | string
  flightDate?: string
  status?: string
  type?: 'PASSENGER' | 'CARGO' | 'POSITIONING'
  filters?: Record<string, any>
}

interface FlightStatsParams {
  startDate?: string
  endDate?: string
  airlineId?: number | string
  type?: 'PASSENGER' | 'CARGO' | 'POSITIONING'
  groupBy?: 'day' | 'week' | 'month' | 'year'
}

interface FlightStatsResponse {
  totalFlights: number
  completedFlights: number
  cancelledFlights: number
  delayedFlights: number
  averageDelay: number
  onTimePercentage: number
  chartData?: {
    labels: string[]
    datasets: Array<{
      label: string
      data: number[]
      backgroundColor?: string
      borderColor?: string
    }>
  }
}

interface CSVUploadOptions {
  skipValidation?: boolean
  overwriteExisting?: boolean
  testMode?: boolean
}

interface CSVUploadResult {
  success: boolean
  message: string
  processedCount: number
  successCount: number
  errorCount: number
  errors?: Array<{
    row: number
    field: string
    message: string
    value: any
  }>
  warnings?: Array<{
    row: number
    message: string
  }>
}

interface ValidationResult {
  valid: boolean
  errors: Array<{
    field: string
    message: string
    value: any
  }>
  warnings?: Array<{
    field: string
    message: string
    value: any
  }>
}

interface ConflictCheckResult {
  hasConflict: boolean
  conflicts: Array<{
    type: 'AIRCRAFT_BUSY' | 'GATE_OCCUPIED' | 'CREW_UNAVAILABLE' | 'ROUTE_CLOSED'
    message: string
    conflictingFlightId?: number
    suggestedAlternatives?: Array<{
      field: string
      value: any
      reason: string
    }>
  }>
}

interface AvailableSlot {
  startTime: string
  endTime: string
  duration: number
  available: boolean
  reason?: string
}

interface FlightHistory {
  id: number
  flightId: number
  eventType: 'CREATED' | 'UPDATED' | 'STATUS_CHANGED' | 'CANCELLED' | 'DELAYED'
  oldValues?: Record<string, any>
  newValues?: Record<string, any>
  timestamp: string
  userId?: number
  notes?: string
}

// Flight status types
type FlightStatus =
| 'SCHEDULED'
| 'BOARDING'
| 'DEPARTED'
| 'IN_FLIGHT'
| 'ARRIVED'
| 'CANCELLED'
| 'DELAYED'

class FlightService {
  private readonly baseURL: string

  constructor() {
    this.baseURL = API_BASE_URLS.FLIGHT_SERVICE
  }

  // Get all flights with filtering and pagination
  async getAll(params: FlightSearchParams = {}): Promise<PaginatedResponse<Flight>> {
  try {
  const response = await apiService.flight.get<PaginatedResponse<Flight>>(
    API_ENDPOINTS.FLIGHTS,
      {
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
      }
  )
  return response.data
} catch (error) {
  console.error('Error fetching flights:', error)
  throw error
}
}

// Get flight by ID
async getById(id: number): Promise<Flight> {
  try {
    const response = await apiService.flight.get<Flight>(`${API_ENDPOINTS.FLIGHTS}/${id}`)
    return response.data
  } catch (error) {
    console.error('Error fetching flight:', error)
    throw error
  }
}

// Create new flight
async create(flightData: CreateFlightRequest): Promise<Flight> {
  try {
    const response = await apiService.flight.post<Flight>(API_ENDPOINTS.FLIGHTS, flightData)
    return response.data
  } catch (error) {
    console.error('Error creating flight:', error)
    throw error
  }
}

// Update existing flight
async update(id: number, flightData: Partial<CreateFlightRequest>): Promise<Flight> {
  try {
    const response = await apiService.flight.put<Flight>(
      `${API_ENDPOINTS.FLIGHTS}/${id}`,
        flightData
    )
    return response.data
  } catch (error) {
    console.error('Error updating flight:', error)
    throw error
  }
}

// Delete flight
async delete(id: number): Promise<boolean> {
  try {
    await apiService.flight.delete(`${API_ENDPOINTS.FLIGHTS}/${id}`)
    return true
  } catch (error) {
    console.error('Error deleting flight:', error)
    throw error
  }
}

// Bulk upload flights from CSV
async uploadCsv(file: File, options: CSVUploadOptions = {}): Promise<CSVUploadResult> {
  try {
    const formData = new FormData()
    formData.append('file', file)

    if (options.skipValidation) {
  formData.append('skipValidation', 'true')
}
if (options.overwriteExisting) {
  formData.append('overwriteExisting', 'true')
}
if (options.testMode) {
  formData.append('testMode', 'true')
}

const response = await apiService.flight.post<CSVUploadResult>(
  API_ENDPOINTS.FLIGHT_UPLOAD,
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
async getStats(params: FlightStatsParams = {}): Promise<FlightStatsResponse> {
  try {
    const response = await apiService.flight.get<FlightStatsResponse>(
      API_ENDPOINTS.FLIGHT_STATS,
        {
          params: {
            startDate: params.startDate || '',
            endDate: params.endDate || '',
            airlineId: params.airlineId || '',
            type: params.type || '',
            groupBy: params.groupBy || 'day'
          }
        }
    )
    return response.data
  } catch (error) {
    console.error('Error fetching flight stats:', error)
    throw error
  }
}

// Search flights
async search(query: string, filters: Record<string, any> = {}): Promise<PaginatedResponse<Flight>> {
  try {
    const response = await apiService.flight.get<PaginatedResponse<Flight>>(
      `${API_ENDPOINTS.FLIGHTS}/search`,
        {
          params: {
            q: query,
            ...filters
          }
        }
    )
    return response.data
  } catch (error) {
    console.error('Error searching flights:', error)
    throw error
  }
}

// Get flights by airline
async getByAirline(airlineId: number, params: SearchParams = {}): Promise<PaginatedResponse<Flight>> {
  try {
    const response = await apiService.flight.get<PaginatedResponse<Flight>>(
      `${API_ENDPOINTS.FLIGHTS}/airline/${airlineId}`,
        { params }
    )
    return response.data
  } catch (error) {
    console.error('Error fetching flights by airline:', error)
    throw error
  }
}

// Get flights by route
async getByRoute(
  originAirportId: number,
  destinationAirportId: number,
  params: SearchParams = {}
): Promise<PaginatedResponse<Flight>> {
  try {
    const response = await apiService.flight.get<PaginatedResponse<Flight>>(
      `${API_ENDPOINTS.FLIGHTS}/route`,
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
async getByAircraft(aircraftId: number, params: SearchParams = {}): Promise<PaginatedResponse<Flight>> {
  try {
    const response = await apiService.flight.get<PaginatedResponse<Flight>>(
      `${API_ENDPOINTS.FLIGHTS}/aircraft/${aircraftId}`,
        { params }
    )
    return response.data
  } catch (error) {
    console.error('Error fetching flights by aircraft:', error)
    throw error
  }
}

// Get recent flights
async getRecent(limit: number = 10): Promise<Flight[]> {
  try {
    const response = await apiService.flight.get<Flight[]>(
      `${API_ENDPOINTS.FLIGHTS}/recent`,
        {
          params: { limit }
        }
    )
    return response.data
  } catch (error) {
    console.error('Error fetching recent flights:', error)
    throw error
  }
}

// Update flight status
async updateStatus(id: number, status: FlightStatus, notes: string = ''): Promise<Flight> {
  try {
    const response = await apiService.flight.patch<Flight>(
      `${API_ENDPOINTS.FLIGHTS}/${id}/status`,
        { status, notes }
    )
    return response.data
  } catch (error) {
    console.error('Error updating flight status:', error)
    throw error
  }
}

// Cancel flight
async cancel(id: number, reason: string = ''): Promise<Flight> {
  try {
    const response = await apiService.flight.patch<Flight>(
      `${API_ENDPOINTS.FLIGHTS}/${id}/cancel`,
        { reason }
    )
    return response.data
  } catch (error) {
    console.error('Error cancelling flight:', error)
    throw error
  }
}

// Delay flight
async delay(id: number, newDepartureTime: string, reason: string = ''): Promise<Flight> {
  try {
    const response = await apiService.flight.patch<Flight>(
      `${API_ENDPOINTS.FLIGHTS}/${id}/delay`,
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
async getHistory(id: number): Promise<FlightHistory[]> {
  try {
    const response = await apiService.flight.get<FlightHistory[]>(
      `${API_ENDPOINTS.FLIGHTS}/${id}/history`
    )
    return response.data
  } catch (error) {
    console.error('Error fetching flight history:', error)
    throw error
  }
}

// Validate flight data
async validate(flightData: CreateFlightRequest): Promise<ValidationResult> {
  try {
    const response = await apiService.flight.post<ValidationResult>(
      `${API_ENDPOINTS.FLIGHTS}/validate`,
        flightData
    )
    return response.data
  } catch (error) {
    console.error('Error validating flight data:', error)
    throw error
  }
}

// Check flight conflicts
async checkConflicts(flightData: CreateFlightRequest): Promise<ConflictCheckResult> {
  try {
    const response = await apiService.flight.post<ConflictCheckResult>(
      `${API_ENDPOINTS.FLIGHTS}/check-conflicts`,
        flightData
    )
    return response.data
  } catch (error) {
    console.error('Error checking flight conflicts:', error)
    throw error
  }
}

// Get available time slots for aircraft
async getAvailableSlots(aircraftId: number, date: string): Promise<AvailableSlot[]> {
  try {
    const response = await apiService.flight.get<AvailableSlot[]>(
      `${API_ENDPOINTS.FLIGHTS}/available-slots`,
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
async exportCsv(filters: Record<string, any> = {}): Promise<Blob> {
  try {
    const response = await apiService.flight.get(
      `${API_ENDPOINTS.FLIGHTS}/export`,
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
async getTemplate(): Promise<Blob> {
  try {
    const response = await apiService.flight.get(
      `${API_ENDPOINTS.FLIGHTS}/template`,
      { responseType: 'blob' }
    )
    return response.data
  } catch (error) {
    console.error('Error downloading template:', error)
    throw error
  }
}

// Batch operations
async batchUpdate(updates: Array<{ id: number; data: Partial<CreateFlightRequest> }>): Promise<{
  success: number
  failed: number
  errors: Array<{ id: number; error: string }>
}> {
  try {
    const response = await apiService.flight.post(
      `${API_ENDPOINTS.FLIGHTS}/batch-update`,
      { updates }
    )
    return response.data
  } catch (error) {
    console.error('Error batch updating flights:', error)
    throw error
  }
}

async batchDelete(ids: number[]): Promise<{
  success: number
  failed: number
  errors: Array<{ id: number; error: string }>
}> {
  try {
    const response = await apiService.flight.post(
      `${API_ENDPOINTS.FLIGHTS}/batch-delete`,
      { ids }
    )
    return response.data
  } catch (error) {
    console.error('Error batch deleting flights:', error)
    throw error
  }
}

// Advanced search with complex filters
async advancedSearch(filters: {
  flightNumber?: string
  airlineIds?: number[]
  aircraftIds?: number[]
  originAirportIds?: number[]
  destinationAirportIds?: number[]
  dateRange?: {
    start: string
    end: string
  }
  timeRange?: {
    start: string
    end: string
  }
  statuses?: FlightStatus[]
  types?: Array<'PASSENGER' | 'CARGO' | 'POSITIONING'>
  passengerCountRange?: {
    min: number
    max: number
  }
  delayThreshold?: number
}): Promise<PaginatedResponse<Flight>> {
  try {
    const response = await apiService.flight.post<PaginatedResponse<Flight>>(
      `${API_ENDPOINTS.FLIGHTS}/advanced-search`,
        filters
    )
    return response.data
  } catch (error) {
    console.error('Error in advanced search:', error)
    throw error
  }
}

// Get flight performance metrics
async getPerformanceMetrics(
  flightId?: number,
  timeRange?: { start: string; end: string }
): Promise<{
  onTimePerformance: number
  averageDelay: number
  cancellationRate: number
  loadFactor: number
  fuelEfficiency?: number
  punctualityTrend: Array<{
    date: string
    onTime: number
    delayed: number
    cancelled: number
  }>
}> {
  try {
    const response = await apiService.flight.get(
      `${API_ENDPOINTS.FLIGHTS}/performance-metrics`,
      {
        params: {
          flightId,
          ...timeRange
        }
      }
    )
    return response.data
  } catch (error) {
    console.error('Error fetching performance metrics:', error)
    throw error
  }
}

// Real-time flight tracking
async getFlightTracking(flightNumber: string, date?: string): Promise<{
  currentLocation?: {
    latitude: number
    longitude: number
    altitude: number
    speed: number
    heading: number
  }
  estimatedArrival?: string
  actualDeparture?: string
  flightPath?: Array<{
      latitude: number
      longitude: number
      timestamp: string
      altitude: number
    }>
    status: FlightStatus
lastUpdate: string
}> {
  try {
    const response = await apiService.flight.get(
      `${API_ENDPOINTS.FLIGHTS}/tracking/${flightNumber}`,
      {
        params: { date }
      }
    )
    return response.data
  } catch (error) {
    console.error('Error fetching flight tracking:', error)
    throw error
  }
}

// Utility methods
async validateFlightNumber(flightNumber: string): Promise<{
  valid: boolean
  suggestions?: string[]
  reason?: string
}> {
  try {
    const response = await apiService.flight.get(
      `${API_ENDPOINTS.FLIGHTS}/validate-flight-number`,
      {
        params: { flightNumber }
      }
    )
    return response.data
  } catch (error) {
    console.error('Error validating flight number:', error)
    throw error
  }
}

async calculateFlightTime(
  originAirportId: number,
  destinationAirportId: number,
  aircraftType?: string
): Promise<{
  estimatedFlightTime: number
  distance: number
  route?: string
}> {
  try {
    const response = await apiService.flight.get(
      `${API_ENDPOINTS.FLIGHTS}/calculate-flight-time`,
      {
        params: {
          originAirportId,
          destinationAirportId,
          aircraftType
        }
      }
    )
    return response.data
  } catch (error) {
    console.error('Error calculating flight time:', error)
    throw error
  }
}
}

// Create and export singleton instance
export const flightService = new FlightService()

// Export types for external use
export type {
  FlightSearchParams,
    FlightStatsParams,
    FlightStatsResponse,
    CSVUploadOptions,
    CSVUploadResult,
    ValidationResult,
    ConflictCheckResult,
    AvailableSlot,
    FlightHistory,
    FlightStatus
}

// Export class for testing
export { FlightService }

// Export default instance
export default flightService
