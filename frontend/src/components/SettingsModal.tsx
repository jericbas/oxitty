import { X } from 'lucide-react';
import type React from 'react';
import type { TerminalPreferences } from '../types/theme';

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
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-lg shadow-xl p-5 text-slate-200">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <h2 className="text-base font-semibold font-mono text-sky-400">Terminal Preferences</h2>
          <button type="button" onClick={onClose} className="text-slate-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-4 py-4 text-sm font-sans">
          <div>
            <label htmlFor="pref-theme" className="block text-xs font-mono text-slate-400 mb-1">
              Theme
            </label>
            <select
              id="pref-theme"
              value={preferences.themeName}
              onChange={(e) =>
                onUpdate({
                  themeName: e.target.value as TerminalPreferences['themeName'],
                })
              }
              className="w-full bg-slate-800 border border-slate-700 rounded px-2.5 py-1.5 text-slate-200 font-mono focus:outline-none focus:border-sky-500"
            >
              <option value="dracula">Dracula</option>
              <option value="nord">Nord</option>
              <option value="oneDark">One Dark</option>
              <option value="catppuccin">Catppuccin Mocha</option>
            </select>
          </div>

          <div>
            <label htmlFor="pref-font-size" className="block text-xs font-mono text-slate-400 mb-1">
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
              className="block text-xs font-mono text-slate-400 mb-1"
            >
              Font Family
            </label>
            <input
              id="pref-font-family"
              type="text"
              value={preferences.fontFamily}
              onChange={(e) => onUpdate({ fontFamily: e.target.value })}
              className="w-full bg-slate-800 border border-slate-700 rounded px-2.5 py-1.5 text-slate-200 font-mono text-xs focus:outline-none focus:border-sky-500"
            />
          </div>

          <div className="flex items-center justify-between pt-2">
            <label htmlFor="pref-cursor-blink" className="text-xs font-mono text-slate-400">
              Cursor Blink
            </label>
            <input
              id="pref-cursor-blink"
              type="checkbox"
              checked={preferences.cursorBlink}
              onChange={(e) => onUpdate({ cursorBlink: e.target.checked })}
              className="w-4 h-4 rounded bg-slate-800 border-slate-700 text-sky-500 focus:ring-0 cursor-pointer"
            />
          </div>
        </div>

        <div className="flex justify-end pt-3 border-t border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 bg-sky-600 hover:bg-sky-500 text-white rounded text-xs font-medium transition"
          >
            Apply & Close
          </button>
        </div>
      </div>
    </div>
  );
};
