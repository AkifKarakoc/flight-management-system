// Type definitions for constants
interface ApiBaseUrls {
  readonly REFERENCE_MANAGER: string
  readonly FLIGHT_SERVICE: string
  readonly ARCHIVE_SERVICE: string
}

interface AuthEndpoints {
  readonly LOGIN: string
  readonly LOGOUT: string
  readonly REFRESH: string
  readonly PROFILE: string
}

interface ApiEndpoints {
  readonly AUTH: AuthEndpoints
  readonly AIRLINES: string
  readonly AIRPORTS: string
  readonly AIRCRAFTS: string
  readonly ROUTES: string
  readonly CREW_MEMBERS: string
  readonly FLIGHTS: string
  readonly FLIGHT_UPLOAD: string
  readonly FLIGHT_STATS: string
  readonly ARCHIVE_FLIGHTS: string
}

interface FlightTypes {
  readonly PASSENGER: 'PASSENGER'
  readonly CARGO: 'CARGO'
  readonly DOMESTIC: 'DOMESTIC'
  readonly INTERNATIONAL: 'INTERNATIONAL'
}

interface FlightStatus {
  readonly SCHEDULED: 'SCHEDULED'
  readonly BOARDING: 'BOARDING'
  readonly DEPARTED: 'DEPARTED'
  readonly IN_FLIGHT: 'IN_FLIGHT'
  readonly ARRIVED: 'ARRIVED'
  readonly CANCELLED: 'CANCELLED'
  readonly DELAYED: 'DELAYED'
}

interface CrewRoles {
  readonly CAPTAIN: 'CAPTAIN'
  readonly FIRST_OFFICER: 'FIRST_OFFICER'
  readonly FLIGHT_ENGINEER: 'FLIGHT_ENGINEER'
  readonly CABIN_CREW: 'CABIN_CREW'
}

interface ValidationMessages {
  readonly REQUIRED: string
  readonly EMAIL: string
  readonly MIN_LENGTH: string
  readonly MAX_LENGTH: string
  readonly PHONE: string
  readonly FLIGHT_NUMBER: string
  readonly POSITIVE_NUMBER: string
}

interface SuccessMessages {
  readonly CREATED: string
  readonly UPDATED: string
  readonly DELETED: string
  readonly UPLOADED: string
  readonly LOGIN: string
  readonly LOGOUT: string
}

interface ErrorMessages {
  readonly NETWORK: string
  readonly UNAUTHORIZED: string
  readonly FORBIDDEN: string
  readonly NOT_FOUND: string
  readonly SERVER_ERROR: string
  readonly VALIDATION: string
  readonly DUPLICATE: string
}

interface PaginationConfig {
  readonly DEFAULT_PAGE_SIZE: number
  readonly PAGE_SIZES: readonly number[]
  readonly MAX_PAGE_SIZE: number
}

interface DateFormats {
  readonly DATE: string
  readonly DATETIME: string
  readonly TIME: string
  readonly DISPLAY_DATE: string
  readonly DISPLAY_DATETIME: string
}

interface TableConfig {
  readonly ROW_HEIGHT: number
  readonly HEADER_HEIGHT: number
  readonly MAX_HEIGHT: number
}

interface AcceptedFileTypes {
  readonly CSV: readonly string[]
  readonly EXCEL: readonly string[]
  readonly IMAGE: readonly string[]
}

interface FileUploadConfig {
  readonly MAX_SIZE: number
  readonly ACCEPTED_TYPES: AcceptedFileTypes
}

interface MenuItem {
  readonly name: string
  readonly path?: string
  readonly icon: string
  readonly title: string
  readonly children?: readonly MenuItem[]
}

interface ThemeColors {
  readonly PRIMARY: string
  readonly SUCCESS: string
  readonly WARNING: string
  readonly DANGER: string
  readonly INFO: string
}

// API Base URLs
export const API_BASE_URLS: ApiBaseUrls = {
  REFERENCE_MANAGER: 'http://localhost:8081',
  FLIGHT_SERVICE: 'http://localhost:8082',
  ARCHIVE_SERVICE: 'http://localhost:8083'
} as const

// API Endpoints
  export const API_ENDPOINTS: ApiEndpoints = {
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
} as const

// Flight Types
  export const FLIGHT_TYPES: FlightTypes = {
  PASSENGER: 'PASSENGER',
  CARGO: 'CARGO',
  DOMESTIC: 'DOMESTIC',
  INTERNATIONAL: 'INTERNATIONAL'
} as const

