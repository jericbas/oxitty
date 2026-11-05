import type React from 'react';
import type { RefObject } from 'react';
import '@xterm/xterm/css/xterm.css';

interface TerminalViewProps {
  containerRef: RefObject<HTMLDivElement | null>;
}

export const TerminalView: React.FC<TerminalViewProps> = ({ containerRef }) => {
  return (
    <main
      className="flex-1 w-full h-full bg-[#1e1e1e] overflow-hidden relative"
      aria-label="Terminal display area"
    >
      <div ref={containerRef} className="w-full h-full p-2 outline-none" />
    </main>
  );
};
