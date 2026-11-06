import { useCallback, useEffect, useState } from 'react';
import { Header } from './components/Header';
import { PaneContainer } from './components/PaneContainer';
import { SettingsModal } from './components/SettingsModal';
import { StatusBar } from './components/StatusBar';
import { useShortcuts } from './hooks/useShortcuts';
import type { ConnectionStatus } from './hooks/useWebSocket';
import { useWorkspace } from './hooks/useWorkspace';
import { THEME_OPTIONS, type TerminalPreferences, normalizeThemePreset } from './types/theme';

const STORAGE_KEY = 'oxitty:preferences';

function loadSavedPreferences(): TerminalPreferences {
  const defaults: TerminalPreferences = {
    fontSize: 14,
    fontFamily: 'JetBrains Mono, Menlo, monospace',
    cursorBlink: true,
    themeName: 'tokyoNight',
  };
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaults;
    const parsed = JSON.parse(raw) as Partial<TerminalPreferences>;
    return {
      fontSize: typeof parsed.fontSize === 'number' ? parsed.fontSize : defaults.fontSize,
      fontFamily: typeof parsed.fontFamily === 'string' ? parsed.fontFamily : defaults.fontFamily,
      cursorBlink:
        typeof parsed.cursorBlink === 'boolean' ? parsed.cursorBlink : defaults.cursorBlink,
      themeName: normalizeThemePreset(parsed.themeName) ?? defaults.themeName,
    };
  } catch {
    return defaults;
  }
}

export function App() {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [reconnectSignal, setReconnectSignal] = useState(0);
  const [preferences, setPreferences] = useState<TerminalPreferences>(loadSavedPreferences);

  const [metrics, setMetrics] = useState<{
    cols: number;
    rows: number;
    latency: number | null;
    status: ConnectionStatus;
    readOnly: boolean;
  }>({
    cols: 80,
    rows: 24,
    latency: null,
    status: 'connecting',
    readOnly: false,
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(preferences));
    } catch {
      // Ignore storage quota errors
    }
  }, [preferences]);

  const workspace = useWorkspace((cfg) => {
    const serverTheme = normalizeThemePreset(cfg.theme);
    setPreferences((prev) => ({
      fontSize: cfg.font_size || prev.fontSize,
      fontFamily: cfg.font_family || prev.fontFamily,
      cursorBlink: cfg.cursor_blink,
      themeName: serverTheme ?? prev.themeName,
      customColors: cfg.custom_colors ?? prev.customColors,
    }));
  });

  const handleCycleTheme = useCallback(() => {
    setPreferences((prev) => {
      const idx = THEME_OPTIONS.findIndex((t) => t.id === prev.themeName);
      const next = THEME_OPTIONS[(idx + 1) % THEME_OPTIONS.length];
      return { ...prev, themeName: next.id };
    });
  }, []);

  const handleMetricsUpdate = useCallback(
    (
      cols: number,
      rows: number,
      latency: number | null,
      status: ConnectionStatus,
      readOnly: boolean
    ) => {
      setMetrics((prev) =>
        prev.cols === cols &&
        prev.rows === rows &&
        prev.latency === latency &&
        prev.status === status &&
        prev.readOnly === readOnly
          ? prev
          : { cols, rows, latency, status, readOnly }
      );
    },
    []
  );

  useShortcuts({
    onNewTab: workspace.handleNewTab,
    onCloseActive: workspace.handleCloseActive,
    onSplitHorizontal: () => workspace.handleSplit('horizontal'),
    onSplitVertical: () => workspace.handleSplit('vertical'),
    onZoomIn: () => setPreferences((p) => ({ ...p, fontSize: Math.min(24, p.fontSize + 1) })),
    onZoomOut: () => setPreferences((p) => ({ ...p, fontSize: Math.max(10, p.fontSize - 1) })),
    onZoomReset: () => setPreferences((p) => ({ ...p, fontSize: 14 })),
  });

  return (
    <div className="flex flex-col w-screen h-screen overflow-hidden bg-slate-950">
      <Header
        tabs={workspace.tabs}
        activeTabId={workspace.activeTab.id}
        canSplit={workspace.activeTab.panes.length < 2}
        canShare={Boolean(workspace.activePane?.sessionId)}
        shareCopied={workspace.shareCopied}
        status={metrics.status}
        onSelectTab={workspace.setActiveTabId}
        onCloseTab={workspace.handleCloseTab}
        onNewTab={workspace.handleNewTab}
        onSplit={workspace.handleSplit}
        onShareObserver={workspace.handleShareObserver}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onReconnect={() => setReconnectSignal((n) => n + 1)}
      />

      <main className="flex-1 w-full h-full min-h-0 relative">
        {workspace.tabs.map((tab) => (
          <PaneContainer
            key={tab.id}
            panes={tab.panes}
            splitDirection={tab.splitDirection}
            activePaneId={tab.activePaneId}
            isVisible={tab.id === workspace.activeTab.id}
            reconnectSignal={reconnectSignal}
            preferences={preferences}
            onSelectPane={(paneId) => workspace.handleSelectPane(tab.id, paneId)}
            onClosePane={(paneId) => workspace.handleClosePane(tab.id, paneId)}
            onSessionReady={(paneId, sessId, title, cfg) =>
              workspace.handleSessionReady(tab.id, paneId, sessId, title, cfg)
            }
            onTitleChange={(paneId, title) => workspace.handleTitleChange(tab.id, paneId, title)}
            onMetricsUpdate={handleMetricsUpdate}
          />
        ))}
      </main>

      <StatusBar
        cols={metrics.cols}
        rows={metrics.rows}
        latency={metrics.latency}
        themeName={preferences.themeName}
        readOnly={metrics.readOnly}
        onCycleTheme={handleCycleTheme}
      />

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        preferences={preferences}
        onUpdate={(update) => setPreferences((prev) => ({ ...prev, ...update }))}
      />
    </div>
  );
}

export default App;
