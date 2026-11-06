import { useCallback, useRef, useState } from 'react';
import type { ClientConfig } from '../types/generated';
import type { TabState } from '../types/tabs';

function copyTextSafe(text: string): Promise<void> {
  if (navigator.clipboard?.writeText) {
    return navigator.clipboard.writeText(text);
  }
  const textarea = document.createElement('textarea');
  textarea.value = text;
  textarea.style.position = 'fixed';
  textarea.style.opacity = '0';
  document.body.appendChild(textarea);
  textarea.select();
  document.execCommand('copy');
  document.body.removeChild(textarea);
  return Promise.resolve();
}

export function useWorkspace(onInitialConfig: (cfg: ClientConfig) => void) {
  const [shareCopied, setShareCopied] = useState(false);
  const tabCounterRef = useRef(1);
  const configAppliedRef = useRef(false);
  const onInitialConfigRef = useRef(onInitialConfig);
  onInitialConfigRef.current = onInitialConfig;

  const [tabs, setTabs] = useState<TabState[]>(() => {
    const params = new URLSearchParams(window.location.search);
    const initialSession = params.get('session') || undefined;
    const isObserver = params.get('observer') === '1' || params.get('observer') === 'true';
    return [
      {
        id: 'tab-1',
        title: 'Terminal 1',
        splitDirection: 'none',
        activePaneId: 'pane-1',
        panes: [
          {
            id: 'pane-1',
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
  const activePane =
    activeTab.panes.find((p) => p.id === activeTab.activePaneId) || activeTab.panes[0];

  const handleNewTab = useCallback(() => {
    tabCounterRef.current += 1;
    const num = tabCounterRef.current;
    const newId = `tab-${Date.now()}`;
    const newPaneId = `pane-${Date.now()}`;
    setTabs((prev) => [
      ...prev,
      {
        id: newId,
        title: `Terminal ${num}`,
        splitDirection: 'none',
        activePaneId: newPaneId,
        panes: [{ id: newPaneId, title: `Terminal ${num}` }],
      },
    ]);
    setActiveTabId(newId);
  }, []);

  const handleCloseTab = useCallback((tabId: string) => {
    setTabs((prev) => {
      if (prev.length <= 1) return prev;
      const idx = prev.findIndex((t) => t.id === tabId);
      const nextTabs = prev.filter((t) => t.id !== tabId);
      setActiveTabId((curr) => (curr === tabId ? nextTabs[Math.max(0, idx - 1)].id : curr));
      return nextTabs;
    });
  }, []);

  const handleClosePane = useCallback((tabId: string, paneId: string) => {
    setTabs((prev) =>
      prev.map((t) => {
        if (t.id !== tabId || t.panes.length <= 1) return t;
        const remaining = t.panes.filter((p) => p.id !== paneId);
        return {
          ...t,
          panes: remaining,
          splitDirection: 'none',
          activePaneId: remaining[0].id,
        };
      })
    );
  }, []);

  const handleCloseActive = useCallback(() => {
    if (activeTab.panes.length > 1) {
      handleClosePane(activeTab.id, activeTab.activePaneId);
    } else {
      handleCloseTab(activeTab.id);
    }
  }, [
    activeTab.id,
    activeTab.panes.length,
    activeTab.activePaneId,
    handleClosePane,
    handleCloseTab,
  ]);

  const handleSplit = useCallback(
    (direction: 'horizontal' | 'vertical') => {
      setTabs((prev) =>
        prev.map((t) => {
          if (t.id !== activeTabId || t.panes.length >= 2) return t;
          const newPaneId = `pane-${Date.now()}`;
          return {
            ...t,
            splitDirection: direction,
            panes: [...t.panes, { id: newPaneId, title: `${t.title} (2)` }],
            activePaneId: newPaneId,
          };
        })
      );
    },
    [activeTabId]
  );

  const handleSelectPane = useCallback((tabId: string, paneId: string) => {
    setTabs((prev) => prev.map((t) => (t.id === tabId ? { ...t, activePaneId: paneId } : t)));
  }, []);

  const handleShareObserver = useCallback(() => {
    if (!activePane?.sessionId) return;
    const url = `${window.location.origin}/?session=${activePane.sessionId}&observer=true`;
    copyTextSafe(url).then(() => {
      setShareCopied(true);
      window.setTimeout(() => setShareCopied(false), 2000);
    });
  }, [activePane?.sessionId]);

  const handleSessionReady = useCallback(
    (tabId: string, paneId: string, sessId: string, title: string, cfg: ClientConfig) => {
      if (!configAppliedRef.current) {
        configAppliedRef.current = true;
        onInitialConfigRef.current(cfg);
      }
      setTabs((prev) =>
        prev.map((t) => {
          if (t.id !== tabId) return t;
          const nextPanes = t.panes.map((p) =>
            p.id === paneId ? { ...p, sessionId: sessId, title } : p
          );
          return { ...t, panes: nextPanes };
        })
      );
    },
    []
  );

  const handleTitleChange = useCallback((tabId: string, paneId: string, title: string) => {
    document.title = `${title} — oxitty`;
    setTabs((prev) =>
      prev.map((t) => {
        if (t.id !== tabId) return t;
        const nextPanes = t.panes.map((p) => (p.id === paneId ? { ...p, title } : p));
        const nextTabTitle = t.activePaneId === paneId ? title : t.title;
        return { ...t, title: nextTabTitle, panes: nextPanes };
      })
    );
  }, []);

  return {
    tabs,
    activeTab,
    activePane,
    shareCopied,
    setActiveTabId,
    handleNewTab,
    handleCloseTab,
    handleClosePane,
    handleCloseActive,
    handleSplit,
    handleSelectPane,
    handleShareObserver,
    handleSessionReady,
    handleTitleChange,
  };
}
