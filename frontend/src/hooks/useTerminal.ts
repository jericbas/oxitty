import { FitAddon } from '@xterm/addon-fit';
import { WebglAddon } from '@xterm/addon-webgl';
import { Terminal } from '@xterm/xterm';
import { useCallback, useEffect, useRef, useState } from 'react';
import type { ResizePayload } from '../types/generated';
import { TERMINAL_THEMES, type TerminalPreferences } from '../types/theme';

interface UseTerminalOptions {
  preferences: TerminalPreferences;
  onInput: (data: string) => void;
  onResize: (dimensions: ResizePayload) => void;
}

export function useTerminal({ preferences, onInput, onResize }: UseTerminalOptions) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const termRef = useRef<Terminal | null>(null);
  const fitAddonRef = useRef<FitAddon | null>(null);
  const onResizeRef = useRef(onResize);
  const onInputRef = useRef(onInput);
  onResizeRef.current = onResize;
  onInputRef.current = onInput;

  const [dimensions, setDimensions] = useState<{ cols: number; rows: number }>({
    cols: 80,
    rows: 24,
  });

  const write = useCallback((data: string) => {
    termRef.current?.write(data);
  }, []);

  const fit = useCallback(() => {
    if (fitAddonRef.current && termRef.current) {
      fitAddonRef.current.fit();
      const cols = termRef.current.cols;
      const rows = termRef.current.rows;
      setDimensions({ cols, rows });
      onResizeRef.current({ cols, rows });
    }
  }, []);

  useEffect(() => {
    if (!containerRef.current) return;

    const term = new Terminal({
      cursorBlink: preferences.cursorBlink,
      fontFamily: preferences.fontFamily,
      fontSize: preferences.fontSize,
      theme: TERMINAL_THEMES[preferences.themeName],
      allowProposedApi: true,
    });

    const fitAddon = new FitAddon();
    term.loadAddon(fitAddon);

    term.open(containerRef.current);

    try {
      const webgl = new WebglAddon();
      webgl.onContextLoss(() => webgl.dispose());
      term.loadAddon(webgl);
    } catch {
      // Graceful fallback to default canvas/DOM renderer
    }

    termRef.current = term;
    fitAddonRef.current = fitAddon;

    fitAddon.fit();
    setDimensions({ cols: term.cols, rows: term.rows });
    onResizeRef.current({ cols: term.cols, rows: term.rows });

    const inputSub = term.onData((data) => {
      onInputRef.current(data);
    });

    const observer = new ResizeObserver(() => fit());
    observer.observe(containerRef.current);

    return () => {
      observer.disconnect();
      inputSub.dispose();
      term.dispose();
    };
  }, [preferences, fit]);

  return { containerRef, write, fit, dimensions };
}
