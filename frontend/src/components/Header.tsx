import { Check, Columns, Maximize, RotateCw, Rows, Settings, Share2, Terminal } from 'lucide-react';
import type React from 'react';
import type { ConnectionStatus } from '../hooks/useWebSocket';
import type { TabState } from '../types/tabs';
import { TabBar } from './TabBar';

interface HeaderProps {
  tabs: TabState[];
  activeTabId: string;
  canSplit: boolean;
  canShare: boolean;
  shareCopied: boolean;
  status: ConnectionStatus;
  onSelectTab: (tabId: string) => void;
  onCloseTab: (tabId: string) => void;
  onNewTab: () => void;
  onSplit: (direction: 'horizontal' | 'vertical') => void;
  onShareObserver: () => void;
  onOpenSettings: () => void;
  onReconnect: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  tabs,
  activeTabId,
  canSplit,
  canShare,
  shareCopied,
  status,
  onSelectTab,
  onCloseTab,
  onNewTab,
  onSplit,
  onShareObserver,
  onOpenSettings,
  onReconnect,
}) => {
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  };

  const statusColors: Record<ConnectionStatus, string> = {
    connected: 'bg-emerald-500',
    connecting: 'bg-amber-500 animate-pulse',
    disconnected: 'bg-rose-500',
    error: 'bg-rose-600',
  };

  return (
    <header className="flex items-center justify-between gap-3 px-3 h-10 bg-slate-900 border-b border-slate-800 text-slate-200 select-none shrink-0">
      <div className="flex items-center gap-2 shrink-0 pr-2 border-r border-slate-800">
        <Terminal className="w-4 h-4 text-sky-400" />
        <span className="font-mono text-xs font-semibold tracking-wide text-sky-400">oxitty</span>
      </div>

      <TabBar
        tabs={tabs}
        activeTabId={activeTabId}
        onSelectTab={onSelectTab}
        onCloseTab={onCloseTab}
        onNewTab={onNewTab}
      />

      <div onMouseDown={(e) => e.preventDefault()} className="flex items-center gap-1 shrink-0">
        <button
          type="button"
          disabled={!canSplit}
          onClick={() => onSplit('horizontal')}
          className="p-1.5 rounded text-slate-400 hover:text-slate-100 hover:bg-slate-800 disabled:opacity-35 disabled:pointer-events-none transition-colors"
          title="Split Horizontally (Alt+Shift+H)"
        >
          <Rows className="w-3.5 h-3.5" />
        </button>

        <button
          type="button"
          disabled={!canSplit}
          onClick={() => onSplit('vertical')}
          className="p-1.5 rounded text-slate-400 hover:text-slate-100 hover:bg-slate-800 disabled:opacity-35 disabled:pointer-events-none transition-colors"
          title="Split Vertically (Alt+Shift+V)"
        >
          <Columns className="w-3.5 h-3.5" />
        </button>

        <button
          type="button"
          disabled={!canShare}
          onClick={onShareObserver}
          className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-mono transition-colors disabled:opacity-35 disabled:pointer-events-none ${
            shareCopied
              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
              : 'text-slate-400 hover:text-sky-300 hover:bg-slate-800'
          }`}
          title="Copy Read-Only Observer Link"
        >
          {shareCopied ? <Check className="w-3.5 h-3.5" /> : <Share2 className="w-3.5 h-3.5" />}
          {shareCopied && <span className="text-[11px]">Copied</span>}
        </button>

        <div className="h-4 w-px bg-slate-800 mx-1" />

        <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-mono bg-slate-800/80 border border-slate-700/80">
          <span className={`w-1.5 h-1.5 rounded-full ${statusColors[status]}`} />
          <span className="text-slate-300 capitalize">{status}</span>
        </div>

        <button
          type="button"
          onClick={onReconnect}
          className="p-1.5 text-slate-400 hover:text-white rounded hover:bg-slate-800 transition-colors"
          title="Reconnect Active Pane"
        >
          <RotateCw className="w-3.5 h-3.5" />
        </button>

        <button
          type="button"
          onClick={toggleFullscreen}
          className="p-1.5 text-slate-400 hover:text-white rounded hover:bg-slate-800 transition-colors"
          title="Toggle Fullscreen"
        >
          <Maximize className="w-3.5 h-3.5" />
        </button>

        <button
          type="button"
          onClick={onOpenSettings}
          className="p-1.5 text-slate-400 hover:text-white rounded hover:bg-slate-800 transition-colors"
          title="Terminal Preferences"
        >
          <Settings className="w-3.5 h-3.5" />
        </button>
      </div>
    </header>
  );
};
