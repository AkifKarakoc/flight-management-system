/**
 * WebSocket Service for Real-time Flight Management
 * Handles real-time updates for flights, system status, and notifications
 */

import type {
  Flight,
  KpiData,
  SystemStatusItem,
  Notification
} from '@/types'

// WebSocket message types
type MessageType =
  | 'ping'
  | 'pong'
  | 'flight_update'
  | 'system_status'
  | 'notification'
  | 'kpi_update'
  | 'chart_update'
  | 'subscribe'
  | 'flight_status_update'
  | 'user_activity'

// WebSocket connection options interface
interface WebSocketOptions {
  onMessage?: (data: WebSocketMessage) => void
  onError?: (error: Event) => void
  onOpen?: (event: Event) => void
  onClose?: (event: CloseEvent) => void
  autoReconnect?: boolean
  heartbeat?: boolean
}

// WebSocket message structure
interface WebSocketMessage {
  type: MessageType
  payload?: any
  timestamp?: number
  userId?: string | number
  filters?: any
}

// Connection info interface
interface ConnectionInfo {
  socket: WebSocket
  endpoint: string
  options: WebSocketOptions
  isConnected: boolean
  lastActivity: number
}

// Active connection interface
interface ActiveConnection {
  id: string
  endpoint: string
  lastActivity: number
}

// Flight subscription filters
interface FlightSubscriptionFilters {
  flightNumbers?: string[]
  airlines?: number[]
  routes?: string[]
  status?: string[]
  airlineIds?: number[]
  aircraftIds?: number[]
  originAirportIds?: number[]
  destinationAirportIds?: number[]
}

// Flight update payload
interface FlightUpdatePayload {
  id: number
  flightNumber: string
  status: string
  airline?: string
  route?: string
  departure?: string
  arrival?: string
  gate?: string
  delay?: number
  timestamp: number
}

// System status payload
interface SystemStatusPayload {
  services: SystemStatusItem[]
  alerts?: Array<{
    id: number
    type: 'info' | 'warning' | 'error' | 'success'
    title: string
    message: string
    timestamp: string
  }>
  overall: 'healthy' | 'warning' | 'critical'
}

// Dashboard update payloads
interface KpiUpdatePayload {
  type: 'kpi_update'
  kpis: KpiData
  timestamp: number
}

interface ChartUpdatePayload {
  type: 'chart_update'
  chartType: 'flight_stats' | 'flight_types' | 'performance'
  data: any
  timestamp: number
}

// Notification payload
interface NotificationPayload {
  id: number
  type: 'info' | 'success' | 'warning' | 'error'
  title: string
  message: string
  userId?: number
  targetUsers?: number[]
  persistent?: boolean
  actions?: Array<{
    label: string
    action: string
    type?: 'primary' | 'success' | 'warning' | 'danger'
  }>
  timestamp: number
}

// User activity payload
interface UserActivityPayload {
  userId: string | number
  page: string
  action?: string
  timestamp: number
}

class WebSocketService {
  private connections: Map<string, ConnectionInfo>
  private reconnectAttempts: Map<string, number>
  private readonly maxReconnectAttempts: number
  private readonly reconnectDelay: number
  private readonly heartbeatInterval: number
  private heartbeatTimers: Map<string, number>
  private isOnline: boolean

  constructor() {
    this.connections = new Map()
    this.reconnectAttempts = new Map()
    this.maxReconnectAttempts = 5
    this.reconnectDelay = 1000
    this.heartbeatInterval = 30000
    this.heartbeatTimers = new Map()
    this.isOnline = navigator.onLine

    // Listen for online/offline events
    window.addEventListener('online', this.handleOnline.bind(this))
    window.addEventListener('offline', this.handleOffline.bind(this))
  }

