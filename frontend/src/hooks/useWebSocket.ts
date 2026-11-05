import { useCallback, useEffect, useRef, useState } from 'react';
import type { ClientMessage, ServerMessage } from '../types/generated';

export type ConnectionStatus = 'connecting' | 'connected' | 'disconnected' | 'error';

interface UseWebSocketOptions {
  url?: string;
  onMessage: (message: ServerMessage) => void;
  autoReconnect?: boolean;
}

export function useWebSocket({ url, onMessage, autoReconnect = true }: UseWebSocketOptions) {
  const [status, setStatus] = useState<ConnectionStatus>('connecting');
  const [latency, setLatency] = useState<number | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const pingStartRef = useRef<number>(0);
  const reconnectTimerRef = useRef<number | null>(null);
  const onMessageRef = useRef(onMessage);
  onMessageRef.current = onMessage;

  const getWsUrl = useCallback(() => {
    if (url) return url;
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    return `${protocol}//${window.location.host}/ws`;
  }, [url]);

  const send = useCallback((message: ClientMessage) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(message));
    }
  }, []);

  const connect = useCallback(() => {
    try {
      setStatus('connecting');
      const targetUrl = getWsUrl();
      const ws = new WebSocket(targetUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        setStatus('connected');
      };

      ws.onmessage = (event) => {
        try {
          const parsed: ServerMessage = JSON.parse(event.data);
          if (parsed.type === 'Pong') {
            setLatency(Date.now() - pingStartRef.current);
          }
          onMessageRef.current(parsed);
        } catch {
          // Ignore parse errors on non-json stream
        }
      };

      ws.onclose = () => {
        setStatus('disconnected');
        if (autoReconnect) {
          reconnectTimerRef.current = window.setTimeout(connect, 2000);
        }
      };

      ws.onerror = () => {
        setStatus('error');
      };
    } catch {
      setStatus('error');
    }
  }, [getWsUrl, autoReconnect]);

  const ping = useCallback(() => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      pingStartRef.current = Date.now();
      send({ type: 'Ping' });
    }
  }, [send]);

  useEffect(() => {
    connect();
    const interval = setInterval(ping, 10000);

    return () => {
      clearInterval(interval);
      if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current);
      if (wsRef.current) wsRef.current.close();
    };
  }, [connect, ping]);

  return { status, latency, send, reconnect: connect };
}
