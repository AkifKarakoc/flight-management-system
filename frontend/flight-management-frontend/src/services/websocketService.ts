/**
 * WebSocket Service for Real-time Flight Management
 * Handles real-time updates for flights, system status, and notifications
 * Updated to support STOMP protocol with SockJS fallback
 */
if (typeof (globalThis as any).global === 'undefined') {
  (globalThis as any).global = globalThis;
}

import { useAuthStore } from '@/stores/auth'
import { Client, StompConfig, type Frame } from '@stomp/stompjs'
import SockJS from 'sockjs-client'
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
  | 'STATUS_CHANGE'
  | 'CREATE'
  | 'UPDATE'
  | 'DELETE'
  | 'BULK_UPDATE'
  | 'SUBSCRIPTION_CONFIRMED'
  | 'SPECIFIC_SUBSCRIPTION_CONFIRMED'
  | 'PONG'

// WebSocket connection options interface
interface WebSocketOptions {
  onMessage?: (data: any) => void
  onError?: (error: Event | Frame) => void
  onOpen?: (event: Event | Frame) => void
  onClose?: (event: CloseEvent | Frame) => void
  autoReconnect?: boolean
  heartbeat?: boolean
}

// WebSocket message structure
interface WebSocketMessage {
  type: MessageType
  entity?: string
  payload?: any
  data?: any
  timestamp?: number
  userId?: string | number
  filters?: any
  entityId?: number
  flightNumber?: string
  status?: string
}

// Connection info interface
interface ConnectionInfo {
  client: Client
  endpoint: string
  options: WebSocketOptions
  isConnected: boolean
  lastActivity: number
  subscriptions: Map<string, any>
}

