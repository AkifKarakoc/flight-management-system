import api from './api.js'
import { API_ENDPOINTS } from '@/utils/constants'

export const referenceService = {
  // Airlines
  airlines: {
    getAll: (params = {}) => {
      return api.get(API_ENDPOINTS.AIRLINES, { params })
    },

    getById: (id) => {
      return api.get(`${API_ENDPOINTS.AIRLINES}/${id}`)
    },

    create: (data) => {
      return api.post(API_ENDPOINTS.AIRLINES, data)
    },

    update: (id, data) => {
      return api.put(`${API_ENDPOINTS.AIRLINES}/${id}`, data)
    },

    delete: (id) => {
      return api.delete(`${API_ENDPOINTS.AIRLINES}/${id}`)
    },

    search: (query) => {
      return api.get(`${API_ENDPOINTS.AIRLINES}/search`, { params: { q: query } })
    }
  },

  // Airports
  airports: {
    getAll: (params = {}) => {
      return api.get(API_ENDPOINTS.AIRPORTS, { params })
    },

    getById: (id) => {
      return api.get(`${API_ENDPOINTS.AIRPORTS}/${id}`)
    },

    create: (data) => {
      return api.post(API_ENDPOINTS.AIRPORTS, data)
    },

    update: (id, data) => {
      return api.put(`${API_ENDPOINTS.AIRPORTS}/${id}`, data)
    },

    delete: (id) => {
      return api.delete(`${API_ENDPOINTS.AIRPORTS}/${id}`)
    },

    searchByIcao: (icao) => {
      return api.get(`${API_ENDPOINTS.AIRPORTS}/search/icao`, { params: { icao } })
    },

    searchByCity: (city) => {
      return api.get(`${API_ENDPOINTS.AIRPORTS}/search/city`, { params: { city } })
    }
  },

  // Aircrafts
  aircrafts: {
    getAll: (params = {}) => {
      return api.get(API_ENDPOINTS.AIRCRAFTS, { params })
    },

    getById: (id) => {
      return api.get(`${API_ENDPOINTS.AIRCRAFTS}/${id}`)
    },

    create: (data) => {
      return api.post(API_ENDPOINTS.AIRCRAFTS, data)
    },

    update: (id, data) => {
      return api.put(`${API_ENDPOINTS.AIRCRAFTS}/${id}`, data)
    },

    delete: (id) => {
      return api.delete(`${API_ENDPOINTS.AIRCRAFTS}/${id}`)
    },

    getByAirline: (airlineId) => {
      return api.get(`${API_ENDPOINTS.AIRCRAFTS}/airline/${airlineId}`)
    }
  },

  // Routes
  routes: {
    getAll: (params = {}) => {
      return api.get(API_ENDPOINTS.ROUTES, { params })
    },

    getById: (id) => {
      return api.get(`${API_ENDPOINTS.ROUTES}/${id}`)
    },

    create: (data) => {
      return api.post(API_ENDPOINTS.ROUTES, data)
    },

    update: (id, data) => {
      return api.put(`${API_ENDPOINTS.ROUTES}/${id}`, data)
    },

    delete: (id) => {
      return api.delete(`${API_ENDPOINTS.ROUTES}/${id}`)
    },

    searchByAirports: (originId, destinationId) => {
      return api.get(`${API_ENDPOINTS.ROUTES}/search`, {
        params: { originId, destinationId }
      })
    }
  },

  // Crew Members
  crewMembers: {
    getAll: (params = {}) => {
      return api.get(API_ENDPOINTS.CREW_MEMBERS, { params })
    },

    getById: (id) => {
      return api.get(`${API_ENDPOINTS.CREW_MEMBERS}/${id}`)
    },

    create: (data) => {
      return api.post(API_ENDPOINTS.CREW_MEMBERS, data)
    },

    update: (id, data) => {
      return api.put(`${API_ENDPOINTS.CREW_MEMBERS}/${id}`, data)
    },

    delete: (id) => {
      return api.delete(`${API_ENDPOINTS.CREW_MEMBERS}/${id}`)
    },

    getByRole: (role) => {
      return api.get(`${API_ENDPOINTS.CREW_MEMBERS}/role/${role}`)
    }
  }
}
