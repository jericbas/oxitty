import { useCallback, useEffect, useRef, useState } from 'react';
import type { ClientMessage, ServerMessage } from '../types/generated';

export type ConnectionStatus = 'connecting' | 'connected' | 'disconnected' | 'error';

interface UseWebSocketOptions {
  url?: string;
  initialSessionId?: string;
  isObserver?: boolean;
  onMessage: (message: ServerMessage) => void;
  onOpen?: () => void;
  autoReconnect?: boolean;
}

export function useWebSocket({
  url,
  initialSessionId,
  isObserver,
  onMessage,
  onOpen,
  autoReconnect = true,
}: UseWebSocketOptions) {
  const [status, setStatus] = useState<ConnectionStatus>('connecting');
  const [latency, setLatency] = useState<number | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const sessionIdRef = useRef<string | undefined>(initialSessionId);
  const processExitedRef = useRef(false);
  const unmountedRef = useRef(false);
  const pingStartRef = useRef<number>(0);
  const reconnectTimerRef = useRef<number | null>(null);

  const onMessageRef = useRef(onMessage);
  const onOpenRef = useRef(onOpen);
  onMessageRef.current = onMessage;
  onOpenRef.current = onOpen;

  const buildWsUrl = useCallback(() => {
    if (url) return url;
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const params = new URLSearchParams();
    if (sessionIdRef.current) params.set('session', sessionIdRef.current);
    if (isObserver) params.set('observer', 'true');
    const qs = params.toString();
    return `${protocol}//${window.location.host}/ws${qs ? `?${qs}` : ''}`;
  }, [url, isObserver]);

  const send = useCallback((message: ClientMessage) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(message));
    }
  }, []);

  const connect = useCallback(() => {
    if (reconnectTimerRef.current) {
      clearTimeout(reconnectTimerRef.current);
      reconnectTimerRef.current = null;
    }
    if (wsRef.current) {
      wsRef.current.onclose = null;
      wsRef.current.close();
    }

    try {
      setStatus('connecting');
      const ws = new WebSocket(buildWsUrl());
      wsRef.current = ws;

      ws.onopen = () => {
        if (unmountedRef.current) return;
        setStatus('connected');
        pingStartRef.current = Date.now();
        ws.send(JSON.stringify({ type: 'Ping' } satisfies ClientMessage));
        onOpenRef.current?.();
      };

      ws.onmessage = (event) => {
        try {
          const parsed: ServerMessage = JSON.parse(event.data);
          if (parsed.type === 'Init') {
            sessionIdRef.current = parsed.payload.session_id;
            processExitedRef.current = false;
          } else if (parsed.type === 'Pong') {
            setLatency(Math.max(0, Date.now() - pingStartRef.current));
          } else if (parsed.type === 'ProcessExited') {
            processExitedRef.current = true;
          }
          onMessageRef.current(parsed);
        } catch {
          // Ignore malformed JSON frames
        }
      };

      ws.onclose = () => {
        if (unmountedRef.current) return;
        setStatus('disconnected');
        if (autoReconnect && !processExitedRef.current) {
          reconnectTimerRef.current = window.setTimeout(connect, 2000);
        }
      };

      ws.onerror = () => {
        if (!unmountedRef.current) setStatus('error');
      };
    } catch {
      setStatus('error');
    }
  }, [buildWsUrl, autoReconnect]);

  const restartSession = useCallback(() => {
    sessionIdRef.current = undefined;
    processExitedRef.current = false;
    connect();
  }, [connect]);

  const ping = useCallback(() => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      pingStartRef.current = Date.now();
      send({ type: 'Ping' });
    }
  }, [send]);

  useEffect(() => {
    unmountedRef.current = false;
    connect();
    const interval = window.setInterval(ping, 10000);

    return () => {
      unmountedRef.current = true;
      clearInterval(interval);
      if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current);
      if (wsRef.current) {
        wsRef.current.onclose = null;
        wsRef.current.close();
      }
    };
  }, [connect, ping]);

  return { status, latency, send, reconnect: connect, restartSession };
}
