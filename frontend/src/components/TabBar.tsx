import { Columns, Copy, Plus, Rows, X } from 'lucide-react';
import type { TabState } from '../types/tabs';

interface TabBarProps {
  tabs: TabState[];
  activeTabId: string;
  isPending: boolean;
  onSelectTab: (tabId: string) => void;
  onCloseTab: (tabId: string) => void;
  onNewTab: () => void;
  onSplit: (direction: 'horizontal' | 'vertical') => void;
  onShareObserver: () => void;
}

export function TabBar({
  tabs,
  activeTabId,
  isPending,
  onSelectTab,
  onCloseTab,
  onNewTab,
  onSplit,
  onShareObserver,
}: TabBarProps) {
  return (
    <div className="flex items-center justify-between bg-slate-900 border-b border-slate-800 px-2 h-10 select-none">
      <div className="flex items-center space-x-1 overflow-x-auto flex-1 h-full scrollbar-none">
        {tabs.map((tab) => {
          const isActive = tab.id === activeTabId;
          return (
            <div
              key={tab.id}
              onClick={() => onSelectTab(tab.id)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') onSelectTab(tab.id);
              }}
              role="tab"
              aria-selected={isActive}
              tabIndex={0}
              className={`flex items-center space-x-2 px-3 py-1 text-xs rounded-t border-t-2 cursor-pointer transition-colors max-w-[200px] truncate ${
                isActive
                  ? 'bg-slate-950 border-cyan-500 text-slate-100 font-medium'
                  : 'bg-slate-900 border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <span className="truncate">{tab.title}</span>
              {tabs.length > 1 && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onCloseTab(tab.id);
                  }}
                  className="p-0.5 rounded text-slate-400 hover:text-red-400 hover:bg-slate-800"
                  title="Close Tab"
                >
                  <X size={12} />
                </button>
              )}
            </div>
          );
        })}

        <button
          type="button"
          onClick={onNewTab}
          className="p-1 rounded text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
          title="New Tab (Ctrl+Shift+T)"
        >
          <Plus size={14} />
        </button>

        {isPending && (
          <span className="text-[10px] text-cyan-400 animate-pulse px-2">Switching...</span>
        )}
      </div>

      <div className="flex items-center space-x-1 pl-2">
        <button
          type="button"
          onClick={() => onSplit('horizontal')}
          className="p-1.5 rounded text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
          title="Split Horizontally (Ctrl+Shift+H)"
        >
          <Rows size={14} />
        </button>
        <button
          type="button"
          onClick={() => onSplit('vertical')}
          className="p-1.5 rounded text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
          title="Split Vertically (Ctrl+Shift+V)"
        >
          <Columns size={14} />
        </button>
        <button
          type="button"
          onClick={onShareObserver}
          className="p-1.5 rounded text-slate-400 hover:text-cyan-300 hover:bg-slate-800 transition-colors"
          title="Copy Observer Link (Shared / Read-Only)"
        >
          <Copy size={14} />
        </button>
      </div>
    </div>
  );
}
