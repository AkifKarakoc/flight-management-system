import SockJS from 'sockjs-client';
import { Stomp } from '@stomp/stompjs';
import { useAuthStore } from '@/stores/auth';

const WS_ENDPOINT = 'http://localhost:8082/ws'; // API dokümanından

class WebSocketService {
  constructor() {
    this.stompClient = null;
    this.connectionPromise = null;
    this.subscriptions = new Map();
  }

  connect() {
    if (this.isConnected()) {
      return this.connectionPromise;
    }

    this.connectionPromise = new Promise((resolve, reject) => {
      const authStore = useAuthStore();
      const token = authStore.accessToken;

      if (!token) {
        console.error('WebSocket connection failed: No auth token found.');
        return reject(new Error('Authentication token is missing.'));
      }

      const socket = new SockJS(WS_ENDPOINT);
      this.stompClient = Stomp.over(socket);

      // STOMP client'ından gelen debug mesajlarını kapatmak için
      this.stompClient.debug = () => {};

      this.stompClient.connect(
        { Authorization: `Bearer ${token}` },
        () => {
          console.log('WebSocket connected successfully.');
          resolve();
        },
        (error) => {
          console.error('WebSocket connection error:', error);
          this.connectionPromise = null;
          reject(error);
        }
      );
    });

    return this.connectionPromise;
  }

  disconnect() {
    if (this.stompClient) {
      this.stompClient.disconnect(() => {
        console.log('WebSocket disconnected.');
      });
      this.stompClient = null;
      this.connectionPromise = null;
      this.subscriptions.clear();
    }
  }

  isConnected() {
    return this.stompClient && this.stompClient.connected;
  }

  async subscribe(topic, callback) {
    await this.connect();

    if (this.subscriptions.has(topic)) {
      console.warn(`Already subscribed to topic: ${topic}`);
      return;
    }

    const subscription = this.stompClient.subscribe(topic, (message) => {
      try {
        const parsedMessage = JSON.parse(message.body);
        callback(parsedMessage);
      } catch (e) {
        console.error('Error parsing WebSocket message:', e);
        callback(message.body);
      }
    });

    this.subscriptions.set(topic, subscription);
    console.log(`Subscribed to ${topic}`);
  }

  unsubscribe(topic) {
    if (this.subscriptions.has(topic)) {
      this.subscriptions.get(topic).unsubscribe();
      this.subscriptions.delete(topic);
      console.log(`Unsubscribed from ${topic}`);
    }
  }
}

// Singleton instance oluşturuyoruz
export const websocketService = new WebSocketService();
