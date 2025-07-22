import apiService from './api'
import { API_ENDPOINTS } from '@/utils/constants'
import type {
  Airline,
  CreateAirlineRequest,
  Airport,
  CreateAirportRequest,
  Aircraft,
  CreateAircraftRequest,
  Route,
  CreateRouteRequest,
  CrewMember,
  CreateCrewMemberRequest,
  PaginatedResponse,
  SearchParams
} from '@/types'

// Generic CRUD interface for all reference entities
interface CrudOperations<TEntity, TCreateRequest, TUpdateRequest = Partial<TCreateRequest>> {
  getAll: (params?: SearchParams) => Promise<PaginatedResponse<TEntity>>
getById: (id: number) => Promise<TEntity>
  create: (data: TCreateRequest) => Promise<TEntity>
  update: (id: number, data: TUpdateRequest) => Promise<TEntity>
  delete: (id: number) => Promise<void>
}

// Airline-specific search parameters
interface AirlineSearchParams extends SearchParams {
  country?: string
  active?: boolean
  iataCode?: string
  icaoCode?: string
}

// Airport-specific search parameters
interface AirportSearchParams extends SearchParams {
  country?: string
  city?: string
  active?: boolean
  iataCode?: string
  icaoCode?: string
  timezone?: string
}

// Aircraft-specific search parameters
interface AircraftSearchParams extends SearchParams {
  airlineId?: number
  manufacturer?: string
  model?: string
  aircraftType?: string
  active?: boolean
  yearManufactured?: number
}

// Route-specific search parameters
interface RouteSearchParams extends SearchParams {
  originAirportId?: number
  destinationAirportId?: number
  routeType?: 'DOMESTIC' | 'INTERNATIONAL'
  active?: boolean
  minDistance?: number
  maxDistance?: number
}

// Crew member-specific search parameters
interface CrewMemberSearchParams extends SearchParams {
  role?: 'CAPTAIN' | 'FIRST_OFFICER' | 'FLIGHT_ENGINEER' | 'CABIN_CREW' | 'PURSER'
  active?: boolean
  licenseExpiryFrom?: string
  licenseExpiryTo?: string
}

// Search result interface
interface SearchResult<T> {
  data: T[]
  total: number
  hasMore: boolean
}

// Airline operations interface
interface AirlineOperations extends CrudOperations<Airline, CreateAirlineRequest> {
  search: (query: string, params?: AirlineSearchParams) => Promise<SearchResult<Airline>>
getByIataCode: (iataCode: string) => Promise<Airline | null>
  getByIcaoCode: (icaoCode: string) => Promise<Airline | null>
  getByCountry: (country: string) => Promise<Airline[]>
  validateCode: (iataCode: string, icaoCode: string, excludeId?: number) => Promise<{
  iataValid: boolean
  icaoValid: boolean
  suggestions?: string[]
}>
}

// Airport operations interface
interface AirportOperations extends CrudOperations<Airport, CreateAirportRequest> {
  searchByIcao: (icao: string) => Promise<Airport[]>
    searchByCity: (city: string) => Promise<Airport[]>
  getByIataCode: (iataCode: string) => Promise<Airport | null>
  getByIcaoCode: (icaoCode: string) => Promise<Airport | null>
  getByCountry: (country: string) => Promise<Airport[]>
  getNearby: (latitude: number, longitude: number, radiusKm: number) => Promise<Airport[]>
  validateCode: (iataCode: string, icaoCode: string, excludeId?: number) => Promise<{
  iataValid: boolean
  icaoValid: boolean
  suggestions?: string[]
}>
}

// Aircraft operations interface
interface AircraftOperations extends CrudOperations<Aircraft, CreateAircraftRequest> {
  getByAirline: (airlineId: number) => Promise<Aircraft[]>
    getByManufacturer: (manufacturer: string) => Promise<Aircraft[]>
  getByType: (aircraftType: string) => Promise<Aircraft[]>
  getAvailable: (date: string, startTime: string, endTime: string) => Promise<Aircraft[]>
  validateRegistration: (registrationNumber: string, excludeId?: number) => Promise<{
  valid: boolean
  suggestions?: string[]
}>
}

