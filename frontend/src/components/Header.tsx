import { Maximize, RotateCw, Settings, Terminal } from 'lucide-react';
import type React from 'react';
import type { ConnectionStatus } from '../hooks/useWebSocket';

interface HeaderProps {
  title: string;
  status: ConnectionStatus;
  onOpenSettings: () => void;
  onReconnect: () => void;
}

export const Header: React.FC<HeaderProps> = ({ title, status, onOpenSettings, onReconnect }) => {
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
    } else {
      document.exitFullscreen();
    }
  };

  const statusColors = {
    connected: 'bg-emerald-500',
    connecting: 'bg-amber-500 animate-pulse',
    disconnected: 'bg-rose-500',
    error: 'bg-rose-600',
  };

  return (
    <header className="flex items-center justify-between px-4 py-2 bg-slate-900 border-b border-slate-800 text-slate-200 select-none">
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 font-mono font-semibold tracking-wide text-sky-400">
          <Terminal className="w-5 h-5 text-sky-400" />
          <span>oxitty</span>
        </div>
        <span className="text-slate-600">/</span>
        <span className="text-xs font-mono text-slate-300 max-w-xs truncate">{title}</span>
      </div>

      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-mono bg-slate-800/80 border border-slate-700">
          <span className={`w-2 h-2 rounded-full ${statusColors[status]}`} />
          <span className="text-slate-300 capitalize">{status}</span>
        </div>

        <button
          type="button"
          onClick={onReconnect}
          className="p-1.5 text-slate-400 hover:text-white rounded hover:bg-slate-800 transition"
          title="Reconnect"
        >
          <RotateCw className="w-4 h-4" />
        </button>

        <button
          type="button"
          onClick={toggleFullscreen}
          className="p-1.5 text-slate-400 hover:text-white rounded hover:bg-slate-800 transition"
          title="Toggle Fullscreen"
        >
          <Maximize className="w-4 h-4" />
        </button>

        <button
          type="button"
          onClick={onOpenSettings}
          className="p-1.5 text-slate-400 hover:text-white rounded hover:bg-slate-800 transition"
          title="Terminal Settings"
        >
          <Settings className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
};
