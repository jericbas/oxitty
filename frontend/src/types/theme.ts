import type { ITheme } from '@xterm/xterm';
import type { CustomColors } from './generated';
import { TERMINAL_THEMES, type ThemePreset } from './presets';

export { TERMINAL_THEMES, type ThemePreset };

export interface TerminalPreferences {
  fontSize: number;
  fontFamily: string;
  cursorBlink: boolean;
  themeName: ThemePreset;
  customColors?: CustomColors;
}

export const THEME_OPTIONS: ReadonlyArray<{ id: ThemePreset; label: string }> = [
  { id: 'tokyoNight', label: 'Tokyo Night' },
  { id: 'catppuccin', label: 'Catppuccin Mocha' },
  { id: 'catppuccinLatte', label: 'Catppuccin Latte (Light)' },
  { id: 'oneDark', label: 'One Dark' },
  { id: 'dracula', label: 'Dracula' },
  { id: 'gruvbox', label: 'Gruvbox Dark' },
  { id: 'nord', label: 'Nord' },
  { id: 'rosePine', label: 'Rosé Pine' },
  { id: 'kanagawa', label: 'Kanagawa' },
  { id: 'everforest', label: 'Everforest Dark' },
  { id: 'ayuDark', label: 'Ayu Dark' },
  { id: 'solarizedDark', label: 'Solarized Dark' },
  { id: 'githubDark', label: 'GitHub Dark' },
  { id: 'monokai', label: 'Monokai Pro' },
];

export const THEME_LABELS: Record<ThemePreset, string> = Object.fromEntries(
  THEME_OPTIONS.map((t) => [t.id, t.label])
) as Record<ThemePreset, string>;

const PRESET_ALIASES: Record<string, ThemePreset> = {
  onedark: 'oneDark',
  tokyonight: 'tokyoNight',
  catppuccin: 'catppuccin',
  catppuccinmocha: 'catppuccin',
  catppuccinlatte: 'catppuccinLatte',
  dracula: 'dracula',
  gruvbox: 'gruvbox',
  gruvboxdark: 'gruvbox',
  nord: 'nord',
  rosepine: 'rosePine',
  kanagawa: 'kanagawa',
  everforest: 'everforest',
  everforestdark: 'everforest',
  ayu: 'ayuDark',
  ayudark: 'ayuDark',
  solarized: 'solarizedDark',
  solarizeddark: 'solarizedDark',
  github: 'githubDark',
  githubdark: 'githubDark',
  monokai: 'monokai',
  monokaipro: 'monokai',
};

export function normalizeThemePreset(val?: string): ThemePreset | undefined {
  if (!val) return undefined;
  const key = val.toLowerCase().replace(/[-_\s]/g, '');
  return PRESET_ALIASES[key];
}

const COLOR_KEY_MAP: Record<string, keyof ITheme> = {
  background: 'background',
  foreground: 'foreground',
  cursor: 'cursor',
  black: 'black',
  red: 'red',
  green: 'green',
  yellow: 'yellow',
  blue: 'blue',
  magenta: 'magenta',
  cyan: 'cyan',
  white: 'white',
  bright_black: 'brightBlack',
  bright_red: 'brightRed',
  bright_green: 'brightGreen',
  bright_yellow: 'brightYellow',
  bright_blue: 'brightBlue',
  bright_magenta: 'brightMagenta',
  bright_cyan: 'brightCyan',
  bright_white: 'brightWhite',
};

export function resolveTheme(themeName: ThemePreset, customColors?: CustomColors): ITheme {
  const base: ITheme = { ...TERMINAL_THEMES[themeName] };
  if (!customColors) return base;
  for (const [key, val] of Object.entries(customColors)) {
    const mapped = COLOR_KEY_MAP[key];
    if (mapped && val) {
      (base as Record<string, string>)[mapped] = val;
    }
  }
  return base;
}
