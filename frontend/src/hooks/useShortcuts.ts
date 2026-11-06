import { useEffect } from 'react';

interface ShortcutActions {
  onNewTab: () => void;
  onCloseTab: () => void;
  onSplitHorizontal: () => void;
  onSplitVertical: () => void;
}

export function useShortcuts({
  onNewTab,
  onCloseTab,
  onSplitHorizontal,
  onSplitVertical,
}: ShortcutActions) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!e.ctrlKey || !e.shiftKey) return;

      switch (e.key.toLowerCase()) {
        case 't':
          e.preventDefault();
          onNewTab();
          break;
        case 'w':
          e.preventDefault();
          onCloseTab();
          break;
        case 'h':
          e.preventDefault();
          onSplitHorizontal();
          break;
        case 'v':
          e.preventDefault();
          onSplitVertical();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onNewTab, onCloseTab, onSplitHorizontal, onSplitVertical]);
}
