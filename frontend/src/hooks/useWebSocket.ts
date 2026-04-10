import { useEffect, useRef, useCallback } from 'react';
import websocketService from '../services/websocket';
import { useAppSelector } from '../store';

type EventCallback = (...args: unknown[]) => void;

export const useWebSocket = () => {
  const accessToken = useAppSelector((state) => state.auth.accessToken);
  const isAuthenticated = useAppSelector((state) => state.auth.isAuthenticated);

  useEffect(() => {
    if (isAuthenticated && accessToken && !websocketService.isConnected) {
      websocketService.connect(accessToken);
    }
    return () => {
      // Keep connection alive across page changes
    };
  }, [isAuthenticated, accessToken]);

  const on = useCallback((event: string, callback: EventCallback) => {
    websocketService.on(event, callback);
    return () => websocketService.off(event, callback);
  }, []);

  const subscribeToVenue = useCallback((venueId: string) => {
    websocketService.subscribeToVenue(venueId);
  }, []);

  const subscribeToQueue = useCallback((queueId: string) => {
    websocketService.subscribeToQueue(queueId);
  }, []);

  const unsubscribeFromQueue = useCallback((queueId: string) => {
    websocketService.unsubscribeFromQueue(queueId);
  }, []);

  return {
    isConnected: websocketService.isConnected,
    on,
    subscribeToVenue,
    subscribeToQueue,
    unsubscribeFromQueue,
  };
};

export const useWebSocketEvent = (event: string, callback: EventCallback) => {
  const callbackRef = useRef(callback);
  callbackRef.current = callback;

  useEffect(() => {
    const handler: EventCallback = (...args) => callbackRef.current(...args);
    websocketService.on(event, handler);
    return () => websocketService.off(event, handler);
  }, [event]);
};
