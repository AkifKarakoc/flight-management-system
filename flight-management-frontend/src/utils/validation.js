import { VALIDATION_RULES, FLIGHT_STATUS, FLIGHT_TYPE, AIRLINE_TYPE, AIRPORT_TYPE, AIRCRAFT_STATUS, CREW_TYPE, CREW_STATUS, ROUTE_TYPES, GENDER } from './constants'

// ========================
// BASIC VALIDATION RULES
// ========================

/**
 * Gerekli alan kontrolü
 * @param {string} message - Hata mesajı
 * @returns {Function} Validasyon fonksiyonu
 */
export const required = (message = 'Bu alan zorunludur') => {
  return (rule, value, callback) => {
    if (!value || (typeof value === 'string' && value.trim() === '')) {
      callback(new Error(message))
    } else {
      callback()
    }
  }
}

/**
 * Minimum uzunluk kontrolü
 * @param {number} min - Minimum uzunluk
 * @param {string} message - Hata mesajı
 * @returns {Function} Validasyon fonksiyonu
 */
export const minLength = (min, message) => {
  return (rule, value, callback) => {
    if (value && value.length < min) {
      callback(new Error(message || `En az ${min} karakter olmalıdır`))
    } else {
      callback()
    }
  }
}

/**
 * Maksimum uzunluk kontrolü
 * @param {number} max - Maksimum uzunluk
 * @param {string} message - Hata mesajı
 * @returns {Function} Validasyon fonksiyonu
 */
export const maxLength = (max, message) => {
  return (rule, value, callback) => {
    if (value && value.length > max) {
      callback(new Error(message || `En fazla ${max} karakter olabilir`))
    } else {
      callback()
    }
  }
}

/**
 * E-posta validasyonu
 * @param {string} message - Hata mesajı
 * @returns {Function} Validasyon fonksiyonu
 */
export const email = (message = 'Geçerli bir e-posta adresi giriniz') => {
  return (rule, value, callback) => {
    if (value && !VALIDATION_RULES.EMAIL.test(value)) {
      callback(new Error(message))
    } else {
      callback()
    }
  }
}

/**
 * Telefon numarası validasyonu
 * @param {string} message - Hata mesajı
 * @returns {Function} Validasyon fonksiyonu
 */
export const phone = (message = 'Geçerli bir telefon numarası giriniz') => {
  return (rule, value, callback) => {
    if (value && !VALIDATION_RULES.PHONE.test(value)) {
      callback(new Error(message))
    } else {
      callback()
    }
  }
}

// ========================
// AVIATION SPECIFIC VALIDATIONS
// ========================

/**
 * Uçuş numarası validasyonu (AA9999 formatı)
 * @param {string} message - Hata mesajı
 * @returns {Function} Validasyon fonksiyonu
 */
export const flightNumber = (message = 'Geçerli bir uçuş numarası giriniz (örn: TK123)') => {
  return (rule, value, callback) => {
    if (value && !VALIDATION_RULES.FLIGHT_NUMBER.test(value)) {
      callback(new Error(message))
    } else {
      callback()
    }
  }
}

/**
 * IATA kodu validasyonu (2 harf)
 * @param {string} message - Hata mesajı
 * @returns {Function} Validasyon fonksiyonu
 */
export const iataCode = (message = 'IATA kodu 2 büyük harf olmalıdır (örn: TK)') => {
  return (rule, value, callback) => {
    if (value && !VALIDATION_RULES.IATA_CODE.test(value)) {
      callback(new Error(message))
    } else {
      callback()
    }
  }
}

/**
 * ICAO kodu validasyonu (3-4 harf)
 * @param {string} message - Hata mesajı
 * @returns {Function} Validasyon fonksiyonu
 */
export const icaoCode = (message = 'ICAO kodu 3-4 büyük harf olmalıdır (örn: THY)') => {
  return (rule, value, callback) => {
    if (value && !VALIDATION_RULES.ICAO_CODE.test(value)) {
      callback(new Error(message))
    } else {
      callback()
    }
  }
}