  /**
   * Create a new WebSocket connection
   */
  async connect(endpoint: string, options: WebSocketOptions = {}): Promise<WebSocket> {
    const {
      onMessage = () => {},
      onError = () => {},
      onOpen = () => {},
      onClose = () => {},
      autoReconnect = true,
      heartbeat = true
    } = options

    const wsUrl = this.buildWebSocketUrl(endpoint)
    const connectionId = this.generateConnectionId(endpoint)

    try {
      const socket = new WebSocket(wsUrl)

      // Store connection info
      this.connections.set(connectionId, {
        socket,
        endpoint,
        options,
        isConnected: false,
        lastActivity: Date.now()
      })

      return new Promise<WebSocket>((resolve, reject) => {
        socket.onopen = (event: Event) => {
          console.log(`WebSocket connected: ${endpoint}`)
          const connection = this.connections.get(connectionId)
          if (connection) {
            connection.isConnected = true
          }
          this.resetReconnectAttempts(connectionId)

          if (heartbeat) {
            this.startHeartbeat(connectionId)
          }

          onOpen(event)
          resolve(socket)
        }

        socket.onmessage = (event: MessageEvent) => {
          this.updateLastActivity(connectionId)

          try {
            const data: WebSocketMessage = JSON.parse(event.data)

            // Handle system messages
            if (data.type === 'ping') {
              this.sendPong(socket)
              return
            }

            if (data.type === 'pong') {
              console.log(`Heartbeat received: ${endpoint}`)
              return
            }

            onMessage(data)
          } catch (error) {
            console.error('WebSocket message parsing error:', error)
            onError(error as Event)
          }
        }

        socket.onerror = (error: Event) => {
          console.error(`WebSocket error: ${endpoint}`, error)
          onError(error)
          reject(error)
        }

        socket.onclose = (event: CloseEvent) => {
          console.log(`WebSocket closed: ${endpoint}`, event.code, event.reason)
          const connection = this.connections.get(connectionId)
          if (connection) {
            connection.isConnected = false
          }
          this.stopHeartbeat(connectionId)

          onClose(event)

          // Auto-reconnect if enabled and not manually closed
          if (autoReconnect && event.code !== 1000 && this.isOnline) {
            this.scheduleReconnect(connectionId)
          }
        }
      })
    } catch (error) {
      console.error(`Failed to create WebSocket connection: ${endpoint}`, error)
      throw error
    }
  }

  /**
   * Send message through WebSocket connection
   */
  send(endpoint: string, message: WebSocketMessage): boolean {
    const connectionId = this.generateConnectionId(endpoint)
    const connection = this.connections.get(connectionId)

    if (!connection || !connection.isConnected) {
      console.warn(`WebSocket not connected: ${endpoint}`)
      return false
    }

    try {
      connection.socket.send(JSON.stringify(message))
      this.updateLastActivity(connectionId)
      return true
    } catch (error) {
      console.error(`Failed to send WebSocket message: ${endpoint}`, error)
      return false
    }
  }

  /**
   * Close WebSocket connection
   */
  disconnect(endpoint: string): void {
    const connectionId = this.generateConnectionId(endpoint)
    const connection = this.connections.get(connectionId)

    if (connection) {
      this.stopHeartbeat(connectionId)
      if (connection.socket.readyState === WebSocket.OPEN) {
        connection.socket.close(1000, 'Manual disconnect')
      }
      this.connections.delete(connectionId)
    }
  }

  /**
   * Close all WebSocket connections
   */
  disconnectAll(): void {
    for (const [connectionId, connection] of this.connections) {
      this.stopHeartbeat(connectionId)
      if (connection.socket.readyState === WebSocket.OPEN) {
        connection.socket.close(1000, 'Disconnect all')
      }
    }
    this.connections.clear()
  }

  /**
   * Get connection status
   */
  isConnected(endpoint: string): boolean {
    const connectionId = this.generateConnectionId(endpoint)
    const connection = this.connections.get(connectionId)
    return connection ? connection.isConnected : false
  }

  /**
   * Get all active connections
   */
  getActiveConnections(): ActiveConnection[] {
    const active: ActiveConnection[] = []
    for (const [connectionId, connection] of this.connections) {
      if (connection.isConnected) {
        active.push({
          id: connectionId,
          endpoint: connection.endpoint,
          lastActivity: connection.lastActivity
        })
      }
    }
    return active
  }

