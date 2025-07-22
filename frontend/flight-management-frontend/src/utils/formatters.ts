// Type definitions
type DateInput = string | number | Date
type NumberInput = string | number | null | undefined

interface DateFormatOptions {
  year?: 'numeric' | '2-digit'
  month?: 'numeric' | '2-digit' | 'long' | 'short' | 'narrow'
  day?: 'numeric' | '2-digit'
  hour?: 'numeric' | '2-digit'
  minute?: 'numeric' | '2-digit'
  second?: 'numeric' | '2-digit'
}

type FlightStatus =
| 'SCHEDULED'
| 'BOARDING'
| 'DEPARTED'
| 'IN_FLIGHT'
| 'ARRIVED'
| 'DELAYED'
| 'CANCELLED'
| 'DIVERTED'

/**
 * Number formatting utilities
 */
export const formatNumber = (num: NumberInput): string => {
  if (num === null || num === undefined) return '0'

  let numValue: number
  if (typeof num !== 'number') {
    numValue = parseFloat(String(num))
    if (isNaN(numValue)) return '0'
  } else {
    numValue = num
  }

  return new Intl.NumberFormat('tr-TR').format(numValue)
}

export const formatCurrency = (amount: NumberInput, currency: string = 'TRY'): string => {
  if (amount === null || amount === undefined) return '0'

  let amountValue: number
  if (typeof amount !== 'number') {
    amountValue = parseFloat(String(amount))
    if (isNaN(amountValue)) return '0'
  } else {
    amountValue = amount
  }

  return new Intl.NumberFormat('tr-TR', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 2
  }).format(amountValue)
}

export const formatPercentage = (value: NumberInput, decimals: number = 1): string => {
  if (value === null || value === undefined) return '0%'

  let valueNum: number
  if (typeof value !== 'number') {
    valueNum = parseFloat(String(value))
    if (isNaN(valueNum)) return '0%'
  } else {
    valueNum = value
  }

  return `${valueNum.toFixed(decimals)}%`
}

/**
 * Date and time formatting utilities
 */
export const formatDate = (date: DateInput, options: DateFormatOptions = {}): string => {
  if (!date) return ''

  const dateObj = new Date(date)
  if (isNaN(dateObj.getTime())) return ''

  const defaultOptions: DateFormatOptions = {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  }

  return new Intl.DateTimeFormat('tr-TR', { ...defaultOptions, ...options }).format(dateObj)
}

export const formatTime = (date: DateInput): string => {
  if (!date) return ''

  const dateObj = new Date(date)
  if (isNaN(dateObj.getTime())) return ''

  return new Intl.DateTimeFormat('tr-TR', {
    hour: '2-digit',
    minute: '2-digit'
  }).format(dateObj)
}

