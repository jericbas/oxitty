import { FitAddon } from '@xterm/addon-fit';
import { WebglAddon } from '@xterm/addon-webgl';
import { Terminal } from '@xterm/xterm';
import { useCallback, useEffect, useRef, useState } from 'react';
import type { ResizePayload } from '../types/generated';
import { type TerminalPreferences, resolveTheme } from '../types/theme';

interface UseTerminalOptions {
  preferences: TerminalPreferences;
  onInput: (data: string) => void;
  onResize: (dimensions: ResizePayload) => void;
  onTitleChange?: (title: string) => void;
}

const PASSTHROUGH_COMBOS = new Set([
  'ctrl+shift+t',
  'ctrl+shift+w',
  'alt+shift+h',
  'alt+shift+v',
  'ctrl+=',
  'ctrl++',
  'ctrl+-',
  'ctrl+0',
  'ctrl+shift+v',
]);

function createKeyHandler(term: Terminal) {
  return (e: KeyboardEvent): boolean => {
    if (e.type !== 'keydown') return true;
    const combo = [
      e.ctrlKey ? 'ctrl' : '',
      e.altKey ? 'alt' : '',
      e.shiftKey ? 'shift' : '',
      e.key.toLowerCase(),
    ]
      .filter(Boolean)
      .join('+');

    if (combo === 'ctrl+shift+c') {
      const selection = term.getSelection();
      if (selection) navigator.clipboard?.writeText(selection).catch(() => {});
      e.preventDefault();
      return false;
    }

    return !PASSTHROUGH_COMBOS.has(combo);
  };
}

export function useTerminal({ preferences, onInput, onResize, onTitleChange }: UseTerminalOptions) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const termRef = useRef<Terminal | null>(null);
  const fitAddonRef = useRef<FitAddon | null>(null);
  const initialPrefsRef = useRef(preferences);
  const onResizeRef = useRef(onResize);
  const onInputRef = useRef(onInput);
  const onTitleChangeRef = useRef(onTitleChange);
  onResizeRef.current = onResize;
  onInputRef.current = onInput;
  onTitleChangeRef.current = onTitleChange;

  const [dimensions, setDimensions] = useState<{ cols: number; rows: number }>({
    cols: 80,
    rows: 24,
  });

  const write = useCallback((data: string) => {
    termRef.current?.write(data);
  }, []);

  const clear = useCallback(() => {
    termRef.current?.clear();
  }, []);

  const focus = useCallback(() => {
    termRef.current?.focus();
  }, []);

  const fit = useCallback(() => {
    const fitAddon = fitAddonRef.current;
    const term = termRef.current;
    const el = containerRef.current;
    if (!fitAddon || !term || !el || el.clientWidth === 0 || el.clientHeight === 0) {
      return;
    }
    try {
      fitAddon.fit();
      const cols = term.cols;
      const rows = term.rows;
      setDimensions((prev) => (prev.cols === cols && prev.rows === rows ? prev : { cols, rows }));
      onResizeRef.current({ cols, rows });
    } catch {
      // Ignore transient layout errors while hidden
    }
  }, []);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const initPrefs = initialPrefsRef.current;
    const term = new Terminal({
      cursorBlink: initPrefs.cursorBlink,
      fontFamily: initPrefs.fontFamily,
      fontSize: initPrefs.fontSize,
      theme: resolveTheme(initPrefs.themeName, initPrefs.customColors),
      scrollback: 5000,
      allowProposedApi: true,
    });

    const fitAddon = new FitAddon();
    term.loadAddon(fitAddon);
    term.open(container);

    try {
      const webgl = new WebglAddon();
      webgl.onContextLoss(() => webgl.dispose());
      term.loadAddon(webgl);
    } catch {
      // Graceful fallback to canvas/DOM renderer
    }

    term.attachCustomKeyEventHandler(createKeyHandler(term));

    termRef.current = term;
    fitAddonRef.current = fitAddon;

    const inputSub = term.onData((data) => onInputRef.current(data));
    const titleSub = term.onTitleChange((title) => {
      if (title.trim()) onTitleChangeRef.current?.(title.trim());
    });

    requestAnimationFrame(() => {
      fit();
      term.focus();
    });
    document.fonts?.ready.then(() => fit()).catch(() => {});

    const observer = new ResizeObserver(() => fit());
    observer.observe(container);

    return () => {
      observer.disconnect();
      inputSub.dispose();
      titleSub.dispose();
      term.dispose();
      termRef.current = null;
      fitAddonRef.current = null;
    };
  }, [fit]);

  useEffect(() => {
    const term = termRef.current;
    if (!term) return;
    term.options.cursorBlink = preferences.cursorBlink;
    term.options.fontFamily = preferences.fontFamily;
    term.options.fontSize = preferences.fontSize;
    term.options.theme = resolveTheme(preferences.themeName, preferences.customColors);
    requestAnimationFrame(() => fit());
  }, [preferences, fit]);

  return { containerRef, write, clear, focus, fit, dimensions };
}