  /**
   * DÜZELTİLMİŞ METOT
   * Bu metot, endpoint'e göre doğru mikroservis portunu seçer ve
   * backend'in beklediği doğru URL yapısını oluşturur.
   */
  private buildWebSocketUrl(endpoint: string): string {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';

    // Endpoint'in ilk kısmına göre hangi servise bağlanılacağını belirliyoruz.
    // Örn: "flight-tracking/TK123" -> "flight-tracking" anahtar kelimesi olur.
    const endpointType = endpoint.split('/')[0];

    // Servis portlarını merkezi bir yerden yönetiyoruz.
    const SERVICE_PORTS: { [key: string]: string } = {
      // Reference Manager Service (Port 8081)
      'notifications': '8081',
      'system': '8081',
      'airline': '8081',
      'route': '8081',
      // Flight Service (Port 8082)
      'flights': '8082',
      'dashboard': '8082',
      'flight-tracking': '8082', // Uçuş takibi de flight-service'e aittir
      // Archive Service (Port 8083)
      'archive': '8083'
    };

    // Endpoint türüne göre portu bul, bulamazsan varsayılan olarak 8082 kullan.
    const port = SERVICE_PORTS[endpointType] || '8082';
    const host = `localhost:${port}`;

    // HATA BURADAYDI: URL'in sonuna endpoint eklemiyoruz. Bağlantı sadece /ws adresine yapılır.
    // Konu (topic) ayrımı bağlantı kurulduktan sonra STOMP mesajları ile yapılır.
    return `${protocol}//${host}/ws`;
  }


  /**
   * Generate unique connection ID
   */
  private generateConnectionId(endpoint: string): string {
    return `ws_${endpoint.replace(/[^a-zA-Z0-9]/g, '_')}`
  }

  /**
   * Schedule reconnection attempt
   */
  private scheduleReconnect(connectionId: string): void {
    const connection = this.connections.get(connectionId)
    if (!connection) return

    const attempts = this.reconnectAttempts.get(connectionId) || 0

    if (attempts >= this.maxReconnectAttempts) {
      console.error(`Max reconnection attempts reached for: ${connection.endpoint}`)
      this.connections.delete(connectionId)
      return
    }

    const delay = this.reconnectDelay * Math.pow(2, attempts) // Exponential backoff
    console.log(`Scheduling reconnection attempt ${attempts + 1} for ${connection.endpoint} in ${delay}ms`)

    setTimeout(async () => {
      if (!this.isOnline) {
        console.log('Device is offline, skipping reconnection attempt')
        return
      }

      try {
        this.reconnectAttempts.set(connectionId, attempts + 1)
        await this.connect(connection.endpoint, connection.options)
      } catch (error) {
        console.error(`Reconnection failed for ${connection.endpoint}:`, error)
        this.scheduleReconnect(connectionId)
      }
    }, delay)
  }

  /**
   * Reset reconnection attempts counter
   */
  private resetReconnectAttempts(connectionId: string): void {
    this.reconnectAttempts.delete(connectionId)
  }

  /**
   * Start heartbeat for connection
   */
  private startHeartbeat(connectionId: string): void {
    const connection = this.connections.get(connectionId)
    if (!connection) return

    const timer = setInterval(() => {
      if (connection.isConnected) {
        this.send(connection.endpoint, {
          type: 'ping',
          timestamp: Date.now()
        })
      } else {
        this.stopHeartbeat(connectionId)
      }
    }, this.heartbeatInterval)

    this.heartbeatTimers.set(connectionId, timer)
  }

  /**
   * Stop heartbeat for connection
   */
  private stopHeartbeat(connectionId: string): void {
    const timer = this.heartbeatTimers.get(connectionId)
    if (timer) {
      clearInterval(timer)
      this.heartbeatTimers.delete(connectionId)
    }
  }

