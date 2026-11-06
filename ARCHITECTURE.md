# 🏗️ Oxitty Architecture & Technical Specification

Oxitty re-engineers terminal web-sharing from first principles using modern systems programming (Rust, Tokio, Axum) and reactive web engineering (React 19, Bun, Vite, Biome).

---

## 📊 Comparison: `ttyd` vs `oxitty`

| Architectural Vector | `ttyd` (tsl0922/ttyd) | `oxitty` (Rust Reimagined) |
|---|---|---|
| **Core Language** | C (libwebsockets, libuv, posix_openpt) | Rust (Axum, Tokio, portable-pty) |
| **Memory Safety** | Manual pointer/buffer handling | Guaranteed by Rust borrow checker |
| **PTY Abstraction** | Platform-specific C calls / OpenPTY / ConPTY | `portable-pty` (Cross-platform Linux, macOS, Windows) |
| **Frontend Framework** | Vanilla TypeScript + Webpack | React 19 + TypeScript + Bun + Vite |
| **Type Synchronization** | Manual ad-hoc opcode matching (`'0'`, `'1'`, etc.) | Typed wire schemas verified and type-checked via [`tsrs`](https://github.com/oxc-project/tsrs) |
| **Renderer Engine** | DOM / Canvas xterm.js | Hardware-accelerated WebGL with Canvas fallback |
| **Styling & Theme Engine**| Static CSS | Modern UI with Tailwind CSS v4 + instant theme hot-swapping |
| **Code Modularity** | Monolithic C files | Strict **<= 200 SLOC** per file enforced via Biome & Bun script |
| **Single Binary Delivery** | CMake + xxd embedded C headers | `rust-embed` zero-copy binary embedding |

---

## 🧩 System Architecture

```
                 +---------------------------------------------+
                 |            Browser (Client)                 |
                 |                                             |
                 |   +-------------------------------------+   |
                 |   |           React 19 App              |   |
                 |   |  (Header, StatusBar, SettingsModal) |   |
                 |   +-------------------------------------+   |
                 |             |                     |         |
                 |      useTerminal()          useWebSocket()  |
                 |      (@xterm/xterm)               |         |
                 +-------------|---------------------|---------+
                               | WebGL Render        | JSON / WS
                               v                     v
                 +---------------------------------------------+
                 |            Oxitty Daemon (Rust)             |
                 |                                             |
                 |   +-------------------------------------+   |
                 |   |     Axum Router & Static Embed      |   |
                 |   +-------------------------------------+   |
                 |             |                     |         |
                 |       / (GET Assets)         /ws (Upgrade)  |
                 |                                   |         |
                 |                             ws_handler()    |
                 |                             (Tokio Loop)    |
                 |                                   |         |
                 |                 +-----------------+         |
                 |                 |                           |
                 |                 v                           |
                 |        +-------------------+                |
                 |        |  oxitty-core PTY  |                |
                 |        |  (Master / Slave) |                |
                 |        +-------------------+                |
                 |                 |                           |
                 |                 v                           |
                 |        Spawned Process                      |
                 |        (/bin/bash, zsh, etc.)               |
                 +---------------------------------------------+
```

---

## 📦 Workspace Topology

The repository is organized as a clean dual workspace:

```
oxitty/
├── crates/
│   ├── oxitty-protocol/    # Single Source of Truth: Data models with ts-rs
│   │   └── src/lib.rs      # ClientMessage, ServerMessage, ClientConfig, ResizePayload
│   ├── oxitty-core/        # PTY Process orchestration & session management
│   │   ├── src/lib.rs
│   │   ├── src/pty.rs      # portable-pty integration & resize handling
│   │   └── src/session.rs  # Arc/Mutex channel bridge between Tokio & PTY threads
│   └── oxitty/             # Axum HTTP/WS server & CLI application
│       ├── src/main.rs     # Entry point & tracing init
│       ├── src/cli.rs      # Clap argument definition
│       ├── src/assets.rs   # rust-embed fallback router
│       └── src/ws.rs       # WebSocket event-loop and bidirectional stream
├── frontend/               # Bun + Vite + React 19 Frontend
│   ├── src/
│   │   ├── types/generated/# Exported by ts-rs (DO NOT EDIT MANUALLY)
│   │   ├── hooks/          # useTerminal, useWebSocket
│   │   ├── components/     # Header, StatusBar, SettingsModal, TerminalView
│   │   ├── App.tsx         # Top-level state coordinator
│   │   └── main.tsx        # React 19 root
├── scripts/
│   └── check-line-limits.ts# Strict 200-line SLOC enforcer
├── biome.json              # Strict Biome formatting & linter config
└── package.json            # Workspace orchestration
```

---

## ⚡ Wire Protocol Specification

Communication occurs over WebSocket (`ws://<host>:<port>/ws`) formatted as JSON tagged enums:

### Server to Client (`ServerMessage`)

```typescript
type ServerMessage =
  | { type: "Init"; payload: ClientConfig }
  | { type: "Output"; payload: string }
  | { type: "SetTitle"; payload: string }
  | { type: "ProcessExited"; payload: number | null }
  | { type: "Pong" }
  | { type: "Error"; payload: string };
```

### Client to Server (`ClientMessage`)

```typescript
type ClientMessage =
  | { type: "Input"; payload: string }
  | { type: "Resize"; payload: { cols: number; rows: number } }
  | { type: "Ping" }
  | { type: "Pause" }
  | { type: "Resume" };
```

---

## 🧵 Concurrency & PTY I/O Model

PTY read operations are fundamentally blocking system calls (`read(2)` on Unix master descriptor). Oxitty bridges this cleanly into Tokio's asynchronous event loop:

1. **Reader Task**: `tokio::task::spawn_blocking` executes a dedicated loop reading master descriptor chunks into a bounded `mpsc::channel(128)`.
2. **WebSocket Bridge**: Axum WebSocket task selects across incoming channel packets and WebSocket client frames.
3. **Write Path**: Stdin keystrokes are dispatched through `Arc<Mutex<PtyWriter>>` asynchronously without blocking the server loop.
