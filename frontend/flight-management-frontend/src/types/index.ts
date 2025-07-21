// Auth Types
export interface User {
  id: number
  username: string
  firstName: string
  lastName: string
  email: string
  role: string
  active: boolean
  createdAt: string
  updatedAt: string
}

export interface LoginCredentials {
  username: string
  password: string
  rememberMe?: boolean
}

export interface AuthResponse {
  token: string
  user: User
}

// Airline Types
export interface Airline {
  id: number
  iataCode: string
  icaoCode: string
  name: string
  country: string
  website?: string
  contactEmail?: string
  contactPhone?: string
  active: boolean
  notes?: string
  createdAt: string
  updatedAt: string
}

export interface CreateAirlineRequest {
  iataCode: string
  icaoCode: string
  name: string
  country: string
  website?: string
  contactEmail?: string
  contactPhone?: string
  active: boolean
  notes?: string
}

// Airport Types
export interface Airport {
  id: number
  icaoCode: string
  iataCode: string
  name: string
  city: string
  country: string
  latitude: number
  longitude: number
  elevation: number
  timezone: string
  active: boolean
  notes?: string
  createdAt: string
  updatedAt: string
}

export interface CreateAirportRequest {
  icaoCode: string
  iataCode: string
  name: string
  city: string
  country: string
  latitude: number
  longitude: number
  elevation: number
  timezone: string
  active: boolean
  notes?: string
}

// Aircraft Types
export interface Aircraft {
  id: number
  airlineId: number
  registrationNumber: string
  aircraftType: string
  manufacturer: string
  model: string
  capacity: number
  yearManufactured: number
  active: boolean
  notes?: string
  airline?: Airline
  createdAt: string
  updatedAt: string
}

export interface CreateAircraftRequest {
  airlineId: number
  registrationNumber: string
  aircraftType: string
  manufacturer: string
  model: string
  capacity: number
  yearManufactured: number
  active: boolean
  notes?: string
}

// Route Types
export interface Route {
  id: number
  originAirportId: number
  destinationAirportId: number
  distance: number
  estimatedFlightTime: number
  routeType: 'DOMESTIC' | 'INTERNATIONAL'
  active: boolean
  notes?: string
  originAirport?: Airport
  destinationAirport?: Airport
  createdAt: string
  updatedAt: string
}

export interface CreateRouteRequest {
  originAirportId: number
  destinationAirportId: number
  distance: number
  estimatedFlightTime: number
  routeType: 'DOMESTIC' | 'INTERNATIONAL'
  active: boolean
  notes?: string
}

// Crew Member Types
export interface CrewMember {
  id: number
  firstName: string
  lastName: string
  role: 'CAPTAIN' | 'FIRST_OFFICER' | 'FLIGHT_ENGINEER' | 'CABIN_CREW' | 'PURSER'
  licenseNumber: string
  licenseExpiryDate: string
  phone: string
  email: string
  active: boolean
  notes?: string
  createdAt: string
  updatedAt: string
}

export interface CreateCrewMemberRequest {
  firstName: string
  lastName: string
  role: 'CAPTAIN' | 'FIRST_OFFICER' | 'FLIGHT_ENGINEER' | 'CABIN_CREW' | 'PURSER'
  licenseNumber: string
  licenseExpiryDate: string
  phone: string
  email: string
  active: boolean
  notes?: string
}

// Flight Types
export interface Flight {
  id: number
  flightNumber: string
  airlineId: number
  aircraftId: number
  originAirportId: number
  destinationAirportId: number
  flightDate: string
  scheduledDeparture: string
  scheduledArrival: string
  type: 'PASSENGER' | 'CARGO' | 'POSITIONING'
  passengerCount?: number
  cargoWeight?: number
  gateNumber?: string
  notes?: string
  airline?: Airline
  aircraft?: Aircraft
  originAirport?: Airport
  destinationAirport?: Airport
  createdAt: string
  updatedAt: string
}

export interface CreateFlightRequest {
  flightNumber: string
  airlineId: number
  aircraftId: number
  originAirportId: number
  destinationAirportId: number
  flightDate: string
  scheduledDeparture: string
  scheduledArrival: string
  type: 'PASSENGER' | 'CARGO' | 'POSITIONING'
  passengerCount?: number
  cargoWeight?: number
  gateNumber?: string
  notes?: string
}

// API Response Types
export interface ApiResponse<T> {
  data: T
  message?: string
  success: boolean
}

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

// Table Column Type
export interface TableColumn {
  prop: string
  label: string
  width?: string | number
  minWidth?: string | number
  sortable?: boolean
  align?: 'left' | 'center' | 'right'
  showOverflowTooltip?: boolean
  slot?: string
  formatter?: (value: any, row: any) => string
  type?: 'tag' | 'switch' | 'image'
  tagMap?: Record<string, { text: string; type: string }>
  size?: number
  disabled?: (row: any) => boolean
}

// Custom Action Type
export interface CustomAction {
  key: string
  tooltip: string
  type?: string
  icon: any
}

// KPI Types
export interface KpiData {
  totalFlights: number
  activeAirlines: number
  totalAirports: number
  activeAircrafts: number
}

// Notification Types
export interface Notification {
  id: number
  title: string
  message: string
  createdAt: Date
  read: boolean
}

// System Status Types
export interface SystemStatusItem {
  name: string
  status: 'online' | 'offline' | 'warning' | 'error'
  details?: Array<{
    label: string
    value: string
  }>
}

// Chart Data Types
export interface ChartData {
  labels: string[]
  datasets: Array<{
    label: string
    data: number[]
    backgroundColor?: string | string[]
    borderColor?: string | string[]
    borderWidth?: number
  }>
}

// Form Rules Type
export interface FormRules {
  [key: string]: Array<{
    required?: boolean
    message?: string
    trigger?: string
    min?: number
    max?: number
    type?: string
    pattern?: RegExp
    validator?: (rule: any, value: any, callback: (error?: Error) => void) => void
  }>
}

// Search Params
export interface SearchParams {
  page?: number
  pageSize?: number
  sort?: string
  order?: 'asc' | 'desc'
  search?: string
  [key: string]: any
}

// File Upload Types
export interface FileUploadResponse {
  fileName: string
  originalName: string
  size: number
  uploadedAt: string
  url: string
}

// Error Types
export interface ApiError {
  message: string
  code?: string
  details?: Record<string, string[]>
}