  /**
   * Send pong response
   */
  private sendPong(socket: WebSocket): void {
    if (socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify({
        type: 'pong',
        timestamp: Date.now()
      }))
    }
  }

  /**
   * Update last activity timestamp
   */
  private updateLastActivity(connectionId: string): void {
    const connection = this.connections.get(connectionId)
    if (connection) {
      connection.lastActivity = Date.now()
    }
  }

  /**
   * Handle online event
   */
  private handleOnline(): void {
    console.log('Device is back online, reconnecting WebSockets...')
    this.isOnline = true

    // Attempt to reconnect all disconnected connections
    for (const [connectionId, connection] of this.connections) {
      if (!connection.isConnected && connection.options.autoReconnect !== false) {
        this.scheduleReconnect(connectionId)
      }
    }
  }

  /**
   * Handle offline event
   */
  private handleOffline(): void {
    console.log('Device is offline, WebSocket connections will be paused')
    this.isOnline = false
  }

  /**
   * Subscribe to flight updates
   */
  async subscribeToFlightUpdates(
    onUpdate: (data: FlightUpdatePayload) => void,
    filters: FlightSubscriptionFilters = {}
  ): Promise<WebSocket> {
    return this.connect('flights', {
      onMessage: (data: WebSocketMessage) => {
        if (data.type === 'flight_update') {
          onUpdate(data.payload as FlightUpdatePayload)
        }
      },
      onOpen: () => {
        // Send subscription filters
        this.send('flights', {
          type: 'subscribe',
          filters: {
            flightNumbers: filters.flightNumbers || [],
            airlines: filters.airlines || [],
            routes: filters.routes || [],
            status: filters.status || []
          }
        })
      },
      autoReconnect: true,
      heartbeat: true
    })
  }

  /**
   * Subscribe to system status updates
   */
  async subscribeToSystemStatus(
    onUpdate: (data: SystemStatusPayload) => void
  ): Promise<WebSocket> {
    return this.connect('system', {
      onMessage: (data: WebSocketMessage) => {
        if (data.type === 'system_status') {
          onUpdate(data.payload as SystemStatusPayload)
        }
      },
      autoReconnect: true,
      heartbeat: true
    })
  }

  /**
   * Subscribe to notifications
   */
  async subscribeToNotifications(
    onNotification: (data: NotificationPayload) => void,
    userId: string | number | null = null
  ): Promise<WebSocket> {
    return this.connect('notifications', {
      onMessage: (data: WebSocketMessage) => {
        if (data.type === 'notification') {
          onNotification(data.payload as NotificationPayload)
        }
      },
      onOpen: () => {
        if (userId) {
          this.send('notifications', {
            type: 'subscribe',
            userId: userId
          })
        }
      },
      autoReconnect: true,
      heartbeat: true
    })
  }

  /**
   * Subscribe to dashboard KPI updates
   */
  async subscribeToDashboardUpdates(
    onUpdate: (data: KpiUpdatePayload | ChartUpdatePayload) => void
  ): Promise<WebSocket> {
    return this.connect('dashboard', {
      onMessage: (data: WebSocketMessage) => {
        if (data.type === 'kpi_update' || data.type === 'chart_update') {
          onUpdate(data.payload as KpiUpdatePayload | ChartUpdatePayload)
        }
      },
      autoReconnect: true,
      heartbeat: true
    })
  }

  /**
   * Send flight status update
   */
  sendFlightUpdate(flightUpdate: Partial<FlightUpdatePayload>): boolean {
    return this.send('flights', {
      type: 'flight_status_update',
      payload: {
        ...flightUpdate,
        timestamp: Date.now()
      }
    })
  }

  /**
   * Send user activity ping
   */
  sendUserActivity(userId: string | number, page: string, action?: string): boolean {
    return this.send('notifications', {
      type: 'user_activity',
      payload: {
        userId,
        page,
        action,
        timestamp: Date.now()
      } as UserActivityPayload
    })
  }

  /**
   * Subscribe to specific flight tracking
   */
  async subscribeToFlightTracking(
    flightNumber: string,
    onUpdate: (data: FlightUpdatePayload) => void,
    date?: string
  ): Promise<WebSocket> {
    const endpoint = `flight-tracking/${flightNumber}${date ? `?date=${date}` : ''}`

    return this.connect(endpoint, {
      onMessage: (data: WebSocketMessage) => {
        if (data.type === 'flight_update') {
          onUpdate(data.payload as FlightUpdatePayload)
        }
      },
      autoReconnect: true,
      heartbeat: true
    })
  }

  /**
   * Subscribe to airline-specific updates
   */
  async subscribeToAirlineUpdates(
    airlineId: number,
    onUpdate: (data: FlightUpdatePayload) => void
  ): Promise<WebSocket> {
    return this.connect(`airline/${airlineId}`, {
      onMessage: (data: WebSocketMessage) => {
        if (data.type === 'flight_update') {
          onUpdate(data.payload as FlightUpdatePayload)
        }
      },
      onOpen: () => {
        this.send(`airline/${airlineId}`, {
          type: 'subscribe',
          filters: { airlineIds: [airlineId] }
        })
      },
      autoReconnect: true,
      heartbeat: true
    })
  }

  /**
   * Subscribe to route-specific updates
   */
  async subscribeToRouteUpdates(
    originAirportId: number,
    destinationAirportId: number,
    onUpdate: (data: FlightUpdatePayload) => void
  ): Promise<WebSocket> {
    const endpoint = `route/${originAirportId}-${destinationAirportId}`

    return this.connect(endpoint, {
      onMessage: (data: WebSocketMessage) => {
        if (data.type === 'flight_update') {
          onUpdate(data.payload as FlightUpdatePayload)
        }
      },
      onOpen: () => {
        this.send(endpoint, {
          type: 'subscribe',
          filters: {
            originAirportIds: [originAirportId],
            destinationAirportIds: [destinationAirportId]
          }
        })
      },
      autoReconnect: true,
      heartbeat: true
    })
  }

  /**
   * Broadcast message to specific endpoint
   */
  broadcast(endpoint: string, message: Omit<WebSocketMessage, 'timestamp'>): boolean {
    return this.send(endpoint, {
      ...message,
      timestamp: Date.now()
    })
  }

  /**
   * Get connection health status
   */
  getConnectionHealth(): {
    totalConnections: number
    activeConnections: number
    reconnectingConnections: number
    healthyConnections: number
    averageLatency: number
  } {
    const now = Date.now()
    let activeCount = 0
    let reconnectingCount = 0
    let healthyCount = 0
    let totalLatency = 0

    for (const [connectionId, connection] of this.connections) {
      if (connection.isConnected) {
        activeCount++
        const latency = now - connection.lastActivity
        totalLatency += latency

        if (latency < 30000) { // Healthy if last activity within 30 seconds
          healthyCount++
        }
      } else if (this.reconnectAttempts.has(connectionId)) {
        reconnectingCount++
      }
    }

    return {
      totalConnections: this.connections.size,
      activeConnections: activeCount,
      reconnectingConnections: reconnectingCount,
      healthyConnections: healthyCount,
      averageLatency: activeCount > 0 ? totalLatency / activeCount : 0
    }
  }

  /**
   * Set connection options globally
   */
  setGlobalOptions(options: Partial<{
    maxReconnectAttempts: number
    reconnectDelay: number
    heartbeatInterval: number
  }>): void {
    if (options.maxReconnectAttempts !== undefined) {
      (this as any).maxReconnectAttempts = options.maxReconnectAttempts
    }
    if (options.reconnectDelay !== undefined) {
      (this as any).reconnectDelay = options.reconnectDelay
    }
    if (options.heartbeatInterval !== undefined) {
      (this as any).heartbeatInterval = options.heartbeatInterval
    }
  }
}

// Create singleton instance
export const websocketService = new WebSocketService()

// Export types for external use
export type {
  WebSocketOptions,
  WebSocketMessage,
  MessageType,
  FlightSubscriptionFilters,
  FlightUpdatePayload,
  SystemStatusPayload,
  KpiUpdatePayload,
  ChartUpdatePayload,
  NotificationPayload,
  UserActivityPayload,
  ActiveConnection
}

// Export class for testing
export { WebSocketService }

// Export default instance
export default websocketService