// ========================
// ENUM VALIDATIONS
// ========================

/**
 * Uçuş durumu validasyonu
 * @param {string} message - Hata mesajı
 * @returns {Function} Validasyon fonksiyonu
 */
export const flightStatus = (message = 'Geçerli bir uçuş durumu seçiniz') => {
  return (rule, value, callback) => {
    if (value && !Object.values(FLIGHT_STATUS).includes(value)) {
      callback(new Error(message))
    } else {
      callback()
    }
  }
}

/**
 * Uçuş tipi validasyonu
 * @param {string} message - Hata mesajı
 * @returns {Function} Validasyon fonksiyonu
 */
export const flightType = (message = 'Geçerli bir uçuş tipi seçiniz') => {
  return (rule, value, callback) => {
    if (value && !Object.values(FLIGHT_TYPE).includes(value)) {
      callback(new Error(message))
    } else {
      callback()
    }
  }
}

/**
 * Havayolu tipi validasyonu
 * @param {string} message - Hata mesajı
 * @returns {Function} Validasyon fonksiyonu
 */
export const airlineType = (message = 'Geçerli bir havayolu tipi seçiniz') => {
  return (rule, value, callback) => {
    if (value && !Object.values(AIRLINE_TYPE).includes(value)) {
      callback(new Error(message))
    } else {
      callback()
    }
  }
}

/**
 * Havalimanı tipi validasyonu
 * @param {string} message - Hata mesajı
 * @returns {Function} Validasyon fonksiyonu
 */
export const airportType = (message = 'Geçerli bir havalimanı tipi seçiniz') => {
  return (rule, value, callback) => {
    if (value && !Object.values(AIRPORT_TYPE).includes(value)) {
      callback(new Error(message))
    } else {
      callback()
    }
  }
}

/**
 * Uçak durumu validasyonu
 * @param {string} message - Hata mesajı
 * @returns {Function} Validasyon fonksiyonu
 */
export const aircraftStatus = (message = 'Geçerli bir uçak durumu seçiniz') => {
  return (rule, value, callback) => {
    if (value && !Object.values(AIRCRAFT_STATUS).includes(value)) {
      callback(new Error(message))
    } else {
      callback()
    }
  }
}

/**
 * Mürettebat tipi validasyonu
 * @param {string} message - Hata mesajı
 * @returns {Function} Validasyon fonksiyonu
 */
export const crewType = (message = 'Geçerli bir mürettebat tipi seçiniz') => {
  return (rule, value, callback) => {
    if (value && !Object.values(CREW_TYPE).includes(value)) {
      callback(new Error(message))
    } else {
      callback()
    }
  }
}

/**
 * Mürettebat durumu validasyonu
 * @param {string} message - Hata mesajı
 * @returns {Function} Validasyon fonksiyonu
 */
export const crewStatus = (message = 'Geçerli bir mürettebat durumu seçiniz') => {
  return (rule, value, callback) => {
    if (value && !Object.values(CREW_STATUS).includes(value)) {
      callback(new Error(message))
    } else {
      callback()
    }
  }
}

/**
 * Rota tipi validasyonu
 * @param {string} message - Hata mesajı
 * @returns {Function} Validasyon fonksiyonu
 */
export const routeType = (message = 'Geçerli bir rota tipi seçiniz') => {
  return (rule, value, callback) => {
    if (value && !Object.values(ROUTE_TYPES).includes(value)) {
      callback(new Error(message))
    } else {
      callback()
    }
  }
}

/**
 * Cinsiyet validasyonu
 * @param {string} message - Hata mesajı
 * @returns {Function} Validasyon fonksiyonu
 */
export const gender = (message = 'Geçerli bir cinsiyet seçiniz') => {
  return (rule, value, callback) => {
    if (value && !Object.values(GENDER).includes(value)) {
      callback(new Error(message))
    } else {
      callback()
    }
  }
}

// ========================
// DATE VALIDATIONS
// ========================

