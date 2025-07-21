/**
 * Number formatting utilities
 */
export const formatNumber = (num) => {
  if (num === null || num === undefined) return '0'

  if (typeof num !== 'number') {
    num = parseFloat(num)
    if (isNaN(num)) return '0'
  }

  return new Intl.NumberFormat('tr-TR').format(num)
}

export const formatCurrency = (amount, currency = 'TRY') => {
  if (amount === null || amount === undefined) return '0'

  if (typeof amount !== 'number') {
    amount = parseFloat(amount)
    if (isNaN(amount)) return '0'
  }

  return new Intl.NumberFormat('tr-TR', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 2
  }).format(amount)
}

export const formatPercentage = (value, decimals = 1) => {
  if (value === null || value === undefined) return '0%'

  if (typeof value !== 'number') {
    value = parseFloat(value)
    if (isNaN(value)) return '0%'
  }

  return `${value.toFixed(decimals)}%`
}

/**
 * Date and time formatting utilities
 */
export const formatDate = (date, options = {}) => {
  if (!date) return ''

  const dateObj = new Date(date)
  if (isNaN(dateObj.getTime())) return ''

  const defaultOptions = {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  }

  return new Intl.DateTimeFormat('tr-TR', { ...defaultOptions, ...options }).format(dateObj)
}

export const formatTime = (date) => {
  if (!date) return ''

  const dateObj = new Date(date)
  if (isNaN(dateObj.getTime())) return ''

  return new Intl.DateTimeFormat('tr-TR', {
    hour: '2-digit',
    minute: '2-digit'
  }).format(dateObj)
}

export const formatDateTime = (date) => {
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

export const formatRelativeTime = (date) => {
  if (!date) return ''

  const dateObj = new Date(date)
  if (isNaN(dateObj.getTime())) return ''

  const now = new Date()
  const diffInSeconds = Math.floor((now - dateObj) / 1000)

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
export const formatDuration = (minutes) => {
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

export const formatFlightDuration = (departureTime, arrivalTime) => {
  if (!departureTime || !arrivalTime) return ''

  const departure = new Date(departureTime)
  const arrival = new Date(arrivalTime)

  if (isNaN(departure.getTime()) || isNaN(arrival.getTime())) return ''

  const diffInMs = arrival - departure
  const diffInMinutes = Math.floor(diffInMs / (1000 * 60))

  return formatDuration(diffInMinutes)
}

/**
 * File size formatting utilities
 */
export const formatFileSize = (bytes) => {
  if (!bytes || bytes === 0) return '0 B'

  const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(1024))

  return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`
}

/**
 * String formatting utilities
 */
export const truncateText = (text, maxLength = 50) => {
  if (!text) return ''

  if (text.length <= maxLength) return text

  return text.substring(0, maxLength) + '...'
}

export const capitalizeFirst = (str) => {
  if (!str) return ''

  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase()
}

export const formatPhoneNumber = (phone) => {
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
export const formatFlightNumber = (flightNumber) => {
  if (!flightNumber) return ''

  // Format: TK1234 -> TK 1234
  const match = flightNumber.match(/^([A-Z]{2})(\d+)$/)
  if (match) {
    return `${match[1]} ${match[2]}`
  }

  return flightNumber
}

export const formatAirportCode = (code) => {
  if (!code) return ''

  return code.toUpperCase()
}

export const formatRoute = (origin, destination) => {
  if (!origin || !destination) return ''

  return `${formatAirportCode(origin)} → ${formatAirportCode(destination)}`
}

/**
 * Status formatting utilities
 */
export const getFlightStatusText = (status) => {
  const statusMap = {
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

export const getFlightStatusColor = (status) => {
  const colorMap = {
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
export const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

export const isValidPhoneNumber = (phone) => {
  const cleaned = phone.replace(/\D/g, '')
  return cleaned.length === 10 || (cleaned.length === 11 && cleaned.startsWith('0'))
}

export const isValidFlightNumber = (flightNumber) => {
  const flightRegex = /^[A-Z]{2}\d{3,4}$/
  return flightRegex.test(flightNumber)
}

/**
 * Array and object formatting utilities
 */
export const formatList = (items, separator = ', ', lastSeparator = ' ve ') => {
  if (!Array.isArray(items) || items.length === 0) return ''

  if (items.length === 1) return items[0]

  if (items.length === 2) return items.join(lastSeparator)

  const allButLast = items.slice(0, -1).join(separator)
  const last = items[items.length - 1]

  return `${allButLast}${lastSeparator}${last}`
}

export const groupBy = (array, key) => {
  return array.reduce((result, item) => {
    const group = item[key]
    if (!result[group]) {
      result[group] = []
    }
    result[group].push(item)
    return result
  }, {})
}
