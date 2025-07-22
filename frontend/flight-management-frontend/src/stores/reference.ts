import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { referenceService } from '@/services/referenceService.js'
import { ElMessage } from 'element-plus'
import { SUCCESS_MESSAGES } from '@/utils/constants'
import type {
  Airline,
  Airport,
  Aircraft,
  Route,
  CrewMember,
  CreateAirlineRequest,
  CreateAirportRequest,
  CreateAircraftRequest,
  CreateRouteRequest,
  CreateCrewMemberRequest,
  ApiResponse
} from '@/types/index'

// Crew Role Types
type CrewRole = 'CAPTAIN' | 'FIRST_OFFICER' | 'FLIGHT_ENGINEER' | 'CABIN_CREW' | 'PURSER'

// Store State Interfaces
interface LoadingState {
  airlines: boolean
  airports: boolean
  aircrafts: boolean
  routes: boolean
  crewMembers: boolean
}

interface CacheState {
  airlines: number | null
  airports: number | null
  aircrafts: number | null
  routes: number | null
  crewMembers: number | null
}

// 35-38. satırları şununla değiştirin:
interface ReferenceResponse<T> {
  data?: T
  success?: boolean
  message?: string
  [key: string]: any
}

function isReferenceResponse<T>(response: any): response is ReferenceResponse<T> {
  return response && typeof response === 'object' && 'data' in response
}

function extractData<T>(response: T | ReferenceResponse<T>): T {
  if (isReferenceResponse<T>(response)) {
    return response.data as T
  }
  return response as T
}