/**
 * Tarih validasyonu (bugünden sonra olmalı)
 * @param {string} message - Hata mesajı
 * @returns {Function} Validasyon fonksiyonu
 */
export const futureDate = (message = 'Tarih bugünden sonra olmalıdır') => {
  return (rule, value, callback) => {
    if (value && new Date(value) <= new Date()) {
      callback(new Error(message))
    } else {
      callback()
    }
  }
}

/**
 * Tarih validasyonu (bugünden önce olmamalı)
 * @param {string} message - Hata mesajı
 * @returns {Function} Validasyon fonksiyonu
 */
export const notPastDate = (message = 'Tarih bugünden önce olamaz') => {
  return (rule, value, callback) => {
    if (value && new Date(value) < new Date().setHours(0, 0, 0, 0)) {
      callback(new Error(message))
    } else {
      callback()
    }
  }
}

/**
 * Doğum tarihi validasyonu (18-80 yaş arası)
 * @param {string} message - Hata mesajı
 * @returns {Function} Validasyon fonksiyonu
 */
export const birthDate = (message = 'Geçerli bir doğum tarihi giriniz (18-80 yaş arası)') => {
  return (rule, value, callback) => {
    if (value) {
      const birthYear = new Date(value).getFullYear()
      const currentYear = new Date().getFullYear()
      const age = currentYear - birthYear

      if (age < 18 || age > 80) {
        callback(new Error(message))
      } else {
        callback()
      }
    } else {
      callback()
    }
  }
}

// ========================
// NUMERIC VALIDATIONS
// ========================

/**
 * Pozitif sayı validasyonu
 * @param {string} message - Hata mesajı
 * @returns {Function} Validasyon fonksiyonu
 */
export const positiveNumber = (message = 'Pozitif bir sayı giriniz') => {
  return (rule, value, callback) => {
    if (value !== null && value !== undefined && value <= 0) {
      callback(new Error(message))
    } else {
      callback()
    }
  }
}

/**
 * Minimum değer kontrolü
 * @param {number} min - Minimum değer
 * @param {string} message - Hata mesajı
 * @returns {Function} Validasyon fonksiyonu
 */
export const minValue = (min, message) => {
  return (rule, value, callback) => {
    if (value !== null && value !== undefined && value < min) {
      callback(new Error(message || `En az ${min} olmalıdır`))
    } else {
      callback()
    }
  }
}

/**
 * Maksimum değer kontrolü
 * @param {number} max - Maksimum değer
 * @param {string} message - Hata mesajı
 * @returns {Function} Validasyon fonksiyonu
 */
export const maxValue = (max, message) => {
  return (rule, value, callback) => {
    if (value !== null && value !== undefined && value > max) {
      callback(new Error(message || `En fazla ${max} olabilir`))
    } else {
      callback()
    }
  }
}

// ========================
// COMPLEX VALIDATIONS
// ========================

/**
 * TC Kimlik No validasyonu
 * @param {string} message - Hata mesajı
 * @returns {Function} Validasyon fonksiyonu
 */
export const turkishNationalId = (message = 'Geçerli bir TC Kimlik No giriniz') => {
  return (rule, value, callback) => {
    if (value) {
      const cleaned = value.replace(/\D/g, '')

      if (cleaned.length !== 11 || cleaned[0] === '0') {
        callback(new Error(message))
        return
      }

      // TC Kimlik No algoritması
      let sum = 0
      for (let i = 0; i < 10; i++) {
        sum += parseInt(cleaned[i])
      }

      const checkDigit = sum % 10
      if (checkDigit !== parseInt(cleaned[10])) {
        callback(new Error(message))
        return
      }

      // 10. hane kontrolü
      let oddSum = 0
      let evenSum = 0
      for (let i = 0; i < 9; i++) {
        if (i % 2 === 0) {
          oddSum += parseInt(cleaned[i])
        } else {
          evenSum += parseInt(cleaned[i])
        }
      }

      const ninthDigit = ((oddSum * 7) - evenSum) % 10
      if (ninthDigit !== parseInt(cleaned[9])) {
        callback(new Error(message))
        return
      }
    }
    callback()
  }
}

