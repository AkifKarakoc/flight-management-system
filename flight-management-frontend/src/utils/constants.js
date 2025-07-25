// API Base URLs
export const API_BASE_URL = {
  REFERENCE_MANAGER: import.meta.env.VITE_REFERENCE_API_BASE_URL || 'http://localhost:8081',
  FLIGHT_SERVICE: import.meta.env.VITE_FLIGHT_API_BASE_URL || 'http://localhost:8082',
  ARCHIVE_SERVICE: import.meta.env.VITE_ARCHIVE_API_BASE_URL || 'http://localhost:8083'
}

// API Endpoints - Reference Manager Service (Port 8081)
export const REFERENCE_API_ENDPOINTS = {
  // Auth endpoints
  AUTH: {
    LOGIN: '/api/v1/auth/login',
    LOGOUT: '/api/v1/auth/logout',
    REFRESH: '/api/v1/auth/refresh',
    PROFILE: '/api/v1/auth/profile'
  },

  // Airlines endpoints
  AIRLINES: {
    BASE: '/api/v1/airlines',
    BY_ID: (id) => `/api/v1/airlines/${id}`,
    BY_IATA: (iataCode) => `/api/v1/airlines/iata/${iataCode}`,
    DELETION_CHECK: (id) => `/api/v1/airlines/${id}/deletion-check`,
    FORCE_DELETE: (id) => `/api/v1/airlines/${id}/force`
  },

  // Airports endpoints
  AIRPORTS: {
    BASE: '/api/v1/airports',
    BY_ID: (id) => `/api/v1/airports/${id}`,
    BY_IATA: (iataCode) => `/api/v1/airports/iata/${iataCode}`,
    DELETION_CHECK: (id) => `/api/v1/airports/${id}/deletion-check`,
    FORCE_DELETE: (id) => `/api/v1/airports/${id}/force`
  },

  // Aircraft endpoints
  AIRCRAFT: {
    BASE: '/api/v1/aircrafts',
    BY_ID: (id) => `/api/v1/aircrafts/${id}`,
    BY_AIRLINE: (airlineId) => `/api/v1/aircrafts/airline/${airlineId}`,
    DELETION_CHECK: (id) => `/api/v1/aircrafts/${id}/deletion-check`,
    FORCE_DELETE: (id) => `/api/v1/aircrafts/${id}/force`
  },

  // Routes endpoints
  ROUTES: {
    BASE: '/api/v1/routes',
    BY_ID: (id) => `/api/v1/routes/${id}`,
    ADMIN_ALL: '/api/v1/routes/admin/all',
    MY_ROUTES: '/api/v1/routes/my-routes',
    AIRLINE_SHARED: (airlineId) => `/api/v1/routes/airline/${airlineId}/shared`,
    DELETION_CHECK: (id) => `/api/v1/routes/${id}/deletion-check`,
    GENERATE_CODE: '/api/v1/routes/generate-code'
  },

  // Crew Members endpoints
  CREW_MEMBERS: {
    BASE: '/api/v1/crew-members',
    BY_ID: (id) => `/api/v1/crew-members/${id}`
  }
}

// API Endpoints - Flight Service (Port 8082)
export const FLIGHT_API_ENDPOINTS = {
  // Main flight endpoints
  FLIGHTS: {
    BASE: '/api/v1/flights',
    BY_ID: (id) => `/api/v1/flights/${id}`,
    BY_FLIGHT_NUMBER: (flightNumber) => `/api/v1/flights/flight-number/${flightNumber}`,
    BY_DATE: (date) => `/api/v1/flights/date/${date}`,
    BY_AIRLINE: (airlineId) => `/api/v1/flights/airline/${airlineId}`,
    BY_AIRPORT: (airportId) => `/api/v1/flights/airport/${airportId}`,
    BY_STATUS: (status) => `/api/v1/flights/status/${status}`,
    DELAYED: '/api/v1/flights/delayed',
    UPLOAD: '/api/v1/flights/upload',
    BULK_UPDATE: '/api/v1/flights/bulk-update',
    STATISTICS: '/api/v1/flights/statistics'
  }
}

// HTTP Status Codes
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  INTERNAL_SERVER_ERROR: 500
}

// Flight Status (Flight Service'ten)
export const FLIGHT_STATUS = {
  SCHEDULED: 'SCHEDULED',
  BOARDING: 'BOARDING',
  DEPARTED: 'DEPARTED',
  ARRIVED: 'ARRIVED',
  CANCELLED: 'CANCELLED',
  DELAYED: 'DELAYED',
  DIVERTED: 'DIVERTED',
  RETURNING: 'RETURNING'
}

// Flight Types
export const FLIGHT_TYPE = {
  PASSENGER: 'PASSENGER',
  CARGO: 'CARGO',
  POSITIONING: 'POSITIONING'
}

// Airline Types (Reference Manager'dan)
export const AIRLINE_TYPE = {
  FULL_SERVICE: 'FULL_SERVICE',
  LOW_COST: 'LOW_COST',
  CARGO: 'CARGO',
  CHARTER: 'CHARTER'
}

// Airport Types (Reference Manager'dan)
export const AIRPORT_TYPE = {
  INTERNATIONAL: 'INTERNATIONAL',
  DOMESTIC: 'DOMESTIC',
  CARGO: 'CARGO',
  MILITARY: 'MILITARY'
}

// Aircraft Status (Reference Manager'dan)
export const AIRCRAFT_STATUS = {
  ACTIVE: 'ACTIVE',
  MAINTENANCE: 'MAINTENANCE',
  OUT_OF_SERVICE: 'OUT_OF_SERVICE',
  RETIRED: 'RETIRED'
}

