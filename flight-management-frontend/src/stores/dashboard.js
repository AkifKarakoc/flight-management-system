import { defineStore } from 'pinia'
import { ref } from 'vue'
import flightService from '@/services/flightService'
import referenceService from '@/services/referenceService'

export const useDashboardStore = defineStore('dashboard', () => {
  // State
  const stats = ref({
    totalFlights: 0,
    activeFlights: 0,
    delayedFlights: 0,
    cancelledFlights: 0,
    flightsChange: 0,
    activeChange: 0,
    delayedChange: 0,
    cancelledChange: 0
  })
  const recentFlights = ref([])
  const flightStatusData = ref([])
  const dailyOperationsData = ref([])
  const notifications = ref([])
  const performanceMetrics = ref({})

  // Actions
  const loadStats = async () => {
    try {
      const response = await flightService.getDashboardKPIs()
      stats.value = response
    } catch (error) {
      console.error('Error loading dashboard stats:', error)
    }
  }

  const loadRecentFlights = async () => {
    try {
      const response = await flightService.getAllFlights({
        page: 0,
        size: 5,
        sort: '-scheduledDeparture'
      })
      recentFlights.value = response.content
    } catch (error) {
      console.error('Error loading recent flights:', error)
    }
  }

  const loadFlightStatusData = async () => {
    try {
      const response = await flightService.getFlightTypeDistribution()
      flightStatusData.value = response
    } catch (error) {
      console.error('Error loading flight status data:', error)
    }
  }

  const loadDailyOperationsData = async () => {
    try {
      const response = await flightService.getChartData()
      dailyOperationsData.value = response
    } catch (error) {
      console.error('Error loading daily operations data:', error)
    }
  }

  const loadNotifications = async () => {
    // This is a placeholder as there is no notification service
    notifications.value = [
      { id: 1, message: 'New flight added: TK123', type: 'info', read: false },
      { id: 2, message: 'Flight TK456 delayed', type: 'warning', read: false },
      { id: 3, message: 'CSV upload complete', type: 'success', read: true }
    ]
  }

  const loadPerformanceMetrics = async () => {
    // This is a placeholder
    performanceMetrics.value = {
      onTimePerformance: 95.5,
      cancellationRate: 2.1,
      averageDelay: 15
    }
  }

  const markNotificationAsRead = (id) => {
    const notification = notifications.value.find(n => n.id === id)
    if (notification) {
      notification.read = true
    }
  }

  const markAllNotificationsAsRead = () => {
    notifications.value.forEach(n => (n.read = true))
  }

  const exportDashboardReport = async (config) => {
    // This is a placeholder
    console.log('Exporting dashboard report with config:', config)
    return Promise.resolve()
  }

  return {
    stats,
    recentFlights,
    flightStatusData,
    dailyOperationsData,
    notifications,
    performanceMetrics,
    loadStats,
    loadRecentFlights,
    loadFlightStatusData,
    loadDailyOperationsData,
    loadNotifications,
    loadPerformanceMetrics,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    exportDashboardReport
  }
})
