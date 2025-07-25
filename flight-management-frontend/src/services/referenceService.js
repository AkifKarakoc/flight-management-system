import { referenceAPI } from './api'
import { getCacheItem, setCacheItem, removeCacheItem } from '@/utils/helpers'
import { CACHE_KEYS, CACHE_TTL } from '@/utils/constants'

class ReferenceService {
  constructor() {
    this.api = referenceAPI
    this.requestCache = new Map() // In-memory request deduplication
  }

  // ========================
  // CACHE MANAGEMENT
  // ========================

  /**
   * Get cached data or fetch from API
   * @param {string} cacheKey - Cache key
   * @param {Function} fetchFn - Function to fetch data
   * @param {number} ttl - Time to live in seconds
   */
  async getCachedOrFetch(cacheKey, fetchFn, ttl = CACHE_TTL.REFERENCE_DATA) {
    // Check cache first
    const cachedData = getCacheItem(cacheKey)
    if (cachedData) {
      return cachedData
    }

    // Check if request is already in progress (deduplication)
    if (this.requestCache.has(cacheKey)) {
      return this.requestCache.get(cacheKey)
    }

    // Make request and cache it
    const requestPromise = fetchFn().then(data => {
      setCacheItem(cacheKey, data, ttl)
      this.requestCache.delete(cacheKey)
      return data
    }).catch(error => {
      this.requestCache.delete(cacheKey)
      throw error
    })

    this.requestCache.set(cacheKey, requestPromise)
    return requestPromise
  }

  /**
   * Invalidate cache for specific key or pattern
   * @param {string|RegExp} keyOrPattern - Cache key or pattern
   */
  invalidateCache(keyOrPattern) {
    if (typeof keyOrPattern === 'string') {
      removeCacheItem(keyOrPattern)
    } else if (keyOrPattern instanceof RegExp) {
      // Clear multiple cache keys matching pattern
      Object.keys(localStorage).forEach(key => {
        if (key.startsWith('cache_') && keyOrPattern.test(key)) {
          localStorage.removeItem(key)
        }
      })
    }
  }

  // ========================
  // AIRLINES
  // ========================

  async getAllAirlines(params = {}, useCache = true) {
    const cacheKey = `${CACHE_KEYS.AIRLINES}_${JSON.stringify(params)}`

    if (!useCache) {
      this.invalidateCache(cacheKey)
    }

    return this.getCachedOrFetch(cacheKey, async () => {
      const { page = 0, size = 20, sort } = params
      const response = await this.api.get('/airlines', {
        params: { page, size, sort }
      })
      return response.data
    })
  }

  async getAirlineById(id, useCache = true) {
    const cacheKey = `${CACHE_KEYS.AIRLINES}_${id}`

    if (!useCache) {
      this.invalidateCache(cacheKey)
    }

    return this.getCachedOrFetch(cacheKey, async () => {
      const response = await this.api.get(`/airlines/${id}`)
      return response.data
    })
  }

  async getAirlineByIataCode(iataCode, useCache = true) {
    const cacheKey = `${CACHE_KEYS.AIRLINES}_iata_${iataCode}`

    if (!useCache) {
      this.invalidateCache(cacheKey)
    }

    return this.getCachedOrFetch(cacheKey, async () => {
      const response = await this.api.get(`/airlines/iata/${iataCode}`)
      return response.data
    })
  }

  async createAirline(airlineData) {
    const response = await this.api.post('/airlines', airlineData)

    // Invalidate related caches
    this.invalidateCache(new RegExp(CACHE_KEYS.AIRLINES))

    return response.data
  }

  async updateAirline(id, airlineData) {
    const response = await this.api.put(`/airlines/${id}`, airlineData)

    // Invalidate specific and related caches
    this.invalidateCache(`${CACHE_KEYS.AIRLINES}_${id}`)
    this.invalidateCache(new RegExp(CACHE_KEYS.AIRLINES))

    return response.data
  }

  async deleteAirline(id) {
    await this.api.delete(`/airlines/${id}`)

    // Invalidate related caches
    this.invalidateCache(new RegExp(CACHE_KEYS.AIRLINES))
  }

  async checkAirlineDeletion(id) {
    const response = await this.api.get(`/airlines/${id}/deletion-check`)
    return response.data
  }

  async forceDeleteAirline(id) {
    await this.api.delete(`/airlines/${id}/force`)

    // Invalidate related caches
    this.invalidateCache(new RegExp(CACHE_KEYS.AIRLINES))
  }

  // ========================
  // AIRPORTS
  // ========================

  async getAllAirports(params = {}, useCache = true) {
    const cacheKey = `${CACHE_KEYS.AIRPORTS}_${JSON.stringify(params)}`

    if (!useCache) {
      this.invalidateCache(cacheKey)
    }

    return this.getCachedOrFetch(cacheKey, async () => {
      const { page = 0, size = 20, sort } = params
      const response = await this.api.get('/airports', {
        params: { page, size, sort }
      })
      return response.data
    })
  }

