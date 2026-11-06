import type { ITheme } from '@xterm/xterm';
import type { CustomColors } from './generated';

export interface TerminalPreferences {
  fontSize: number;
  fontFamily: string;
  cursorBlink: boolean;
  themeName: 'dracula' | 'nord' | 'oneDark' | 'catppuccin';
  customColors?: CustomColors;
}

export const TERMINAL_THEMES: Record<TerminalPreferences['themeName'], ITheme> = {
  dracula: {
    background: '#282a36',
    foreground: '#f8f8f2',
    cursor: '#f8f8f2',
    cursorAccent: '#282a36',
    selectionBackground: 'rgba(255, 255, 255, 0.2)',
    black: '#21222c',
    red: '#ff5555',
    green: '#50fa7b',
    yellow: '#f1fa8c',
    blue: '#bd93f9',
    magenta: '#ff79c6',
    cyan: '#8be9fd',
    white: '#f8f8f2',
  },
  nord: {
    background: '#2e3440',
    foreground: '#d8dee9',
    cursor: '#d8dee9',
    selectionBackground: '#434c5e',
    black: '#3b4252',
    red: '#bf616a',
    green: '#a3be8c',
    yellow: '#ebcb8b',
    blue: '#81a1c1',
    magenta: '#b48ead',
    cyan: '#88c0d0',
    white: '#e5e9f0',
  },
  oneDark: {
    background: '#1e1e1e',
    foreground: '#abb2bf',
    cursor: '#528bff',
    selectionBackground: '#3e4451',
    black: '#282c34',
    red: '#e06c75',
    green: '#98c379',
    yellow: '#e5c07b',
    blue: '#61afef',
    magenta: '#c678dd',
    cyan: '#56b6c2',
    white: '#abb2bf',
  },
  catppuccin: {
    background: '#1e1e2e',
    foreground: '#cdd6f4',
    cursor: '#f5e0dc',
    selectionBackground: '#585b70',
    black: '#45475a',
    red: '#f38ba8',
    green: '#a6e3a1',
    yellow: '#f9e2af',
    blue: '#89b4fa',
    magenta: '#f5c2e7',
    cyan: '#94e2d5',
    white: '#bac2de',
  },
};

export function resolveTheme(
  themeName: TerminalPreferences['themeName'],
  customColors?: CustomColors
): ITheme {
  const base = { ...TERMINAL_THEMES[themeName] };
  if (!customColors) return base;
  for (const [key, val] of Object.entries(customColors)) {
    if (val) {
      (base as Record<string, string>)[key] = val;
    }
  }
  return base;
}
