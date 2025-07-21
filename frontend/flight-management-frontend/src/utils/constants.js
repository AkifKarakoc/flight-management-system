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

// Date Formats (devamı)
export const DATE_FORMATS = {
  DATE: 'YYYY-MM-DD',
  DATETIME: 'YYYY-MM-DD HH:mm:ss',
  DISPLAY_DATE: 'DD.MM.YYYY',
  DISPLAY_DATETIME: 'DD.MM.YYYY HH:mm',
  TIME: 'HH:mm'
}

// Validation Rules
export const VALIDATION_RULES = {
  FLIGHT_NUMBER: /^[A-Z]{2}[0-9]{1,4}$/,
  ICAO_CODE: /^[A-Z]{4}$/,
  IATA_CODE: /^[A-Z]{3}$/,
  PHONE: /^[0-9]{10,15}$/,
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/
}

// Error Messages
export const ERROR_MESSAGES = {
  REQUIRED: 'Bu alan zorunludur',
  EMAIL_INVALID: 'Geçerli bir e-posta adresi girin',
  PHONE_INVALID: 'Geçerli bir telefon numarası girin',
  FLIGHT_NUMBER_INVALID: 'Uçuş numarası formatı: AA1234',
  ICAO_INVALID: 'ICAO kodu 4 harften oluşmalıdır',
  IATA_INVALID: 'IATA kodu 3 harften oluşmalıdır',
  MIN_LENGTH: (min) => `En az ${min} karakter olmalıdır`,
  MAX_LENGTH: (max) => `En fazla ${max} karakter olmalıdır`,
  NUMBER_MIN: (min) => `En az ${min} olmalıdır`,
  NUMBER_MAX: (max) => `En fazla ${max} olmalıdır`
}

// Success Messages
export const SUCCESS_MESSAGES = {
  CREATED: 'Başarıyla oluşturuldu',
  UPDATED: 'Başarıyla güncellendi',
  DELETED: 'Başarıyla silindi',
  SAVED: 'Başarıyla kaydedildi',
  LOGIN: 'Başarıyla giriş yapıldı',
  LOGOUT: 'Başarıyla çıkış yapıldı'
}

// Chart Colors
export const CHART_COLORS = {
  PRIMARY: '#409eff',
  SUCCESS: '#67c23a',
  WARNING: '#e6a23c',
  DANGER: '#f56c6c',
  INFO: '#909399',
  GRADIENT: ['#409eff', '#67c23a', '#e6a23c', '#f56c6c', '#909399']
}

// File Upload
export const FILE_UPLOAD = {
  MAX_SIZE: 10 * 1024 * 1024, // 10MB
  ALLOWED_TYPES: ['.csv', '.xlsx', '.xls'],
  IMAGE_TYPES: ['.jpg', '.jpeg', '.png', '.gif']
}
