import { onUnmounted, watch } from 'vue'
import { websocketService } from '@/services/websocketService'
import { useAuthStore } from '@/stores/auth'

export function useWebSocket(subscriptions) {
  const authStore = useAuthStore()

  const connectAndSubscribe = async () => {
    if (authStore.isAuthenticated && !websocketService.isConnected()) {
      try {
        await websocketService.connect()
        Object.entries(subscriptions).forEach(([topic, callback]) => {
          websocketService.subscribe(topic, callback)
        })
      } catch (error) {
        console.error('Failed to setup WebSocket subscriptions:', error)
      }
    }
  }

  const disconnectAndUnsubscribe = () => {
    if (websocketService.isConnected()) {
      Object.keys(subscriptions).forEach(topic => {
        websocketService.unsubscribe(topic)
      })
      // Disconnect if no other components are using it.
      // This logic might need to be more sophisticated in a larger app.
      websocketService.disconnect()
    }
  }

  // Watch for authentication changes
  const stopWatch = watch(
    () => authStore.isAuthenticated,
    (isAuthenticated) => {
      if (isAuthenticated) {
        connectAndSubscribe()
      } else {
        disconnectAndUnsubscribe()
      }
    },
  )

  onUnmounted(() => {
    stopWatch()
    // We don't disconnect here because other components might still be using the connection.
    // The watcher will handle disconnection on logout.
  })
}