  async getAirportById(id, useCache = true) {
    const cacheKey = `${CACHE_KEYS.AIRPORTS}_${id}`

    if (!useCache) {
      this.invalidateCache(cacheKey)
    }

    return this.getCachedOrFetch(cacheKey, async () => {
      const response = await this.api.get(`/airports/${id}`)
      return response.data
    })
  }

  async getAirportByIataCode(iataCode, useCache = true) {
    const cacheKey = `${CACHE_KEYS.AIRPORTS}_iata_${iataCode}`

    if (!useCache) {
      this.invalidateCache(cacheKey)
    }

    return this.getCachedOrFetch(cacheKey, async () => {
      const response = await this.api.get(`/airports/iata/${iataCode}`)
      return response.data
    })
  }

  async createAirport(airportData) {
    const response = await this.api.post('/airports', airportData)

    // Invalidate related caches
    this.invalidateCache(new RegExp(CACHE_KEYS.AIRPORTS))

    return response.data
  }

  async updateAirport(id, airportData) {
    const response = await this.api.put(`/airports/${id}`, airportData)

    // Invalidate specific and related caches
    this.invalidateCache(`${CACHE_KEYS.AIRPORTS}_${id}`)
    this.invalidateCache(new RegExp(CACHE_KEYS.AIRPORTS))

    return response.data
  }

  async deleteAirport(id) {
    await this.api.delete(`/airports/${id}`)

    // Invalidate related caches
    this.invalidateCache(new RegExp(CACHE_KEYS.AIRPORTS))
  }

  async checkAirportDeletion(id) {
    const response = await this.api.get(`/airports/${id}/deletion-check`)
    return response.data
  }

  async forceDeleteAirport(id) {
    await this.api.delete(`/airports/${id}/force`)

    // Invalidate related caches
    this.invalidateCache(new RegExp(CACHE_KEYS.AIRPORTS))
  }

  // ========================
  // AIRCRAFT
  // ========================

  async getAllAircraft(params = {}, useCache = true) {
    const cacheKey = `${CACHE_KEYS.AIRCRAFT}_${JSON.stringify(params)}`

    if (!useCache) {
      this.invalidateCache(cacheKey)
    }

    return this.getCachedOrFetch(cacheKey, async () => {
      const { page = 0, size = 20, sort } = params
      const response = await this.api.get('/aircrafts', {
        params: { page, size, sort }
      })
      return response.data
    })
  }

  async getAircraftById(id, useCache = true) {
    const cacheKey = `${CACHE_KEYS.AIRCRAFT}_${id}`

    if (!useCache) {
      this.invalidateCache(cacheKey)
    }

    return this.getCachedOrFetch(cacheKey, async () => {
      const response = await this.api.get(`/aircrafts/${id}`)
      return response.data
    })
  }

  async getAircraftByAirline(airlineId, useCache = true) {
    const cacheKey = `${CACHE_KEYS.AIRCRAFT}_airline_${airlineId}`

    if (!useCache) {
      this.invalidateCache(cacheKey)
    }

    return this.getCachedOrFetch(cacheKey, async () => {
      const response = await this.api.get(`/aircrafts/airline/${airlineId}`)
      return response.data
    })
  }

  async createAircraft(aircraftData) {
    const response = await this.api.post('/aircrafts', aircraftData)

    // Invalidate related caches
    this.invalidateCache(new RegExp(CACHE_KEYS.AIRCRAFT))

    return response.data
  }

  async updateAircraft(id, aircraftData) {
    const response = await this.api.put(`/aircrafts/${id}`, aircraftData)

    // Invalidate specific and related caches
    this.invalidateCache(`${CACHE_KEYS.AIRCRAFT}_${id}`)
    this.invalidateCache(new RegExp(CACHE_KEYS.AIRCRAFT))

    return response.data
  }

  async deleteAircraft(id) {
    await this.api.delete(`/aircrafts/${id}`)

    // Invalidate related caches
    this.invalidateCache(new RegExp(CACHE_KEYS.AIRCRAFT))
  }

  async checkAircraftDeletion(id) {
    const response = await this.api.get(`/aircrafts/${id}/deletion-check`)
    return response.data
  }

  async forceDeleteAircraft(id) {
    await this.api.delete(`/aircrafts/${id}/force`)

    // Invalidate related caches
    this.invalidateCache(new RegExp(CACHE_KEYS.AIRCRAFT))
  }

  // ========================
  // ROUTES
  // ========================

  async getAllRoutes(useCache = true) {
    const cacheKey = CACHE_KEYS.ROUTES

    if (!useCache) {
      this.invalidateCache(cacheKey)
    }

    return this.getCachedOrFetch(cacheKey, async () => {
      const response = await this.api.get('/routes')
      return response.data
    })
  }

  async getRouteById(id, useCache = true) {
    const cacheKey = `${CACHE_KEYS.ROUTES}_${id}`

    if (!useCache) {
      this.invalidateCache(cacheKey)
    }

    return this.getCachedOrFetch(cacheKey, async () => {
      const response = await this.api.get(`/routes/${id}`)
      return response.data
    })
  }