// Crew Types (Reference Manager'dan)
export const CREW_TYPE = {
  CAPTAIN: 'CAPTAIN',
  FIRST_OFFICER: 'FIRST_OFFICER',
  FLIGHT_ENGINEER: 'FLIGHT_ENGINEER',
  PURSER: 'PURSER',
  FLIGHT_ATTENDANT: 'FLIGHT_ATTENDANT',
  CABIN_CREW: 'CABIN_CREW'
}

// Crew Status (Reference Manager'dan)
export const CREW_STATUS = {
  ACTIVE: 'ACTIVE',
  ON_LEAVE: 'ON_LEAVE',
  SICK_LEAVE: 'SICK_LEAVE',
  RETIRED: 'RETIRED',
  SUSPENDED: 'SUSPENDED'
}

// Route Types (Reference Manager'dan)
export const ROUTE_TYPE = {
  DOMESTIC: 'DOMESTIC',
  INTERNATIONAL: 'INTERNATIONAL',
  CONTINENTAL: 'CONTINENTAL'
}

// Route Visibility (Reference Manager'dan)
export const ROUTE_VISIBILITY = {
  PRIVATE: 'PRIVATE',
  SHARED: 'SHARED',
  PUBLIC: 'PUBLIC'
}

// Gender (Reference Manager'dan)
export const GENDER = {
  MALE: 'MALE',
  FEMALE: 'FEMALE',
  OTHER: 'OTHER'
}

// User Roles
export const USER_ROLES = {
  ADMIN: 'ADMIN',
  USER: 'USER'
}

// Table pagination defaults
export const PAGINATION = {
  DEFAULT_PAGE_SIZE: 20,
  PAGE_SIZES: [10, 20, 50, 100],
  DEFAULT_PAGE: 0 // API'ler 0-based pagination kullanıyor
}

// Date formats
export const DATE_FORMATS = {
  DATE_ONLY: 'YYYY-MM-DD',
  TIME_ONLY: 'HH:mm',
  DATETIME: 'YYYY-MM-DD HH:mm',
  DATETIME_SECONDS: 'YYYY-MM-DD HH:mm:ss',
  DISPLAY_DATE: 'DD/MM/YYYY',
  DISPLAY_DATETIME: 'DD/MM/YYYY HH:mm'
}

// Validation patterns
export const VALIDATION_PATTERNS = {
  FLIGHT_NUMBER: /^[A-Z]{2,3}[0-9]{1,4}$/,
  IATA_CODE: /^[A-Z]{2}$/,
  ICAO_CODE: /^[A-Z]{3,4}$/,
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  PHONE: /^[+]?[1-9][\d\s\-()]{7,15}$/
}

// File upload constraints
export const FILE_UPLOAD = {
  MAX_SIZE_MB: 10,
  ALLOWED_TYPES: ['text/csv', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'],
  CSV_HEADERS: {
    FLIGHTS: ['flightNumber', 'airlineId', 'aircraftType', 'originId', 'destinationId', 'flightDate', 'std', 'sta', 'flightType']
  }
}

// Notification types
export const NOTIFICATION_TYPES = {
  SUCCESS: 'success',
  WARNING: 'warning',
  ERROR: 'error',
  INFO: 'info'
}

// WebSocket endpoints
export const WS_ENDPOINTS = {
  REFERENCE_MANAGER: 'ws://localhost:8081/ws',
  FLIGHT_SERVICE: 'ws://localhost:8082/ws'
}

// WebSocket events/topics
export const WS_TOPICS = {
  // Reference Manager WebSocket topics
  REFERENCE_UPDATES: '/topic/reference/updates',
  AIRLINES: '/topic/reference/airlines',
  AIRCRAFT: '/topic/reference/aircrafts',
  AIRPORTS: '/topic/reference/airports',
  ROUTES: '/topic/reference/routes',
  CREW_MEMBERS: '/topic/reference/crew-members',

  // Flight Service WebSocket topics
  FLIGHTS: '/topic/flights',
  FLIGHT_BY_NUMBER: (flightNumber) => `/topic/flights/${flightNumber}`,
  FLIGHT_BY_STATUS: (status) => `/topic/flights/status/${status}`,
  FLIGHT_BULK: '/topic/flights/bulk',
  UPDATES: '/topic/updates'
}

// WebSocket message types
export const WS_MESSAGE_TYPES = {
  CREATE: 'CREATE',
  UPDATE: 'UPDATE',
  DELETE: 'DELETE',
  STATUS_CHANGE: 'STATUS_CHANGE',
  DELAY: 'DELAY',
  CONNECTING_FLIGHT_CREATED: 'CONNECTING_FLIGHT_CREATED',
  CONNECTING_FLIGHT_UPDATED: 'CONNECTING_FLIGHT_UPDATED',
  CONNECTING_FLIGHT_DELETED: 'CONNECTING_FLIGHT_DELETED',
  SUBSCRIPTION_CONFIRMED: 'SUBSCRIPTION_CONFIRMED',
  PONG: 'PONG',
  SUBSCRIBE: 'SUBSCRIBE',
  PING: 'PING'
}

// Local storage keys
export const STORAGE_KEYS = {
  AUTH_TOKEN: 'auth_token',
  REFRESH_TOKEN: 'refresh_token',
  USER_PREFERENCES: 'user_preferences',
  LAST_ROUTE: 'last_route'
}

// Cache keys
export const CACHE_KEYS = {
  AIRLINES: 'airlines',
  AIRPORTS: 'airports',
  ROUTES: 'routes',
  CREW_MEMBERS: 'crew_members',
  AIRCRAFT: 'aircraft'
}

// Cache TTL (seconds)
export const CACHE_TTL = {
  REFERENCE_DATA: 3600, // 1 hour
  USER_DATA: 1800, // 30 minutes
  FLIGHT_DATA: 300 // 5 minutes
}
