import { referenceAPI } from './api'

class ReferenceService {

  // ========================
  // AIRLINES
  // ========================
  async getAllAirlines(params = {}) {
    const { page = 0, size = 20, sort } = params
    const response = await referenceAPI.get('/airlines', {
      params: { page, size, sort }
    })
    return response.data
  }

  async getAirlineById(id) {
    const response = await referenceAPI.get(`/airlines/${id}`)
    return response.data
  }

  async getAirlineByIataCode(iataCode) {
    const response = await referenceAPI.get(`/airlines/iata/${iataCode}`)
    return response.data
  }

  async createAirline(airlineData) {
    const response = await referenceAPI.post('/airlines', airlineData)
    return response.data
  }

  async updateAirline(id, airlineData) {
    const response = await referenceAPI.put(`/airlines/${id}`, airlineData)
    return response.data
  }

  async deleteAirline(id) {
    await referenceAPI.delete(`/airlines/${id}`)
  }

  async checkAirlineDeletion(id) {
    const response = await referenceAPI.get(`/airlines/${id}/deletion-check`)
    return response.data
  }

  async forceDeleteAirline(id) {
    await referenceAPI.delete(`/airlines/${id}/force`)
  }

  // ========================
  // AIRPORTS
  // ========================
  async getAllAirports(params = {}) {
    const { page = 0, size = 20, sort } = params
    const response = await referenceAPI.get('/airports', {
      params: { page, size, sort }
    })
    return response.data
  }

  async getAirportById(id) {
    const response = await referenceAPI.get(`/airports/${id}`)
    return response.data
  }

  async getAirportByIataCode(iataCode) {
    const response = await referenceAPI.get(`/airports/iata/${iataCode}`)
    return response.data
  }

  async createAirport(airportData) {
    const response = await referenceAPI.post('/airports', airportData)
    return response.data
  }

  async updateAirport(id, airportData) {
    const response = await referenceAPI.put(`/airports/${id}`, airportData)
    return response.data
  }

  async deleteAirport(id) {
    await referenceAPI.delete(`/airports/${id}`)
  }

  async checkAirportDeletion(id) {
    const response = await referenceAPI.get(`/airports/${id}/deletion-check`)
    return response.data
  }

  async forceDeleteAirport(id) {
    await referenceAPI.delete(`/airports/${id}/force`)
  }

  // ========================
  // ROUTES
  // ========================
  async getAllRoutes() {
    const response = await referenceAPI.get('/routes')
    return response.data
  }

  async getRouteById(id) {
    const response = await referenceAPI.get(`/routes/${id}`)
    return response.data
  }

  async createRoute(routeData) {
    const response = await referenceAPI.post('/routes', routeData)
    return response.data
  }

  async updateRoute(id, routeData) {
    const response = await referenceAPI.put(`/routes/${id}`, routeData)
    return response.data
  }

  async deleteRoute(id) {
    await referenceAPI.delete(`/routes/${id}`)
  }

  async checkRouteDeletion(id) {
    const response = await referenceAPI.get(`/routes/${id}/deletion-check`)
    return response.data
  }

  // ========================
  // CREW MEMBERS
  // ========================
  async getAllCrewMembers() {
    const response = await referenceAPI.get('/crew-members')
    return response.data
  }

  async getCrewMemberById(id) {
    const response = await referenceAPI.get(`/crew-members/${id}`)
    return response.data
  }

  async createCrewMember(crewData) {
    const response = await referenceAPI.post('/crew-members', crewData)
    return response.data
  }

  async updateCrewMember(id, crewData) {
    const response = await referenceAPI.put(`/crew-members/${id}`, crewData)
    return response.data
  }

  async deleteCrewMember(id) {
    await referenceAPI.delete(`/crew-members/${id}`)
  }

  // ========================
  // AIRCRAFT (Future)
  // ========================
  async getAllAircraft() {
    const response = await referenceAPI.get('/aircrafts')
    return response.data
  }

  async getAircraftById(id) {
    const response = await referenceAPI.get(`/aircrafts/${id}`)
    return response.data
  }

  async createAircraft(aircraftData) {
    const response = await referenceAPI.post('/aircrafts', aircraftData)
    return response.data
  }

  async updateAircraft(id, aircraftData) {
    const response = await referenceAPI.put(`/aircrafts/${id}`, aircraftData)
    return response.data
  }

  async deleteAircraft(id) {
    await referenceAPI.delete(`/aircrafts/${id}`)
  }

  // ========================
  // UTILITY METHODS
  // ========================

  /**
   * Dropdown'lar için airline options
   */
  async getAirlineOptions() {
    try {
      const airlines = await this.getAllAirlines({ size: 1000 })
      return airlines.content?.map(airline => ({
        value: airline.id,
        label: `${airline.name} (${airline.iataCode})`,
        ...airline
      })) || []
    } catch (error) {
      console.error('Error fetching airline options:', error)
      return []
    }
  }

  /**
   * Dropdown'lar için airport options
   */
  async getAirportOptions() {
    try {
      const airports = await this.getAllAirports({ size: 1000 })
      return airports.content?.map(airport => ({
        value: airport.id,
        label: `${airport.name} (${airport.iataCode}) - ${airport.city}`,
        ...airport
      })) || []
    } catch (error) {
      console.error('Error fetching airport options:', error)
      return []
    }
  }

  /**
   * Dropdown'lar için aircraft options
   */
  async getAircraftOptions(airlineId = null) {
    try {
      const aircraft = await this.getAllAircraft()
      let filtered = aircraft || []

      if (airlineId) {
        filtered = filtered.filter(ac => ac.airlineId === airlineId)
      }

      return filtered.map(ac => ({
        value: ac.id,
        label: `${ac.registrationNumber} (${ac.aircraftType})`,
        ...ac
      }))
    } catch (error) {
      console.error('Error fetching aircraft options:', error)
      return []
    }
  }

  /**
   * Dropdown'lar için route options
   */
  async getRouteOptions() {
    try {
      const routes = await this.getAllRoutes()
      return routes?.map(route => ({
        value: route.id,
        label: `${route.originAirport?.iataCode} → ${route.destinationAirport?.iataCode}`,
        ...route
      })) || []
    } catch (error) {
      console.error('Error fetching route options:', error)
      return []
    }
  }

  /**
   * Dropdown'lar için crew member options
   */
  async getCrewMemberOptions(crewType = null) {
    try {
      const crewMembers = await this.getAllCrewMembers()
      let filtered = crewMembers || []

      if (crewType) {
        filtered = filtered.filter(crew => crew.crewType === crewType)
      }

      return filtered.map(crew => ({
        value: crew.id,
        label: `${crew.fullName} (${crew.crewType})`,
        ...crew
      }))
    } catch (error) {
      console.error('Error fetching crew member options:', error)
      return []
    }
  }
}

// Singleton instance
const referenceService = new ReferenceService()
export default referenceService