// Route operations interface
interface RouteOperations extends CrudOperations<Route, CreateRouteRequest> {
  searchByAirports: (originId: number, destinationId: number) => Promise<Route[]>
    getByOrigin: (originAirportId: number) => Promise<Route[]>
  getByDestination: (destinationAirportId: number) => Promise<Route[]>
  getPopularRoutes: (limit?: number) => Promise<Array<Route & { flightCount: number }>>
calculateDistance: (originId: number, destinationId: number) => Promise<{
  distance: number
  estimatedFlightTime: number
  route?: string
}>
}

// Crew member operations interface
interface CrewMemberOperations extends CrudOperations<CrewMember, CreateCrewMemberRequest> {
  getByRole: (role: 'CAPTAIN' | 'FIRST_OFFICER' | 'FLIGHT_ENGINEER' | 'CABIN_CREW' | 'PURSER') => Promise<CrewMember[]>
    getAvailable: (date: string, startTime: string, endTime: string, role?: string) => Promise<CrewMember[]>
getByLicenseExpiry: (fromDate: string, toDate: string) => Promise<CrewMember[]>
  validateLicense: (licenseNumber: string, excludeId?: number) => Promise<{
  valid: boolean
  expiryWarning?: boolean
  daysUntilExpiry?: number
}>
}

