import { io, Socket } from 'socket.io-client';
import { store } from '../store';
import { updateQueueRealtime } from '../store/slices/queueSlice';
import { updateSensorReading } from '../store/slices/sensorSlice';
import { updateVenueOccupancy } from '../store/slices/venueSlice';

const WS_URL = process.env.REACT_APP_WS_URL || 'http://localhost:3000';

type EventCallback = (...args: unknown[]) => void;

class WebSocketService {
  private socket: Socket | null = null;
  private reconnectAttempts = 0;
  private readonly maxReconnectAttempts = 5;
  private listeners: Map<string, EventCallback[]> = new Map();

  connect(token: string): void {
    if (this.socket?.connected) return;

    this.socket = io(WS_URL, {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: this.maxReconnectAttempts,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
    });

    this.socket.on('connect', () => {
      this.reconnectAttempts = 0;
      console.info('[WS] Connected:', this.socket?.id);
    });

    this.socket.on('disconnect', (reason) => {
      console.warn('[WS] Disconnected:', reason);
    });

    this.socket.on('connect_error', (err) => {
      this.reconnectAttempts++;
      console.error('[WS] Connection error:', err.message);
    });

    // Queue real-time events
    this.socket.on('queue:update', (data) => {
      store.dispatch(updateQueueRealtime(data));
    });

    this.socket.on('queue:joined', (data) => {
      store.dispatch(updateQueueRealtime(data));
      this.emit('queue:joined', data);
    });

    this.socket.on('queue:called', (data) => {
      this.emit('queue:called', data);
    });

    // Sensor real-time events
    this.socket.on('sensor:reading', (data) => {
      store.dispatch(updateSensorReading(data));
    });

    this.socket.on('sensor:alert', (data) => {
      this.emit('sensor:alert', data);
    });

    // Venue occupancy events
    this.socket.on('venue:occupancy', (data) => {
      store.dispatch(updateVenueOccupancy(data));
    });

    // Alert events
    this.socket.on('alert:new', (data) => {
      this.emit('alert:new', data);
    });

    // Register all buffered listeners
    this.listeners.forEach((callbacks, event) => {
      callbacks.forEach((cb) => this.socket?.on(event, cb));
    });
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  joinRoom(room: string): void {
    this.socket?.emit('join:room', room);
  }

  leaveRoom(room: string): void {
    this.socket?.emit('leave:room', room);
  }

  subscribeToVenue(venueId: string): void {
    this.joinRoom(`venue:${venueId}`);
  }

  subscribeToQueue(queueId: string): void {
    this.joinRoom(`queue:${queueId}`);
  }

  unsubscribeFromQueue(queueId: string): void {
    this.leaveRoom(`queue:${queueId}`);
  }

  on(event: string, callback: EventCallback): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event)!.push(callback);
    this.socket?.on(event, callback);
  }

  off(event: string, callback: EventCallback): void {
    const callbacks = this.listeners.get(event) ?? [];
    this.listeners.set(
      event,
      callbacks.filter((cb) => cb !== callback)
    );
    this.socket?.off(event, callback);
  }

  private emit(event: string, data: unknown): void {
    const callbacks = this.listeners.get(event) ?? [];
    callbacks.forEach((cb) => cb(data));
  }

  get isConnected(): boolean {
    return this.socket?.connected ?? false;
  }

  get socketId(): string | undefined {
    return this.socket?.id;
  }
}

const websocketService = new WebSocketService();
export default websocketService;
