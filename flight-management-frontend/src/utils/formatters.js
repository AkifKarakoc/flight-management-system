import dayjs from 'dayjs'
import { DATE_FORMATS, FLIGHT_STATUS, AIRLINE_TYPE, AIRPORT_TYPE, AIRCRAFT_STATUS, CREW_TYPE, CREW_STATUS } from './constants'

// ========================
// DATE & TIME FORMATTERS
// ========================

/**
 * Tarihi istenen formatta formatlar
 * @param {string|Date} date - Formatlanacak tarih
 * @param {string} format - Format string (DATE_FORMATS'tan)
 * @returns {string} Formatlanmış tarih
 */
export const formatDate = (date, format = DATE_FORMATS.DISPLAY_DATE) => {
  if (!date) return '-'
  return dayjs(date).format(format)
}

/**
 * Tarih ve saati formatlar
 * @param {string|Date} datetime - Formatlanacak tarih/saat
 * @returns {string} Formatlanmış tarih/saat
 */
export const formatDateTime = (datetime) => {
  if (!datetime) return '-'
  return dayjs(datetime).format(DATE_FORMATS.DISPLAY_DATETIME)
}

/**
 * Sadece saati formatlar
 * @param {string|Date} time - Formatlanacak saat
 * @returns {string} Formatlanmış saat
 */
export const formatTime = (time) => {
  if (!time) return '-'
  return dayjs(time).format(DATE_FORMATS.TIME_ONLY)
}

/**
 * Relatif zamanı formatlar (örn: "2 saat önce")
 * @param {string|Date} date - Formatlanacak tarih
 * @returns {string} Relatif zaman
 */
export const formatRelativeTime = (date) => {
  if (!date) return '-'
  return dayjs(date).fromNow()
}

// ========================
// FLIGHT FORMATTERS
// ========================

/**
 * Uçuş durumunu Türkçe formatlar
 * @param {string} status - Uçuş durumu
 * @returns {string} Türkçe durum
 */
export const formatFlightStatus = (status) => {
  const statusMap = {
    [FLIGHT_STATUS.SCHEDULED]: 'Planlandı',
    [FLIGHT_STATUS.BOARDING]: 'Boarding',
    [FLIGHT_STATUS.DEPARTED]: 'Kalktı',
    [FLIGHT_STATUS.ARRIVED]: 'Geldi',
    [FLIGHT_STATUS.CANCELLED]: 'İptal',
    [FLIGHT_STATUS.DELAYED]: 'Gecikti',
    [FLIGHT_STATUS.DIVERTED]: 'Yönlendirildi',
    [FLIGHT_STATUS.RETURNING]: 'Geri Dönüyor'
  }
  return statusMap[status] || status || '-'
}

/**
 * Uçuş tipini Türkçe formatlar
 * @param {string} type - Uçuş tipi
 * @returns {string} Türkçe tip
 */
export const formatFlightType = (type) => {
  const typeMap = {
    PASSENGER: 'Yolcu',
    CARGO: 'Kargo',
    POSITIONING: 'Pozisyon'
  }
  return typeMap[type] || type || '-'
}

/**
 * Uçuş numarasını formatlar
 * @param {string} flightNumber - Uçuş numarası
 * @returns {string} Formatlanmış uçuş numarası
 */
export const formatFlightNumber = (flightNumber) => {
  if (!flightNumber) return '-'
  return flightNumber.toUpperCase()
}

// ========================
// REFERENCE DATA FORMATTERS
// ========================

/**
 * Havayolu tipini Türkçe formatlar
 * @param {string} type - Havayolu tipi
 * @returns {string} Türkçe tip
 */
export const formatAirlineType = (type) => {
  const typeMap = {
    [AIRLINE_TYPE.FULL_SERVICE]: 'Tam Hizmet',
    [AIRLINE_TYPE.LOW_COST]: 'Düşük Maliyet',
    [AIRLINE_TYPE.CARGO]: 'Kargo',
    [AIRLINE_TYPE.CHARTER]: 'Charter'
  }
  return typeMap[type] || type || '-'
}

/**
 * Havalimanı tipini Türkçe formatlar
 * @param {string} type - Havalimanı tipi
 * @returns {string} Türkçe tip
 */
export const formatAirportType = (type) => {
  const typeMap = {
    [AIRPORT_TYPE.INTERNATIONAL]: 'Uluslararası',
    [AIRPORT_TYPE.DOMESTIC]: 'İç Hat',
    [AIRPORT_TYPE.CARGO]: 'Kargo',
    [AIRPORT_TYPE.MILITARY]: 'Askeri'
  }
  return typeMap[type] || type || '-'
}

/**
 * Uçak durumunu Türkçe formatlar
 * @param {string} status - Uçak durumu
 * @returns {string} Türkçe durum
 */
export const formatAircraftStatus = (status) => {
  const statusMap = {
    [AIRCRAFT_STATUS.ACTIVE]: 'Aktif',
    [AIRCRAFT_STATUS.MAINTENANCE]: 'Bakımda',
    [AIRCRAFT_STATUS.OUT_OF_SERVICE]: 'Hizmet Dışı',
    [AIRCRAFT_STATUS.RETIRED]: 'Emekli'
  }
  return statusMap[status] || status || '-'
}

/**
 * Mürettebat tipini Türkçe formatlar
 * @param {string} type - Mürettebat tipi
 * @returns {string} Türkçe tip
 */
