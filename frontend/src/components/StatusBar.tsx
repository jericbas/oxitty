import { Activity, LayoutGrid, Palette, ShieldCheck } from 'lucide-react';
import type React from 'react';
import { THEME_LABELS, type ThemePreset } from '../types/theme';

interface StatusBarProps {
  cols: number;
  rows: number;
  latency: number | null;
  themeName: ThemePreset;
  readOnly?: boolean;
  onCycleTheme: () => void;
}

export const StatusBar: React.FC<StatusBarProps> = ({
  cols,
  rows,
  latency,
  themeName,
  readOnly = false,
  onCycleTheme,
}) => {
  return (
    <footer className="flex items-center justify-between px-3 h-6 bg-slate-950 border-t border-slate-800 text-[11px] font-mono text-slate-400 select-none shrink-0">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-1.5">
          <LayoutGrid className="w-3 h-3 text-slate-500" />
          <span>
            {cols} &times; {rows}
          </span>
        </div>

        {readOnly && (
          <div className="flex items-center gap-1 text-amber-400 font-semibold">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>READ-ONLY</span>
          </div>
        )}
      </div>

      <div className="flex items-center gap-4">
        {latency !== null && (
          <div className="flex items-center gap-1">
            <Activity className="w-3 h-3 text-emerald-500/80" />
            <span>{latency} ms</span>
          </div>
        )}
        <button
          type="button"
          onClick={onCycleTheme}
          className="flex items-center gap-1 text-slate-400 hover:text-sky-400 transition-colors cursor-pointer"
          title="Click to cycle color theme"
        >
          <Palette className="w-3 h-3" />
          <span>{THEME_LABELS[themeName]}</span>
        </button>
        <div className="text-slate-500 hidden sm:block">UTF-8 / WebGL</div>
      </div>
    </footer>
  );
};