// Active connection interface
interface ActiveConnection {
  id: string
  endpoint: string
  lastActivity: number
  subscriptions: string[]
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
   * Create a new STOMP WebSocket connection
   */
  async connect(endpoint: string, options: WebSocketOptions = {}): Promise<Client> {
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

    console.log(`Attempting to connect to: ${wsUrl}`)

    try {
      const stompConfig: StompConfig = {
        webSocketFactory: () => new SockJS(wsUrl),
        reconnectDelay: this.reconnectDelay,
        heartbeatIncoming: heartbeat ? 4000 : 0,
        heartbeatOutgoing: heartbeat ? 4000 : 0,
        onConnect: (frame: Frame) => {
          console.log(`STOMP Connected to: ${endpoint}`, frame)
          const connection = this.connections.get(connectionId)
          if (connection) {
            connection.isConnected = true
            connection.lastActivity = Date.now()
          }
          this.resetReconnectAttempts(connectionId)
          this.setupSubscriptions(connectionId, endpoint)
          onOpen(frame)
        },
        onStompError: (frame: Frame) => {
          console.error(`STOMP Error for ${endpoint}:`, frame)
          onError(frame)
        },
        onWebSocketError: (error: Event) => {
          console.error(`WebSocket Error for ${endpoint}:`, error)
          onError(error)
        },
        onWebSocketClose: (event: CloseEvent) => {
          console.log(`WebSocket closed for ${endpoint}:`, event)
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
      }

      const client = new Client(stompConfig)

      // Store connection info
      this.connections.set(connectionId, {
        client,
        endpoint,
        options: { ...options, onMessage },
        isConnected: false,
        lastActivity: Date.now(),
        subscriptions: new Map()
      })

      return new Promise<Client>((resolve, reject) => {
        const originalOnConnect = stompConfig.onConnect
        const originalOnStompError = stompConfig.onStompError

        stompConfig.onConnect = (frame: Frame) => {
          originalOnConnect?.(frame)
          resolve(client)
        }

        stompConfig.onStompError = (frame: Frame) => {
          originalOnStompError?.(frame)
          reject(new Error(`STOMP connection failed: ${frame.headers['message'] || 'Unknown error'}`))
        }

        // Add connection timeout
        const timeout = setTimeout(() => {
          if (!client.connected) {
            client.deactivate()
            reject(new Error(`Connection timeout for ${endpoint}`))
          }
        }, 10000)

        client.onConnect = (frame: Frame) => {
          clearTimeout(timeout)
          stompConfig.onConnect?.(frame)
        }

        client.activate()
      })
    } catch (error) {
      console.error(`Failed to create STOMP connection: ${endpoint}`, error)
      throw error
    }
  }

  /**
   * Setup default subscriptions for endpoint
   */
  private setupSubscriptions(connectionId: string, endpoint: string): void {
    const connection = this.connections.get(connectionId)
    if (!connection || !connection.client.connected) return

    const client = connection.client
    const onMessage = connection.options.onMessage

    try {
      // Subscribe based on endpoint type
      const endpointType = endpoint.split('/')[0]

      switch (endpointType) {
        case 'flights':
        case 'dashboard':
        case 'flight-tracking':
          // Subscribe to flight-related topics
          this.subscribeToTopic(connectionId, '/topic/flights', onMessage)
          this.subscribeToTopic(connectionId, '/topic/flights/status', onMessage)
          this.subscribeToTopic(connectionId, '/topic/updates', onMessage)
          this.subscribeToTopic(connectionId, '/topic/flights/bulk', onMessage)
          break

        case 'notifications':
          // Subscribe to notification topics
          this.subscribeToTopic(connectionId, '/topic/notifications', onMessage)
          this.subscribeToTopic(connectionId, '/topic/alerts', onMessage)
          break

        case 'system':
          // Subscribe to system status topics
          this.subscribeToTopic(connectionId, '/topic/system/status', onMessage)
          this.subscribeToTopic(connectionId, '/topic/system/health', onMessage)
          break

        case 'airline':
        case 'route':
          // Subscribe to reference data topics
          this.subscribeToTopic(connectionId, '/topic/airlines', onMessage)
          this.subscribeToTopic(connectionId, '/topic/routes', onMessage)
          this.subscribeToTopic(connectionId, '/topic/airports', onMessage)
          break

        case 'archive':
          // Subscribe to archive topics
          this.subscribeToTopic(connectionId, '/topic/archive', onMessage)
          break
      }

      // Send initial subscription message
      this.sendSubscriptionMessage(connectionId, endpoint)

    } catch (error) {
      console.error(`Failed to setup subscriptions for ${endpoint}:`, error)
    }
  }

  /**
   * Subscribe to specific STOMP topic
   */
  private subscribeToTopic(connectionId: string, topic: string, onMessage?: (data: any) => void): void {
    const connection = this.connections.get(connectionId)
    if (!connection || !connection.client.connected) return

    try {
      const subscription = connection.client.subscribe(topic, (message) => {
        this.updateLastActivity(connectionId)

        try {
          const data = JSON.parse(message.body)
          console.log(`Received message from ${topic}:`, data)
          onMessage?.(data)
        } catch (error) {
          console.error(`Error parsing message from ${topic}:`, error)
        }
      })

      connection.subscriptions.set(topic, subscription)
      console.log(`Subscribed to topic: ${topic}`)
    } catch (error) {
      console.error(`Failed to subscribe to topic ${topic}:`, error)
    }
  }

  /**
   * Send subscription message to backend
   */
  private sendSubscriptionMessage(connectionId: string, endpoint: string): void {
    const connection = this.connections.get(connectionId)
    if (!connection || !connection.client.connected) return

    try {
      const endpointType = endpoint.split('/')[0]

      switch (endpointType) {
        case 'flights':
        case 'dashboard':
        case 'flight-tracking':
          connection.client.publish({
            destination: '/app/flights/subscribe',
            body: JSON.stringify({
              type: 'SUBSCRIBE',
              entity: 'FLIGHT',
              timestamp: new Date().toISOString(),
              filters: {}
            })
          })
          break

        case 'notifications':
          connection.client.publish({
            destination: '/app/notifications/subscribe',
            body: JSON.stringify({
              type: 'SUBSCRIBE',
              entity: 'NOTIFICATION',
              timestamp: new Date().toISOString()
            })
          })
          break
      }
    } catch (error) {
      console.error(`Failed to send subscription message for ${endpoint}:`, error)
    }
  }

  /**
   * Send message through STOMP connection
   */
  send(endpoint: string, message: WebSocketMessage): boolean {
    const connectionId = this.generateConnectionId(endpoint)
    const connection = this.connections.get(connectionId)

    if (!connection || !connection.client.connected) {
      console.warn(`STOMP client not connected: ${endpoint}`)
      return false
    }

    try {
      const destination = this.getDestinationForMessage(endpoint, message.type)
      const messageBody = JSON.stringify({
        ...message,
        timestamp: message.timestamp || new Date().toISOString()
      })

      connection.client.publish({
        destination,
        body: messageBody
      })

      this.updateLastActivity(connectionId)
      console.log(`Sent message to ${destination}:`, message)
      return true
    } catch (error) {
      console.error(`Failed to send STOMP message: ${endpoint}`, error)
      return false
    }
  }

  /**
   * Get destination path for message type
   */
  private getDestinationForMessage(endpoint: string, messageType: MessageType): string {
    const endpointType = endpoint.split('/')[0]

    switch (endpointType) {
      case 'flights':
      case 'dashboard':
      case 'flight-tracking':
        if (messageType === 'subscribe') {
          return '/app/flights/subscribe'
        }
        if (messageType === 'ping') {
          return '/app/flights/ping'
        }
        return '/app/flights/update'

      case 'notifications':
        return '/app/notifications/send'

      case 'system':
        return '/app/system/update'

      default:
        return '/app/general'
    }
  }

  /**
   * Close STOMP connection
   */
  disconnect(endpoint: string): void {
    const connectionId = this.generateConnectionId(endpoint)
    const connection = this.connections.get(connectionId)

    if (connection) {
      this.stopHeartbeat(connectionId)

      // Unsubscribe from all topics
      for (const [topic, subscription] of connection.subscriptions) {
        try {
          subscription.unsubscribe()
          console.log(`Unsubscribed from topic: ${topic}`)
        } catch (error) {
          console.error(`Error unsubscribing from topic ${topic}:`, error)
        }
      }
      connection.subscriptions.clear()

      // Disconnect STOMP client
      if (connection.client.connected) {
        connection.client.deactivate()
      }

      this.connections.delete(connectionId)
      console.log(`Disconnected from: ${endpoint}`)
    }
  }

  private getAuthToken(): string {
    // localStorage'dan direkt token al
    const token = localStorage.getItem('token') || localStorage.getItem('auth_token') || localStorage.getItem('authToken')

    if (!token) {
      console.warn('No authentication token found for WebSocket connection')
      return ''
    }

    console.log('Using token for WebSocket:', token.substring(0, 20) + '...')
    return token
  }

  /**
   * Close all STOMP connections
   */
  disconnectAll(): void {
    for (const [connectionId, connection] of this.connections) {
      this.stopHeartbeat(connectionId)

      // Unsubscribe from all topics
      for (const [topic, subscription] of connection.subscriptions) {
        try {
          subscription.unsubscribe()
        } catch (error) {
          console.error(`Error unsubscribing from topic ${topic}:`, error)
        }
      }

      if (connection.client.connected) {
        connection.client.deactivate()
      }
    }
    this.connections.clear()
    console.log('All STOMP connections disconnected')
  }

  /**
   * Get connection status
   */
  isConnected(endpoint: string): boolean {
    const connectionId = this.generateConnectionId(endpoint)
    const connection = this.connections.get(connectionId)
    return connection ? connection.isConnected && connection.client.connected : false
  }

  /**
   * Get all active connections
   */
  getActiveConnections(): ActiveConnection[] {
    const active: ActiveConnection[] = []
    for (const [connectionId, connection] of this.connections) {
      if (connection.isConnected && connection.client.connected) {
        active.push({
          id: connectionId,
          endpoint: connection.endpoint,
          lastActivity: connection.lastActivity,
          subscriptions: Array.from(connection.subscriptions.keys())
        })
      }
    }
    return active
  }

  /**
   * Build WebSocket URL for STOMP connection
   */
  private buildWebSocketUrl(endpoint: string): string {
    const protocol = window.location.protocol === 'https:' ? 'https:' : 'http:'
    const endpointType = endpoint.split('/')[0]

    const SERVICE_PORTS: { [key: string]: string } = {
      'notifications': '8081',
      'system': '8081',
      'airline': '8081',
      'route': '8081',
      'flights': '8082',
      'dashboard': '8082',
      'flight-tracking': '8082',
      'archive': '8083'
    }

    const port = SERVICE_PORTS[endpointType] || '8082'
    const token = this.getAuthToken()
    return `${protocol}//localhost:${port}/ws?token=${encodeURIComponent(token)}`
  }

  /**
   * Generate unique connection ID
   */
  private generateConnectionId(endpoint: string): string {
    return `stomp_${endpoint.replace(/[^a-zA-Z0-9]/g, '_')}`
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

    const delay = this.reconnectDelay * Math.pow(2, attempts)
    console.log(`Scheduling STOMP reconnection attempt ${attempts + 1} for ${connection.endpoint} in ${delay}ms`)

    setTimeout(async () => {
      if (!this.isOnline) {
        console.log('Device is offline, skipping reconnection attempt')
        return
      }

      try {
        this.reconnectAttempts.set(connectionId, attempts + 1)
        await this.connect(connection.endpoint, connection.options)
      } catch (error) {
        console.error(`STOMP reconnection failed for ${connection.endpoint}:`, error)
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
      if (connection.isConnected && connection.client.connected) {
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
    console.log('Device is back online, reconnecting STOMP clients...')
    this.isOnline = true

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
    console.log('Device is offline, STOMP connections will be paused')
    this.isOnline = false
  }

  /**
   * Subscribe to flight updates with STOMP
   */
  async subscribeToFlightUpdates(
    onUpdate: (data: FlightUpdatePayload) => void,
    filters: FlightSubscriptionFilters = {}
  ): Promise<Client> {
    return this.connect('flights', {
      onMessage: (data: WebSocketMessage) => {
        if (data.type === 'flight_update' || data.type === 'UPDATE' || data.type === 'STATUS_CHANGE') {
          onUpdate(data.data as FlightUpdatePayload)
        }
      },
      onOpen: () => {
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
  ): Promise<Client> {
    return this.connect('system', {
      onMessage: (data: WebSocketMessage) => {
        if (data.type === 'system_status') {
          onUpdate(data.data as SystemStatusPayload)
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
  ): Promise<Client> {
    return this.connect('notifications', {
      onMessage: (data: WebSocketMessage) => {
        if (data.type === 'notification') {
          onNotification(data.data as NotificationPayload)
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
  ): Promise<Client> {
    return this.connect('dashboard', {
      onMessage: (data: WebSocketMessage) => {
        if (data.type === 'kpi_update' || data.type === 'chart_update') {
          onUpdate(data.data as KpiUpdatePayload | ChartUpdatePayload)
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
      data: {
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
      data: {
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
  ): Promise<Client> {
    const endpoint = `flight-tracking/${flightNumber}${date ? `?date=${date}` : ''}`

    return this.connect(endpoint, {
      onMessage: (data: WebSocketMessage) => {
        if (data.type === 'flight_update' || data.type === 'STATUS_CHANGE') {
          onUpdate(data.data as FlightUpdatePayload)
        }
      },
      onOpen: () => {
        this.send(endpoint, {
          type: 'subscribe',
          flightNumber: flightNumber,
          filters: { flightNumbers: [flightNumber] }
        })
      },
      autoReconnect: true,
      heartbeat: true
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
      if (connection.isConnected && connection.client.connected) {
        activeCount++
        const latency = now - connection.lastActivity
        totalLatency += latency

        if (latency < 30000) {
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
   * Broadcast message to specific endpoint
   */
  broadcast(endpoint: string, message: Omit<WebSocketMessage, 'timestamp'>): boolean {
    return this.send(endpoint, {
      ...message,
      timestamp: Date.now()
    })
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
  ActiveConnection,
  ConnectionInfo
}

// Export class for testing
export { WebSocketService }

// Export default instance
export default websocketService
