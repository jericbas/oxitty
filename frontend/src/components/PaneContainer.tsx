import type { PaneState, SplitDirection } from '../types/tabs';
import type { TerminalPreferences } from '../types/theme';
import { TerminalPane } from './TerminalPane';

interface PaneContainerProps {
  panes: PaneState[];
  splitDirection: SplitDirection;
  activePaneId: string;
  preferences: TerminalPreferences;
  onSelectPane: (paneId: string) => void;
  onClosePane: (paneId: string) => void;
  onSessionReady: (paneId: string, sessionId: string, title: string) => void;
  onMetricsUpdate: (cols: number, rows: number, latency: number | null) => void;
}

export function PaneContainer({
  panes,
  splitDirection,
  activePaneId,
  preferences,
  onSelectPane,
  onClosePane,
  onSessionReady,
  onMetricsUpdate,
}: PaneContainerProps) {
  const containerClass =
    splitDirection === 'horizontal'
      ? 'flex flex-col h-full w-full divide-y divide-slate-800'
      : splitDirection === 'vertical'
        ? 'flex flex-row h-full w-full divide-x divide-slate-800'
        : 'flex h-full w-full';

  return (
    <div className={containerClass}>
      {panes.map((pane) => (
        <TerminalPane
          key={pane.id}
          id={pane.id}
          sessionId={pane.sessionId}
          isReadOnly={pane.isReadOnly}
          isActive={pane.id === activePaneId}
          preferences={preferences}
          onFocus={() => onSelectPane(pane.id)}
          onClose={panes.length > 1 ? () => onClosePane(pane.id) : undefined}
          onSessionReady={(sessId, title) => onSessionReady(pane.id, sessId, title)}
          onMetricsUpdate={pane.id === activePaneId ? onMetricsUpdate : undefined}
        />
      ))}
    </div>
  );
}