  async getMyRoutes(useCache = true) {
    const cacheKey = `${CACHE_KEYS.ROUTES}_my`

    if (!useCache) {
      this.invalidateCache(cacheKey)
    }

    return this.getCachedOrFetch(cacheKey, async () => {
      const response = await this.api.get('/routes/my-routes')
      return response.data
    })
  }

  async getSharedRoutesForAirline(airlineId, useCache = true) {
    const cacheKey = `${CACHE_KEYS.ROUTES}_airline_${airlineId}`

    if (!useCache) {
      this.invalidateCache(cacheKey)
    }

    return this.getCachedOrFetch(cacheKey, async () => {
      const response = await this.api.get(`/routes/airline/${airlineId}/shared`)
      return response.data
    })
  }

  async createRoute(routeData) {
    const response = await this.api.post('/routes', routeData)

    // Invalidate related caches
    this.invalidateCache(new RegExp(CACHE_KEYS.ROUTES))

    return response.data
  }

  async updateRoute(id, routeData) {
    const response = await this.api.put(`/routes/${id}`, routeData)

    // Invalidate specific and related caches
    this.invalidateCache(`${CACHE_KEYS.ROUTES}_${id}`)
    this.invalidateCache(new RegExp(CACHE_KEYS.ROUTES))

    return response.data
  }

  async deleteRoute(id) {
    await this.api.delete(`/routes/${id}`)

    // Invalidate related caches
    this.invalidateCache(new RegExp(CACHE_KEYS.ROUTES))
  }

  async checkRouteDeletion(id) {
    const response = await this.api.get(`/routes/${id}/deletion-check`)
    return response.data
  }

  async generateRouteCode(prefix) {
    const response = await this.api.get('/routes/generate-code', {
      params: { prefix }
    })
    return response.data
  }

  // ========================
  // CREW MEMBERS
  // ========================

  async getAllCrewMembers(useCache = true) {
    const cacheKey = CACHE_KEYS.CREW_MEMBERS

    if (!useCache) {
      this.invalidateCache(cacheKey)
    }

    return this.getCachedOrFetch(cacheKey, async () => {
      const response = await this.api.get('/crew-members')
      return response.data
    })
  }

  async getCrewMemberById(id, useCache = true) {
    const cacheKey = `${CACHE_KEYS.CREW_MEMBERS}_${id}`

    if (!useCache) {
      this.invalidateCache(cacheKey)
    }

    return this.getCachedOrFetch(cacheKey, async () => {
      const response = await this.api.get(`/crew-members/${id}`)
      return response.data
    })
  }

  async createCrewMember(crewData) {
    const response = await this.api.post('/crew-members', crewData)

    // Invalidate related caches
    this.invalidateCache(new RegExp(CACHE_KEYS.CREW_MEMBERS))

    return response.data
  }

  async updateCrewMember(id, crewData) {
    const response = await this.api.put(`/crew-members/${id}`, crewData)

    // Invalidate specific and related caches
    this.invalidateCache(`${CACHE_KEYS.CREW_MEMBERS}_${id}`)
    this.invalidateCache(new RegExp(CACHE_KEYS.CREW_MEMBERS))

    return response.data
  }

  async deleteCrewMember(id) {
    await this.api.delete(`/crew-members/${id}`)

    // Invalidate related caches
    this.invalidateCache(new RegExp(CACHE_KEYS.CREW_MEMBERS))
  }

  // ========================
  // BULK OPERATIONS
  // ========================

  /**
   * Prefetch multiple reference data types
   * @param {Array} types - Array of reference types to prefetch
   */
  async prefetchReferenceData(types = ['airlines', 'airports']) {
    const promises = []

    if (types.includes('airlines')) {
      promises.push(this.getAllAirlines({ size: 100 }))
    }

    if (types.includes('airports')) {
      promises.push(this.getAllAirports({ size: 100 }))
    }

    if (types.includes('aircraft')) {
      promises.push(this.getAllAircraft({ size: 100 }))
    }

    if (types.includes('routes')) {
      promises.push(this.getAllRoutes())
    }

    if (types.includes('crew')) {
      promises.push(this.getAllCrewMembers())
    }

    return Promise.allSettled(promises)
  }

  /**
   * Clear all reference data caches
   */
  clearAllCaches() {
    Object.values(CACHE_KEYS).forEach(key => {
      this.invalidateCache(new RegExp(key))
    })
    this.requestCache.clear()
  }

  /**
   * Get cache statistics
   */
  getCacheStats() {
    const stats = {
      totalItems: 0,
      cacheKeys: [],
      memoryUsage: 0
    }

    Object.keys(localStorage).forEach(key => {
      if (key.startsWith('cache_')) {
        stats.totalItems++
        stats.cacheKeys.push(key.replace('cache_', ''))

        try {
          const value = localStorage.getItem(key)
          stats.memoryUsage += new Blob([value]).size
        } catch (e) {
          // Handle quota exceeded or other errors
        }
      }
    })

    return stats
  }
}

// Export singleton instance
export default new ReferenceService()
