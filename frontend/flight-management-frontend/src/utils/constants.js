// API Endpoints
export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: '/auth/login',
    LOGOUT: '/auth/logout',
    REFRESH: '/auth/refresh',
    VERIFY: '/auth/verify'
  },
  AIRLINES: '/airlines',
  AIRPORTS: '/airports',
  AIRCRAFTS: '/aircrafts',
  ROUTES: '/routes',
  CREW_MEMBERS: '/crew-members',
  FLIGHTS: '/flights'
}

// Flight Types
export const FLIGHT_TYPES = {
  PASSENGER: 'PASSENGER',
  CARGO: 'CARGO',
  POSITIONING: 'POSITIONING'
}

export const FLIGHT_TYPE_OPTIONS = [
  { label: 'Yolcu Uçuşu', value: 'PASSENGER' },
  { label: 'Kargo Uçuşu', value: 'CARGO' },
  { label: 'Positioning', value: 'POSITIONING' }
]

// Route Types
export const ROUTE_TYPES = {
  DOMESTIC: 'DOMESTIC',
  INTERNATIONAL: 'INTERNATIONAL'
}

export const ROUTE_TYPE_OPTIONS = [
  { label: 'İç Hat', value: 'DOMESTIC' },
  { label: 'Dış Hat', value: 'INTERNATIONAL' }
]

// Crew Roles
export const CREW_ROLES = {
  CAPTAIN: 'CAPTAIN',
  FIRST_OFFICER: 'FIRST_OFFICER',
  FLIGHT_ENGINEER: 'FLIGHT_ENGINEER',
  CABIN_CREW: 'CABIN_CREW',
  PURSER: 'PURSER'
}

export const CREW_ROLE_OPTIONS = [
  { label: 'Kaptan', value: 'CAPTAIN' },
  { label: 'İkinci Pilot', value: 'FIRST_OFFICER' },
  { label: 'Uçuş Mühendisi', value: 'FLIGHT_ENGINEER' },
  { label: 'Kabin Memuru', value: 'CABIN_CREW' },
  { label: 'Kabin Şefi', value: 'PURSER' }
]

// Aircraft Types
export const AIRCRAFT_TYPES = {
  NARROW_BODY: 'NARROW_BODY',
  WIDE_BODY: 'WIDE_BODY',
  REGIONAL: 'REGIONAL',
  CARGO: 'CARGO'
}

export const AIRCRAFT_TYPE_OPTIONS = [
  { label: 'Dar Gövde', value: 'NARROW_BODY' },
  { label: 'Geniş Gövde', value: 'WIDE_BODY' },
  { label: 'Bölgesel', value: 'REGIONAL' },
  { label: 'Kargo', value: 'CARGO' }
]

// Status Types
export const STATUS_TYPES = {
  ACTIVE: 'ACTIVE',
  INACTIVE: 'INACTIVE',
  MAINTENANCE: 'MAINTENANCE',
  RETIRED: 'RETIRED'
}

// Pagination
export const PAGINATION = {
  DEFAULT_PAGE_SIZE: 20,
  PAGE_SIZES: [10, 20, 50, 100]
}

// Date Formats
export const DATE_FORMATS = {
  DATE: 'YYYY-MM-DD',
  DATETIME: 'YYYY-MM-DD HH:mm:ss',
  DISPLAY_DATE:
