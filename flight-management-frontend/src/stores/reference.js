import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import referenceService from '@/services/referenceService'

export const useReferenceStore = defineStore('reference', () => {
  // State
  const airlines = ref([])
  const airports = ref([])
  const routes = ref([])
  const crewMembers = ref([])
  const aircraft = ref([])

  // Loading states
  const loadingStates = ref({
    airlines: false,
    airports: false,
    routes: false,
    crewMembers: false,
    aircraft: false
  })

  // Cache timestamps
  const cacheTimestamps = ref({
    airlines: null,
    airports: null,
    routes: null,
    crewMembers: null,
    aircraft: null
  })

  // Cache duration (5 minutes)
  const CACHE_DURATION = 5 * 60 * 1000

  // Getters
  const airlineOptions = computed(() => {
    return airlines.value.map(airline => ({
      value: airline.id,
      label: `${airline.name} (${airline.iataCode})`,
      ...airline
    }))
  })

  const airportOptions = computed(() => {
    return airports.value.map(airport => ({
      value: airport.id,
      label: `${airport.name} (${airport.iataCode}) - ${airport.city}`,
      ...airport
    }))
  })

  const routeOptions = computed(() => {
    return routes.value.map(route => ({
      value: route.id,
      label: `${route.originAirport?.iataCode || 'N/A'} → ${route.destinationAirport?.iataCode || 'N/A'}`,
      ...route
    }))
  })

  const crewMemberOptions = computed(() => {
    return crewMembers.value.map(crew => ({
      value: crew.id,
      label: `${crew.fullName} (${crew.crewType})`,
      ...crew
    }))
  })

  const aircraftOptions = computed(() => {
    return aircraft.value.map(ac => ({
      value: ac.id,
      label: `${ac.registrationNumber} (${ac.aircraftType})`,
      ...ac
    }))
  })

  // Helper function to check if data is cached and fresh
  const isCacheFresh = (key) => {
    const timestamp = cacheTimestamps.value[key]
    if (!timestamp) return false
    return Date.now() - timestamp < CACHE_DURATION
  }

  // Actions - Airlines
  const loadAirlines = async (forceRefresh = false) => {
    if (!forceRefresh && isCacheFresh('airlines') && airlines.value.length > 0) {
      return airlines.value
    }

    loadingStates.value.airlines = true
    try {
      const response = await referenceService.getAllAirlines({ size: 1000 })
      airlines.value = response.content || response || []
      cacheTimestamps.value.airlines = Date.now()
      return airlines.value
    } catch (error) {
      console.error('Error loading airlines:', error)
      return []
    } finally {
      loadingStates.value.airlines = false
    }
  }

  const createAirline = async (airlineData) => {
    try {
      const newAirline = await referenceService.createAirline(airlineData)
      airlines.value.push(newAirline)
      return newAirline
    } catch (error) {
      console.error('Error creating airline:', error)
      throw error
    }
  }

  const updateAirline = async (id, airlineData) => {
    try {
      const updatedAirline = await referenceService.updateAirline(id, airlineData)
      const index = airlines.value.findIndex(a => a.id === id)
      if (index !== -1) {
        airlines.value[index] = updatedAirline
      }
      return updatedAirline
    } catch (error) {
      console.error('Error updating airline:', error)
      throw error
    }
  }

  const deleteAirline = async (id) => {
    try {
      await referenceService.deleteAirline(id)
      airlines.value = airlines.value.filter(a => a.id !== id)
    } catch (error) {
      console.error('Error deleting airline:', error)
      throw error
    }
  }

  // Actions - Airports
  const loadAirports = async (forceRefresh = false) => {
    if (!forceRefresh && isCacheFresh('airports') && airports.value.length > 0) {
      return airports.value
    }

    loadingStates.value.airports = true
    try {
      const response = await referenceService.getAllAirports({ size: 1000 })
      airports.value = response.content || response || []
      cacheTimestamps.value.airports = Date.now()
      return airports.value
    } catch (error) {
      console.error('Error loading airports:', error)
      return []
    } finally {
      loadingStates.value.airports = false
    }
  }

  const createAirport = async (airportData) => {
    try {
      const newAirport = await referenceService.createAirport(airportData)
      airports.value.push(newAirport)
      return newAirport
    } catch (error) {
      console.error('Error creating airport:', error)
      throw error
    }
  }

  const updateAirport = async (id, airportData) => {
    try {
      const updatedAirport = await referenceService.updateAirport(id, airportData)
      const index = airports.value.findIndex(a => a.id === id)
      if (index !== -1) {
        airports.value[index] = updatedAirport
      }
      return updatedAirport
    } catch (error) {
      console.error('Error updating airport:', error)
      throw error
    }
  }

  const deleteAirport = async (id) => {
    try {
      await referenceService.deleteAirport(id)
      airports.value = airports.value.filter(a => a.id !== id)
    } catch (error) {
      console.error('Error deleting airport:', error)
      throw error
    }
  }

  // Actions - Routes
  const loadRoutes = async (forceRefresh = false) => {
    if (!forceRefresh && isCacheFresh('routes') && routes.value.length > 0) {
      return routes.value
    }

    loadingStates.value.routes = true
    try {
      const response = await referenceService.getAllRoutes()
      routes.value = response || []
      cacheTimestamps.value.routes = Date.now()
      return routes.value
    } catch (error) {
      console.error('Error loading routes:', error)
      return []
    } finally {
      loadingStates.value.routes = false
    }
  }

  const createRoute = async (routeData) => {
    try {
      const newRoute = await referenceService.createRoute(routeData)
      routes.value.push(newRoute)
      return newRoute
    } catch (error) {
      console.error('Error creating route:', error)
      throw error
    }
  }

  const updateRoute = async (id, routeData) => {
    try {
      const updatedRoute = await referenceService.updateRoute(id, routeData)
      const index = routes.value.findIndex(r => r.id === id)
      if (index !== -1) {
        routes.value[index] = updatedRoute
      }
      return updatedRoute
    } catch (error) {
      console.error('Error updating route:', error)
      throw error
    }
  }

  const deleteRoute = async (id) => {
    try {
      await referenceService.deleteRoute(id)
      routes.value = routes.value.filter(r => r.id !== id)
    } catch (error) {
      console.error('Error deleting route:', error)
      throw error
    }
  }

  // Actions - Crew Members
  const loadCrewMembers = async (forceRefresh = false) => {
    if (!forceRefresh && isCacheFresh('crewMembers') && crewMembers.value.length > 0) {
      return crewMembers.value
    }

    loadingStates.value.crewMembers = true
    try {
      const response = await referenceService.getAllCrewMembers()
      crewMembers.value = response || []
      cacheTimestamps.value.crewMembers = Date.now()
      return crewMembers.value
    } catch (error) {
      console.error('Error loading crew members:', error)
      return []
    } finally {
      loadingStates.value.crewMembers = false
    }
  }

  const createCrewMember = async (crewData) => {
    try {
      const newCrewMember = await referenceService.createCrewMember(crewData)
      crewMembers.value.push(newCrewMember)
      return newCrewMember
    } catch (error) {
      console.error('Error creating crew member:', error)
      throw error
    }
  }

  const updateCrewMember = async (id, crewData) => {
    try {
      const updatedCrewMember = await referenceService.updateCrewMember(id, crewData)
      const index = crewMembers.value.findIndex(c => c.id === id)
      if (index !== -1) {
        crewMembers.value[index] = updatedCrewMember
      }
      return updatedCrewMember
    } catch (error) {
      console.error('Error updating crew member:', error)
      throw error
    }
  }

  const deleteCrewMember = async (id) => {
    try {
      await referenceService.deleteCrewMember(id)
      crewMembers.value = crewMembers.value.filter(c => c.id !== id)
    } catch (error) {
      console.error('Error deleting crew member:', error)
      throw error
    }
  }

  // Actions - Aircraft
  const loadAircraft = async (forceRefresh = false) => {
    if (!forceRefresh && isCacheFresh('aircraft') && aircraft.value.length > 0) {
      return aircraft.value
    }

    loadingStates.value.aircraft = true
    try {
      const response = await referenceService.getAllAircraft()
      aircraft.value = response || []
      cacheTimestamps.value.aircraft = Date.now()
      return aircraft.value
    } catch (error) {
      console.error('Error loading aircraft:', error)
      return []
    } finally {
      loadingStates.value.aircraft = false
    }
  }

  // Utility Actions
  const loadAllReferenceData = async (forceRefresh = false) => {
    try {
      await Promise.all([
        loadRoutes(forceRefresh),
        loadCrewMembers(forceRefresh),
        loadAircraft(forceRefresh)
      ])
    } catch (error) {
      console.error('Error loading reference data:', error)
    }
  }

  const clearCache = () => {
    airlines.value = []
    airports.value = []
    routes.value = []
    crewMembers.value = []
    aircraft.value = []

    cacheTimestamps.value = {
      airlines: null,
      airports: null,
      routes: null,
      crewMembers: null,
      aircraft: null
    }
  }

  // Filtered options for specific use cases
  const getAircraftByAirline = (airlineId) => {
    return aircraft.value.filter(ac => ac.airlineId === airlineId).map(ac => ({
      value: ac.id,
      label: `${ac.registrationNumber} (${ac.aircraftType})`,
      ...ac
    }))
  }

  const getCrewByType = (crewType) => {
    return crewMembers.value.filter(crew => crew.crewType === crewType).map(crew => ({
      value: crew.id,
      label: `${crew.fullName} (${crew.crewType})`,
      ...crew
    }))
  }

  const getRoutesByAirport = (airportId) => {
    return routes.value.filter(route =>
      route.originAirportId === airportId || route.destinationAirportId === airportId
    ).map(route => ({
      value: route.id,
      label: `${route.originAirport?.iataCode || 'N/A'} → ${route.destinationAirport?.iataCode || 'N/A'}`,
      ...route
    }))
  }

  return {
    // State
    airlines,
    airports,
    routes,
    crewMembers,
    aircraft,
    loadingStates,

    // Getters
    airlineOptions,
    airportOptions,
    routeOptions,
    crewMemberOptions,
    aircraftOptions,

    // Actions - Airlines
    loadAirlines,
    createAirline,
    updateAirline,
    deleteAirline,

    // Actions - Airports
    loadAirports,
    createAirport,
    updateAirport,
    deleteAirport,

    // Actions - Routes
    loadRoutes,
    createRoute,
    updateRoute,
    deleteRoute,

    // Actions - Crew Members
    loadCrewMembers,
    createCrewMember,
    updateCrewMember,
    deleteCrewMember,

    // Actions - Aircraft
    loadAircraft,

    // Utility Actions
    loadAllReferenceData,
    clearCache,
    getAircraftByAirline,
    getCrewByType,
    getRoutesByAirport
  }
})
