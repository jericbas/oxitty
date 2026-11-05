import { Activity, LayoutGrid, ShieldCheck } from 'lucide-react';
import type React from 'react';

interface StatusBarProps {
  cols: number;
  rows: number;
  latency: number | null;
  readOnly?: boolean;
}

export const StatusBar: React.FC<StatusBarProps> = ({ cols, rows, latency, readOnly = false }) => {
  return (
    <footer className="flex items-center justify-between px-3 py-1 bg-slate-950 border-t border-slate-800 text-[11px] font-mono text-slate-400 select-none">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-1.5">
          <LayoutGrid className="w-3.5 h-3.5 text-slate-500" />
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
            <Activity className="w-3.5 h-3.5 text-slate-500" />
            <span>{latency} ms</span>
          </div>
        )}
        <div className="text-slate-500">UTF-8 / WebGL</div>
      </div>
    </footer>
  );
};
