import WebSocket, { WebSocketServer } from 'ws';
import { IncomingMessage } from 'http';
import { verifyToken } from '../utils/jwt';
import { WebSocketMessage } from '../types';
import logger from '../utils/logger';

interface ConnectedClient {
  ws: WebSocket;
  userId?: string;
  venueIds: Set<string>;
  isAlive: boolean;
}

const clients = new Map<string, ConnectedClient>();
let wss: WebSocketServer | null = null;

export const WebSocketService = {
  initialize(server: import('http').Server): WebSocketServer {
    wss = new WebSocketServer({ server, path: '/ws' });

    wss.on('connection', (ws: WebSocket, req: IncomingMessage) => {
      const clientId = require('uuid').v4() as string;
      const client: ConnectedClient = {
        ws,
        venueIds: new Set(),
        isAlive: true,
      };
      clients.set(clientId, client);
      logger.info(`WebSocket client connected: ${clientId}`);

      const token = new URL(req.url ?? '/', `http://${req.headers.host}`).searchParams.get('token');
      if (token) {
        try {
          const payload = verifyToken(token);
          client.userId = payload.userId;
        } catch {
          logger.warn(`WebSocket: invalid token from client ${clientId}`);
        }
      }

      ws.on('pong', () => {
        client.isAlive = true;
      });

      ws.on('message', (data: WebSocket.RawData) => {
        try {
          const message = JSON.parse(data.toString()) as WebSocketMessage;
          WebSocketService.handleMessage(clientId, client, message);
        } catch {
          logger.warn(`WebSocket: invalid message from client ${clientId}`);
        }
      });

      ws.on('close', () => {
        clients.delete(clientId);
        logger.info(`WebSocket client disconnected: ${clientId}`);
      });

      ws.on('error', (err) => {
        logger.error(`WebSocket client error ${clientId}:`, err.message);
        clients.delete(clientId);
      });

      ws.send(JSON.stringify({
        type: 'pong',
        payload: { message: 'Connected to SVES WebSocket' },
        timestamp: new Date().toISOString(),
      }));
    });

    const heartbeat = setInterval(() => {
      clients.forEach((client, id) => {
        if (!client.isAlive) {
          client.ws.terminate();
          clients.delete(id);
          return;
        }
        client.isAlive = false;
        client.ws.ping();
      });
    }, 30000);

    wss.on('close', () => clearInterval(heartbeat));

    return wss;
  },

  handleMessage(
    clientId: string,
    client: ConnectedClient,
    message: WebSocketMessage
  ): void {
    switch (message.type) {
      case 'ping':
        client.ws.send(JSON.stringify({
          type: 'pong',
          payload: {},
          timestamp: new Date().toISOString(),
        }));
        break;

      default:
        if (message.venueId) {
          client.venueIds.add(message.venueId);
          logger.debug(`Client ${clientId} subscribed to venue ${message.venueId}`);
        }
        break;
    }
  },

  broadcastToVenue(venueId: string, message: WebSocketMessage): void {
    const payload = JSON.stringify(message);
    let sent = 0;

    clients.forEach((client) => {
      if (
        client.venueIds.has(venueId) &&
        client.ws.readyState === WebSocket.OPEN
      ) {
        client.ws.send(payload);
        sent++;
      }
    });

    logger.debug(`WebSocket: broadcast to venue ${venueId}: ${sent} clients`);
  },

  broadcastToUser(userId: string, message: WebSocketMessage): void {
    const payload = JSON.stringify(message);

    clients.forEach((client) => {
      if (
        client.userId === userId &&
        client.ws.readyState === WebSocket.OPEN
      ) {
        client.ws.send(payload);
      }
    });
  },

  broadcast(message: WebSocketMessage): void {
    const payload = JSON.stringify(message);
    clients.forEach((client) => {
      if (client.ws.readyState === WebSocket.OPEN) {
        client.ws.send(payload);
      }
    });
  },

  getConnectedCount(): number {
    return clients.size;
  },

  getServer(): WebSocketServer | null {
    return wss;
  },
};
