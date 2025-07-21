// API Base URLs
export const API_BASE_URLS = {
  REFERENCE_MANAGER: 'http://localhost:8081',
  FLIGHT_SERVICE: 'http://localhost:8082',
  ARCHIVE_SERVICE: 'http://localhost:8083'
}

// API Endpoints
export const API_ENDPOINTS = {
  // Authentication
  AUTH: {
    LOGIN: '/api/v1/auth/login',
    LOGOUT: '/api/v1/auth/logout',
    REFRESH: '/api/v1/auth/refresh',
    PROFILE: '/api/v1/auth/profile'
  },

  // Reference Manager Endpoints
  AIRLINES: '/api/v1/airlines',
  AIRPORTS: '/api/v1/airports',
  AIRCRAFTS: '/api/v1/aircrafts',
  ROUTES: '/api/v1/routes',
  CREW_MEMBERS: '/api/v1/crew-members',

  // Flight Service Endpoints
  FLIGHTS: '/api/v1/flights',
  FLIGHT_UPLOAD: '/api/v1/flights/upload',
  FLIGHT_STATS: '/api/v1/flights/stats',

  // Archive Service Endpoints
  ARCHIVE_FLIGHTS: '/api/v1/archive/flights'
}

// Flight Types
export const FLIGHT_TYPES = {
  PASSENGER: 'PASSENGER',
  CARGO: 'CARGO',
  DOMESTIC: 'DOMESTIC',
  INTERNATIONAL: 'INTERNATIONAL'
}

// Flight Status
export const FLIGHT_STATUS = {
  SCHEDULED: 'SCHEDULED',
  BOARDING: 'BOARDING',
  DEPARTED: 'DEPARTED',
  IN_FLIGHT: 'IN_FLIGHT',
  ARRIVED: 'ARRIVED',
  CANCELLED: 'CANCELLED',
  DELAYED: 'DELAYED'
}

// Crew Member Roles
export const CREW_ROLES = {
  CAPTAIN: 'CAPTAIN',
  FIRST_OFFICER: 'FIRST_OFFICER',
  FLIGHT_ENGINEER: 'FLIGHT_ENGINEER',
  CABIN_CREW: 'CABIN_CREW'
}

// Form Validation Messages
export const VALIDATION_MESSAGES = {
  REQUIRED: 'Bu alan zorunludur',
  EMAIL: 'Geçerli bir e-posta adresi girin',
  MIN_LENGTH: 'En az {min} karakter olmalıdır',
  MAX_LENGTH: 'En fazla {max} karakter olabilir',
  PHONE: 'Geçerli bir telefon numarası girin',
  FLIGHT_NUMBER: 'Geçerli format: TK1234',
  POSITIVE_NUMBER: 'Pozitif bir sayı giriniz'
}

// Success Messages
export const SUCCESS_MESSAGES = {
  CREATED: 'Başarıyla oluşturuldu',
  UPDATED: 'Başarıyla güncellendi',
  DELETED: 'Başarıyla silindi',
  UPLOADED: 'Dosya başarıyla yüklendi',
  LOGIN: 'Giriş başarılı',
  LOGOUT: 'Çıkış başarılı'
}

// Error Messages
export const ERROR_MESSAGES = {
  NETWORK: 'Sunucuya bağlanılamıyor',
  UNAUTHORIZED: 'Yetkilendirme hatası',
  FORBIDDEN: 'Bu işlem için yetkiniz yok',
  NOT_FOUND: 'Kaynak bulunamadı',
  SERVER_ERROR: 'Sunucu hatası',
  VALIDATION: 'Doğrulama hatası',
  DUPLICATE: 'Bu kayıt zaten mevcut'
}

// Pagination
export const PAGINATION = {
  DEFAULT_PAGE_SIZE: 20,
  PAGE_SIZES: [10, 20, 50, 100],
  MAX_PAGE_SIZE: 1000
}

// Date/Time Formats
export const DATE_FORMATS = {
  DATE: 'YYYY-MM-DD',
  DATETIME: 'YYYY-MM-DD HH:mm',
  TIME: 'HH:mm',
  DISPLAY_DATE: 'DD.MM.YYYY',
  DISPLAY_DATETIME: 'DD.MM.YYYY HH:mm'
}

// Table Configurations
export const TABLE_CONFIG = {
  ROW_HEIGHT: 48,
  HEADER_HEIGHT: 56,
  MAX_HEIGHT: 600
}

// File Upload
export const FILE_UPLOAD = {
  MAX_SIZE: 10 * 1024 * 1024, // 10MB
  ACCEPTED_TYPES: {
    CSV: ['.csv', 'text/csv'],
    EXCEL: ['.xlsx', '.xls'],
    IMAGE: ['.jpg', '.jpeg', '.png', '.gif']
  }
}

// Routes for Keep Alive
export const KEEP_ALIVE_ROUTES = [
  'Dashboard',
  'Airlines',
  'Airports',
  'Aircrafts',
  'Routes',
  'CrewMembers',
  'Flights'
]

// Menu Items
export const MENU_ITEMS = [
  {
    name: 'Dashboard',
    path: '/dashboard',
    icon: 'Monitor',
    title: 'Dashboard'
  },
  {
    name: 'Reference',
    title: 'Referans Yönetimi',
    icon: 'Setting',
    children: [
      {
        name: 'Airlines',
        path: '/airlines',
        icon: 'Ship',
        title: 'Havayolları'
      },
      {
        name: 'Airports',
        path: '/airports',
        icon: 'MapLocation',
        title: 'Havaalanları'
      },
      {
        name: 'Aircrafts',
        path: '/aircrafts',
        icon: 'Promotion',
        title: 'Uçaklar'
      },
      {
        name: 'Routes',
        path: '/routes',
        icon: 'Connection',
        title: 'Rotalar'
      },
      {
        name: 'CrewMembers',
        path: '/crew-members',
        icon: 'Avatar',
        title: 'Mürettebat'
      }
    ]
  },
  {
    name: 'Flight',
    title: 'Uçuş Yönetimi',
    icon: 'Position',
    children: [
      {
        name: 'Flights',
        path: '/flights',
        icon: 'List',
        title: 'Uçuş Listesi'
      },
      {
        name: 'FlightCreate',
        path: '/flights/create',
        icon: 'Plus',
        title: 'Yeni Uçuş'
      },
      {
        name: 'FlightUpload',
        path: '/flights/upload',
        icon: 'Upload',
        title: 'Toplu Yükleme'
      }
    ]
  }
]

// Theme Colors
export const THEME_COLORS = {
  PRIMARY: '#409EFF',
  SUCCESS: '#67C23A',
  WARNING: '#E6A23C',
  DANGER: '#F56C6C',
  INFO: '#909399'
}
