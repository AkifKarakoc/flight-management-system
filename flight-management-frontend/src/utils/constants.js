// API Base URLs - Vite Proxy ile uyumlu
export const API_BASE_URL = {
  // Vite proxy aktifken boş string kullan, production'da full URL
  REFERENCE_MANAGER: import.meta.env.VITE_REFERENCE_API_BASE_URL || '',
  FLIGHT_SERVICE: import.meta.env.VITE_FLIGHT_API_BASE_URL || '',
  ARCHIVE_SERVICE: import.meta.env.VITE_ARCHIVE_API_BASE_URL || ''
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
    BY_ROUTE: (routeId) => `/api/v1/flights/route/${routeId}`,
    BY_ROUTE_PAGED: (routeId) => `/api/v1/flights/route/${routeId}/paged`,
    DELAYED: '/api/v1/flights/delayed',
    SEARCH: '/api/v1/flights/search',
    FILTER: '/api/v1/flights/filter',
    COUNT: '/api/v1/flights/count',
    STATS: '/api/v1/flights/stats',
    SYSTEM_INFO: '/api/v1/flights/system-info',
    MIGRATION_STATUS: '/api/v1/flights/migration-status',
    HEALTH: '/api/v1/flights/health',
    ROUTE_INFO: (id) => `/api/v1/flights/${id}/route-info`,
    UPLOAD_CSV: '/api/v1/flights/upload-csv',
    VALIDATE_CSV: '/api/v1/flights/validate-csv',
    CSV_TEMPLATE: '/api/v1/flights/csv-template',
    BULK_STATUS_UPDATE: '/api/v1/flights/bulk-status-update',
    BULK_DELETE: '/api/v1/flights/bulk-delete'
  },

  // Connecting flights endpoints
  CONNECTING_FLIGHTS: {
    BASE: '/api/v1/flights/connecting',
    BY_ID: (id) => `/api/v1/flights/connecting/${id}`,
    SEGMENTS: (id) => `/api/v1/flights/${id}/segments`,
    SEGMENT_UPDATE: (segmentId) => `/api/v1/flights/segments/${segmentId}`,
    SEGMENT_STATUS: (segmentId) => `/api/v1/flights/segments/${segmentId}/status`
  },

  // Flight status management
  STATUS: {
    UPDATE: (id) => `/api/v1/flights/${id}/status`,
    DELAY: (id) => `/api/v1/flights/${id}/delay`
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

// Flight Status (Backend'den alınan)
export const FLIGHT_STATUS = {
  SCHEDULED: 'SCHEDULED',
  BOARDING: 'BOARDING',
  DEPARTED: 'DEPARTED',
  ARRIVED: 'ARRIVED',
  DELAYED: 'DELAYED',
  CANCELLED: 'CANCELLED'
}

// Flight Status Labels (Türkçe)
export const FLIGHT_STATUS_LABELS = {
  SCHEDULED: 'Planlandı',
  BOARDING: 'Biniş',
  DEPARTED: 'Kalktı',
  ARRIVED: 'İndi',
  DELAYED: 'Gecikti',
  CANCELLED: 'İptal'
}

// Flight Type Labels (Türkçe)
export const FLIGHT_TYPE_LABELS = {
  DOMESTIC: 'Yurt İçi',
  INTERNATIONAL: 'Yurt Dışı',
  CARGO: 'Kargo',
  CHARTER: 'Charter'
}

// Airport Type Labels (Türkçe)
export const AIRPORT_TYPE_LABELS = {
  INTERNATIONAL: 'Uluslararası',
  DOMESTIC: 'Yurt İçi',
  CARGO: 'Kargo',
  MILITARY: 'Askeri'
}

// Aircraft Status (Reference Manager'dan)
export const AIRCRAFT_STATUS = {
  ACTIVE: 'ACTIVE',
  MAINTENANCE: 'MAINTENANCE',
  OUT_OF_SERVICE: 'OUT_OF_SERVICE',
  RETIRED: 'RETIRED'
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

// Gender
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

// Notification types
export const NOTIFICATION_TYPES = {
  SUCCESS: 'success',
  WARNING: 'warning',
  ERROR: 'error',
  INFO: 'info'
}

// Cache Keys
export const CACHE_KEYS = {
  AIRLINES: 'airlines',
  AIRPORTS: 'airports',
  AIRCRAFT: 'aircraft',
  ROUTES: 'routes',
  CREW: 'crew'
}

// Cache TTL (Time to Live) in seconds
export const CACHE_TTL = {
  REFERENCE_DATA: 3600, // 1 hour
  FLIGHT_DATA: 300,     // 5 minutes
  USER_DATA: 900        // 15 minutes
}

// Flight Type (Backend'den alınan)
export const FLIGHT_TYPE = {
  PASSENGER: 'PASSENGER',
  CARGO: 'CARGO',
  POSITIONING: 'POSITIONING',
  FERRY: 'FERRY',
  TRAINING: 'TRAINING'
}

// Flight Status Display Names
export const FLIGHT_STATUS_DISPLAY = {
  [FLIGHT_STATUS.SCHEDULED]: 'Scheduled',
  [FLIGHT_STATUS.BOARDING]: 'Boarding',
  [FLIGHT_STATUS.DEPARTED]: 'Departed',
  [FLIGHT_STATUS.ARRIVED]: 'Arrived',
  [FLIGHT_STATUS.DELAYED]: 'Delayed',
  [FLIGHT_STATUS.CANCELLED]: 'Cancelled'
}

// Flight Type Display Names
export const FLIGHT_TYPE_DISPLAY = {
  [FLIGHT_TYPE.PASSENGER]: 'Passenger',
  [FLIGHT_TYPE.CARGO]: 'Cargo',
  [FLIGHT_TYPE.POSITIONING]: 'Positioning',
  [FLIGHT_TYPE.FERRY]: 'Ferry',
  [FLIGHT_TYPE.TRAINING]: 'Training'
}

// Flight Status Colors
export const FLIGHT_STATUS_COLORS = {
  [FLIGHT_STATUS.SCHEDULED]: 'blue',
  [FLIGHT_STATUS.BOARDING]: 'orange',
  [FLIGHT_STATUS.DEPARTED]: 'green',
  [FLIGHT_STATUS.ARRIVED]: 'success',
  [FLIGHT_STATUS.DELAYED]: 'yellow',
  [FLIGHT_STATUS.CANCELLED]: 'red'
}

// Flight Type Colors
export const FLIGHT_TYPE_COLORS = {
  [FLIGHT_TYPE.PASSENGER]: 'primary',
  [FLIGHT_TYPE.CARGO]: 'warning',
  [FLIGHT_TYPE.POSITIONING]: 'info',
  [FLIGHT_TYPE.FERRY]: 'secondary',
  [FLIGHT_TYPE.TRAINING]: 'success'
}

// Pagination Defaults
export const PAGINATION = {
  DEFAULT_PAGE: 0,
  DEFAULT_SIZE: 20,
  DEFAULT_SORT: 'createdAt',
  DEFAULT_DIRECTION: 'desc'
}

// Date Formats
export const DATE_FORMATS = {
  DATE: 'YYYY-MM-DD',
  DATETIME: 'YYYY-MM-DD HH:mm',
  DATETIME_SECONDS: 'YYYY-MM-DD HH:mm:ss',
  TIME: 'HH:mm',
  DISPLAY_DATE: 'DD/MM/YYYY',
  DISPLAY_DATETIME: 'DD/MM/YYYY HH:mm'
}

// Storage Keys - GÜNCELLENMIŞ VERSİYON
export const STORAGE_KEYS = {
  TOKEN: 'auth_token',              // JWT token
  USER: 'user_profile',             // User bilgileri
  REFRESH_TOKEN: 'refresh_token',   // Refresh token (gelecekte kullanım için)
  LAST_ROUTE: 'last_route',         // Son ziyaret edilen route
  THEME: 'theme',                   // UI teması
  LANGUAGE: 'language',             // Dil seçimi
  SIDEBAR_COLLAPSED: 'sidebar_collapsed',
  TABLE_SETTINGS: 'table_settings',
  DASHBOARD_SETTINGS: 'dashboard_settings'
}

// Table Settings
export const TABLE_SETTINGS = {
  DEFAULT_PAGE_SIZE: 20,
  PAGE_SIZE_OPTIONS: [10, 20, 50, 100],
  DEFAULT_SORT_FIELD: 'createdAt',
  DEFAULT_SORT_ORDER: 'desc'
}

// Dashboard Settings
export const DASHBOARD_SETTINGS = {
  REFRESH_INTERVAL: 30000, // 30 seconds
  CHART_HEIGHT: 300,
  MAX_RECENT_FLIGHTS: 10,
  MAX_DELAYED_FLIGHTS: 5
}

// Validation Rules
export const VALIDATION_RULES = {
  FLIGHT_NUMBER: /^[A-Z]{2}\d{1,4}$/,
  IATA_CODE: /^[A-Z]{3}$/,
  ICAO_CODE: /^[A-Z]{4}$/,
  PHONE: /^\+?[\d\s\-\(\)]+$/,
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  PASSWORD: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{8,}$/
}

// Error Messages
export const ERROR_MESSAGES = {
  NETWORK_ERROR: 'Network error occurred. Please check your connection.',
  UNAUTHORIZED: 'You are not authorized to perform this action.',
  FORBIDDEN: 'Access denied. You don\'t have permission for this action.',
  NOT_FOUND: 'The requested resource was not found.',
  VALIDATION_ERROR: 'Please check your input and try again.',
  SERVER_ERROR: 'An internal server error occurred. Please try again later.',
  TIMEOUT_ERROR: 'Request timed out. Please try again.',
  UNKNOWN_ERROR: 'An unknown error occurred. Please try again.'
}

// Success Messages
export const SUCCESS_MESSAGES = {
  CREATED: 'Record created successfully.',
  UPDATED: 'Record updated successfully.',
  DELETED: 'Record deleted successfully.',
  SAVED: 'Changes saved successfully.',
  UPLOADED: 'File uploaded successfully.',
  EXPORTED: 'Data exported successfully.',
  IMPORTED: 'Data imported successfully.'
}

// WebSocket Events
export const WEBSOCKET_EVENTS = {
  FLIGHT_CREATED: 'flight.created',
  FLIGHT_UPDATED: 'flight.updated',
  FLIGHT_DELETED: 'flight.deleted',
  FLIGHT_STATUS_CHANGED: 'flight.status.changed',
  FLIGHT_DELAYED: 'flight.delayed',
  FLIGHT_CANCELLED: 'flight.cancelled'
}

// File Upload
export const FILE_UPLOAD = {
  MAX_SIZE: 10 * 1024 * 1024, // 10MB
  ALLOWED_TYPES: ['.csv', '.xlsx', '.xls'],
  ALLOWED_MIME_TYPES: [
    'text/csv',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-excel'
  ]
}

// Export formats
export const EXPORT_FORMATS = {
  CSV: 'csv',
  EXCEL: 'xlsx',
  PDF: 'pdf',
  JSON: 'json'
}

// Chart Types
export const CHART_TYPES = {
  LINE: 'line',
  BAR: 'bar',
  PIE: 'pie',
  DOUGHNUT: 'doughnut',
  RADAR: 'radar',
  POLAR_AREA: 'polarArea'
}

// Chart Colors
export const CHART_COLORS = {
  PRIMARY: '#409EFF',
  SUCCESS: '#67C23A',
  WARNING: '#E6A23C',
  DANGER: '#F56C6C',
  INFO: '#909399',
  SECONDARY: '#909399'
}

// Time Intervals
export const TIME_INTERVALS = {
  MINUTE: 60 * 1000,
  FIVE_MINUTES: 5 * 60 * 1000,
  TEN_MINUTES: 10 * 60 * 1000,
  THIRTY_MINUTES: 30 * 60 * 1000,
  HOUR: 60 * 60 * 1000,
  DAY: 24 * 60 * 60 * 1000
}

// Delay Categories
export const DELAY_CATEGORIES = {
  ON_TIME: 'ON_TIME',
  MINOR_DELAY: 'MINOR_DELAY',
  MODERATE_DELAY: 'MODERATE_DELAY',
  MAJOR_DELAY: 'MAJOR_DELAY'
}

// Delay Category Thresholds (minutes)
export const DELAY_THRESHOLDS = {
  MINOR: 15,
  MODERATE: 60,
  MAJOR: 60
}

// Route Types
export const ROUTE_TYPES = {
  DOMESTIC: 'DOMESTIC',
  INTERNATIONAL: 'INTERNATIONAL'
}

// Flight Phases
export const FLIGHT_PHASES = {
  PRE_FLIGHT: 'PRE_FLIGHT',
  BOARDING: 'BOARDING',
  AIRBORNE: 'AIRBORNE',
  LANDED: 'LANDED'
}

// Weather Impact Levels
export const WEATHER_IMPACT = {
  NONE: 'NONE',
  MINOR: 'MINOR',
  MAJOR: 'MAJOR'
}

// Operational Status
export const OPERATIONAL_STATUS = {
  NORMAL: 'NORMAL',
  DELAYED: 'DELAYED',
  CANCELLED: 'CANCELLED',
  DIVERTED: 'DIVERTED'
}

// Route Efficiency
export const ROUTE_EFFICIENCY = {
  OPTIMAL: 'OPTIMAL',
  GOOD: 'GOOD',
  SUBOPTIMAL: 'SUBOPTIMAL'
}

// Efficiency Rating
export const EFFICIENCY_RATING = {
  EXCELLENT: 'EXCELLENT',
  GOOD: 'GOOD',
  AVERAGE: 'AVERAGE',
  POOR: 'POOR',
  UNKNOWN: 'UNKNOWN'
}
