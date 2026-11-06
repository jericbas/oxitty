import { useCallback, useEffect, useState } from 'react';
import { useTerminal } from '../hooks/useTerminal';
import { useWebSocket } from '../hooks/useWebSocket';
import type { ServerMessage } from '../types/generated';
import type { TerminalPreferences } from '../types/theme';

interface TerminalPaneProps {
  id: string;
  sessionId?: string;
  isReadOnly?: boolean;
  isActive: boolean;
  preferences: TerminalPreferences;
  onFocus: () => void;
  onClose?: () => void;
  onSessionReady?: (sessionId: string, title: string) => void;
  onMetricsUpdate?: (cols: number, rows: number, latency: number | null) => void;
}

export function TerminalPane({
  sessionId,
  isReadOnly,
  isActive,
  preferences,
  onFocus,
  onClose,
  onSessionReady,
  onMetricsUpdate,
}: TerminalPaneProps) {
  const [paneTitle, setPaneTitle] = useState('Terminal');

  const handleMessage = useCallback(
    (msg: ServerMessage) => {
      switch (msg.type) {
        case 'Init':
          setPaneTitle(msg.payload.title);
          onSessionReady?.(msg.payload.session_id, msg.payload.title);
          break;
        case 'Output':
          write(msg.payload);
          break;
        case 'SetTitle':
          setPaneTitle(msg.payload);
          break;
        case 'ProcessExited':
          write(`\r\n\x1b[33m[Process exited with code ${msg.payload ?? 'none'}]\x1b[0m\r\n`);
          break;
        case 'Error':
          write(`\r\n\x1b[31m[Server Error: ${msg.payload}]\x1b[0m\r\n`);
          break;
      }
    },
    [onSessionReady]
  );

  const { status, latency, send } = useWebSocket({
    sessionId,
    isObserver: isReadOnly,
    onMessage: handleMessage,
  });

  const { containerRef, write, dimensions } = useTerminal({
    preferences,
    onInput: (data) => {
      if (!isReadOnly) send({ type: 'Input', payload: data });
    },
    onResize: (dims) => {
      if (!isReadOnly) send({ type: 'Resize', payload: dims });
    },
  });

  useEffect(() => {
    if (isActive) {
      onMetricsUpdate?.(dimensions.cols, dimensions.rows, latency);
    }
  }, [isActive, dimensions.cols, dimensions.rows, latency, onMetricsUpdate]);

  return (
    <section
      onClick={onFocus}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') onFocus();
      }}
      aria-label={`Terminal pane ${paneTitle}`}
      className={`flex flex-col flex-1 min-w-0 min-h-0 relative ${
        isActive ? 'ring-1 ring-cyan-500/50' : 'opacity-90'
      }`}
    >
      <div className="flex items-center justify-between px-3 py-1 bg-slate-900 border-b border-slate-800 text-xs text-slate-400">
        <div className="flex items-center space-x-2 truncate">
          <span
            className={`w-2 h-2 rounded-full ${
              status === 'connected' ? 'bg-emerald-500' : 'bg-amber-500 animate-pulse'
            }`}
          />
          <span className="font-medium text-slate-300 truncate">{paneTitle}</span>
          {isReadOnly && (
            <span className="px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 text-[10px]">
              OBSERVER
            </span>
          )}
        </div>
        {onClose && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onClose();
            }}
            className="text-slate-400 hover:text-red-400 transition-colors p-0.5 rounded"
            title="Close Pane"
          >
            ✕
          </button>
        )}
      </div>
      <div ref={containerRef} className="flex-1 w-full h-full bg-slate-950 p-2 overflow-hidden" />
    </section>
  );
}
