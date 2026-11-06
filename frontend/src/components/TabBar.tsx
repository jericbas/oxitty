import { Plus, TerminalSquare, X } from 'lucide-react';
import type { TabState } from '../types/tabs';

interface TabBarProps {
  tabs: TabState[];
  activeTabId: string;
  onSelectTab: (tabId: string) => void;
  onCloseTab: (tabId: string) => void;
  onNewTab: () => void;
}

export function TabBar({ tabs, activeTabId, onSelectTab, onCloseTab, onNewTab }: TabBarProps) {
  return (
    <div
      role="tablist"
      aria-label="Terminal tabs"
      className="flex items-center gap-1 overflow-x-auto flex-1 min-w-0 h-full py-1"
    >
      {tabs.map((tab) => {
        const isActive = tab.id === activeTabId;
        return (
          <div
            key={tab.id}
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => onSelectTab(tab.id)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onSelectTab(tab.id);
              }
            }}
            role="tab"
            aria-selected={isActive}
            tabIndex={0}
            className={`group flex items-center gap-2 px-3 h-7 text-xs rounded-md border cursor-pointer transition-colors max-w-[200px] shrink-0 ${
              isActive
                ? 'bg-slate-800/90 border-slate-700 text-slate-100 font-medium shadow-xs'
                : 'bg-transparent border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
            }`}
          >
            <TerminalSquare
              className={`w-3.5 h-3.5 shrink-0 ${isActive ? 'text-sky-400' : 'text-slate-500'}`}
            />
            <span className="truncate font-mono text-[11px]">{tab.title}</span>
            {tab.panes.length > 1 && (
              <span className="px-1 rounded bg-slate-700/80 text-[9px] font-mono text-slate-300">
                {tab.panes.length}
              </span>
            )}
            {tabs.length > 1 && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onCloseTab(tab.id);
                }}
                className="p-0.5 rounded text-slate-500 hover:text-rose-400 hover:bg-slate-700/60 transition-colors"
                title="Close Tab (Ctrl+Shift+W)"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
        );
      })}

      <button
        type="button"
        onMouseDown={(e) => e.preventDefault()}
        onClick={onNewTab}
        className="flex items-center justify-center w-7 h-7 rounded-md text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-colors shrink-0"
        title="New Tab (Ctrl+Shift+T)"
      >
        <Plus className="w-4 h-4" />
      </button>
    </div>
  );
}
