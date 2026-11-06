import type { ITheme } from '@xterm/xterm';

export type ThemePreset =
  | 'tokyoNight'
  | 'catppuccin'
  | 'catppuccinLatte'
  | 'oneDark'
  | 'dracula'
  | 'gruvbox'
  | 'nord'
  | 'rosePine'
  | 'kanagawa'
  | 'everforest'
  | 'ayuDark'
  | 'solarizedDark'
  | 'githubDark'
  | 'monokai';

function makeTheme(
  background: string,
  foreground: string,
  cursor: string,
  selectionBackground: string,
  normal8: string,
  bright8: string
): ITheme {
  const n = normal8.split(' ');
  const b = bright8.split(' ');
  return {
    background,
    foreground,
    cursor,
    cursorAccent: background,
    selectionBackground,
    black: n[0],
    red: n[1],
    green: n[2],
    yellow: n[3],
    blue: n[4],
    magenta: n[5],
    cyan: n[6],
    white: n[7],
    brightBlack: b[0],
    brightRed: b[1],
    brightGreen: b[2],
    brightYellow: b[3],
    brightBlue: b[4],
    brightMagenta: b[5],
    brightCyan: b[6],
    brightWhite: b[7],
  };
}

export const TERMINAL_THEMES: Record<ThemePreset, ITheme> = {
  tokyoNight: makeTheme(
    '#1a1b26',
    '#c0caf5',
    '#c0caf5',
    '#33467c',
    '#15161e #f7768e #9ece6a #e0af68 #7aa2f7 #bb9af7 #7dcfff #a9b1d6',
    '#414868 #f7768e #9ece6a #e0af68 #7aa2f7 #bb9af7 #7dcfff #c0caf5'
  ),
  catppuccin: makeTheme(
    '#1e1e2e',
    '#cdd6f4',
    '#f5e0dc',
    '#45475a',
    '#45475a #f38ba8 #a6e3a1 #f9e2af #89b4fa #f5c2e7 #94e2d5 #bac2de',
    '#585b70 #f38ba8 #a6e3a1 #f9e2af #89b4fa #f5c2e7 #94e2d5 #a6adc8'
  ),
  catppuccinLatte: makeTheme(
    '#eff1f5',
    '#4c4f69',
    '#dc8a78',
    '#acb0be',
    '#5c5f77 #d20f39 #40a02b #df8e1d #1e66f5 #ea76cb #179299 #acb0be',
    '#6c6f85 #d20f39 #40a02b #df8e1d #1e66f5 #ea76cb #179299 #bcc0cc'
  ),
  oneDark: makeTheme(
    '#1e2127',
    '#abb2bf',
    '#528bff',
    '#3e4451',
    '#282c34 #e06c75 #98c379 #e5c07b #61afef #c678dd #56b6c2 #abb2bf',
    '#5c6370 #e06c75 #98c379 #e5c07b #61afef #c678dd #56b6c2 #ffffff'
  ),
  dracula: makeTheme(
    '#282a36',
    '#f8f8f2',
    '#f8f8f2',
    '#44475a',
    '#21222c #ff5555 #50fa7b #f1fa8c #bd93f9 #ff79c6 #8be9fd #f8f8f2',
    '#6272a4 #ff6e6e #69ff94 #ffffa5 #d6acff #ff92df #a4ffff #ffffff'
  ),
  gruvbox: makeTheme(
    '#282828',
    '#ebdbb2',
    '#fe8019',
    '#504945',
    '#282828 #cc241d #98971a #d79921 #458588 #b16286 #689d6a #a89984',
    '#928374 #fb4934 #b8bb26 #fabd2f #83a598 #d3869b #8ec07c #ebdbb2'
  ),
  nord: makeTheme(
    '#2e3440',
    '#d8dee9',
    '#88c0d0',
    '#434c5e',
    '#3b4252 #bf616a #a3be8c #ebcb8b #81a1c1 #b48ead #88c0d0 #e5e9f0',
    '#4c566a #bf616a #a3be8c #ebcb8b #81a1c1 #b48ead #8fbcbb #eceff4'
  ),
  rosePine: makeTheme(
    '#191724',
    '#e0def4',
    '#ebbcba',
    '#2a283e',
    '#26233a #eb6f92 #31748f #f6c177 #9ccfd8 #c4a7e7 #ebbcba #e0def4',
    '#6e6a86 #eb6f92 #31748f #f6c177 #9ccfd8 #c4a7e7 #ebbcba #e0def4'
  ),
  kanagawa: makeTheme(
    '#1f1f28',
    '#dcd7ba',
    '#c8c093',
    '#2d4f67',
    '#090618 #c34043 #76946a #c0a36e #7e9cd8 #957fb8 #6a9589 #c8c093',
    '#727169 #e82424 #98bb6c #e6c384 #7fb4ca #938aa9 #7aa89f #dcd7ba'
  ),
  everforest: makeTheme(
    '#2d353b',
    '#d3c6aa',
    '#d3c6aa',
    '#475258',
    '#343f44 #e67e80 #a7c080 #dbbc7f #7fbbb3 #d699b6 #83c092 #d3c6aa',
    '#4f585e #e67e80 #a7c080 #dbbc7f #7fbbb3 #d699b6 #83c092 #d3c6aa'
  ),
  ayuDark: makeTheme(
    '#0b0e14',
    '#bfbdb6',
    '#e6b450',
    '#273747',
    '#01060e #ea6c73 #91b362 #f9af4f #53bdfa #fae994 #90e1c6 #c7c7c7',
    '#686868 #f07178 #c2d94c #ffb454 #59c2ff #ffee99 #95e6cb #ffffff'
  ),
  solarizedDark: makeTheme(
    '#002b36',
    '#839496',
    '#93a1a1',
    '#073642',
    '#073642 #dc322f #859900 #b58900 #268bd2 #d33682 #2aa198 #eee8d5',
    '#586e75 #cb4b16 #586e75 #657b83 #839496 #6c71c4 #93a1a1 #fdf6e3'
  ),
  githubDark: makeTheme(
    '#0d1117',
    '#c9d1d9',
    '#58a6ff',
    '#1f3a5f',
    '#484f58 #ff7b72 #3fb950 #d29922 #58a6ff #bc8cff #39c5cf #b1bac4',
    '#6e7681 #ffa198 #56d364 #e3b341 #79c0ff #d2a8ff #56d4dd #f0f6fc'
  ),
  monokai: makeTheme(
    '#2d2a2e',
    '#fcfcfa',
    '#fcfcfa',
    '#403e41',
    '#403e41 #ff6188 #a9dc76 #ffd866 #fc9867 #ab9df2 #78dce8 #fcfcfa',
    '#727072 #ff6188 #a9dc76 #ffd866 #fc9867 #ab9df2 #78dce8 #fcfcfa'
  ),
};
