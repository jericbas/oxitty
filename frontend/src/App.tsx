import { useCallback, useState, useTransition } from 'react';
import { Header } from './components/Header';
import { PaneContainer } from './components/PaneContainer';
import { SettingsModal } from './components/SettingsModal';
import { StatusBar } from './components/StatusBar';
import { TabBar } from './components/TabBar';
import { useShortcuts } from './hooks/useShortcuts';
import type { TabState } from './types/tabs';
import type { TerminalPreferences } from './types/theme';

export function App() {
  const [isPending, startTransition] = useTransition();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [metrics, setMetrics] = useState<{ cols: number; rows: number; latency: number | null }>({
    cols: 80,
    rows: 24,
    latency: null,
  });

  const [preferences, setPreferences] = useState<TerminalPreferences>({
    fontSize: 14,
    fontFamily: 'JetBrains Mono, Menlo, monospace',
    cursorBlink: true,
    themeName: 'oneDark',
  });

  const [tabs, setTabs] = useState<TabState[]>(() => {
    const params = new URLSearchParams(window.location.search);
    const initialSession = params.get('session') || undefined;
    const isObserver = params.get('observer') === '1' || params.get('observer') === 'true';
    const initialPaneId = 'pane-1';
    return [
      {
        id: 'tab-1',
        title: 'Terminal 1',
        splitDirection: 'none',
        activePaneId: initialPaneId,
        panes: [
          {
            id: initialPaneId,
            sessionId: initialSession,
            title: 'Terminal 1',
            isReadOnly: isObserver,
          },
        ],
      },
    ];
  });

  const [activeTabId, setActiveTabId] = useState('tab-1');
  const activeTab = tabs.find((t) => t.id === activeTabId) || tabs[0];

  const handleSelectTab = useCallback((tabId: string) => {
    startTransition(() => {
      setActiveTabId(tabId);
    });
  }, []);

  const handleNewTab = useCallback(() => {
    const newId = `tab-${Date.now()}`;
    const newPaneId = `pane-${Date.now()}`;
    const newTab: TabState = {
      id: newId,
      title: `Terminal ${tabs.length + 1}`,
      splitDirection: 'none',
      activePaneId: newPaneId,
      panes: [{ id: newPaneId, title: `Terminal ${tabs.length + 1}` }],
    };
    setTabs((prev) => [...prev, newTab]);
    startTransition(() => {
      setActiveTabId(newId);
    });
  }, [tabs.length]);

  const handleCloseTab = useCallback(
    (tabId: string) => {
      setTabs((prev) => {
        if (prev.length <= 1) return prev;
        const nextTabs = prev.filter((t) => t.id !== tabId);
        if (activeTabId === tabId && nextTabs.length > 0) {
          setActiveTabId(nextTabs[0].id);
        }
        return nextTabs;
      });
    },
    [activeTabId]
  );

  const handleSplit = useCallback(
    (direction: 'horizontal' | 'vertical') => {
      setTabs((prev) =>
        prev.map((t) => {
          if (t.id !== activeTabId || t.panes.length >= 2) return t;
          const newPaneId = `pane-${Date.now()}`;
          return {
            ...t,
            splitDirection: direction,
            panes: [...t.panes, { id: newPaneId, title: `${t.title} (Split)` }],
            activePaneId: newPaneId,
          };
        })
      );
    },
    [activeTabId]
  );

  const handleClosePane = useCallback(
    (paneId: string) => {
      setTabs((prev) =>
        prev.map((t) => {
          if (t.id !== activeTabId || t.panes.length <= 1) return t;
          const remaining = t.panes.filter((p) => p.id !== paneId);
          return {
            ...t,
            panes: remaining,
            splitDirection: 'none',
            activePaneId: remaining[0].id,
          };
        })
      );
    },
    [activeTabId]
  );

  const handleShareObserver = useCallback(() => {
    const activePane = activeTab.panes.find((p) => p.id === activeTab.activePaneId);
    if (!activePane?.sessionId) return;
    const url = `${window.location.origin}/?session=${activePane.sessionId}&observer=true`;
    navigator.clipboard.writeText(url).then(() => {
      alert('Observer share link copied to clipboard!');
    });
  }, [activeTab]);

  useShortcuts({
    onNewTab: handleNewTab,
    onCloseTab: () => handleCloseTab(activeTabId),
    onSplitHorizontal: () => handleSplit('horizontal'),
    onSplitVertical: () => handleSplit('vertical'),
  });

  return (
    <div className="flex flex-col w-screen h-screen overflow-hidden bg-slate-950">
      <Header
        title={activeTab.title}
        status="connected"
        onOpenSettings={() => setIsSettingsOpen(true)}
        onReconnect={() => window.location.reload()}
      />
      <TabBar
        tabs={tabs}
        activeTabId={activeTabId}
        isPending={isPending}
        onSelectTab={handleSelectTab}
        onCloseTab={handleCloseTab}
        onNewTab={handleNewTab}
        onSplit={handleSplit}
        onShareObserver={handleShareObserver}
      />
      <div className="flex-1 w-full h-full min-h-0 relative">
        <PaneContainer
          panes={activeTab.panes}
          splitDirection={activeTab.splitDirection}
          activePaneId={activeTab.activePaneId}
          preferences={preferences}
          onSelectPane={(paneId) =>
            setTabs((prev) =>
              prev.map((t) => (t.id === activeTabId ? { ...t, activePaneId: paneId } : t))
            )
          }
          onClosePane={handleClosePane}
          onSessionReady={(paneId, sessId, title) =>
            setTabs((prev) =>
              prev.map((t) => {
                if (t.id !== activeTabId) return t;
                const nextPanes = t.panes.map((p) =>
                  p.id === paneId ? { ...p, sessionId: sessId, title } : p
                );
                return { ...t, panes: nextPanes };
              })
            )
          }
          onMetricsUpdate={(cols, rows, latency) => setMetrics({ cols, rows, latency })}
        />
      </div>
      <StatusBar
        cols={metrics.cols}
        rows={metrics.rows}
        latency={metrics.latency}
        readOnly={Boolean(activeTab.panes.find((p) => p.id === activeTab.activePaneId)?.isReadOnly)}
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
