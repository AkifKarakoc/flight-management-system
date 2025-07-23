// API Base URLs
export const API_BASE_URLS = {
  REFERENCE: import.meta.env.VITE_API_BASE_URL_REFERENCE,
  FLIGHT: import.meta.env.VITE_API_BASE_URL_FLIGHT,
  ARCHIVE: import.meta.env.VITE_API_BASE_URL_ARCHIVE,
}

export const WEBSOCKET_URL = import.meta.env.VITE_WEBSOCKET_URL

// Flight Status
export const FLIGHT_STATUS = {
  SCHEDULED: 'SCHEDULED',
  BOARDING: 'BOARDING',
  DEPARTED: 'DEPARTED',
  ARRIVED: 'ARRIVED',
  DELAYED: 'DELAYED',
  CANCELLED: 'CANCELLED'
}

export const FLIGHT_STATUS_LABELS = {
  [FLIGHT_STATUS.SCHEDULED]: 'Planlandı',
  [FLIGHT_STATUS.BOARDING]: 'Biniş',
  [FLIGHT_STATUS.DEPARTED]: 'Kalkış Yaptı',
  [FLIGHT_STATUS.ARRIVED]: 'Vardı',
  [FLIGHT_STATUS.DELAYED]: 'Gecikmeli',
  [FLIGHT_STATUS.CANCELLED]: 'İptal'
}

export const FLIGHT_STATUS_COLORS = {
  [FLIGHT_STATUS.SCHEDULED]: 'primary',
  [FLIGHT_STATUS.BOARDING]: 'warning',
  [FLIGHT_STATUS.DEPARTED]: 'success',
  [FLIGHT_STATUS.ARRIVED]: 'success',
  [FLIGHT_STATUS.DELAYED]: 'warning',
  [FLIGHT_STATUS.CANCELLED]: 'danger'
}

// Flight Type
export const FLIGHT_TYPE = {
  PASSENGER: 'PASSENGER',
  CARGO: 'CARGO',
  MIXED: 'MIXED'
}

export const FLIGHT_TYPE_LABELS = {
  [FLIGHT_TYPE.PASSENGER]: 'Yolcu',
  [FLIGHT_TYPE.CARGO]: 'Kargo',
  [FLIGHT_TYPE.MIXED]: 'Karma'
}

// Airline Type
export const AIRLINE_TYPE = {
  FULL_SERVICE: 'FULL_SERVICE',
  LOW_COST: 'LOW_COST',
  CHARTER: 'CHARTER',
  CARGO: 'CARGO'
}

export const AIRLINE_TYPE_LABELS = {
  [AIRLINE_TYPE.FULL_SERVICE]: 'Tam Hizmet',
  [AIRLINE_TYPE.LOW_COST]: 'Düşük Maliyet',
  [AIRLINE_TYPE.CHARTER]: 'Charter',
  [AIRLINE_TYPE.CARGO]: 'Kargo'
}

// Airport Type
export const AIRPORT_TYPE = {
  INTERNATIONAL: 'INTERNATIONAL',
  DOMESTIC: 'DOMESTIC',
  REGIONAL: 'REGIONAL',
  MILITARY: 'MILITARY'
}

export const AIRPORT_TYPE_LABELS = {
  [AIRPORT_TYPE.INTERNATIONAL]: 'Uluslararası',
  [AIRPORT_TYPE.DOMESTIC]: 'İç Hat',
  [AIRPORT_TYPE.REGIONAL]: 'Bölgesel',
  [AIRPORT_TYPE.MILITARY]: 'Askeri'
}

// Route Type
export const ROUTE_TYPE = {
  DOMESTIC: 'DOMESTIC',
  INTERNATIONAL: 'INTERNATIONAL'
}

export const ROUTE_TYPE_LABELS = {
  [ROUTE_TYPE.DOMESTIC]: 'İç Hat',
  [ROUTE_TYPE.INTERNATIONAL]: 'Uluslararası'
}

// Crew Type
export const CREW_TYPE = {
  CAPTAIN: 'CAPTAIN',
  FIRST_OFFICER: 'FIRST_OFFICER',
  FLIGHT_ENGINEER: 'FLIGHT_ENGINEER',
  CABIN_CREW: 'CABIN_CREW',
  PURSER: 'PURSER'
}

export const CREW_TYPE_LABELS = {
  [CREW_TYPE.CAPTAIN]: 'Kaptan',
  [CREW_TYPE.FIRST_OFFICER]: 'İkinci Pilot',
  [CREW_TYPE.FLIGHT_ENGINEER]: 'Uçuş Mühendisi',
  [CREW_TYPE.CABIN_CREW]: 'Kabin Memuru',
  [CREW_TYPE.PURSER]: 'Kabin Şefi'
}

// Aircraft Status
export const AIRCRAFT_STATUS = {
  ACTIVE: 'ACTIVE',
  MAINTENANCE: 'MAINTENANCE',
  RETIRED: 'RETIRED',
  GROUNDED: 'GROUNDED'
}

export const AIRCRAFT_STATUS_LABELS = {
  [AIRCRAFT_STATUS.ACTIVE]: 'Aktif',
  [AIRCRAFT_STATUS.MAINTENANCE]: 'Bakımda',
  [AIRCRAFT_STATUS.RETIRED]: 'Emekli',
  [AIRCRAFT_STATUS.GROUNDED]: 'Yerde'
}

// Gender
export const GENDER = {
  MALE: 'MALE',
  FEMALE: 'FEMALE'
}

export const GENDER_LABELS = {
  [GENDER.MALE]: 'Erkek',
  [GENDER.FEMALE]: 'Kadın'
}

// Crew Status
export const CREW_STATUS = {
  ACTIVE: 'ACTIVE',
  INACTIVE: 'INACTIVE',
  ON_LEAVE: 'ON_LEAVE',
  RETIRED: 'RETIRED'
}

export const CREW_STATUS_LABELS = {
  [CREW_STATUS.ACTIVE]: 'Aktif',
  [CREW_STATUS.INACTIVE]: 'Pasif',
  [CREW_STATUS.ON_LEAVE]: 'İzinli',
  [CREW_STATUS.RETIRED]: 'Emekli'
}

// Pagination
export const DEFAULT_PAGE_SIZE = 20
export const PAGE_SIZE_OPTIONS = [10, 20, 50, 100]

// Date Formats
export const DATE_FORMATS = {
  DATE_ONLY: 'YYYY-MM-DD',
  DATETIME: 'YYYY-MM-DD HH:mm',
  DATETIME_SECONDS: 'YYYY-MM-DD HH:mm:ss',
  TIME_ONLY: 'HH:mm',
  DISPLAY_DATE: 'DD.MM.YYYY',
  DISPLAY_DATETIME: 'DD.MM.YYYY HH:mm'
}

// Local Storage Keys
export const STORAGE_KEYS = {
  TOKEN: 'auth_token',
  USER: 'auth_user',
  THEME: 'app_theme',
  LANGUAGE: 'app_language'
}

// WebSocket Topics
export const WS_TOPICS = {
  FLIGHTS: '/topic/flights',
  ARCHIVE: '/topic/archive',
  REFERENCE: '/topic/reference'
}

// HTTP Status Codes
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  PARTIAL_CONTENT: 206,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  INTERNAL_SERVER_ERROR: 500
}

// User Roles
export const USER_ROLES = {
  ADMIN: 'ROLE_ADMIN',
  USER: 'ROLE_USER'
}

export const USER_ROLE_LABELS = {
  [USER_ROLES.ADMIN]: 'Yönetici',
  [USER_ROLES.USER]: 'Kullanıcı'
}
