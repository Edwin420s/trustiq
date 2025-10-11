import { WebSocketServer, WebSocket } from 'ws';
import { Server } from 'http';
import { verifyJWT } from '../lib/auth';

interface Client {
  ws: WebSocket;
  userId: string;
  sessionId: string;
}

export class WebSocketService {
  private wss: WebSocketServer;
  private clients: Map<string, Client> = new Map();

  constructor(server: Server) {
    this.wss = new WebSocketServer({ 
      server,
      path: '/ws'
    });

    this.setupWebSocketServer();
  }

  private setupWebSocketServer() {
    this.wss.on('connection', (ws: WebSocket, request) => {
      console.log('New WebSocket connection attempt');

      // Extract token from query parameters
      const url = new URL(request.url!, `http://${request.headers.host}`);
      const token = url.searchParams.get('token');

      if (!token) {
        ws.close(1008, 'Authentication required');
        return;
      }

      try {
        const decoded = verifyJWT(token);
        const clientId = this.generateClientId();
        
        const client: Client = {
          ws,
          userId: decoded.id,
          sessionId: clientId,
        };

        this.clients.set(clientId, client);
        console.log(`Client connected: ${clientId} (User: ${decoded.id})`);

        // Send welcome message
        this.sendToClient(clientId, {
          type: 'connected',
          sessionId: clientId,
          timestamp: new Date().toISOString(),
        });

        // Handle messages
        ws.on('message', (data) => {
          this.handleMessage(clientId, data.toString());
        });

        // Handle disconnection
        ws.on('close', () => {
          this.handleDisconnection(clientId);
        });

        // Handle errors
        ws.on('error', (error) => {
          console.error('WebSocket error:', error);
          this.handleDisconnection(clientId);
        });

      } catch (error) {
        console.error('WebSocket authentication failed:', error);
        ws.close(1008, 'Invalid token');
      }
    });
  }

  private handleMessage(clientId: string, message: string) {
    try {
      const client = this.clients.get(clientId);
      if (!client) return;

      const data = JSON.parse(message);
      
      switch (data.type) {
        case 'ping':
          this.sendToClient(clientId, { type: 'pong', timestamp: new Date().toISOString() });
          break;
        
        case 'subscribe':
          this.handleSubscribe(clientId, data.channel);
          break;
        
        case 'unsubscribe':
          this.handleUnsubscribe(clientId, data.channel);
          break;
        
        default:
          console.log('Unknown message type:', data.type);
      }
    } catch (error) {
      console.error('Error handling WebSocket message:', error);
    }
  }

  private handleSubscribe(clientId: string, channel: string) {
    const client = this.clients.get(clientId);
    if (!client) return;

    console.log(`Client ${clientId} subscribed to ${channel}`);
    
    // In a real implementation, you would manage channel subscriptions
    this.sendToClient(clientId, {
      type: 'subscribed',
      channel,
      timestamp: new Date().toISOString(),
    });
  }

  private handleUnsubscribe(clientId: string, channel: string) {
    const client = this.clients.get(clientId);
    if (!client) return;

    console.log(`Client ${clientId} unsubscribed from ${channel}`);
    
    this.sendToClient(clientId, {
      type: 'unsubscribed',
      channel,
      timestamp: new Date().toISOString(),
    });
  }

  private handleDisconnection(clientId: string) {
    this.clients.delete(clientId);
    console.log(`Client disconnected: ${clientId}`);
  }

  private generateClientId(): string {
    return `client_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Public methods for sending messages
  public sendToClient(clientId: string, message: any) {
    const client = this.clients.get(clientId);
    if (client && client.ws.readyState === WebSocket.OPEN) {
      client.ws.send(JSON.stringify(message));
    }
  }

  public sendToUser(userId: string, message: any) {
    this.clients.forEach((client) => {
      if (client.userId === userId && client.ws.readyState === WebSocket.OPEN) {
        client.ws.send(JSON.stringify(message));
      }
    });
  }

  public broadcast(message: any) {
    this.clients.forEach((client) => {
      if (client.ws.readyState === WebSocket.OPEN) {
        client.ws.send(JSON.stringify(message));
      }
    });
  }

  public sendTrustScoreUpdate(userId: string, oldScore: number, newScore: number) {
    this.sendToUser(userId, {
      type: 'trust_score_updated',
      data: {
        oldScore,
        newScore,
        timestamp: new Date().toISOString(),
      },
    });
  }

  public sendAccountVerified(userId: string, provider: string) {
    this.sendToUser(userId, {
      type: 'account_verified',
      data: {
        provider,
        timestamp: new Date().toISOString(),
      },
    });
  }

  public sendBadgeMinted(userId: string, badgeType: string, transactionHash: string) {
    this.sendToUser(userId, {
      type: 'badge_minted',
      data: {
        badgeType,
        transactionHash,
        timestamp: new Date().toISOString(),
      },
    });
  }

  public getConnectedClientsCount(): number {
    return this.clients.size;
  }

  public getConnectedUsers(): string[] {
    const users = new Set<string>();
    this.clients.forEach(client => users.add(client.userId));
    return Array.from(users);
  }
}