/**
 * WebSocket Service for Real-time Flight Management
 * Handles real-time updates for flights, system status, and notifications
 */

class WebSocketService {
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
   * @param {string} endpoint - WebSocket endpoint path
   * @param {Object} options - Connection options
   * @returns {Promise<WebSocket>}
   */
  async connect(endpoint, options = {}) {
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

      return new Promise((resolve, reject) => {
        socket.onopen = (event) => {
          console.log(`WebSocket connected: ${endpoint}`)
          this.connections.get(connectionId).isConnected = true
          this.resetReconnectAttempts(connectionId)

          if (heartbeat) {
            this.startHeartbeat(connectionId)
          }

          onOpen(event)
          resolve(socket)
        }

        socket.onmessage = (event) => {
          this.updateLastActivity(connectionId)

          try {
            const data = JSON.parse(event.data)

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
            onError(error)
          }
        }

        socket.onerror = (error) => {
          console.error(`WebSocket error: ${endpoint}`, error)
          onError(error)
          reject(error)
        }

        socket.onclose = (event) => {
          console.log(`WebSocket closed: ${endpoint}`, event.code, event.reason)
          this.connections.get(connectionId).isConnected = false
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
   * @param {string} endpoint - Connection endpoint
   * @param {Object} message - Message to send
   */
  send(endpoint, message) {
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
   * @param {string} endpoint - Connection endpoint
   */
  disconnect(endpoint) {
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
  disconnectAll() {
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
   * @param {string} endpoint - Connection endpoint
   * @returns {boolean}
   */
  isConnected(endpoint) {
    const connectionId = this.generateConnectionId(endpoint)
    const connection = this.connections.get(connectionId)
    return connection && connection.isConnected
  }

  /**
   * Get all active connections
   * @returns {Array}
   */
  getActiveConnections() {
    const active = []
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
   * Build WebSocket URL from endpoint
   * @param {string} endpoint - Endpoint path
   * @returns {string}
   */
  buildWebSocketUrl(endpoint) {
    // WebSocket backend'ler hazır - Flight Service 8082'de WebSocket var
    const host = 'localhost:8082'
    return `ws://${host}/ws/${endpoint}`
  }

  /**
   * Generate unique connection ID
   * @param {string} endpoint - Endpoint path
   * @returns {string}
   */
  generateConnectionId(endpoint) {
    return `ws_${endpoint.replace(/[^a-zA-Z0-9]/g, '_')}`
  }

  /**
   * Schedule reconnection attempt
   * @param {string} connectionId - Connection ID
   */
  scheduleReconnect(connectionId) {
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
   * @param {string} connectionId - Connection ID
   */
  resetReconnectAttempts(connectionId) {
    this.reconnectAttempts.delete(connectionId)
  }

  /**
   * Start heartbeat for connection
   * @param {string} connectionId - Connection ID
   */
  startHeartbeat(connectionId) {
    const connection = this.connections.get(connectionId)
    if (!connection) return

    const timer = setInterval(() => {
      if (connection.isConnected) {
        this.send(connection.endpoint, { type: 'ping', timestamp: Date.now() })
      } else {
        this.stopHeartbeat(connectionId)
      }
    }, this.heartbeatInterval)

    this.heartbeatTimers.set(connectionId, timer)
  }

  /**
   * Stop heartbeat for connection
   * @param {string} connectionId - Connection ID
   */
  stopHeartbeat(connectionId) {
    const timer = this.heartbeatTimers.get(connectionId)
    if (timer) {
      clearInterval(timer)
      this.heartbeatTimers.delete(connectionId)
    }
  }

  /**
   * Send pong response
   * @param {WebSocket} socket - WebSocket instance
   */
  sendPong(socket) {
    if (socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify({ type: 'pong', timestamp: Date.now() }))
    }
  }

  /**
   * Update last activity timestamp
   * @param {string} connectionId - Connection ID
   */
  updateLastActivity(connectionId) {
    const connection = this.connections.get(connectionId)
    if (connection) {
      connection.lastActivity = Date.now()
    }
  }

  /**
   * Handle online event
   */
  handleOnline() {
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
  handleOffline() {
    console.log('Device is offline, WebSocket connections will be paused')
    this.isOnline = false
  }

  /**
   * Subscribe to flight updates
   * @param {Function} onUpdate - Update callback
   * @param {Object} filters - Subscription filters
   * @returns {Promise<WebSocket>}
   */
  async subscribeToFlightUpdates(onUpdate, filters = {}) {
    return this.connect('flights', {
      onMessage: (data) => {
        if (data.type === 'flight_update') {
          onUpdate(data.payload)
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
   * @param {Function} onUpdate - Update callback
   * @returns {Promise<WebSocket>}
   */
  async subscribeToSystemStatus(onUpdate) {
    return this.connect('system', {
      onMessage: (data) => {
        if (data.type === 'system_status') {
          onUpdate(data.payload)
        }
      },
      autoReconnect: true,
      heartbeat: true
    })
  }

  /**
   * Subscribe to notifications
   * @param {Function} onNotification - Notification callback
   * @param {string} userId - User ID for personal notifications
   * @returns {Promise<WebSocket>}
   */
  async subscribeToNotifications(onNotification, userId = null) {
    return this.connect('notifications', {
      onMessage: (data) => {
        if (data.type === 'notification') {
          onNotification(data.payload)
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
   * @param {Function} onUpdate - Update callback
   * @returns {Promise<WebSocket>}
   */
  async subscribeToDashboardUpdates(onUpdate) {
    return this.connect('dashboard', {
      onMessage: (data) => {
        if (data.type === 'kpi_update' || data.type === 'chart_update') {
          onUpdate(data.payload)
        }
      },
      autoReconnect: true,
      heartbeat: true
    })
  }

  /**
   * Send flight status update
   * @param {Object} flightUpdate - Flight update data
   */
  sendFlightUpdate(flightUpdate) {
    return this.send('flights', {
      type: 'flight_status_update',
      payload: flightUpdate
    })
  }

  /**
   * Send user activity ping
   * @param {string} userId - User ID
   * @param {string} page - Current page
   */
  sendUserActivity(userId, page) {
    return this.send('notifications', {
      type: 'user_activity',
      payload: {
        userId,
        page,
        timestamp: Date.now()
      }
    })
  }
}

// Create singleton instance
export const websocketService = new WebSocketService()

// Export class for testing
export { WebSocketService }

// Export default instance
export default websocketService
