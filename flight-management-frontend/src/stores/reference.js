import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import referenceService from '@/services/referenceService'
import { ElMessage } from 'element-plus'
import { parseApiError, logError } from '@/utils/helpers'

export const useReferenceStore = defineStore('reference', () => {
  // ========================
  // STATE
  // ========================

  // Airlines
  const airlines = ref([])
  const airlinesPagination = ref({
    page: 0,
    size: 20,
    total: 0,
    totalPages: 0
  })
  const airlinesLoading = ref(false)

  // Airports
  const airports = ref([])
  const airportsPagination = ref({
    page: 0,
    size: 20,
    total: 0,
    totalPages: 0
  })
  const airportsLoading = ref(false)

  // Aircraft
  const aircraft = ref([])
  const aircraftPagination = ref({
    page: 0,
    size: 20,
    total: 0,
    totalPages: 0
  })
  const aircraftLoading = ref(false)

  // Routes
  const routes = ref([])
  const routesLoading = ref(false)

  // Crew Members
  const crewMembers = ref([])
  const crewMembersLoading = ref(false)

  // Current items (for forms/details)
  const currentAirline = ref(null)
  const currentAirport = ref(null)
  const currentAircraft = ref(null)
  const currentRoute = ref(null)
  const currentCrewMember = ref(null)

  // Filters and search
  const filters = ref({
    airlines: {},
    airports: {},
    aircraft: {},
    routes: {},
    crewMembers: {}
  })

  // ========================
  // GETTERS
  // ========================

  const activeAirlines = computed(() =>
    airlines.value.filter(airline => airline.active)
  )

  const activeAirports = computed(() =>
    airports.value.filter(airport => airport.active)
  )

  const activeAircraft = computed(() =>
    aircraft.value.filter(ac => ac.status === 'ACTIVE')
  )

  const airlineOptions = computed(() =>
    activeAirlines.value.map(airline => ({
      label: `${airline.name} (${airline.iataCode})`,
      value: airline.id,
      iataCode: airline.iataCode,
      icaoCode: airline.icaoCode
    }))
  )

  const airportOptions = computed(() =>
    activeAirports.value.map(airport => ({
      label: `${airport.name} (${airport.iataCode}) - ${airport.city}`,
      value: airport.id,
      iataCode: airport.iataCode,
      icaoCode: airport.icaoCode,
      city: airport.city,
      country: airport.country
    }))
  )

  const aircraftOptions = computed(() =>
    activeAircraft.value.map(ac => ({
      label: `${ac.registrationNumber} - ${ac.aircraftType}`,
      value: ac.id,
      registration: ac.registrationNumber,
      type: ac.aircraftType,
      airlineId: ac.airlineId
    }))
  )

  // ========================
  // AIRLINES ACTIONS
  // ========================

  const loadAirlines = async (params = {}, useCache = true) => {
    if (airlinesLoading.value) return

    airlinesLoading.value = true
    try {
      const response = await referenceService.getAllAirlines(params, useCache)

      airlines.value = response.content || response.data || response
      airlinesPagination.value = {
        page: response.page || 0,
        size: response.size || 20,
        total: response.totalElements || response.total || airlines.value.length,
        totalPages: response.totalPages || Math.ceil((response.totalElements || airlines.value.length) / (response.size || 20))
      }

      return response
    } catch (error) {
      const errorInfo = parseApiError(error)
      ElMessage.error(`Havayolları yüklenirken hata: ${errorInfo.message}`)
      logError('loadAirlines', error, params)
      throw error
    } finally {
      airlinesLoading.value = false
    }
  }

  const getAirlineById = async (id, useCache = true) => {
    try {
      const airline = await referenceService.getAirlineById(id, useCache)
      currentAirline.value = airline
      return airline
    } catch (error) {
      const errorInfo = parseApiError(error)
      ElMessage.error(`Havayolu bilgisi alınırken hata: ${errorInfo.message}`)
      logError('getAirlineById', error, { id })
      throw error
    }
  }

  const createAirline = async (airlineData) => {
    try {
      const newAirline = await referenceService.createAirline(airlineData)

      // Update local state efficiently
      airlines.value.unshift(newAirline)
      airlinesPagination.value.total++

      ElMessage.success('Havayolu başarıyla oluşturuldu')
      return newAirline
    } catch (error) {
      const errorInfo = parseApiError(error)
      ElMessage.error(`Havayolu oluşturulurken hata: ${errorInfo.message}`)
      logError('createAirline', error, airlineData)
      throw error
    }
  }

  const updateAirline = async (id, airlineData) => {
    try {
      const updatedAirline = await referenceService.updateAirline(id, airlineData)

      // Update local state efficiently
      const index = airlines.value.findIndex(airline => airline.id === id)
      if (index !== -1) {
        airlines.value[index] = updatedAirline
      }

      if (currentAirline.value?.id === id) {
        currentAirline.value = updatedAirline
      }

      ElMessage.success('Havayolu başarıyla güncellendi')
      return updatedAirline
    } catch (error) {
      const errorInfo = parseApiError(error)
      ElMessage.error(`Havayolu güncellenirken hata: ${errorInfo.message}`)
      logError('updateAirline', error, { id, airlineData })
      throw error
    }
  }

  const deleteAirline = async (id, force = false) => {
    try {
      if (force) {
        await referenceService.forceDeleteAirline(id)
      } else {
        await referenceService.deleteAirline(id)
      }

      // Update local state efficiently
      const index = airlines.value.findIndex(airline => airline.id === id)
      if (index !== -1) {
        airlines.value.splice(index, 1)
        airlinesPagination.value.total--
      }

      if (currentAirline.value?.id === id) {
        currentAirline.value = null
      }

      ElMessage.success('Havayolu başarıyla silindi')
    } catch (error) {
      const errorInfo = parseApiError(error)
      ElMessage.error(`Havayolu silinirken hata: ${errorInfo.message}`)
      logError('deleteAirline', error, { id, force })
      throw error
    }
  }

  const checkAirlineDeletion = async (id) => {
    try {
      return await referenceService.checkAirlineDeletion(id)
    } catch (error) {
      const errorInfo = parseApiError(error)
      ElMessage.error(`Silme kontrolü yapılırken hata: ${errorInfo.message}`)
      logError('checkAirlineDeletion', error, { id })
      throw error
    }
  }

  // ========================
  // AIRPORTS ACTIONS
  // ========================

  const loadAirports = async (params = {}, useCache = true) => {
    if (airportsLoading.value) return

    airportsLoading.value = true
    try {
      const response = await referenceService.getAllAirports(params, useCache)

      airports.value = response.content || response.data || response
      airportsPagination.value = {
        page: response.page || 0,
        size: response.size || 20,
        total: response.totalElements || response.total || airports.value.length,
        totalPages: response.totalPages || Math.ceil((response.totalElements || airports.value.length) / (response.size || 20))
      }

      return response
    } catch (error) {
      const errorInfo = parseApiError(error)
      ElMessage.error(`Havalimanları yüklenirken hata: ${errorInfo.message}`)
      logError('loadAirports', error, params)
      throw error
    } finally {
      airportsLoading.value = false
    }
  }

  const getAirportById = async (id, useCache = true) => {
    try {
      const airport = await referenceService.getAirportById(id, useCache)
      currentAirport.value = airport
      return airport
    } catch (error) {
      const errorInfo = parseApiError(error)
      ElMessage.error(`Havalimanı bilgisi alınırken hata: ${errorInfo.message}`)
      logError('getAirportById', error, { id })
      throw error
    }
  }

  const createAirport = async (airportData) => {
    try {
      const newAirport = await referenceService.createAirport(airportData)

      // Update local state efficiently
      airports.value.unshift(newAirport)
      airportsPagination.value.total++

      ElMessage.success('Havalimanı başarıyla oluşturuldu')
      return newAirport
    } catch (error) {
      const errorInfo = parseApiError(error)
      ElMessage.error(`Havalimanı oluşturulurken hata: ${errorInfo.message}`)
      logError('createAirport', error, airportData)
      throw error
    }
  }

  const updateAirport = async (id, airportData) => {
    try {
      const updatedAirport = await referenceService.updateAirport(id, airportData)

      // Update local state efficiently
      const index = airports.value.findIndex(airport => airport.id === id)
      if (index !== -1) {
        airports.value[index] = updatedAirport
      }

      if (currentAirport.value?.id === id) {
        currentAirport.value = updatedAirport
      }

      ElMessage.success('Havalimanı başarıyla güncellendi')
      return updatedAirport
    } catch (error) {
      const errorInfo = parseApiError(error)
      ElMessage.error(`Havalimanı güncellenirken hata: ${errorInfo.message}`)
      logError('updateAirport', error, { id, airportData })
      throw error
    }
  }

  const deleteAirport = async (id, force = false) => {
    try {
      if (force) {
        await referenceService.forceDeleteAirport(id)
      } else {
        await referenceService.deleteAirport(id)
      }

      // Update local state efficiently
      const index = airports.value.findIndex(airport => airport.id === id)
      if (index !== -1) {
        airports.value.splice(index, 1)
        airportsPagination.value.total--
      }

      if (currentAirport.value?.id === id) {
        currentAirport.value = null
      }

      ElMessage.success('Havalimanı başarıyla silindi')
    } catch (error) {
      const errorInfo = parseApiError(error)
      ElMessage.error(`Havalimanı silinirken hata: ${errorInfo.message}`)
      logError('deleteAirport', error, { id, force })
      throw error
    }
  }

  // ========================
  // UTILITY ACTIONS
  // ========================

  const prefetchData = async (types = ['airlines', 'airports']) => {
    try {
      await referenceService.prefetchReferenceData(types)
    } catch (error) {
      logError('prefetchData', error, { types })
    }
  }

  const clearAllCaches = () => {
    referenceService.clearAllCaches()
    ElMessage.success('Tüm önbellekler temizlendi')
  }

  const resetCurrentItems = () => {
    currentAirline.value = null
    currentAirport.value = null
    currentAircraft.value = null
    currentRoute.value = null
    currentCrewMember.value = null
  }

  const getCacheStats = () => {
    return referenceService.getCacheStats()
  }

// ========================
  // AIRCRAFT ACTIONS
  // ========================

  const loadAircraft = async (params = {}, useCache = true) => {
    if (aircraftLoading.value) return

    aircraftLoading.value = true
    try {
      const response = await referenceService.getAllAircraft(params, useCache)

      aircraft.value = response.content || response.data || response
      aircraftPagination.value = {
        page: response.page || 0,
        size: response.size || 20,
        total: response.totalElements || response.total || aircraft.value.length,
        totalPages: response.totalPages || Math.ceil((response.totalElements || aircraft.value.length) / (response.size || 20))
      }

      return response
    } catch (error) {
      const errorInfo = parseApiError(error)
      ElMessage.error(`Uçaklar yüklenirken hata: ${errorInfo.message}`)
      logError('loadAircraft', error, params)
      throw error
    } finally {
      aircraftLoading.value = false
    }
  }

  const getAircraftById = async (id, useCache = true) => {
    try {
      const aircraftItem = await referenceService.getAircraftById(id, useCache)
      currentAircraft.value = aircraftItem
      return aircraftItem
    } catch (error) {
      const errorInfo = parseApiError(error)
      ElMessage.error(`Uçak bilgisi alınırken hata: ${errorInfo.message}`)
      logError('getAircraftById', error, { id })
      throw error
    }
  }

  const getAircraftByAirline = async (airlineId, useCache = true) => {
    try {
      return await referenceService.getAircraftByAirline(airlineId, useCache)
    } catch (error) {
      const errorInfo = parseApiError(error)
      ElMessage.error(`Havayolu uçakları alınırken hata: ${errorInfo.message}`)
      logError('getAircraftByAirline', error, { airlineId })
      throw error
    }
  }

  const createAircraft = async (aircraftData) => {
    try {
      const newAircraft = await referenceService.createAircraft(aircraftData)

      // Update local state efficiently
      aircraft.value.unshift(newAircraft)
      aircraftPagination.value.total++

      ElMessage.success('Uçak başarıyla oluşturuldu')
      return newAircraft
    } catch (error) {
      const errorInfo = parseApiError(error)
      ElMessage.error(`Uçak oluşturulurken hata: ${errorInfo.message}`)
      logError('createAircraft', error, aircraftData)
      throw error
    }
  }

  const updateAircraft = async (id, aircraftData) => {
    try {
      const updatedAircraft = await referenceService.updateAircraft(id, aircraftData)

      // Update local state efficiently
      const index = aircraft.value.findIndex(ac => ac.id === id)
      if (index !== -1) {
        aircraft.value[index] = updatedAircraft
      }

      if (currentAircraft.value?.id === id) {
        currentAircraft.value = updatedAircraft
      }

      ElMessage.success('Uçak başarıyla güncellendi')
      return updatedAircraft
    } catch (error) {
      const errorInfo = parseApiError(error)
      ElMessage.error(`Uçak güncellenirken hata: ${errorInfo.message}`)
      logError('updateAircraft', error, { id, aircraftData })
      throw error
    }
  }

  const deleteAircraft = async (id, force = false) => {
    try {
      if (force) {
        await referenceService.forceDeleteAircraft(id)
      } else {
        await referenceService.deleteAircraft(id)
      }

      // Update local state efficiently
      const index = aircraft.value.findIndex(ac => ac.id === id)
      if (index !== -1) {
        aircraft.value.splice(index, 1)
        aircraftPagination.value.total--
      }

      if (currentAircraft.value?.id === id) {
        currentAircraft.value = null
      }

      ElMessage.success('Uçak başarıyla silindi')
    } catch (error) {
      const errorInfo = parseApiError(error)
      ElMessage.error(`Uçak silinirken hata: ${errorInfo.message}`)
      logError('deleteAircraft', error, { id, force })
      throw error
    }
  }

  // ========================
  // ROUTES ACTIONS
  // ========================

  const loadRoutes = async (useCache = true) => {
    if (routesLoading.value) return

    routesLoading.value = true
    try {
      const response = await referenceService.getAllRoutes(useCache)
      routes.value = response
      return response
    } catch (error) {
      const errorInfo = parseApiError(error)
      ElMessage.error(`Rotalar yüklenirken hata: ${errorInfo.message}`)
      logError('loadRoutes', error)
      throw error
    } finally {
      routesLoading.value = false
    }
  }

  const getRouteById = async (id, useCache = true) => {
    try {
      const route = await referenceService.getRouteById(id, useCache)
      currentRoute.value = route
      return route
    } catch (error) {
      const errorInfo = parseApiError(error)
      ElMessage.error(`Rota bilgisi alınırken hata: ${errorInfo.message}`)
      logError('getRouteById', error, { id })
      throw error
    }
  }

  const getMyRoutes = async (useCache = true) => {
    try {
      return await referenceService.getMyRoutes(useCache)
    } catch (error) {
      const errorInfo = parseApiError(error)
      ElMessage.error(`Rotalarım alınırken hata: ${errorInfo.message}`)
      logError('getMyRoutes', error)
      throw error
    }
  }

  const createRoute = async (routeData) => {
    try {
      const newRoute = await referenceService.createRoute(routeData)

      // Update local state efficiently
      routes.value.unshift(newRoute)

      ElMessage.success('Rota başarıyla oluşturuldu')
      return newRoute
    } catch (error) {
      const errorInfo = parseApiError(error)
      ElMessage.error(`Rota oluşturulurken hata: ${errorInfo.message}`)
      logError('createRoute', error, routeData)
      throw error
    }
  }

  const updateRoute = async (id, routeData) => {
    try {
      const updatedRoute = await referenceService.updateRoute(id, routeData)

      // Update local state efficiently
      const index = routes.value.findIndex(route => route.id === id)
      if (index !== -1) {
        routes.value[index] = updatedRoute
      }

      if (currentRoute.value?.id === id) {
        currentRoute.value = updatedRoute
      }

      ElMessage.success('Rota başarıyla güncellendi')
      return updatedRoute
    } catch (error) {
      const errorInfo = parseApiError(error)
      ElMessage.error(`Rota güncellenirken hata: ${errorInfo.message}`)
      logError('updateRoute', error, { id, routeData })
      throw error
    }
  }

  const deleteRoute = async (id) => {
    try {
      await referenceService.deleteRoute(id)

      // Update local state efficiently
      const index = routes.value.findIndex(route => route.id === id)
      if (index !== -1) {
        routes.value.splice(index, 1)
      }

      if (currentRoute.value?.id === id) {
        currentRoute.value = null
      }

      ElMessage.success('Rota başarıyla silindi')
    } catch (error) {
      const errorInfo = parseApiError(error)
      ElMessage.error(`Rota silinirken hata: ${errorInfo.message}`)
      logError('deleteRoute', error, { id })
      throw error
    }
  }

  const generateRouteCode = async (prefix) => {
    try {
      return await referenceService.generateRouteCode(prefix)
    } catch (error) {
      const errorInfo = parseApiError(error)
      ElMessage.error(`Rota kodu oluşturulurken hata: ${errorInfo.message}`)
      logError('generateRouteCode', error, { prefix })
      throw error
    }
  }

  // ========================
  // CREW MEMBERS ACTIONS
  // ========================

  const loadCrewMembers = async (useCache = true) => {
    if (crewMembersLoading.value) return

    crewMembersLoading.value = true
    try {
      const response = await referenceService.getAllCrewMembers(useCache)
      crewMembers.value = response
      return response
    } catch (error) {
      const errorInfo = parseApiError(error)
      ElMessage.error(`Mürettebat yüklenirken hata: ${errorInfo.message}`)
      logError('loadCrewMembers', error)
      throw error
    } finally {
      crewMembersLoading.value = false
    }
  }

  const getCrewMemberById = async (id, useCache = true) => {
    try {
      const crewMember = await referenceService.getCrewMemberById(id, useCache)
      currentCrewMember.value = crewMember
      return crewMember
    } catch (error) {
      const errorInfo = parseApiError(error)
      ElMessage.error(`Mürettebat bilgisi alınırken hata: ${errorInfo.message}`)
      logError('getCrewMemberById', error, { id })
      throw error
    }
  }

  const createCrewMember = async (crewData) => {
    try {
      const newCrewMember = await referenceService.createCrewMember(crewData)

      // Update local state efficiently
      crewMembers.value.unshift(newCrewMember)

      ElMessage.success('Mürettebat başarıyla oluşturuldu')
      return newCrewMember
    } catch (error) {
      const errorInfo = parseApiError(error)
      ElMessage.error(`Mürettebat oluşturulurken hata: ${errorInfo.message}`)
      logError('createCrewMember', error, crewData)
      throw error
    }
  }

  const updateCrewMember = async (id, crewData) => {
    try {
      const updatedCrewMember = await referenceService.updateCrewMember(id, crewData)

      // Update local state efficiently
      const index = crewMembers.value.findIndex(crew => crew.id === id)
      if (index !== -1) {
        crewMembers.value[index] = updatedCrewMember
      }

      if (currentCrewMember.value?.id === id) {
        currentCrewMember.value = updatedCrewMember
      }

      ElMessage.success('Mürettebat başarıyla güncellendi')
      return updatedCrewMember
    } catch (error) {
      const errorInfo = parseApiError(error)
      ElMessage.error(`Mürettebat güncellenirken hata: ${errorInfo.message}`)
      logError('updateCrewMember', error, { id, crewData })
      throw error
    }
  }

  const deleteCrewMember = async (id) => {
    try {
      await referenceService.deleteCrewMember(id)

      // Update local state efficiently
      const index = crewMembers.value.findIndex(crew => crew.id === id)
      if (index !== -1) {
        crewMembers.value.splice(index, 1)
      }

      if (currentCrewMember.value?.id === id) {
        currentCrewMember.value = null
      }

      ElMessage.success('Mürettebat başarıyla silindi')
    } catch (error) {
      const errorInfo = parseApiError(error)
      ElMessage.error(`Mürettebat silinirken hata: ${errorInfo.message}`)
      logError('deleteCrewMember', error, { id })
      throw error
    }
  }

  // ========================
  // BATCH OPERATIONS
  // ========================

  const batchDeleteAirlines = async (ids) => {
    const results = { success: [], failed: [] }

    for (const id of ids) {
      try {
        await deleteAirline(id)
        results.success.push(id)
      } catch (error) {
        results.failed.push({ id, error: error.message })
      }
    }

    const successCount = results.success.length
    const failedCount = results.failed.length

    if (successCount > 0) {
      ElMessage.success(`${successCount} havayolu başarıyla silindi`)
    }

    if (failedCount > 0) {
      ElMessage.warning(`${failedCount} havayolu silinemedi`)
    }

    return results
  }

  const batchDeleteAirports = async (ids) => {
    const results = { success: [], failed: [] }

    for (const id of ids) {
      try {
        await deleteAirport(id)
        results.success.push(id)
      } catch (error) {
        results.failed.push({ id, error: error.message })
      }
    }

    const successCount = results.success.length
    const failedCount = results.failed.length

    if (successCount > 0) {
      ElMessage.success(`${successCount} havalimanı başarıyla silindi`)
    }

    if (failedCount > 0) {
      ElMessage.warning(`${failedCount} havalimanı silinemedi`)
    }

    return results
  }

  // ========================
  // SEARCH & FILTER
  // ========================

  const searchAirlines = computed(() => (query) => {
    if (!query) return airlines.value

    const searchTerm = query.toLowerCase()
    return airlines.value.filter(airline =>
      airline.name.toLowerCase().includes(searchTerm) ||
      airline.iataCode.toLowerCase().includes(searchTerm) ||
      airline.icaoCode.toLowerCase().includes(searchTerm) ||
      airline.country.toLowerCase().includes(searchTerm)
    )
  })

  const searchAirports = computed(() => (query) => {
    if (!query) return airports.value

    const searchTerm = query.toLowerCase()
    return airports.value.filter(airport =>
      airport.name.toLowerCase().includes(searchTerm) ||
      airport.iataCode.toLowerCase().includes(searchTerm) ||
      airport.icaoCode.toLowerCase().includes(searchTerm) ||
      airport.city.toLowerCase().includes(searchTerm) ||
      airport.country.toLowerCase().includes(searchTerm)
    )
  })

  // ========================
  // RETURN STORE OBJECT
  // ========================

  return {
    // State
    airlines,
    airlinesPagination,
    airlinesLoading,
    airports,
    airportsPagination,
    airportsLoading,
    aircraft,
    aircraftPagination,
    aircraftLoading,
    routes,
    routesLoading,
    crewMembers,
    crewMembersLoading,
    currentAirline,
    currentAirport,
    currentAircraft,
    currentRoute,
    currentCrewMember,
    filters,

    // Getters
    activeAirlines,
    activeAirports,
    activeAircraft,
    airlineOptions,
    airportOptions,
    aircraftOptions,
    searchAirlines,
    searchAirports,

    // Airlines Actions
    loadAirlines,
    getAirlineById,
    createAirline,
    updateAirline,
    deleteAirline,
    checkAirlineDeletion,

    // Airports Actions
    loadAirports,
    getAirportById,
    createAirport,
    updateAirport,
    deleteAirport,

    // Aircraft Actions
    loadAircraft,
    getAircraftById,
    getAircraftByAirline,
    createAircraft,
    updateAircraft,
    deleteAircraft,

    // Routes Actions
    loadRoutes,
    getRouteById,
    getMyRoutes,
    createRoute,
    updateRoute,
    deleteRoute,
    generateRouteCode,

    // Crew Members Actions
    loadCrewMembers,
    getCrewMemberById,
    createCrewMember,
    updateCrewMember,
    deleteCrewMember,

    // Batch Operations
    batchDeleteAirlines,
    batchDeleteAirports,

    // Utility Actions
    prefetchData,
    clearAllCaches,
    resetCurrentItems,
    getCacheStats
  }
})