// Flight Status
  export const FLIGHT_STATUS: FlightStatus = {
  SCHEDULED: 'SCHEDULED',
  BOARDING: 'BOARDING',
  DEPARTED: 'DEPARTED',
  IN_FLIGHT: 'IN_FLIGHT',
  ARRIVED: 'ARRIVED',
  CANCELLED: 'CANCELLED',
  DELAYED: 'DELAYED'
} as const

// Crew Member Roles
  export const CREW_ROLES: CrewRoles = {
  CAPTAIN: 'CAPTAIN',
  FIRST_OFFICER: 'FIRST_OFFICER',
  FLIGHT_ENGINEER: 'FLIGHT_ENGINEER',
  CABIN_CREW: 'CABIN_CREW'
} as const

// Form Validation Messages
  export const VALIDATION_MESSAGES: ValidationMessages = {
  REQUIRED: 'Bu alan zorunludur',
  EMAIL: 'Geçerli bir e-posta adresi girin',
  MIN_LENGTH: 'En az {min} karakter olmalıdır',
  MAX_LENGTH: 'En fazla {max} karakter olabilir',
  PHONE: 'Geçerli bir telefon numarası girin',
  FLIGHT_NUMBER: 'Geçerli format: TK1234',
  POSITIVE_NUMBER: 'Pozitif bir sayı giriniz'
} as const

// Success Messages
  export const SUCCESS_MESSAGES: SuccessMessages = {
  CREATED: 'Başarıyla oluşturuldu',
  UPDATED: 'Başarıyla güncellendi',
  DELETED: 'Başarıyla silindi',
  UPLOADED: 'Dosya başarıyla yüklendi',
  LOGIN: 'Giriş başarılı',
  LOGOUT: 'Çıkış başarılı'
} as const

// Error Messages
  export const ERROR_MESSAGES: ErrorMessages = {
  NETWORK: 'Sunucuya bağlanılamıyor',
  UNAUTHORIZED: 'Yetkilendirme hatası',
  FORBIDDEN: 'Bu işlem için yetkiniz yok',
  NOT_FOUND: 'Kaynak bulunamadı',
  SERVER_ERROR: 'Sunucu hatası',
  VALIDATION: 'Doğrulama hatası',
  DUPLICATE: 'Bu kayıt zaten mevcut'
} as const

// Pagination
  export const PAGINATION: PaginationConfig = {
  DEFAULT_PAGE_SIZE: 20,
  PAGE_SIZES: [10, 20, 50, 100] as const,
  MAX_PAGE_SIZE: 1000
} as const

// Date/Time Formats
  export const DATE_FORMATS: DateFormats = {
  DATE: 'YYYY-MM-DD',
  DATETIME: 'YYYY-MM-DD HH:mm',
  TIME: 'HH:mm',
  DISPLAY_DATE: 'DD.MM.YYYY',
  DISPLAY_DATETIME: 'DD.MM.YYYY HH:mm'
} as const

// Table Configurations
  export const TABLE_CONFIG: TableConfig = {
  ROW_HEIGHT: 48,
  HEADER_HEIGHT: 56,
  MAX_HEIGHT: 600
} as const

// File Upload
  export const FILE_UPLOAD: FileUploadConfig = {
  MAX_SIZE: 10 * 1024 * 1024, // 10MB
  ACCEPTED_TYPES: {
    CSV: ['.csv', 'text/csv'] as const,
    EXCEL: ['.xlsx', '.xls'] as const,
    IMAGE: ['.jpg', '.jpeg', '.png', '.gif'] as const
  }
} as const

// Routes for Keep Alive
  export const KEEP_ALIVE_ROUTES: readonly string[] = [
  'Dashboard',
  'Airlines',
  'Airports',
  'Aircrafts',
  'Routes',
  'CrewMembers',
  'Flights'
] as const

// Menu Items
  export const MENU_ITEMS: readonly MenuItem[] = [
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
] as const

// Theme Colors
  export const THEME_COLORS: ThemeColors = {
  PRIMARY: '#409EFF',
  SUCCESS: '#67C23A',
  WARNING: '#E6A23C',
  DANGER: '#F56C6C',
  INFO: '#909399'
} as const

// Type exports for external use
  export type FlightStatusType = keyof typeof FLIGHT_STATUS
export type FlightTypeType = keyof typeof FLIGHT_TYPES
export type CrewRoleType = keyof typeof CREW_ROLES

// Utility type to get union types from constant objects
export type FlightStatusValue = typeof FLIGHT_STATUS[FlightStatusType]
export type FlightTypeValue = typeof FLIGHT_TYPES[FlightTypeType]
export type CrewRoleValue = typeof CREW_ROLES[CrewRoleType]