/**
 * Uçak tescil numarası validasyonu (TC-XXX formatı)
 * @param {string} message - Hata mesajı
 * @returns {Function} Validasyon fonksiyonu
 */
export const aircraftRegistration = (message = 'Geçerli bir tescil numarası giriniz (örn: TC-JJA)') => {
  return (rule, value, callback) => {
    if (value && !/^[A-Z]{2}-[A-Z0-9]{3,6}$/i.test(value)) {
      callback(new Error(message))
    } else {
      callback()
    }
  }
}

// ========================
// FORM VALIDATION RULES
// ========================

/**
 * Uçuş formu validasyon kuralları
 */
export const flightFormRules = {
  flightNumber: [
    { required: true, message: 'Uçuş numarası zorunludur', trigger: 'blur' },
    { validator: flightNumber(), trigger: 'blur' }
  ],
  airlineId: [
    { required: true, message: 'Havayolu seçimi zorunludur', trigger: 'change' }
  ],
  aircraftType: [
    { required: true, message: 'Uçak tipi zorunludur', trigger: 'blur' },
    { max: 50, message: 'En fazla 50 karakter olabilir', trigger: 'blur' }
  ],
  originId: [
    { required: true, message: 'Kalkış havalimanı seçimi zorunludur', trigger: 'change' }
  ],
  destinationId: [
    { required: true, message: 'Varış havalimanı seçimi zorunludur', trigger: 'change' }
  ],
  flightDate: [
    { required: true, message: 'Uçuş tarihi zorunludur', trigger: 'change' },
    { validator: notPastDate(), trigger: 'change' }
  ],
  std: [
    { required: true, message: 'Kalkış saati zorunludur', trigger: 'blur' }
  ],
  sta: [
    { required: true, message: 'Varış saati zorunludur', trigger: 'blur' }
  ],
  flightType: [
    { required: true, message: 'Uçuş tipi seçimi zorunludur', trigger: 'change' },
    { validator: flightType(), trigger: 'change' }
  ]
}

/**
 * Havayolu formu validasyon kuralları
 */
export const airlineFormRules = {
  iataCode: [
    { required: true, message: 'IATA kodu zorunludur', trigger: 'blur' },
    { validator: iataCode(), trigger: 'blur' }
  ],
  icaoCode: [
    { required: true, message: 'ICAO kodu zorunludur', trigger: 'blur' },
    { validator: icaoCode(), trigger: 'blur' }
  ],
  name: [
    { required: true, message: 'Havayolu adı zorunludur', trigger: 'blur' },
    { min: 2, max: 100, message: '2-100 karakter arası olmalıdır', trigger: 'blur' }
  ],
  country: [
    { required: true, message: 'Ülke zorunludur', trigger: 'blur' },
    { min: 2, max: 50, message: '2-50 karakter arası olmalıdır', trigger: 'blur' }
  ],
  type: [
    { required: true, message: 'Havayolu tipi seçimi zorunludur', trigger: 'change' },
    { validator: airlineType(), trigger: 'change' }
  ]
}

/**
 * Havalimanı formu validasyon kuralları
 */
export const airportFormRules = {
  iataCode: [
    { required: true, message: 'IATA kodu zorunludur', trigger: 'blur' },
    { validator: iataCode(), trigger: 'blur' }
  ],
  icaoCode: [
    { required: true, message: 'ICAO kodu zorunludur', trigger: 'blur' },
    { validator: icaoCode(), trigger: 'blur' }
  ],
  name: [
    { required: true, message: 'Havalimanı adı zorunludur', trigger: 'blur' },
    { min: 2, max: 100, message: '2-100 karakter arası olmalıdır', trigger: 'blur' }
  ],
  city: [
    { required: true, message: 'Şehir zorunludur', trigger: 'blur' },
    { min: 2, max: 50, message: '2-50 karakter arası olmalıdır', trigger: 'blur' }
  ],
  country: [
    { required: true, message: 'Ülke zorunludur', trigger: 'blur' },
    { min: 2, max: 50, message: '2-50 karakter arası olmalıdır', trigger: 'blur' }
  ],
  type: [
    { required: true, message: 'Havalimanı tipi seçimi zorunludur', trigger: 'change' },
    { validator: airportType(), trigger: 'change' }
  ]
}

