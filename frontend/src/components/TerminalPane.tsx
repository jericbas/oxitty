import { RotateCcw, X } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useTerminal } from '../hooks/useTerminal';
import { type ConnectionStatus, useWebSocket } from '../hooks/useWebSocket';
import type { ClientConfig, ClientMessage, ResizePayload, ServerMessage } from '../types/generated';
import { type TerminalPreferences, resolveTheme } from '../types/theme';

interface TerminalPaneProps {
  id: string;
  sessionId?: string;
  isReadOnly?: boolean;
  isActive: boolean;
  isVisible: boolean;
  isSplit: boolean;
  reconnectSignal: number;
  preferences: TerminalPreferences;
  onFocus: () => void;
  onClose?: () => void;
  onSessionReady?: (sessionId: string, title: string, config: ClientConfig) => void;
  onTitleChange?: (title: string) => void;
  onMetricsUpdate?: (
    cols: number,
    rows: number,
    latency: number | null,
    status: ConnectionStatus,
    readOnly: boolean
  ) => void;
}

export function TerminalPane({
  sessionId,
  isReadOnly,
  isActive,
  isVisible,
  isSplit,
  reconnectSignal,
  preferences,
  onFocus,
  onClose,
  onSessionReady,
  onTitleChange,
  onMetricsUpdate,
}: TerminalPaneProps) {
  const [paneTitle, setPaneTitle] = useState('Terminal');
  const [serverReadOnly, setServerReadOnly] = useState(false);
  const [exitedCode, setExitedCode] = useState<number | null | undefined>(undefined);
  const effectiveReadOnly = Boolean(isReadOnly || serverReadOnly);

  const sendRef = useRef<(msg: ClientMessage) => void>(() => {});
  const dimsRef = useRef<ResizePayload>({ cols: 80, rows: 24 });
  const prevReconnectSignalRef = useRef(reconnectSignal);

  const handleTitleUpdate = useCallback(
    (nextTitle: string) => {
      setPaneTitle(nextTitle);
      onTitleChange?.(nextTitle);
    },
    [onTitleChange]
  );

  const { containerRef, write, focus, fit, dimensions } = useTerminal({
    preferences,
    onInput: (data) => {
      if (!effectiveReadOnly) sendRef.current({ type: 'Input', payload: data });
    },
    onResize: (dims) => {
      dimsRef.current = dims;
      if (!effectiveReadOnly) sendRef.current({ type: 'Resize', payload: dims });
    },
    onTitleChange: handleTitleUpdate,
  });

  const handleMessage = useCallback(
    (msg: ServerMessage) => {
      switch (msg.type) {
        case 'Init':
          setExitedCode(undefined);
          setServerReadOnly(msg.payload.read_only);
          setPaneTitle(msg.payload.title);
          onSessionReady?.(msg.payload.session_id, msg.payload.title, msg.payload);
          break;
        case 'Output':
          write(msg.payload);
          break;
        case 'SetTitle':
          handleTitleUpdate(msg.payload);
          break;
        case 'ProcessExited':
          setExitedCode(msg.payload ?? null);
          write(`\r\n\x1b[33m[Process exited (code: ${msg.payload ?? 'unknown'})]\x1b[0m\r\n`);
          break;
        case 'Error':
          write(`\r\n\x1b[31m[Server Error: ${msg.payload}]\x1b[0m\r\n`);
          break;
      }
    },
    [onSessionReady, handleTitleUpdate, write]
  );

  const { status, latency, send, reconnect, restartSession } = useWebSocket({
    initialSessionId: sessionId,
    isObserver: isReadOnly,
    onMessage: handleMessage,
    onOpen: () => {
      if (!effectiveReadOnly) {
        sendRef.current({ type: 'Resize', payload: dimsRef.current });
      }
    },
  });
  sendRef.current = send;

  useEffect(() => {
    if (reconnectSignal !== prevReconnectSignalRef.current) {
      prevReconnectSignalRef.current = reconnectSignal;
      if (isActive && isVisible) reconnect();
    }
  }, [reconnectSignal, isActive, isVisible, reconnect]);

  useEffect(() => {
    if (isActive && isVisible) {
      requestAnimationFrame(() => {
        fit();
        focus();
      });
    }
  }, [isActive, isVisible, fit, focus]);

  useEffect(() => {
    if (isActive && isVisible) {
      onMetricsUpdate?.(dimensions.cols, dimensions.rows, latency, status, effectiveReadOnly);
    }
  }, [
    isActive,
    isVisible,
    dimensions.cols,
    dimensions.rows,
    latency,
    status,
    effectiveReadOnly,
    onMetricsUpdate,
  ]);

  const themeBg = resolveTheme(preferences.themeName, preferences.customColors).background;
  const showPaneBar = isSplit || effectiveReadOnly || exitedCode !== undefined;

  return (
    <section
      onMouseDown={() => {
        onFocus();
        requestAnimationFrame(() => focus());
      }}
      aria-label={`Terminal pane ${paneTitle}`}
      style={{ backgroundColor: themeBg }}
      className={`flex flex-col flex-1 min-w-0 min-h-0 relative ${
        isSplit && isActive ? 'ring-1 ring-inset ring-sky-500/60' : ''
      }`}
    >
      {showPaneBar && (
        <div className="flex items-center justify-between px-3 h-7 bg-slate-900/95 border-b border-slate-800 text-xs text-slate-400 select-none shrink-0">
          <div className="flex items-center gap-2 truncate">
            <span
              className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                status === 'connected' ? 'bg-emerald-500' : 'bg-amber-500 animate-pulse'
              }`}
            />
            <span className="font-mono text-[11px] text-slate-300 truncate">{paneTitle}</span>
            {effectiveReadOnly && (
              <span className="px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 text-[10px] font-mono">
                OBSERVER
              </span>
            )}
          </div>
          <div className="flex items-center gap-1.5">
            {exitedCode !== undefined && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setExitedCode(undefined);
                  restartSession();
                  focus();
                }}
                className="flex items-center gap-1 px-2 py-0.5 rounded bg-sky-600 hover:bg-sky-500 text-white text-[11px] font-mono transition-colors"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Restart Shell</span>
              </button>
            )}
            {onClose && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onClose();
                }}
                className="text-slate-400 hover:text-rose-400 transition-colors p-0.5 rounded hover:bg-slate-800"
                title="Close Split Pane (Ctrl+Shift+W)"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      )}
      <div className="flex-1 w-full h-full min-h-0 min-w-0 p-2 overflow-hidden">
        <div ref={containerRef} className="w-full h-full overflow-hidden" />
      </div>
    </section>
  );
}
