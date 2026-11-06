import { X } from 'lucide-react';
import type React from 'react';
import { useEffect } from 'react';
import {
  TERMINAL_THEMES,
  THEME_OPTIONS,
  type TerminalPreferences,
  type ThemePreset,
} from '../types/theme';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  preferences: TerminalPreferences;
  onUpdate: (prefs: Partial<TerminalPreferences>) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  preferences,
  onUpdate,
}) => {
  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const activePalette = TERMINAL_THEMES[preferences.themeName];
  const swatches = [
    activePalette.red,
    activePalette.green,
    activePalette.yellow,
    activePalette.blue,
    activePalette.magenta,
    activePalette.cyan,
  ];

  return (
    <div
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 backdrop-blur-xs p-4"
    >
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-xl shadow-2xl p-5 text-slate-200">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <h2 id="settings-title" className="text-sm font-semibold font-mono text-sky-400">
            Terminal Preferences
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-4 py-4 text-sm">
          <div>
            <label htmlFor="pref-theme" className="block text-xs font-mono text-slate-400 mb-1.5">
              Color Theme ({THEME_OPTIONS.length} Presets)
            </label>
            <select
              id="pref-theme"
              value={preferences.themeName}
              onChange={(e) => onUpdate({ themeName: e.target.value as ThemePreset })}
              className="w-full bg-slate-800 border border-slate-700 rounded-md px-3 py-2 text-xs text-slate-200 font-mono focus:outline-none focus:border-sky-500"
            >
              {THEME_OPTIONS.map((opt) => (
                <option key={opt.id} value={opt.id}>
                  {opt.label}
                </option>
              ))}
            </select>
            <div
              style={{ backgroundColor: activePalette.background, color: activePalette.foreground }}
              className="mt-2 flex items-center justify-between px-3 py-1.5 rounded-md border border-slate-700/80 font-mono text-[11px]"
            >
              <span>~/oxitty $ cargo run</span>
              <div className="flex items-center gap-1.5">
                {swatches.map((hex) => (
                  <span
                    key={hex}
                    style={{ backgroundColor: hex }}
                    className="w-2.5 h-2.5 rounded-full"
                  />
                ))}
              </div>
            </div>
          </div>

          <div>
            <label
              htmlFor="pref-font-size"
              className="block text-xs font-mono text-slate-400 mb-1.5"
            >
              Font Size ({preferences.fontSize}px)
            </label>
            <input
              id="pref-font-size"
              type="range"
              min="10"
              max="24"
              value={preferences.fontSize}
              onChange={(e) => onUpdate({ fontSize: Number(e.target.value) })}
              className="w-full accent-sky-400 cursor-pointer"
            />
          </div>

          <div>
            <label
              htmlFor="pref-font-family"
              className="block text-xs font-mono text-slate-400 mb-1.5"
            >
              Font Family
            </label>
            <input
              id="pref-font-family"
              type="text"
              value={preferences.fontFamily}
              onChange={(e) => onUpdate({ fontFamily: e.target.value })}
              className="w-full bg-slate-800 border border-slate-700 rounded-md px-3 py-2 text-slate-200 font-mono text-xs focus:outline-none focus:border-sky-500"
            />
          </div>

          <div className="flex items-center justify-between pt-1">
            <label htmlFor="pref-cursor-blink" className="text-xs font-mono text-slate-400">
              Cursor Blink
            </label>
            <input
              id="pref-cursor-blink"
              type="checkbox"
              checked={preferences.cursorBlink}
              onChange={(e) => onUpdate({ cursorBlink: e.target.checked })}
              className="w-4 h-4 rounded bg-slate-800 border-slate-700 accent-sky-500 cursor-pointer"
            />
          </div>

          <div className="pt-2 border-t border-slate-800/80 text-[11px] font-mono text-slate-400 space-y-1">
            <div className="flex justify-between">
              <span>New / Close Tab</span>
              <span className="text-slate-300">Ctrl+Shift+T / W</span>
            </div>
            <div className="flex justify-between">
              <span>Split Horizontal / Vertical</span>
              <span className="text-slate-300">Alt+Shift+H / V</span>
            </div>
            <div className="flex justify-between">
              <span>Copy / Paste / Zoom</span>
              <span className="text-slate-300">Ctrl+Shift+C / V, Ctrl+±</span>
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-3 border-t border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 bg-sky-600 hover:bg-sky-500 text-white rounded-md text-xs font-medium transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
