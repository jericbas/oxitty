export interface PaneState {
  id: string;
  sessionId?: string;
  title: string;
  isReadOnly?: boolean;
}

export type SplitDirection = 'none' | 'horizontal' | 'vertical';

export interface TabState {
  id: string;
  title: string;
  panes: PaneState[];
  splitDirection: SplitDirection;
  activePaneId: string;
}