export const formatCrewType = (type) => {
  const typeMap = {
    [CREW_TYPE.CAPTAIN]: 'Kaptan',
    [CREW_TYPE.FIRST_OFFICER]: 'İkinci Pilot',
    [CREW_TYPE.FLIGHT_ENGINEER]: 'Uçuş Mühendisi',
    [CREW_TYPE.PURSER]: 'Purser',
    [CREW_TYPE.FLIGHT_ATTENDANT]: 'Kabin Memuru',
    [CREW_TYPE.CABIN_CREW]: 'Kabin Ekibi'
  }
  return typeMap[type] || type || '-'
}

/**
 * Mürettebat durumunu Türkçe formatlar
 * @param {string} status - Mürettebat durumu
 * @returns {string} Türkçe durum
 */
export const formatCrewStatus = (status) => {
  const statusMap = {
    [CREW_STATUS.ACTIVE]: 'Aktif',
    [CREW_STATUS.ON_LEAVE]: 'İzinli',
    [CREW_STATUS.SICK_LEAVE]: 'Hasta İzni',
    [CREW_STATUS.RETIRED]: 'Emekli',
    [CREW_STATUS.SUSPENDED]: 'Uzaklaştırılmış'
  }
  return statusMap[status] || status || '-'
}

// ========================
// NUMERIC FORMATTERS
// ========================

/**
 * Sayıyı formatlar (binlik ayracı ile)
 * @param {number} number - Formatlanacak sayı
 * @param {number} decimals - Ondalık basamak sayısı
 * @returns {string} Formatlanmış sayı
 */
export const formatNumber = (number, decimals = 0) => {
  if (number === null || number === undefined) return '-'
  return new Intl.NumberFormat('tr-TR', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  }).format(number)
}

/**
 * Para birimi formatlar
 * @param {number} amount - Miktar
 * @param {string} currency - Para birimi kodu
 * @returns {string} Formatlanmış para
 */
export const formatCurrency = (amount, currency = 'TRY') => {
  if (amount === null || amount === undefined) return '-'
  return new Intl.NumberFormat('tr-TR', {
    style: 'currency',
    currency: currency
  }).format(amount)
}

/**
 * Yüzde formatlar
 * @param {number} value - Yüzde değeri (0-100 arası)
 * @param {number} decimals - Ondalık basamak sayısı
 * @returns {string} Formatlanmış yüzde
 */
export const formatPercentage = (value, decimals = 1) => {
  if (value === null || value === undefined) return '-'
  return new Intl.NumberFormat('tr-TR', {
    style: 'percent',
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  }).format(value / 100)
}

// ========================
// TEXT FORMATTERS
// ========================

/**
 * Metni başlık formatında yapar (Her kelimenin ilk harfi büyük)
 * @param {string} text - Formatlanacak metin
 * @returns {string} Başlık formatında metin
 */
export const formatTitle = (text) => {
  if (!text) return '-'
  return text.toLowerCase().replace(/\b\w/g, l => l.toUpperCase())
}

/**
 * Telefon numarasını formatlar
 * @param {string} phone - Telefon numarası
 * @returns {string} Formatlanmış telefon
 */
export const formatPhone = (phone) => {
  if (!phone) return '-'
  // Türkiye telefon formatı: +90 (532) 123 45 67
  const cleaned = phone.replace(/\D/g, '')
  if (cleaned.startsWith('90')) {
    const countryCode = cleaned.slice(0, 2)
    const areaCode = cleaned.slice(2, 5)
    const number = cleaned.slice(5)
    return `+${countryCode} (${areaCode}) ${number.slice(0, 3)} ${number.slice(3, 5)} ${number.slice(5)}`
  }
  return phone
}

/**
 * E-posta adresini formatlar (küçük harf)
 * @param {string} email - E-posta adresi
 * @returns {string} Formatlanmış e-posta
 */
export const formatEmail = (email) => {
  if (!email) return '-'
  return email.toLowerCase()
}

// ========================
// DISTANCE & DURATION FORMATTERS
// ========================

/**
 * Mesafeyi formatlar
 * @param {number} distance - Mesafe (km)
 * @returns {string} Formatlanmış mesafe
 */
export const formatDistance = (distance) => {
  if (!distance) return '-'
  return `${formatNumber(distance)} km`
}

/**
 * Süreyi formatlar (dakika cinsinden)
 * @param {number} minutes - Dakika
 * @returns {string} Formatlanmış süre (saat:dakika)
 */
export const formatDuration = (minutes) => {
  if (!minutes) return '-'
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  return `${hours}:${mins.toString().padStart(2, '0')}`
}

// ========================
// BOOLEAN FORMATTERS
// ========================

/**
 * Boolean değeri Türkçe formatlar
 * @param {boolean} value - Boolean değer
 * @returns {string} Türkçe değer
 */
export const formatBoolean = (value) => {
  if (value === null || value === undefined) return '-'
  return value ? 'Evet' : 'Hayır'
}

/**
 * Aktif/Pasif durumu formatlar
 * @param {boolean} active - Aktif durumu
 * @returns {string} Durum metni
 */
export const formatActiveStatus = (active) => {
  if (active === null || active === undefined) return '-'
  return active ? 'Aktif' : 'Pasif'
}

// ========================
// FILE SIZE FORMATTER
// ========================

/**
 * Dosya boyutunu formatlar
 * @param {number} bytes - Byte cinsinden boyut
 * @returns {string} Formatlanmış boyut
 */
export const formatFileSize = (bytes) => {
  if (!bytes) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`
}