export const formatDateTime = (date: DateInput): string => {
  if (!date) return ''

  const dateObj = new Date(date)
  if (isNaN(dateObj.getTime())) return ''

  return new Intl.DateTimeFormat('tr-TR', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(dateObj)
}

export const formatRelativeTime = (date: DateInput): string => {
  if (!date) return ''

  const dateObj = new Date(date)
  if (isNaN(dateObj.getTime())) return ''

  const now = new Date()
  const diffInSeconds = Math.floor((now.getTime() - dateObj.getTime()) / 1000)

  if (diffInSeconds < 60) {
    return `${diffInSeconds} saniye önce`
  }

  const diffInMinutes = Math.floor(diffInSeconds / 60)
  if (diffInMinutes < 60) {
    return `${diffInMinutes} dakika önce`
  }

  const diffInHours = Math.floor(diffInMinutes / 60)
  if (diffInHours < 24) {
    return `${diffInHours} saat önce`
  }

  const diffInDays = Math.floor(diffInHours / 24)
  if (diffInDays < 30) {
    return `${diffInDays} gün önce`
  }

  const diffInMonths = Math.floor(diffInDays / 30)
  if (diffInMonths < 12) {
    return `${diffInMonths} ay önce`
  }

  const diffInYears = Math.floor(diffInMonths / 12)
  return `${diffInYears} yıl önce`
}

/**
 * Duration formatting utilities
 */
export const formatDuration = (minutes: number): string => {
  if (!minutes || minutes <= 0) return '0 dk'

  const hours = Math.floor(minutes / 60)
  const remainingMinutes = minutes % 60

  if (hours === 0) {
    return `${remainingMinutes} dk`
  }

  if (remainingMinutes === 0) {
    return `${hours} sa`
  }

  return `${hours} sa ${remainingMinutes} dk`
}

export const formatFlightDuration = (departureTime: DateInput, arrivalTime: DateInput): string => {
  if (!departureTime || !arrivalTime) return ''

  const departure = new Date(departureTime)
  const arrival = new Date(arrivalTime)

  if (isNaN(departure.getTime()) || isNaN(arrival.getTime())) return ''

  const diffInMs = arrival.getTime() - departure.getTime()
  const diffInMinutes = Math.floor(diffInMs / (1000 * 60))

  return formatDuration(diffInMinutes)
}

/**
 * File size formatting utilities
 */
export const formatFileSize = (bytes: number): string => {
  if (!bytes || bytes === 0) return '0 B'

  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'] as const
  const i = Math.floor(Math.log(bytes) / Math.log(1024))

  return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`
}

/**
 * String formatting utilities
 */
export const truncateText = (text: string, maxLength: number = 50): string => {
  if (!text) return ''

  if (text.length <= maxLength) return text

  return text.substring(0, maxLength) + '...'
}

export const capitalizeFirst = (str: string): string => {
  if (!str) return ''

  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase()
}

export const formatPhoneNumber = (phone: string): string => {
  if (!phone) return ''

  // Remove all non-digit characters
  const cleaned = phone.replace(/\D/g, '')

  // Turkish phone number format
  if (cleaned.length === 11 && cleaned.startsWith('0')) {
    return `(${cleaned.substring(1, 4)}) ${cleaned.substring(4, 7)} ${cleaned.substring(7, 9)} ${cleaned.substring(9)}`
  }

  if (cleaned.length === 10) {
    return `(${cleaned.substring(0, 3)}) ${cleaned.substring(3, 6)} ${cleaned.substring(6, 8)} ${cleaned.substring(8)}`
  }

  return phone
}

/**
 * Flight specific formatting utilities
 */
export const formatFlightNumber = (flightNumber: string): string => {
  if (!flightNumber) return ''

  // Format: TK1234 -> TK 1234
  const match = flightNumber.match(/^([A-Z]{2})(\d+)$/)
  if (match) {
    return `${match[1]} ${match[2]}`
  }

  return flightNumber
}

export const formatAirportCode = (code: string): string => {
  if (!code) return ''

  return code.toUpperCase()
}

export const formatRoute = (origin: string, destination: string): string => {
  if (!origin || !destination) return ''

  return `${formatAirportCode(origin)} → ${formatAirportCode(destination)}`
}

/**
 * Status formatting utilities
 */
export const getFlightStatusText = (status: FlightStatus): string => {
  const statusMap: Record<FlightStatus, string> = {
    'SCHEDULED': 'Planlandı',
    'BOARDING': 'Biniş',
    'DEPARTED': 'Kalktı',
    'IN_FLIGHT': 'Uçuşta',
    'ARRIVED': 'İndi',
    'DELAYED': 'Gecikti',
    'CANCELLED': 'İptal',
    'DIVERTED': 'Yönlendirildi'
  }

  return statusMap[status] || status
}

export const getFlightStatusColor = (status: FlightStatus): string => {
  const colorMap: Record<FlightStatus, string> = {
    'SCHEDULED': '#909399',
    'BOARDING': '#e6a23c',
    'DEPARTED': '#67c23a',
    'IN_FLIGHT': '#409eff',
    'ARRIVED': '#67c23a',
    'DELAYED': '#e6a23c',
    'CANCELLED': '#f56c6c',
    'DIVERTED': '#e6a23c'
  }

  return colorMap[status] || '#909399'
}

/**
 * Validation utilities
 */
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

export const isValidPhoneNumber = (phone: string): boolean => {
  const cleaned = phone.replace(/\D/g, '')
  return cleaned.length === 10 || (cleaned.length === 11 && cleaned.startsWith('0'))
}

export const isValidFlightNumber = (flightNumber: string): boolean => {
  const flightRegex = /^[A-Z]{2}\d{3,4}$/
  return flightRegex.test(flightNumber)
}

/**
 * Array and object formatting utilities
 */
export const formatList = (items: string[], separator: string = ', ', lastSeparator: string = ' ve '): string => {
  if (!Array.isArray(items) || items.length === 0) return ''

  if (items.length === 1) return items[0]

  if (items.length === 2) return items.join(lastSeparator)

  const allButLast = items.slice(0, -1).join(separator)
  const last = items[items.length - 1]

  return `${allButLast}${lastSeparator}${last}`
}

export const groupBy = <T>(array: T[], key: keyof T): Record<string, T[]> => {
  return array.reduce((result, item) => {
    const group = String(item[key])
    if (!result[group]) {
      result[group] = []
    }
    result[group].push(item)
    return result
  }, {} as Record<string, T[]>)
}
