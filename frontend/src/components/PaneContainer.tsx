import type React from 'react';
import { useCallback, useEffect, useRef, useState } from 'react';
import type { ConnectionStatus } from '../hooks/useWebSocket';
import type { ClientConfig } from '../types/generated';
import type { PaneState, SplitDirection } from '../types/tabs';
import type { TerminalPreferences } from '../types/theme';
import { TerminalPane } from './TerminalPane';

interface PaneContainerProps {
  panes: PaneState[];
  splitDirection: SplitDirection;
  activePaneId: string;
  isVisible: boolean;
  reconnectSignal: number;
  preferences: TerminalPreferences;
  onSelectPane: (paneId: string) => void;
  onClosePane: (paneId: string) => void;
  onSessionReady: (paneId: string, sessionId: string, title: string, config: ClientConfig) => void;
  onTitleChange: (paneId: string, title: string) => void;
  onMetricsUpdate: (
    cols: number,
    rows: number,
    latency: number | null,
    status: ConnectionStatus,
    readOnly: boolean
  ) => void;
}

function getFirstPaneStyle(
  isSplit: boolean,
  isVertical: boolean,
  splitRatio: number
): React.CSSProperties | undefined {
  if (!isSplit) return undefined;
  return isVertical ? { width: `${splitRatio}%` } : { height: `${splitRatio}%` };
}

function getContainerClass(isVisible: boolean, isSplit: boolean, isVertical: boolean): string {
  if (!isVisible) return 'hidden';
  const dir = isSplit && !isVertical ? 'flex-col' : 'flex-row';
  return `flex ${dir} h-full w-full`;
}

export function PaneContainer({
  panes,
  splitDirection,
  activePaneId,
  isVisible,
  reconnectSignal,
  preferences,
  onSelectPane,
  onClosePane,
  onSessionReady,
  onTitleChange,
  onMetricsUpdate,
}: PaneContainerProps) {
  const [splitRatio, setSplitRatio] = useState(50);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const draggingRef = useRef(false);
  const isSplit = panes.length > 1 && splitDirection !== 'none';
  const isVertical = splitDirection === 'vertical';

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!draggingRef.current || !containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const raw = isVertical
        ? ((e.clientX - rect.left) / rect.width) * 100
        : ((e.clientY - rect.top) / rect.height) * 100;
      setSplitRatio(Math.min(80, Math.max(20, raw)));
    },
    [isVertical]
  );

  useEffect(() => {
    const stopDrag = () => {
      draggingRef.current = false;
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', stopDrag);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', stopDrag);
    };
  }, [handleMouseMove]);

  const firstPane = panes[0];
  const secondPane = isSplit ? panes[1] : undefined;

  return (
    <div ref={containerRef} className={getContainerClass(isVisible, isSplit, isVertical)}>
      <div
        style={getFirstPaneStyle(isSplit, isVertical, splitRatio)}
        className={`flex min-w-0 min-h-0 ${isSplit ? '' : 'flex-1'}`}
      >
        <TerminalPane
          key={firstPane.id}
          id={firstPane.id}
          sessionId={firstPane.sessionId}
          isReadOnly={firstPane.isReadOnly}
          isActive={isSplit ? firstPane.id === activePaneId : isVisible}
          isVisible={isVisible}
          isSplit={isSplit}
          reconnectSignal={reconnectSignal}
          preferences={preferences}
          onFocus={() => onSelectPane(firstPane.id)}
          onClose={isSplit ? () => onClosePane(firstPane.id) : undefined}
          onSessionReady={(sessId, title, cfg) => onSessionReady(firstPane.id, sessId, title, cfg)}
          onTitleChange={(title) => onTitleChange(firstPane.id, title)}
          onMetricsUpdate={!isSplit || firstPane.id === activePaneId ? onMetricsUpdate : undefined}
        />
      </div>

      {secondPane && (
        <>
          <div
            role="separator"
            tabIndex={0}
            aria-valuenow={Math.round(splitRatio)}
            aria-valuemin={20}
            aria-valuemax={80}
            aria-orientation={isVertical ? 'vertical' : 'horizontal'}
            onKeyDown={(e) => {
              if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
                setSplitRatio((r) => Math.max(20, r - 5));
              } else if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
                setSplitRatio((r) => Math.min(80, r + 5));
              }
            }}
            onMouseDown={() => {
              draggingRef.current = true;
              document.body.style.cursor = isVertical ? 'col-resize' : 'row-resize';
              document.body.style.userSelect = 'none';
            }}
            className={`shrink-0 bg-slate-800 hover:bg-sky-500 active:bg-sky-400 transition-colors ${
              isVertical ? 'w-1 cursor-col-resize' : 'h-1 cursor-row-resize'
            }`}
          />

          <div className="flex flex-1 min-w-0 min-h-0">
            <TerminalPane
              key={secondPane.id}
              id={secondPane.id}
              sessionId={secondPane.sessionId}
              isReadOnly={secondPane.isReadOnly}
              isActive={secondPane.id === activePaneId}
              isVisible={isVisible}
              isSplit={true}
              reconnectSignal={reconnectSignal}
              preferences={preferences}
              onFocus={() => onSelectPane(secondPane.id)}
              onClose={() => onClosePane(secondPane.id)}
              onSessionReady={(sessId, title, cfg) =>
                onSessionReady(secondPane.id, sessId, title, cfg)
              }
              onTitleChange={(title) => onTitleChange(secondPane.id, title)}
              onMetricsUpdate={secondPane.id === activePaneId ? onMetricsUpdate : undefined}
            />
          </div>
        </>
      )}
    </div>
  );
}
