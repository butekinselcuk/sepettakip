import { useEffect, useRef, useState, useCallback } from 'react';

interface WebSocketMessage {
  type: 'delivery_update' | 'courier_update' | 'zone_update';
  data: {
    activeCouriers?: number;
    activeDeliveries?: number;
    completedToday?: number;
    averageDeliveryTime?: number;
  };
}

interface WebSocketHook {
  isConnected: boolean;
  error: string | null;
  addMessageHandler: (handler: (message: WebSocketMessage) => void) => () => void;
  sendMessage: (message: any) => void;
}

export function useWebSocket(url: string): WebSocketHook {
  const ws = useRef<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messageHandlers = useRef<((message: WebSocketMessage) => void)[]>([]);

  useEffect(() => {
    if (!url) return;

    const connect = () => {
      try {
        ws.current = new WebSocket(url);

        ws.current.onopen = () => {
          setIsConnected(true);
          setError(null);
        };

        ws.current.onclose = () => {
          setIsConnected(false);
          // Yeniden bağlanma denemesi
          setTimeout(connect, 3000);
        };

        ws.current.onerror = (error) => {
          setError('WebSocket bağlantı hatası');
          console.error('WebSocket error:', error);
        };

        ws.current.onmessage = (event) => {
          try {
            const message = JSON.parse(event.data) as WebSocketMessage;
            messageHandlers.current.forEach((handler) => handler(message));
          } catch (error) {
            console.error('Message parsing error:', error);
          }
        };
      } catch (error) {
        setError('WebSocket bağlantısı kurulamadı');
        console.error('WebSocket connection error:', error);
      }
    };

    connect();

    return () => {
      if (ws.current) {
        ws.current.close();
      }
    };
  }, [url]);

  const addMessageHandler = useCallback((handler: (message: WebSocketMessage) => void) => {
    messageHandlers.current.push(handler);
    return () => {
      const index = messageHandlers.current.indexOf(handler);
      if (index > -1) {
        messageHandlers.current.splice(index, 1);
      }
    };
  }, []);

  const sendMessage = useCallback((message: any) => {
    if (ws.current && ws.current.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify(message));
    } else {
      console.error('WebSocket is not connected');
    }
  }, []);

  return {
    isConnected,
    error,
    addMessageHandler,
    sendMessage
  };
} 