/**
 * Uçak formu validasyon kuralları
 */
export const aircraftFormRules = {
  registrationNumber: [
    { required: true, message: 'Tescil numarası zorunludur', trigger: 'blur' },
    { validator: aircraftRegistration(), trigger: 'blur' }
  ],
  aircraftType: [
    { required: true, message: 'Uçak tipi zorunludur', trigger: 'blur' },
    { max: 50, message: 'En fazla 50 karakter olabilir', trigger: 'blur' }
  ],
  manufacturer: [
    { required: true, message: 'Üretici zorunludur', trigger: 'blur' },
    { max: 50, message: 'En fazla 50 karakter olabilir', trigger: 'blur' }
  ],
  model: [
    { required: true, message: 'Model zorunludur', trigger: 'blur' },
    { max: 50, message: 'En fazla 50 karakter olabilir', trigger: 'blur' }
  ],
  seatCapacity: [
    { required: true, message: 'Koltuk kapasitesi zorunludur', trigger: 'blur' },
    { validator: positiveNumber(), trigger: 'blur' },
    { validator: maxValue(1000, 'En fazla 1000 olabilir'), trigger: 'blur' }
  ],
  status: [
    { required: true, message: 'Durum seçimi zorunludur', trigger: 'change' },
    { validator: aircraftStatus(), trigger: 'change' }
  ],
  airlineId: [
    { required: true, message: 'Havayolu seçimi zorunludur', trigger: 'change' }
  ]
}

/**
 * Mürettebat formu validasyon kuralları
 */
export const crewMemberFormRules = {
  firstName: [
    { required: true, message: 'Ad zorunludur', trigger: 'blur' },
    { min: 2, max: 50, message: '2-50 karakter arası olmalıdır', trigger: 'blur' }
  ],
  lastName: [
    { required: true, message: 'Soyad zorunludur', trigger: 'blur' },
    { min: 2, max: 50, message: '2-50 karakter arası olmalıdır', trigger: 'blur' }
  ],
  employeeNumber: [
    { required: true, message: 'Çalışan numarası zorunludur', trigger: 'blur' },
    { max: 20, message: 'En fazla 20 karakter olabilir', trigger: 'blur' }
  ],
  nationalId: [
    { required: true, message: 'TC Kimlik No zorunludur', trigger: 'blur' },
    { validator: turkishNationalId(), trigger: 'blur' }
  ],
  dateOfBirth: [
    { required: true, message: 'Doğum tarihi zorunludur', trigger: 'change' },
    { validator: birthDate(), trigger: 'change' }
  ],
  gender: [
    { required: true, message: 'Cinsiyet seçimi zorunludur', trigger: 'change' },
    { validator: gender(), trigger: 'change' }
  ],
  phoneNumber: [
    { validator: phone(), trigger: 'blur' }
  ],
  email: [
    { required: true, message: 'E-posta zorunludur', trigger: 'blur' },
    { validator: email(), trigger: 'blur' }
  ],
  crewType: [
    { required: true, message: 'Mürettebat tipi seçimi zorunludur', trigger: 'change' },
    { validator: crewType(), trigger: 'change' }
  ],
  licenseNumber: [
    { max: 50, message: 'En fazla 50 karakter olabilir', trigger: 'blur' }
  ],
  status: [
    { required: true, message: 'Durum seçimi zorunludur', trigger: 'change' },
    { validator: crewStatus(), trigger: 'change' }
  ],
  baseAirportId: [
    { required: true, message: 'Ana üs havalimanı seçimi zorunludur', trigger: 'change' }
  ],
  airlineId: [
    { required: true, message: 'Havayolu seçimi zorunludur', trigger: 'change' }
  ]
}
