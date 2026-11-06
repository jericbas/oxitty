import { useEffect, useRef } from 'react';

interface ShortcutActions {
  onNewTab: () => void;
  onCloseActive: () => void;
  onSplitHorizontal: () => void;
  onSplitVertical: () => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onZoomReset: () => void;
}

function getShortcutCombo(e: KeyboardEvent): string {
  const parts: string[] = [];
  if (e.ctrlKey) parts.push('ctrl');
  if (e.altKey) parts.push('alt');
  if (e.shiftKey) parts.push('shift');
  parts.push(e.key.toLowerCase());
  return parts.join('+');
}

export function useShortcuts(actions: ShortcutActions) {
  const actionsRef = useRef(actions);
  actionsRef.current = actions;

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const a = actionsRef.current;
      const bindings: Record<string, () => void> = {
        'ctrl+shift+t': a.onNewTab,
        'ctrl+shift+w': a.onCloseActive,
        'alt+shift+h': a.onSplitHorizontal,
        'alt+shift+v': a.onSplitVertical,
        'ctrl+=': a.onZoomIn,
        'ctrl++': a.onZoomIn,
        'ctrl+-': a.onZoomOut,
        'ctrl+0': a.onZoomReset,
      };
      const handler = bindings[getShortcutCombo(e)];
      if (handler) {
        e.preventDefault();
        handler();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);
}
