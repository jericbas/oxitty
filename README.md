# 🐱🦀 Oxitty (`oxitty`)

> **Next-Generation Web Terminal Daemon**  
> Reimagining [`ttyd`](https://github.com/tsl0922/ttyd) with **Rust**, **React 19**, **Bun**, **Vite**, and **`ts-rs`**.

[![Rust](https://img.shields.io/badge/Rust-1.80%2B-orange.svg)](https://www.rust-lang.org/)
[![React](https://img.shields.io/badge/React-19.0-61dafb.svg)](https://react.dev/)
[![Bun](https://img.shields.io/badge/Bun-1.4%2B-fbf0df.svg)](https://bun.sh/)
[![Biome](https://img.shields.io/badge/Linter-Biome-60a5fa.svg)](https://biomejs.dev/)
[![License](https://img.shields.io/badge/License-MIT%20OR%20Apache--2.0-blue.svg)](LICENSE)
[![SLOC Limit](https://img.shields.io/badge/Max%20File%20SLOC-%E2%89%A4%20200-brightgreen.svg)](PHILOSOPHY.md)

---

## 💡 About the Name: `oxitty`

**`oxitty`** is a portmanteau of **"Oxidized"** (Rust) and **"TTY"** (Teletypewriter). In modern terminal emulator culture, the greatest tools follow the iconic `-ty`/`-tty` lineage:
- `alacritty` (fastest OpenGL terminal)
- `kitty` (GPU-accelerated terminal)
- `ghostty` (modern cross-platform terminal)
- `ttyd` (classic web terminal daemon)

👉 **`oxitty`** brings that heritage together: an oxidized terminal daemon sharing your command line across the web with modern React 19 responsiveness and Rust memory safety. It is 100% unregistered and available on **crates.io**.

---

## ✨ Features

- **🚀 Memory-Safe & Asynchronous**: Built with **Axum**, **Tokio**, and **`portable-pty`** for high-throughput, low-latency terminal multiplexing without C memory pitfalls.
- **⚛️ Modern React 19 UI**: Built with the latest React 19 component architecture, hooks, and clean UI state separation.
- **🔄 Zero-Drift Type Sharing (`ts-rs`)**: Rust structs automatically compile down to TypeScript definitions for both client and server wire messages.
- **⚡ Hardware-Accelerated Terminal**: Integrated `@xterm/xterm` with **WebGL** renderer and seamless canvas fallback.
- **📦 Single-Binary Distribution**: Production React frontend is statically compiled and embedded directly into the Rust executable via `rust-embed`.
- **🎨 Live Customization**: Switch themes on the fly (Dracula, Nord, One Dark, Catppuccin), adjust font sizes, toggle cursor blinking, and expand fullscreen.
- **📏 Strict 200-Line Axiom**: Every source file is kept strictly under **200 Source Lines of Code (SLOC)**, enforced by custom verification scripts and Biome linter.

---

## 🚀 Quick Start

### 1. Build and Run the Single Standalone Binary

```bash
# Clone the repository
git clone https://github.com/jericbas/oxitty.git
cd oxitty

# Install frontend dependencies and build assets
bun install
bun run build:frontend

# Build the release Rust binary
cargo build --release

# Run oxitty (defaults to port 7681 and your current shell)
./target/release/oxitty
```

Open your browser at **`http://localhost:7681`**.

---

### 2. Run with Docker (Containerized)

You can run Oxitty in an isolated container without installing Rust or Bun locally:

```bash
# Using Docker Compose:
docker compose up -d

# Or build and run directly:
docker build -t oxitty .
docker run -it --rm -p 7681:7681 oxitty
```

Access your containerized terminal at **`http://localhost:7681`**.

---

### 3. Development Workflow (Hot Reloading)

During development, enjoy sub-second Vite HMR for React alongside the Rust daemon:

```bash
# Terminal 1: Start the Rust backend daemon
cargo run -p oxitty-server -- --port 7681

# Terminal 2: Start the Vite + Bun dev server (proxies /ws to 7681)
bun run dev
```

Visit **`http://localhost:3000`** with instant React 19 Hot Module Replacement.

---

## 🛠️ CLI Options

```
High-performance Web TTY Daemon built in Rust & React 19

Usage: oxitty [OPTIONS] [ARGS]...

Arguments:
  [ARGS]...  Command arguments

Options:
  -p, --port <PORT>            Port to listen on [default: 7681]
  -i, --interface <INTERFACE>  Interface to bind to [default: 0.0.0.0]
  -c, --command <COMMAND>      Command to spawn (defaults to user's $SHELL)
  -t, --title <TITLE>          Window title [default: "Oxitty Terminal"]
  -R, --readonly               Run in read-only mode (clients cannot send stdin)
  -s, --shared                 Allow multiple clients to attach to the same session
  -h, --help                   Print help
  -V, --version                Print version
```

### Examples

```bash
# Launch htop over the web in read-only mode
oxitty -c htop -R

# Run a custom bash session on port 8080
oxitty -p 8080 -c /bin/bash

# Run custom command with parameters
oxitty -t "System Log" -- journalctl -f
```

---

## 📁 Repository Structure

```
oxitty/
├── crates/
│   ├── oxitty-protocol/     # Data models + ts-rs TypeScript export tests
│   ├── oxitty-core/         # PTY process orchestration & session bridge
│   └── oxitty-server/       # Axum HTTP/WS server, CLI & embedded assets
├── frontend/                # React 19 + Bun + Vite frontend
│   ├── src/
│   │   ├── types/generated/ # Auto-generated TypeScript definitions
│   │   ├── hooks/           # useTerminal, useWebSocket
│   │   ├── components/      # Header, StatusBar, SettingsModal, TerminalView
│   │   ├── App.tsx          # Main React 19 interface
│   │   └── main.tsx         # React 19 root
├── scripts/
│   └── check-line-limits.ts # Verifies <= 200 SLOC per file
├── biome.json               # Biome linter & formatter configuration
├── ARCHITECTURE.md          # In-depth architectural specification & protocol
└── PHILOSOPHY.md            # Modularity, SLOC rules & core guidelines
```

---

## 🧪 Code Quality & Quality Assurance

Run the complete test, lint, and modularity verification suite:

```bash
# 1. Regenerate TypeScript types from Rust
bun run gen:types

# 2. Run Biome formatter and linter check
bun run lint

# 3. Verify strict <= 200 line constraint
bun run check:lines

# 4. Run all checks together
bun run check
```

---

## 📜 Documentation

- [Philosophy Guidelines](PHILOSOPHY.md) - Learn about our design principles and the 200-line axiom.
- [Architecture & Protocol Specification](ARCHITECTURE.md) - Deep dive into Tokio concurrency, PTY bridging, and WebSocket message framing.

---

## 📄 License

Dual-licensed under either of:
- Apache License, Version 2.0 ([LICENSE-APACHE](LICENSE-APACHE) or http://www.apache.org/licenses/LICENSE-2.0)
- MIT license ([LICENSE-MIT](LICENSE-MIT) or http://opensource.org/licenses/MIT)
at your option.
