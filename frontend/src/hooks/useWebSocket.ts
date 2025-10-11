import { useEffect, useRef, useState, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';

interface WebSocketMessage {
  type: string;
  data?: any;
  timestamp?: string;
}

export function useWebSocket() {
  const { user } = useAuth();
  const ws = useRef<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [lastMessage, setLastMessage] = useState<WebSocketMessage | null>(null);
  const [reconnectAttempts, setReconnectAttempts] = useState(0);
  const maxReconnectAttempts = 5;

  const connect = useCallback(() => {
    if (!user) return;

    const token = localStorage.getItem('trustiq_token');
    if (!token) return;

    try {
      const wsUrl = `ws://localhost:3001/ws?token=${token}`;
      ws.current = new WebSocket(wsUrl);

      ws.current.onopen = () => {
        console.log('WebSocket connected');
        setIsConnected(true);
        setReconnectAttempts(0);
      };

      ws.current.onclose = (event) => {
        console.log('WebSocket disconnected:', event.code, event.reason);
        setIsConnected(false);
        
        // Attempt reconnection
        if (reconnectAttempts < maxReconnectAttempts) {
          const timeout = Math.min(1000 * Math.pow(2, reconnectAttempts), 30000);
          setTimeout(() => {
            setReconnectAttempts(prev => prev + 1);
            connect();
          }, timeout);
        }
      };

      ws.current.onerror = (error) => {
        console.error('WebSocket error:', error);
        setIsConnected(false);
      };

      ws.current.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data);
          setLastMessage(message);
          handleIncomingMessage(message);
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };

    } catch (error) {
      console.error('WebSocket connection error:', error);
    }
  }, [user, reconnectAttempts]);

  const disconnect = useCallback(() => {
    if (ws.current) {
      ws.current.close(1000, 'Manual disconnect');
      ws.current = null;
    }
    setIsConnected(false);
  }, []);

  const sendMessage = useCallback((message: WebSocketMessage) => {
    if (ws.current && ws.current.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify(message));
    } else {
      console.warn('WebSocket is not connected');
    }
  }, []);

  const subscribe = useCallback((channel: string) => {
    sendMessage({ type: 'subscribe', channel });
  }, [sendMessage]);

  const unsubscribe = useCallback((channel: string) => {
    sendMessage({ type: 'unsubscribe', channel });
  }, [sendMessage]);

  const handleIncomingMessage = useCallback((message: WebSocketMessage) => {
    switch (message.type) {
      case 'trust_score_updated':
        console.log('Trust score updated:', message.data);
        // You could dispatch a Redux action or update context here
        break;
      
      case 'account_verified':
        console.log('Account verified:', message.data);
        break;
      
      case 'badge_minted':
        console.log('Badge minted:', message.data);
        break;
      
      case 'connected':
        console.log('WebSocket session established:', message.sessionId);
        break;
      
      default:
        console.log('Unknown message type:', message.type);
    }
  }, []);

  // Auto-connect on mount and when user changes
  useEffect(() => {
    if (user) {
      connect();
    } else {
      disconnect();
    }

    return () => {
      disconnect();
    };
  }, [user, connect, disconnect]);

  // Auto-reconnect when connection is lost
  useEffect(() => {
    if (!isConnected && user && reconnectAttempts < maxReconnectAttempts) {
      const timeout = setTimeout(() => {
        connect();
      }, 5000);
      
      return () => clearTimeout(timeout);
    }
  }, [isConnected, user, reconnectAttempts, connect]);

  return {
    isConnected,
    lastMessage,
    sendMessage,
    subscribe,
    unsubscribe,
    reconnectAttempts,
  };
}