import { useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_API_URL || '';

export interface Queue {
  id: string;
  facilityId: string;
  facilityName: string;
  type: 'restroom' | 'food' | 'merch' | 'firstaid';
  currentSize: number;
  maxSize: number;
  waitMinutes: number;
  status: 'low' | 'medium' | 'high';
  icon: string;
}

export interface HeatmapZone {
  id: string;
  sectionId: string;
  name: string;
  density: number;
  level: 'low' | 'medium' | 'high';
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface Alert {
  id: string;
  type: 'warning' | 'info' | 'critical';
  message: string;
  section: string;
  timestamp: string;
}

export interface SocketState {
  connected: boolean;
  queues: Queue[];
  heatmap: HeatmapZone[];
  alerts: Alert[];
}

export function useSocket() {
  const socketRef = useRef<Socket | null>(null);
  const [state, setState] = useState<SocketState>({
    connected: false,
    queues: [],
    heatmap: [],
    alerts: [],
  });

  useEffect(() => {
    const socket = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
    });
    socketRef.current = socket;

    socket.on('connect', () => {
      setState((prev) => ({ ...prev, connected: true }));
    });

    socket.on('disconnect', () => {
      setState((prev) => ({ ...prev, connected: false }));
    });

    socket.on('init', (data: { queues: Queue[]; heatmap: HeatmapZone[]; alerts: Alert[] }) => {
      setState((prev) => ({
        ...prev,
        queues: data.queues,
        heatmap: data.heatmap,
        alerts: data.alerts,
      }));
    });

    socket.on('queue:update', (data: { queues: Queue[] }) => {
      setState((prev) => ({ ...prev, queues: data.queues }));
    });

    socket.on('heatmap:update', (data: { heatmap: HeatmapZone[] }) => {
      setState((prev) => ({ ...prev, heatmap: data.heatmap }));
    });

    socket.on('alert:new', (data: { alert: Alert; alerts: Alert[] }) => {
      setState((prev) => ({ ...prev, alerts: data.alerts }));
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  return { ...state, socket: socketRef.current };
}
