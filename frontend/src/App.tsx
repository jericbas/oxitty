import { useCallback, useState } from 'react';
import { Header } from './components/Header';
import { SettingsModal } from './components/SettingsModal';
import { StatusBar } from './components/StatusBar';
import { TerminalView } from './components/TerminalView';
import { useTerminal } from './hooks/useTerminal';
import { useWebSocket } from './hooks/useWebSocket';
import type { ServerMessage } from './types/generated';
import type { TerminalPreferences } from './types/theme';

export function App() {
  const [title, setTitle] = useState('oxitty');
  const [readOnly, setReadOnly] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [preferences, setPreferences] = useState<TerminalPreferences>({
    fontSize: 14,
    fontFamily: 'JetBrains Mono, Menlo, monospace',
    cursorBlink: true,
    themeName: 'oneDark',
  });

  const handleMessage = useCallback((msg: ServerMessage) => {
    switch (msg.type) {
      case 'Init':
        setTitle(msg.payload.title);
        setReadOnly(msg.payload.read_only);
        setPreferences((prev) => ({
          ...prev,
          fontSize: msg.payload.font_size,
          fontFamily: msg.payload.font_family,
          cursorBlink: msg.payload.cursor_blink,
        }));
        break;
      case 'Output':
        write(msg.payload);
        break;
      case 'SetTitle':
        setTitle(msg.payload);
        document.title = `${msg.payload} - oxitty`;
        break;
      case 'ProcessExited':
        write(`\r\n\x1b[33m[Process exited with code ${msg.payload ?? 'none'}]\x1b[0m\r\n`);
        break;
      case 'Error':
        write(`\r\n\x1b[31m[Server Error: ${msg.payload}]\x1b[0m\r\n`);
        break;
    }
  }, []);

  const { status, latency, send, reconnect } = useWebSocket({
    onMessage: handleMessage,
  });

  const { containerRef, write, dimensions } = useTerminal({
    preferences,
    onInput: (data) => {
      send({ type: 'Input', payload: data });
    },
    onResize: (dims) => {
      send({ type: 'Resize', payload: dims });
    },
  });

  const handleUpdatePreferences = (update: Partial<TerminalPreferences>) => {
    setPreferences((prev) => ({ ...prev, ...update }));
  };

  return (
    <div className="flex flex-col w-screen h-screen overflow-hidden bg-slate-950">
      <Header
        title={title}
        status={status}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onReconnect={reconnect}
      />

      <TerminalView containerRef={containerRef} />

      <StatusBar
        cols={dimensions.cols}
        rows={dimensions.rows}
        latency={latency}
        readOnly={readOnly}
      />

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        preferences={preferences}
        onUpdate={handleUpdatePreferences}
      />
    </div>
  );
}

export default App;
