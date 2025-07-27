import { defineStore } from 'pinia'
import { ref } from 'vue'
import flightService from '@/services/flightService'

export const useDashboardStore = defineStore('dashboard', () => {
  // State
  const stats = ref({
    totalFlights: 0,
    scheduledFlights: 0,
    departedFlights: 0,
    arrivedFlights: 0,
    delayedFlights: 0,
    cancelledFlights: 0,
    flightsChange: 0,
    scheduledChange: 0,
    departedChange: 0,
    arrivedChange: 0,
    delayedChange: 0,
    cancelledChange: 0
  })

  const recentFlights = ref([])
  const flightStatusData = ref([])
  const dailyOperationsData = ref([])
  const loading = ref({
    stats: false,
    recentFlights: false,
    statusData: false,
    dailyOps: false
  })
  const error = ref({
    stats: null,
    recentFlights: null,
    statusData: null,
    dailyOps: null
  })

  // Actions - Stats (Backend: GET /api/v1/flights/count)
  const loadStats = async (date = null) => {
    loading.value.stats = true
    error.value.stats = null

    try {
      const targetDate = date || new Date().toISOString().split('T')[0]

      // Backend'deki mevcut endpoint: /api/v1/flights/count
      const response = await flightService.getFlightCounts(targetDate)

      // Backend response formatı:
      // { date: "2025-07-28", total: 150, scheduled: 80, departed: 40, arrived: 25, delayed: 3, cancelled: 2 }
      stats.value = {
        totalFlights: response.total || 0,
        scheduledFlights: response.scheduled || 0,
        departedFlights: response.departed || 0,
        arrivedFlights: response.arrived || 0,
        delayedFlights: response.delayed || 0,
        cancelledFlights: response.cancelled || 0,
        // Değişim yüzdeleri için önceki günü de çekeceğiz
        flightsChange: 0,
        scheduledChange: 0,
        departedChange: 0,
        arrivedChange: 0,
        delayedChange: 0,
        cancelledChange: 0
      }

      // Önceki gün ile karşılaştırma için
      try {
        const previousDate = new Date(targetDate)
        previousDate.setDate(previousDate.getDate() - 1)
        const prevDateStr = previousDate.toISOString().split('T')[0]

        const prevResponse = await flightService.getFlightCounts(prevDateStr)

        // Değişim yüzdelerini hesapla
        stats.value.flightsChange = calculateChangePercentage(response.total, prevResponse.total)
        stats.value.scheduledChange = calculateChangePercentage(response.scheduled, prevResponse.scheduled)
        stats.value.departedChange = calculateChangePercentage(response.departed, prevResponse.departed)
        stats.value.arrivedChange = calculateChangePercentage(response.arrived, prevResponse.arrived)
        stats.value.delayedChange = calculateChangePercentage(response.delayed, prevResponse.delayed)
        stats.value.cancelledChange = calculateChangePercentage(response.cancelled, prevResponse.cancelled)
      } catch (prevError) {
        console.warn('Previous day data could not be loaded:', prevError)
        // Önceki gün verisi alınamazsa değişim yüzdeleri 0 kalır
      }

    } catch (err) {
      console.error('Error loading dashboard stats:', err)
      error.value.stats = err.message || 'İstatistikler yüklenirken hata oluştu'

      // Hata durumunda sıfır değerler ata
      stats.value = {
        totalFlights: 0,
        scheduledFlights: 0,
        departedFlights: 0,
        arrivedFlights: 0,
        delayedFlights: 0,
        cancelledFlights: 0,
        flightsChange: 0,
        scheduledChange: 0,
        departedChange: 0,
        arrivedChange: 0,
        delayedChange: 0,
        cancelledChange: 0
      }
    } finally {
      loading.value.stats = false
    }
  }

  // Actions - Recent Flights (Backend: GET /api/v1/flights)
  const loadRecentFlights = async () => {
    loading.value.recentFlights = true
    error.value.recentFlights = null

    try {
      // Son 5 uçuşu getir, zamana göre sıralı
      const response = await flightService.getAllFlights({
        page: 0,
        size: 5,
        sortBy: 'scheduledDeparture',
        sortDirection: 'desc'
      })

      recentFlights.value = response.content || []
    } catch (err) {
      console.error('Error loading recent flights:', err)
      error.value.recentFlights = err.message || 'Son uçuşlar yüklenirken hata oluştu'
      recentFlights.value = []
    } finally {
      loading.value.recentFlights = false
    }
  }

  // Actions - Flight Status Data (Backend: GET /api/v1/flights/stats/type-distribution)
  const loadFlightStatusData = async () => {
    loading.value.statusData = true
    error.value.statusData = null

    try {
      // Backend'de type distribution endpoint'i var mı kontrol edelim
      const response = await flightService.getFlightTypeDistribution()
      flightStatusData.value = response || []
    } catch (err) {
      console.error('Error loading flight status data:', err)
      error.value.statusData = err.message || 'Uçuş durum verileri yüklenirken hata oluştu'

      // Fallback olarak count endpoint'inden veri türetelim
      try {
        const today = new Date().toISOString().split('T')[0]
        const counts = await flightService.getFlightCounts(today)

        // Count verilerinden chart data'sı oluştur
        flightStatusData.value = [
          { name: 'Planlandı', value: counts.scheduled || 0, status: 'SCHEDULED' },
          { name: 'Kalktı', value: counts.departed || 0, status: 'DEPARTED' },
          { name: 'Vardı', value: counts.arrived || 0, status: 'ARRIVED' },
          { name: 'Gecikti', value: counts.delayed || 0, status: 'DELAYED' },
          { name: 'İptal', value: counts.cancelled || 0, status: 'CANCELLED' }
        ].filter(item => item.value > 0) // Sıfır olanları filtrele
      } catch (fallbackErr) {
        console.error('Fallback flight status data failed:', fallbackErr)
        flightStatusData.value = []
      }
    } finally {
      loading.value.statusData = false
    }
  }

  // Actions - Daily Operations Data (Backend: GET /api/v1/flights/stats/daily-chart)
  const loadDailyOperationsData = async (startDate = null, endDate = null) => {
    loading.value.dailyOps = true
    error.value.dailyOps = null

    try {
      // Tarih aralığı verilmemişse son 7 günü al
      if (!startDate || !endDate) {
        endDate = new Date().toISOString().split('T')[0]
        const start = new Date()
        start.setDate(start.getDate() - 7)
        startDate = start.toISOString().split('T')[0]
      }

      // Backend'de daily chart endpoint'i var mı kontrol edelim
      const response = await flightService.getChartData(startDate, endDate)
      dailyOperationsData.value = response || []
    } catch (err) {
      console.error('Error loading daily operations data:', err)
      error.value.dailyOps = err.message || 'Günlük işlem verileri yüklenirken hata oluştu'

      // Bu endpoint yoksa basit mock veri döndürelim ya da kaldıralım
      console.warn('Daily operations chart endpoint not available, using empty data')
      dailyOperationsData.value = []
    } finally {
      loading.value.dailyOps = false
    }
  }

  // Helper function - Değişim yüzdesini hesapla
  const calculateChangePercentage = (current, previous) => {
    if (!previous || previous === 0) return current > 0 ? 100 : 0
    return Math.round(((current - previous) / previous) * 100)
  }

  // Tüm dashboard verilerini yükle
  const loadAllDashboardData = async () => {
    const promises = [
      loadStats(),
      loadRecentFlights(),
      loadFlightStatusData(),
      loadDailyOperationsData()
    ]

    // Paralel olarak tüm verileri yükle, hata olsa bile diğerleri devam etsin
    await Promise.allSettled(promises)
  }

  // Dashboard verilerini yenile
  const refreshDashboard = async () => {
    await loadAllDashboardData()
  }

  return {
    // State
    stats,
    recentFlights,
    flightStatusData,
    dailyOperationsData,
    loading,
    error,

    // Actions
    loadStats,
    loadRecentFlights,
    loadFlightStatusData,
    loadDailyOperationsData,
    loadAllDashboardData,
    refreshDashboard,

    // Helper
    calculateChangePercentage
  }
})