// Reference service implementation
export const referenceService = {
  // Airlines
  airlines: {
    getAll: (params: AirlineSearchParams = {}): Promise<PaginatedResponse<Airline>> => {
  return apiService.reference.get<PaginatedResponse<Airline>>(
    API_ENDPOINTS.AIRLINES,
      { params }
  ).then(response => response.data)
},

getById: (id: number): Promise<Airline> => {
  return apiService.reference.get<Airline>(
    `${API_ENDPOINTS.AIRLINES}/${id}`
  ).then(response => response.data)
},

create: (data: CreateAirlineRequest): Promise<Airline> => {
  return apiService.reference.post<Airline>(
    API_ENDPOINTS.AIRLINES,
      data
  ).then(response => response.data)
},

update: (id: number, data: Partial<CreateAirlineRequest>): Promise<Airline> => {
  return apiService.reference.put<Airline>(
    `${API_ENDPOINTS.AIRLINES}/${id}`,
      data
  ).then(response => response.data)
},

delete: (id: number): Promise<void> => {
  return apiService.reference.delete(`${API_ENDPOINTS.AIRLINES}/${id}`)
    .then(() => undefined)
},

search: (query: string, params: AirlineSearchParams = {}): Promise<SearchResult<Airline>> => {
  return apiService.reference.get<SearchResult<Airline>>(
    `${API_ENDPOINTS.AIRLINES}/search`,
      { params: { q: query, ...params } }
  ).then(response => response.data)
},

getByIataCode: (iataCode: string): Promise<Airline | null> => {
  return apiService.reference.get<Airline | null>(
    `${API_ENDPOINTS.AIRLINES}/iata/${iataCode}`
  ).then(response => response.data)
},

getByIcaoCode: (icaoCode: string): Promise<Airline | null> => {
  return apiService.reference.get<Airline | null>(
    `${API_ENDPOINTS.AIRLINES}/icao/${icaoCode}`
  ).then(response => response.data)
},

getByCountry: (country: string): Promise<Airline[]> => {
  return apiService.reference.get<Airline[]>(
    `${API_ENDPOINTS.AIRLINES}/country/${country}`
  ).then(response => response.data)
},

validateCode: (iataCode: string, icaoCode: string, excludeId?: number): Promise<{
  iataValid: boolean
  icaoValid: boolean
  suggestions?: string[]
}> => {
  return apiService.reference.post(
    `${API_ENDPOINTS.AIRLINES}/validate-codes`,
    { iataCode, icaoCode, excludeId }
  ).then(response => response.data)
}
} as AirlineOperations,

  // Airports
  airports: {
  getAll: (params: AirportSearchParams = {}): Promise<PaginatedResponse<Airport>> => {
    return apiService.reference.get<PaginatedResponse<Airport>>(
      API_ENDPOINTS.AIRPORTS,
        { params }
    ).then(response => response.data)
  },

  getById: (id: number): Promise<Airport> => {
    return apiService.reference.get<Airport>(
      `${API_ENDPOINTS.AIRPORTS}/${id}`
    ).then(response => response.data)
  },

  create: (data: CreateAirportRequest): Promise<Airport> => {
    return apiService.reference.post<Airport>(
      API_ENDPOINTS.AIRPORTS,
        data
    ).then(response => response.data)
  },

  update: (id: number, data: Partial<CreateAirportRequest>): Promise<Airport> => {
    return apiService.reference.put<Airport>(
      `${API_ENDPOINTS.AIRPORTS}/${id}`,
        data
    ).then(response => response.data)
  },

  delete: (id: number): Promise<void> => {
    return apiService.reference.delete(`${API_ENDPOINTS.AIRPORTS}/${id}`)
      .then(() => undefined)
  },

  searchByIcao: (icao: string): Promise<Airport[]> => {
    return apiService.reference.get<Airport[]>(
      `${API_ENDPOINTS.AIRPORTS}/search/icao`,
        { params: { icao } }
    ).then(response => response.data)
  },

  searchByCity: (city: string): Promise<Airport[]> => {
    return apiService.reference.get<Airport[]>(
      `${API_ENDPOINTS.AIRPORTS}/search/city`,
        { params: { city } }
    ).then(response => response.data)
  },

  getByIataCode: (iataCode: string): Promise<Airport | null> => {
    return apiService.reference.get<Airport | null>(
      `${API_ENDPOINTS.AIRPORTS}/iata/${iataCode}`
    ).then(response => response.data)
  },

  getByIcaoCode: (icaoCode: string): Promise<Airport | null> => {
    return apiService.reference.get<Airport | null>(
      `${API_ENDPOINTS.AIRPORTS}/icao/${icaoCode}`
    ).then(response => response.data)
  },

  getByCountry: (country: string): Promise<Airport[]> => {
    return apiService.reference.get<Airport[]>(
      `${API_ENDPOINTS.AIRPORTS}/country/${country}`
    ).then(response => response.data)
  },

  getNearby: (latitude: number, longitude: number, radiusKm: number): Promise<Airport[]> => {
    return apiService.reference.get<Airport[]>(
      `${API_ENDPOINTS.AIRPORTS}/nearby`,
        { params: { latitude, longitude, radius: radiusKm } }
    ).then(response => response.data)
  },

  validateCode: (iataCode: string, icaoCode: string, excludeId?: number): Promise<{
    iataValid: boolean
    icaoValid: boolean
    suggestions?: string[]
  }> => {
    return apiService.reference.post(
      `${API_ENDPOINTS.AIRPORTS}/validate-codes`,
      { iataCode, icaoCode, excludeId }
    ).then(response => response.data)
  }
} as AirportOperations,

  // Aircrafts
  aircrafts: {
  getAll: (params: AircraftSearchParams = {}): Promise<PaginatedResponse<Aircraft>> => {
    return apiService.reference.get<PaginatedResponse<Aircraft>>(
      API_ENDPOINTS.AIRCRAFTS,
        { params }
    ).then(response => response.data)
  },

  getById: (id: number): Promise<Aircraft> => {
    return apiService.reference.get<Aircraft>(
      `${API_ENDPOINTS.AIRCRAFTS}/${id}`
    ).then(response => response.data)
  },

  create: (data: CreateAircraftRequest): Promise<Aircraft> => {
    return apiService.reference.post<Aircraft>(
      API_ENDPOINTS.AIRCRAFTS,
        data
    ).then(response => response.data)
  },

  update: (id: number, data: Partial<CreateAircraftRequest>): Promise<Aircraft> => {
    return apiService.reference.put<Aircraft>(
      `${API_ENDPOINTS.AIRCRAFTS}/${id}`,
        data
    ).then(response => response.data)
  },

  delete: (id: number): Promise<void> => {
    return apiService.reference.delete(`${API_ENDPOINTS.AIRCRAFTS}/${id}`)
      .then(() => undefined)
  },

  getByAirline: (airlineId: number): Promise<Aircraft[]> => {
    return apiService.reference.get<Aircraft[]>(
      `${API_ENDPOINTS.AIRCRAFTS}/airline/${airlineId}`
    ).then(response => response.data)
  },

  getByManufacturer: (manufacturer: string): Promise<Aircraft[]> => {
    return apiService.reference.get<Aircraft[]>(
      `${API_ENDPOINTS.AIRCRAFTS}/manufacturer/${manufacturer}`
    ).then(response => response.data)
  },

  getByType: (aircraftType: string): Promise<Aircraft[]> => {
    return apiService.reference.get<Aircraft[]>(
      `${API_ENDPOINTS.AIRCRAFTS}/type/${aircraftType}`
    ).then(response => response.data)
  },

  getAvailable: (date: string, startTime: string, endTime: string): Promise<Aircraft[]> => {
    return apiService.reference.get<Aircraft[]>(
      `${API_ENDPOINTS.AIRCRAFTS}/available`,
        { params: { date, startTime, endTime } }
    ).then(response => response.data)
  },

  validateRegistration: (registrationNumber: string, excludeId?: number): Promise<{
    valid: boolean
    suggestions?: string[]
  }> => {
    return apiService.reference.post(
      `${API_ENDPOINTS.AIRCRAFTS}/validate-registration`,
      { registrationNumber, excludeId }
    ).then(response => response.data)
  }
} as AircraftOperations,

  // Routes
  routes: {
  getAll: (params: RouteSearchParams = {}): Promise<PaginatedResponse<Route>> => {
    return apiService.reference.get<PaginatedResponse<Route>>(
      API_ENDPOINTS.ROUTES,
        { params }
    ).then(response => response.data)
  },

  getById: (id: number): Promise<Route> => {
    return apiService.reference.get<Route>(
      `${API_ENDPOINTS.ROUTES}/${id}`
    ).then(response => response.data)
  },

  create: (data: CreateRouteRequest): Promise<Route> => {
    return apiService.reference.post<Route>(
      API_ENDPOINTS.ROUTES,
        data
    ).then(response => response.data)
  },

  update: (id: number, data: Partial<CreateRouteRequest>): Promise<Route> => {
    return apiService.reference.put<Route>(
      `${API_ENDPOINTS.ROUTES}/${id}`,
        data
    ).then(response => response.data)
  },

  delete: (id: number): Promise<void> => {
    return apiService.reference.delete(`${API_ENDPOINTS.ROUTES}/${id}`)
      .then(() => undefined)
  },

  searchByAirports: (originId: number, destinationId: number): Promise<Route[]> => {
    return apiService.reference.get<Route[]>(
      `${API_ENDPOINTS.ROUTES}/search`,
        { params: { originId, destinationId } }
    ).then(response => response.data)
  },

  getByOrigin: (originAirportId: number): Promise<Route[]> => {
    return apiService.reference.get<Route[]>(
      `${API_ENDPOINTS.ROUTES}/origin/${originAirportId}`
    ).then(response => response.data)
  },

  getByDestination: (destinationAirportId: number): Promise<Route[]> => {
    return apiService.reference.get<Route[]>(
      `${API_ENDPOINTS.ROUTES}/destination/${destinationAirportId}`
    ).then(response => response.data)
  },

  getPopularRoutes: (limit: number = 10): Promise<Array<Route & { flightCount: number }>> => {
    return apiService.reference.get<Array<Route & { flightCount: number }>>(
      `${API_ENDPOINTS.ROUTES}/popular`,
        { params: { limit } }
    ).then(response => response.data)
  },

  calculateDistance: (originId: number, destinationId: number): Promise<{
    distance: number
    estimatedFlightTime: number
    route?: string
  }> => {
    return apiService.reference.post(
      `${API_ENDPOINTS.ROUTES}/calculate-distance`,
      { originId, destinationId }
    ).then(response => response.data)
  }
} as RouteOperations,

  // Crew Members
  crewMembers: {
  getAll: (params: CrewMemberSearchParams = {}): Promise<PaginatedResponse<CrewMember>> => {
    return apiService.reference.get<PaginatedResponse<CrewMember>>(
      API_ENDPOINTS.CREW_MEMBERS,
        { params }
    ).then(response => response.data)
  },

  getById: (id: number): Promise<CrewMember> => {
    return apiService.reference.get<CrewMember>(
      `${API_ENDPOINTS.CREW_MEMBERS}/${id}`
    ).then(response => response.data)
  },

  create: (data: CreateCrewMemberRequest): Promise<CrewMember> => {
    return apiService.reference.post<CrewMember>(
      API_ENDPOINTS.CREW_MEMBERS,
        data
    ).then(response => response.data)
  },

  update: (id: number, data: Partial<CreateCrewMemberRequest>): Promise<CrewMember> => {
    return apiService.reference.put<CrewMember>(
      `${API_ENDPOINTS.CREW_MEMBERS}/${id}`,
        data
    ).then(response => response.data)
  },

  delete: (id: number): Promise<void> => {
    return apiService.reference.delete(`${API_ENDPOINTS.CREW_MEMBERS}/${id}`)
      .then(() => undefined)
  },

  getByRole: (role: 'CAPTAIN' | 'FIRST_OFFICER' | 'FLIGHT_ENGINEER' | 'CABIN_CREW' | 'PURSER'): Promise<CrewMember[]> => {
    return apiService.reference.get<CrewMember[]>(
      `${API_ENDPOINTS.CREW_MEMBERS}/role/${role}`
    ).then(response => response.data)
  },

  getAvailable: (date: string, startTime: string, endTime: string, role?: string): Promise<CrewMember[]> => {
    return apiService.reference.get<CrewMember[]>(
      `${API_ENDPOINTS.CREW_MEMBERS}/available`,
        { params: { date, startTime, endTime, role } }
    ).then(response => response.data)
  },

  getByLicenseExpiry: (fromDate: string, toDate: string): Promise<CrewMember[]> => {
    return apiService.reference.get<CrewMember[]>(
      `${API_ENDPOINTS.CREW_MEMBERS}/license-expiry`,
        { params: { fromDate, toDate } }
    ).then(response => response.data)
  },

  validateLicense: (licenseNumber: string, excludeId?: number): Promise<{
    valid: boolean
    expiryWarning?: boolean
    daysUntilExpiry?: number
  }> => {
    return apiService.reference.post(
      `${API_ENDPOINTS.CREW_MEMBERS}/validate-license`,
      { licenseNumber, excludeId }
    ).then(response => response.data)
  }
} as CrewMemberOperations,

  // Utility methods
  utils: {
  // Get all reference data for dropdowns
  getAllForDropdowns: async (): Promise<{
    airlines: Array<{ id: number; name: string; iataCode: string }>
      airports: Array<{ id: number; name: string; iataCode: string; city: string }>
  aircrafts: Array<{ id: number; registrationNumber: string; type: string }>
}> => {
    const [airlines, airports, aircrafts] = await Promise.all([
      apiService.reference.get<Array<{ id: number; name: string; iataCode: string }>>(
        `${API_ENDPOINTS.AIRLINES}/dropdown`
      ),
      apiService.reference.get<Array<{ id: number; name: string; iataCode: string; city: string }>>(
        `${API_ENDPOINTS.AIRPORTS}/dropdown`
      ),
      apiService.reference.get<Array<{ id: number; registrationNumber: string; type: string }>>(
        `${API_ENDPOINTS.AIRCRAFTS}/dropdown`
      )
    ])

    return {
      airlines: airlines.data,
      airports: airports.data,
      aircrafts: aircrafts.data
    }
  },

  // Search across all reference entities
  globalSearch: (query: string, entities: Array<'airlines' | 'airports' | 'aircrafts' | 'routes' | 'crew'> = ['airlines', 'airports']): Promise<{
    airlines: Airline[]
    airports: Airport[]
    aircrafts: Aircraft[]
    routes: Route[]
    crewMembers: CrewMember[]
  }> => {
    return apiService.reference.get(
      '/api/v1/search/global',
      { params: { q: query, entities: entities.join(',') } }
    ).then(response => response.data)
  },

  // Get reference data statistics
  getStatistics: (): Promise<{
    totalAirlines: number
    activeAirlines: number
    totalAirports: number
    activeAirports: number
    totalAircrafts: number
    activeAircrafts: number
    totalRoutes: number
    activeRoutes: number
    totalCrewMembers: number
    activeCrewMembers: number
  }> => {
    return apiService.reference.get('/api/v1/reference/statistics')
      .then(response => response.data)
  },

  // Validate reference data integrity
  validateIntegrity: (): Promise<{
    valid: boolean
    issues: Array<{
      type: 'warning' | 'error'
      entity: string
      message: string
      count: number
    }>
  }> => {
    return apiService.reference.get('/api/v1/reference/validate-integrity')
      .then(response => response.data)
  }
}
}

// Export types for external use
export type {
  AirlineOperations,
    AirportOperations,
    AircraftOperations,
    RouteOperations,
    CrewMemberOperations,
    AirlineSearchParams,
    AirportSearchParams,
    AircraftSearchParams,
    RouteSearchParams,
    CrewMemberSearchParams,
    SearchResult
}

// Export default
export default referenceService
