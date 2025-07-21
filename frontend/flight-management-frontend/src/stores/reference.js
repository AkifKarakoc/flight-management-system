import { defineStore } from 'pinia'
import { referenceService } from '@/services/referenceService'
import { ElMessage } from 'element-plus'
import { SUCCESS_MESSAGES } from '@/utils/constants'

export const useReferenceStore = defineStore('reference', {
  state: () => ({
    airlines: [],
    airports: [],
    aircrafts: [],
    routes: [],
    crewMembers: [],

    // Loading states
    loading: {
      airlines: false,
      airports: false,
      aircrafts: false,
      routes: false,
      crewMembers: false
    },

    // Cache timestamps
    lastFetch: {
      airlines: null,
      airports: null,
      aircrafts: null,
      routes: null,
      crewMembers: null
    },

    // Cache duration (5 minutes)
    cacheDuration: 5 * 60 * 1000
  }),

  getters: {
    activeAirlines: (state) => state.airlines.filter(airline => airline.active),
    activeAirports: (state) => state.airports.filter(airport => airport.active),
    activeAircrafts: (state) => state.aircrafts.filter(aircraft => aircraft.active),
    activeRoutes: (state) => state.routes.filter(route => route.active),
    activeCrewMembers: (state) => state.crewMembers.filter(crew => crew.active),

    getAirlineById: (state) => (id) => state.airlines.find(airline => airline.id === id),
    getAirportById: (state) => (id) => state.airports.find(airport => airport.id === id),
    getAircraftById: (state) => (id) => state.aircrafts.find(aircraft => aircraft.id === id),
    getRouteById: (state) => (id) => state.routes.find(route => route.id === id),
    getCrewMemberById: (state) => (id) => state.crewMembers.find(crew => crew.id === id),

    getAircraftsByAirline: (state) => (airlineId) =>
      state.aircrafts.filter(aircraft => aircraft.airlineId === airlineId),

    getCrewMembersByRole: (state) => (role) =>
      state.crewMembers.filter(crew => crew.role === role)
  },

  actions: {
    // Check if cache is valid
    isCacheValid(type) {
      const lastFetch = this.lastFetch[type]
      if (!lastFetch) return false
      return Date.now() - lastFetch < this.cacheDuration
    },

    // Airlines
    async fetchAirlines(force = false) {
      if (!force && this.isCacheValid('airlines')) {
        return this.airlines
      }

      this.loading.airlines = true
      try {
        const response = await referenceService.airlines.getAll()
        this.airlines = response.data || response
        this.lastFetch.airlines = Date.now()
        return this.airlines
      } catch (error) {
        ElMessage.error('Havayolları yüklenirken hata oluştu')
        throw error
      } finally {
        this.loading.airlines = false
      }
    },

    async createAirline(data) {
      try {
        const response = await referenceService.airlines.create(data)
        this.airlines.push(response.data || response)
        ElMessage.success(SUCCESS_MESSAGES.CREATED)
        return response
      } catch (error) {
        ElMessage.error('Havayolu oluşturulurken hata oluştu')
        throw error
      }
    },

    async updateAirline(id, data) {
      try {
        const response = await referenceService.airlines.update(id, data)
        const index = this.airlines.findIndex(airline => airline.id === id)
        if (index !== -1) {
          this.airlines[index] = response.data || response
        }
        ElMessage.success(SUCCESS_MESSAGES.UPDATED)
        return response
      } catch (error) {
        ElMessage.error('Havayolu güncellenirken hata oluştu')
        throw error
      }
    },

    async deleteAirline(id) {
      try {
        await referenceService.airlines.delete(id)
        const index = this.airlines.findIndex(airline => airline.id === id)
        if (index !== -1) {
          this.airlines.splice(index, 1)
        }
        ElMessage.success(SUCCESS_MESSAGES.DELETED)
      } catch (error) {
        ElMessage.error('Havayolu silinirken hata oluştu')
        throw error
      }
    },

    async searchAirlines(query) {
      try {
        const response = await referenceService.airlines.search(query)
        return response.data || response
      } catch (error) {
        ElMessage.error('Havayolu arama işleminde hata oluştu')
        return []
      }
    },

    // Airports
    async fetchAirports(force = false) {
      if (!force && this.isCacheValid('airports')) {
        return this.airports
      }

      this.loading.airports = true
      try {
        const response = await referenceService.airports.getAll()
        this.airports = response.data || response
        this.lastFetch.airports = Date.now()
        return this.airports
      } catch (error) {
        ElMessage.error('Havaalanları yüklenirken hata oluştu')
        throw error
      } finally {
        this.loading.airports = false
      }
    },

    async createAirport(data) {
      try {
        const response = await referenceService.airports.create(data)
        this.airports.push(response.data || response)
        ElMessage.success(SUCCESS_MESSAGES.CREATED)
        return response
      } catch (error) {
        ElMessage.error('Havaalanı oluşturulurken hata oluştu')
        throw error
      }
    },

    async updateAirport(id, data) {
      try {
        const response = await referenceService.airports.update(id, data)
        const index = this.airports.findIndex(airport => airport.id === id)
        if (index !== -1) {
          this.airports[index] = response.data || response
        }
        ElMessage.success(SUCCESS_MESSAGES.UPDATED)
        return response
      } catch (error) {
        ElMessage.error('Havaalanı güncellenirken hata oluştu')
        throw error
      }
    },

    async deleteAirport(id) {
      try {
        await referenceService.airports.delete(id)
        const index = this.airports.findIndex(airport => airport.id === id)
        if (index !== -1) {
          this.airports.splice(index, 1)
        }
        ElMessage.success(SUCCESS_MESSAGES.DELETED)
      } catch (error) {
        ElMessage.error('Havaalanı silinirken hata oluştu')
        throw error
      }
    },

    async searchAirportsByIcao(icao) {
      try {
        const response = await referenceService.airports.searchByIcao(icao)
        return response.data || response
      } catch (error) {
        ElMessage.error('Havaalanı arama işleminde hata oluştu')
        return []
      }
    },

    // Aircrafts
    async fetchAircrafts(force = false) {
      if (!force && this.isCacheValid('aircrafts')) {
        return this.aircrafts
      }

      this.loading.aircrafts = true
      try {
        const response = await referenceService.aircrafts.getAll()
        this.aircrafts = response.data || response
        this.lastFetch.aircrafts = Date.now()
        return this.aircrafts
      } catch (error) {
        ElMessage.error('Uçaklar yüklenirken hata oluştu')
        throw error
      } finally {
        this.loading.aircrafts = false
      }
    },

    async createAircraft(data) {
      try {
        const response = await referenceService.aircrafts.create(data)
        this.aircrafts.push(response.data || response)
        ElMessage.success(SUCCESS_MESSAGES.CREATED)
        return response
      } catch (error) {
        ElMessage.error('Uçak oluşturulurken hata oluştu')
        throw error
      }
    },

    async updateAircraft(id, data) {
      try {
        const response = await referenceService.aircrafts.update(id, data)
        const index = this.aircrafts.findIndex(aircraft => aircraft.id === id)
        if (index !== -1) {
          this.aircrafts[index] = response.data || response
        }
        ElMessage.success(SUCCESS_MESSAGES.UPDATED)
        return response
      } catch (error) {
        ElMessage.error('Uçak güncellenirken hata oluştu')
        throw error
      }
    },

    async deleteAircraft(id) {
      try {
        await referenceService.aircrafts.delete(id)
        const index = this.aircrafts.findIndex(aircraft => aircraft.id === id)
        if (index !== -1) {
          this.aircrafts.splice(index, 1)
        }
        ElMessage.success(SUCCESS_MESSAGES.DELETED)
      } catch (error) {
        ElMessage.error('Uçak silinirken hata oluştu')
        throw error
      }
    },

    // Routes
    async fetchRoutes(force = false) {
      if (!force && this.isCacheValid('routes')) {
        return this.routes
      }

      this.loading.routes = true
      try {
        const response = await referenceService.routes.getAll()
        this.routes = response.data || response
        this.lastFetch.routes = Date.now()
        return this.routes
      } catch (error) {
        ElMessage.error('Rotalar yüklenirken hata oluştu')
        throw error
      } finally {
        this.loading.routes = false
      }
    },

    async createRoute(data) {
      try {
        const response = await referenceService.routes.create(data)
        this.routes.push(response.data || response)
        ElMessage.success(SUCCESS_MESSAGES.CREATED)
        return response
      } catch (error) {
        ElMessage.error('Rota oluşturulurken hata oluştu')
        throw error
      }
    },

    async updateRoute(id, data) {
      try {
        const response = await referenceService.routes.update(id, data)
        const index = this.routes.findIndex(route => route.id === id)
        if (index !== -1) {
          this.routes[index] = response.data || response
        }
        ElMessage.success(SUCCESS_MESSAGES.UPDATED)
        return response
      } catch (error) {
        ElMessage.error('Rota güncellenirken hata oluştu')
        throw error
      }
    },

    async deleteRoute(id) {
      try {
        await referenceService.routes.delete(id)
        const index = this.routes.findIndex(route => route.id === id)
        if (index !== -1) {
          this.routes.splice(index, 1)
        }
        ElMessage.success(SUCCESS_MESSAGES.DELETED)
      } catch (error) {
        ElMessage.error('Rota silinirken hata oluştu')
        throw error
      }
    },

    // Crew Members
    async fetchCrewMembers(force = false) {
      if (!force && this.isCacheValid('crewMembers')) {
        return this.crewMembers
      }

      this.loading.crewMembers = true
      try {
        const response = await referenceService.crewMembers.getAll()
        this.crewMembers = response.data || response
        this.lastFetch.crewMembers = Date.now()
        return this.crewMembers
      } catch (error) {
        ElMessage.error('Mürettebat yüklenirken hata oluştu')
        throw error
      } finally {
        this.loading.crewMembers = false
      }
    },

    async createCrewMember(data) {
      try {
        const response = await referenceService.crewMembers.create(data)
        this.crewMembers.push(response.data || response)
        ElMessage.success(SUCCESS_MESSAGES.CREATED)
        return response
      } catch (error) {
        ElMessage.error('Mürettebat oluşturulurken hata oluştu')
        throw error
      }
    },

    async updateCrewMember(id, data) {
      try {
        const response = await referenceService.crewMembers.update(id, data)
        const index = this.crewMembers.findIndex(crew => crew.id === id)
        if (index !== -1) {
          this.crewMembers[index] = response.data || response
        }
        ElMessage.success(SUCCESS_MESSAGES.UPDATED)
        return response
      } catch (error) {
        ElMessage.error('Mürettebat güncellenirken hata oluştu')
        throw error
      }
    },

    async deleteCrewMember(id) {
      try {
        await referenceService.crewMembers.delete(id)
        const index = this.crewMembers.findIndex(crew => crew.id === id)
        if (index !== -1) {
          this.crewMembers.splice(index, 1)
        }
        ElMessage.success(SUCCESS_MESSAGES.DELETED)
      } catch (error) {
        ElMessage.error('Mürettebat silinirken hata oluştu')
        throw error
      }
    },

    // Bulk operations
    async fetchAllReferenceData(force = false) {
      const promises = [
        this.fetchAirlines(force),
        this.fetchAirports(force),
        this.fetchAircrafts(force),
        this.fetchRoutes(force),
        this.fetchCrewMembers(force)
      ]

      try {
        await Promise.all(promises)
      } catch (error) {
        ElMessage.error('Referans veriler yüklenirken hata oluştu')
        throw error
      }
    },

    // Clear cache
    clearCache() {
      this.lastFetch = {
        airlines: null,
        airports: null,
        aircrafts: null,
        routes: null,
        crewMembers: null
      }
    }
  }
})
