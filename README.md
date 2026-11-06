# 🐱🦀 Oxitty (`oxitty`)

> **Next-Generation Web Terminal Daemon**  
> Reimagining [`ttyd`](https://github.com/tsl0922/ttyd) with **Rust**, **React 19**, **Bun**, **Vite**, and **[`tsrs`](https://github.com/oxc-project/tsrs)**.

[![Crates.io](https://img.shields.io/crates/v/oxitty.svg)](https://crates.io/crates/oxitty)
[![Rust](https://img.shields.io/badge/Rust-1.80%2B-orange.svg)](https://www.rust-lang.org/)
[![React](https://img.shields.io/badge/React-19.0-61dafb.svg)](https://react.dev/)
[![Bun](https://img.shields.io/badge/Bun-1.4%2B-fbf0df.svg)](https://bun.sh/)
[![Biome](https://img.shields.io/badge/Linter-Biome-60a5fa.svg)](https://biomejs.dev/)
[![License](https://img.shields.io/badge/License-MIT%20OR%20Apache--2.0-blue.svg)](LICENSE)
[![SLOC Limit](https://img.shields.io/badge/Max%20File%20SLOC-%E2%89%A4%20200-brightgreen.svg)](PHILOSOPHY.md)

---

## ⚡ Quick Start

### Install from crates.io

```bash
cargo install oxitty
oxitty
```

### Or Download Pre-built Binary / Debian Package

Pre-built standalone static binaries (`x86_64` and `aarch64`) and `.deb` packages (with bundled `oxitty.service` systemd unit) are available on [GitHub Releases](https://github.com/jericbas/oxitty/releases).

```bash
# Install Debian package (.deb)
sudo dpkg -i oxitty_*.deb
sudo systemctl enable --now oxitty
```

### Build from Source

```bash
git clone https://github.com/jericbas/oxitty.git
cd oxitty
bun install && bun run build
./target/release/oxitty
```

Open your browser at **`http://localhost:7681`**.

### Run with Docker

```bash
docker run -it --rm -p 7681:7681 ghcr.io/jericbas/oxitty:latest
```

---

## ✨ Highlights

- **🚀 Memory-Safe & Async**: Built with Axum, Tokio, and `portable-pty`.
- **👥 Multi-Client Session Sharing & Observer Mode**: Broadcast terminal sessions across clients (`-s, --shared`), generate instant read-only share links, with automatic PTY buffer replay on join.
- **🗂️ Multi-Tab & Split-Pane Workspace**: React 19 concurrent transitions for responsive tab switching, vertical/horizontal pane splitting, and keyboard navigation (`Ctrl+Shift+T`, `Ctrl+Shift+H`, `Ctrl+Shift+V`, `Ctrl+Shift+W`).
- **⚙️ Configuration File (`.oxitty.toml`)**: Persistent configuration loaded from `./.oxitty.toml`, `~/.config/oxitty/oxitty.toml`, or `/etc/oxitty/oxitty.toml` with custom 16-color ANSI palettes and truecolor presets.
- **🔒 Security Built-In**: Native HTTP Basic Auth (`-u user:pass`) and in-process TLS/SSL (`--ssl-cert`, `--ssl-key`).
- **📦 Single Standalone Binary**: Frontend assets embedded directly via `rust-embed`.
- **📏 Strict 200-Line Axiom**: Every file is guaranteed <= 200 SLOC.

---

## 📚 Documentation

For complete guides and references, please see:

- 📖 **[Comprehensive User Guide & CLI Reference](DOCUMENTATION.md)** - Full CLI manual, deployment modes, config options, and security configurations.
- 🏗️ **[Architecture & Protocol Specification](ARCHITECTURE.md)** - Deep dive into Tokio event loops, PTY bridging, and WebSocket protocols.
- 📐 **[Philosophy & 200-Line Axiom](PHILOSOPHY.md)** - Modularity, design principles, and code constraints.

---

## 📄 License

Dual-licensed under [MIT](LICENSE-MIT) or [Apache-2.0](LICENSE-APACHE).