export const useReferenceStore = defineStore('reference', () => {
  // State
  const airlines = ref<Airline[]>([])
  const airports = ref<Airport[]>([])
  const aircrafts = ref<Aircraft[]>([])
  const routes = ref<Route[]>([])
  const crewMembers = ref<CrewMember[]>([])

  // Loading states
  const loading = ref<LoadingState>({
    airlines: false,
    airports: false,
    aircrafts: false,
    routes: false,
    crewMembers: false
  })

  // Cache timestamps
  const lastFetch = ref<CacheState>({
    airlines: null,
    airports: null,
    aircrafts: null,
    routes: null,
    crewMembers: null
  })

  // Cache duration (5 minutes)
  const cacheDuration = 5 * 60 * 1000

  // Computed (Getters)
  const activeAirlines = computed((): Airline[] =>
  airlines.value.filter(airline => airline.active)
)

  const activeAirports = computed((): Airport[] =>
  airports.value.filter(airport => airport.active)
)

  const activeAircrafts = computed((): Aircraft[] =>
  aircrafts.value.filter(aircraft => aircraft.active)
)

  const activeRoutes = computed((): Route[] =>
  routes.value.filter(route => route.active)
)

  const activeCrewMembers = computed((): CrewMember[] =>
  crewMembers.value.filter(crew => crew.active)
)

  const getAirlineById = computed(() => (id: number): Airline | undefined =>
  airlines.value.find(airline => airline.id === id)
)

  const getAirportById = computed(() => (id: number): Airport | undefined =>
  airports.value.find(airport => airport.id === id)
)

  const getAircraftById = computed(() => (id: number): Aircraft | undefined =>
  aircrafts.value.find(aircraft => aircraft.id === id)
)

  const getRouteById = computed(() => (id: number): Route | undefined =>
  routes.value.find(route => route.id === id)
)

  const getCrewMemberById = computed(() => (id: number): CrewMember | undefined =>
  crewMembers.value.find(crew => crew.id === id)
)

  const getAircraftsByAirline = computed(() => (airlineId: number): Aircraft[] =>
  aircrafts.value.filter(aircraft => aircraft.airlineId === airlineId)
)

  const getCrewMembersByRole = computed(() => (role: CrewRole): CrewMember[] =>
  crewMembers.value.filter(crew => crew.role === role)
)

  // Actions

  // Check if cache is valid
  function isCacheValid(type: keyof CacheState): boolean {
    const lastFetchTime = lastFetch.value[type]
    if (!lastFetchTime) return false
    return Date.now() - lastFetchTime < cacheDuration
  }

  // Airlines
  async function fetchAirlines(force: boolean = false): Promise<Airline[]> {
    if (!force && isCacheValid('airlines')) {
      return airlines.value
    }

    loading.value.airlines = true
    try {
      const response = await referenceService.airlines.getAll()
      airlines.value = extractData<Airline[]>(response)
      lastFetch.value.airlines = Date.now()
      return airlines.value
    } catch (error: any) {
      ElMessage.error('Havayolları yüklenirken hata oluştu')
      throw error
    } finally {
      loading.value.airlines = false
    }
  }

// createAirline fonksiyonunu değiştirin:
  async function createAirline(data: CreateAirlineRequest): Promise<Airline> {
    try {
      const response = await referenceService.airlines.create(data)
      const newAirline = extractData<Airline>(response)
      airlines.value.push(newAirline)
      ElMessage.success(SUCCESS_MESSAGES.CREATED)
      return newAirline
    } catch (error: any) {
      ElMessage.error('Havayolu oluşturulurken hata oluştu')
      throw error
    }
  }

// updateAirline fonksiyonunu değiştirin:
  async function updateAirline(id: number, data: Partial<CreateAirlineRequest>): Promise<Airline> {
    try {
      const response = await referenceService.airlines.update(id, data)
      const updatedAirline = extractData<Airline>(response)
      const index = airlines.value.findIndex(airline => airline.id === id)
      if (index !== -1) {
        airlines.value[index] = updatedAirline
      }
      ElMessage.success(SUCCESS_MESSAGES.UPDATED)
      return updatedAirline
    } catch (error: any) {
      ElMessage.error('Havayolu güncellenirken hata oluştu')
      throw error
    }
  }


  async function deleteAirline(id: number): Promise<void> {
    try {
      await referenceService.airlines.delete(id)
      const index = airlines.value.findIndex(airline => airline.id === id)
      if (index !== -1) {
        airlines.value.splice(index, 1)
      }
      ElMessage.success(SUCCESS_MESSAGES.DELETED)
    } catch (error: any) {
      ElMessage.error('Havayolu silinirken hata oluştu')
      throw error
    }
  }

  async function searchAirlines(query: string): Promise<Airline[]> {
    try {
      const response = await referenceService.airlines.search(query)
      return extractData<Airline[]>(response)
    } catch (error: any) {
      ElMessage.error('Havayolu arama işleminde hata oluştu')
      return []
    }
  }

  // Airports
  async function fetchAirports(force: boolean = false): Promise<Airport[]> {
    if (!force && isCacheValid('airports')) {
      return airports.value
    }

    loading.value.airports = true
    try {
      const response = await referenceService.airports.getAll()
      airports.value = extractData<Airport[]>(response)
      lastFetch.value.airports = Date.now()
      return airports.value
    } catch (error: any) {
      ElMessage.error('Havaalanları yüklenirken hata oluştu')
      throw error
    } finally {
      loading.value.airports = false
    }
  }

// createAirport fonksiyonunu değiştirin:
  async function createAirport(data: CreateAirportRequest): Promise<Airport> {
    try {
      const response = await referenceService.airports.create(data)
      const newAirport = extractData<Airport>(response)
      airports.value.push(newAirport)
      ElMessage.success(SUCCESS_MESSAGES.CREATED)
      return newAirport
    } catch (error: any) {
      ElMessage.error('Havaalanı oluşturulurken hata oluştu')
      throw error
    }
  }

// updateAirport fonksiyonunu değiştirin:
  async function updateAirport(id: number, data: Partial<CreateAirportRequest>): Promise<Airport> {
    try {
      const response = await referenceService.airports.update(id, data)
      const updatedAirport = extractData<Airport>(response)
      const index = airports.value.findIndex(airport => airport.id === id)
      if (index !== -1) {
        airports.value[index] = updatedAirport
      }
      ElMessage.success(SUCCESS_MESSAGES.UPDATED)
      return updatedAirport
    } catch (error: any) {
      ElMessage.error('Havaalanı güncellenirken hata oluştu')
      throw error
    }
  }

  async function deleteAirport(id: number): Promise<void> {
    try {
      await referenceService.airports.delete(id)
      const index = airports.value.findIndex(airport => airport.id === id)
      if (index !== -1) {
        airports.value.splice(index, 1)
      }
      ElMessage.success(SUCCESS_MESSAGES.DELETED)
    } catch (error: any) {
      ElMessage.error('Havaalanı silinirken hata oluştu')
      throw error
    }
  }

  async function searchAirportsByIcao(icao: string): Promise<Airport[]> {
    try {
      const response = await referenceService.airports.searchByIcao(icao)
      return extractData<Airport[]>(response)
    } catch (error: any) {
      ElMessage.error('Havaalanı arama işleminde hata oluştu')
      return []
    }
  }

  // Aircrafts
  async function fetchAircrafts(force: boolean = false): Promise<Aircraft[]> {
    if (!force && isCacheValid('aircrafts')) {
      return aircrafts.value
    }

    loading.value.aircrafts = true
    try {
      const response = await referenceService.aircrafts.getAll()
      aircrafts.value = extractData<Aircraft[]>(response)
      lastFetch.value.aircrafts = Date.now()
      return aircrafts.value
    } catch (error: any) {
      ElMessage.error('Uçaklar yüklenirken hata oluştu')
      throw error
    } finally {
      loading.value.aircrafts = false
    }
  }

// createAircraft fonksiyonunu değiştirin:
  async function createAircraft(data: CreateAircraftRequest): Promise<Aircraft> {
    try {
      const response = await referenceService.aircrafts.create(data)
      const newAircraft = extractData<Aircraft>(response)
      aircrafts.value.push(newAircraft)
      ElMessage.success(SUCCESS_MESSAGES.CREATED)
      return newAircraft
    } catch (error: any) {
      ElMessage.error('Uçak oluşturulurken hata oluştu')
      throw error
    }
  }

// updateAircraft fonksiyonunu değiştirin:
  async function updateAircraft(id: number, data: Partial<CreateAircraftRequest>): Promise<Aircraft> {
    try {
      const response = await referenceService.aircrafts.update(id, data)
      const updatedAircraft = extractData<Aircraft>(response)
      const index = aircrafts.value.findIndex(aircraft => aircraft.id === id)
      if (index !== -1) {
        aircrafts.value[index] = updatedAircraft
      }
      ElMessage.success(SUCCESS_MESSAGES.UPDATED)
      return updatedAircraft
    } catch (error: any) {
      ElMessage.error('Uçak güncellenirken hata oluştu')
      throw error
    }
  }

  async function deleteAircraft(id: number): Promise<void> {
    try {
      await referenceService.aircrafts.delete(id)
      const index = aircrafts.value.findIndex(aircraft => aircraft.id === id)
      if (index !== -1) {
        aircrafts.value.splice(index, 1)
      }
      ElMessage.success(SUCCESS_MESSAGES.DELETED)
    } catch (error: any) {
      ElMessage.error('Uçak silinirken hata oluştu')
      throw error
    }
  }

  // Routes
  async function fetchRoutes(force: boolean = false): Promise<Route[]> {
    if (!force && isCacheValid('routes')) {
      return routes.value
    }

    loading.value.routes = true
    try {
      const response = await referenceService.routes.getAll()
      routes.value = extractData<Route[]>(response)
      lastFetch.value.routes = Date.now()
      return routes.value
    } catch (error: any) {
      ElMessage.error('Rotalar yüklenirken hata oluştu')
      throw error
    } finally {
      loading.value.routes = false
    }
  }

// createRoute ve updateRoute için de aynı pattern:
  async function createRoute(data: CreateRouteRequest): Promise<Route> {
    try {
      const response = await referenceService.routes.create(data)
      const newRoute = extractData<Route>(response)
      routes.value.push(newRoute)
      ElMessage.success(SUCCESS_MESSAGES.CREATED)
      return newRoute
    } catch (error: any) {
      ElMessage.error('Rota oluşturulurken hata oluştu')
      throw error
    }
  }

  async function updateRoute(id: number, data: Partial<CreateRouteRequest>): Promise<Route> {
    try {
      const response = await referenceService.routes.update(id, data)
      const updatedRoute = extractData<Route>(response)
      const index = routes.value.findIndex(route => route.id === id)
      if (index !== -1) {
        routes.value[index] = updatedRoute
      }
      ElMessage.success(SUCCESS_MESSAGES.UPDATED)
      return updatedRoute
    } catch (error: any) {
      ElMessage.error('Rota güncellenirken hata oluştu')
      throw error
    }
  }

  async function deleteRoute(id: number): Promise<void> {
    try {
      await referenceService.routes.delete(id)
      const index = routes.value.findIndex(route => route.id === id)
      if (index !== -1) {
        routes.value.splice(index, 1)
      }
      ElMessage.success(SUCCESS_MESSAGES.DELETED)
    } catch (error: any) {
      ElMessage.error('Rota silinirken hata oluştu')
      throw error
    }
  }

  // Crew Members
  async function fetchCrewMembers(force: boolean = false): Promise<CrewMember[]> {
    if (!force && isCacheValid('crewMembers')) {
      return crewMembers.value
    }

    loading.value.crewMembers = true
    try {
      const response = await referenceService.crewMembers.getAll()
      crewMembers.value = extractData<CrewMember[]>(response)
      lastFetch.value.crewMembers = Date.now()
      return crewMembers.value
    } catch (error: any) {
      ElMessage.error('Mürettebat yüklenirken hata oluştu')
      throw error
    } finally {
      loading.value.crewMembers = false
    }
  }

  async function createCrewMember(data: CreateCrewMemberRequest): Promise<CrewMember> {
    try {
      const response = await referenceService.crewMembers.create(data)
      const newCrewMember = extractData<CrewMember>(response)
      crewMembers.value.push(newCrewMember)
      ElMessage.success(SUCCESS_MESSAGES.CREATED)
      return newCrewMember
    } catch (error: any) {
      ElMessage.error('Mürettebat oluşturulurken hata oluştu')
      throw error
    }
  }

  async function updateCrewMember(id: number, data: Partial<CreateCrewMemberRequest>): Promise<CrewMember> {
    try {
      const response = await referenceService.crewMembers.update(id, data)
      const updatedCrewMember = extractData<CrewMember>(response)
      const index = crewMembers.value.findIndex(crew => crew.id === id)
      if (index !== -1) {
        crewMembers.value[index] = updatedCrewMember
      }
      ElMessage.success(SUCCESS_MESSAGES.UPDATED)
      return updatedCrewMember
    } catch (error: any) {
      ElMessage.error('Mürettebat güncellenirken hata oluştu')
      throw error
    }
  }

  async function deleteCrewMember(id: number): Promise<void> {
    try {
      await referenceService.crewMembers.delete(id)
      const index = crewMembers.value.findIndex(crew => crew.id === id)
      if (index !== -1) {
        crewMembers.value.splice(index, 1)
      }
      ElMessage.success(SUCCESS_MESSAGES.DELETED)
    } catch (error: any) {
      ElMessage.error('Mürettebat silinirken hata oluştu')
      throw error
    }
  }

  // Bulk operations
  async function fetchAllReferenceData(force: boolean = false): Promise<void> {
    const promises = [
      fetchAirlines(force),
      fetchAirports(force),
      fetchAircrafts(force),
      fetchRoutes(force),
      fetchCrewMembers(force)
    ]

    try {
      await Promise.all(promises)
    } catch (error: any) {
      ElMessage.error('Referans veriler yüklenirken hata oluştu')
      throw error
    }
  }

  // Clear cache
  function clearCache(): void {
    lastFetch.value = {
      airlines: null,
      airports: null,
      aircrafts: null,
      routes: null,
      crewMembers: null
    }
  }

  return {
    // State
    airlines,
    airports,
    aircrafts,
    routes,
    crewMembers,
    loading,
    lastFetch,
    cacheDuration,

    // Computed (Getters)
    activeAirlines,
    activeAirports,
    activeAircrafts,
    activeRoutes,
    activeCrewMembers,
    getAirlineById,
    getAirportById,
    getAircraftById,
    getRouteById,
    getCrewMemberById,
    getAircraftsByAirline,
    getCrewMembersByRole,

    // Actions
    isCacheValid,

    // Airlines
    fetchAirlines,
    createAirline,
    updateAirline,
    deleteAirline,
    searchAirlines,

    // Airports
    fetchAirports,
    createAirport,
    updateAirport,
    deleteAirport,
    searchAirportsByIcao,

    // Aircrafts
    fetchAircrafts,
    createAircraft,
    updateAircraft,
    deleteAircraft,

    // Routes
    fetchRoutes,
    createRoute,
    updateRoute,
    deleteRoute,

    // Crew Members
    fetchCrewMembers,
    createCrewMember,
    updateCrewMember,
    deleteCrewMember,

    // Bulk operations
    fetchAllReferenceData,
    clearCache
  }
})
