# Oxitty Documentation & User Guide

> Comprehensive user guide, CLI reference, and operational manual for **Oxitty**.

---

## 📖 Table of Contents

- [About Oxitty](#about-oxitty)
- [Architecture & Design](#architecture--design)
- [Complete CLI Reference](#complete-cli-reference)
- [Configuration File (.oxitty.toml)](#configuration-file-oxittytoml)
- [Session Sharing & Observer Mode](#session-sharing--observer-mode)
- [Multi-Tab & Split-Pane Workspace](#multi-tab--split-pane-workspace)
- [Authentication & TLS Security](#authentication--tls-security)
- [Deployment Modes](#deployment-modes)
  - [Standalone Binary](#standalone-binary)
  - [Debian Package & Systemd](#debian-package--systemd)
  - [Docker & Containerized](#docker--containerized)
  - [Development with Hot Reloading](#development-with-hot-reloading)
- [License](#license)

---

## About Oxitty

**`oxitty`** is a portmanteau of **"Oxidized"** (Rust) and **"TTY"** (Teletypewriter). It brings the modern terminal emulator heritage (`alacritty`, `kitty`, `ghostty`, `ttyd`) into an oxidized, memory-safe web terminal daemon sharing your command line across the web with React 19 responsiveness and Tokio async throughput.

---

## Architecture & Design

- **PTY Process Orchestration**: `portable-pty` interacts directly with OS pseudo-terminals, bridging child process STDIN/STDOUT via Tokio asynchronous task loops.
- **WebSocket Framing & TypeScript**: Bidirectional JSON messages (`ClientMessage` and `ServerMessage`) synchronized across frontend and backend, with blazing fast typechecking powered by [`tsrs`](https://github.com/oxc-project/tsrs).
- **Embedded Frontend**: Built with Vite and Bun, the React 19 UI is embedded directly into the final standalone Rust executable via `rust-embed`.
- **200-Line Axiom**: Strict adherence to <= 200 Source Lines of Code per file ensures high maintainability and modular decoupling.

---

## Complete CLI Reference

```
Usage: oxitty [OPTIONS] [ARGS]...

Arguments:
  [ARGS]...  Command arguments to pass to the spawned process

Options:
      --config <PATH>          Path to TOML configuration file
  -p, --port <PORT>            Port to listen on [default: 7681]
  -i, --interface <INTERFACE>  Interface to bind to [default: 0.0.0.0]
  -c, --command <COMMAND>      Command to spawn (defaults to user's $SHELL)
  -t, --title <TITLE>          Terminal window title [default: "Oxitty Terminal"]
      --theme <THEME>          Terminal color theme preset [env: OXITTY_THEME]
  -R, --readonly               Run in read-only mode (clients cannot send stdin)
  -s, --shared                 Allow multiple clients to attach to the same session
  -u, --credential <USER:PASS> Basic HTTP authentication credentials (format: username:password)
      --ssl-cert <PATH>        Path to SSL/TLS X.509 certificate (PEM format)
      --ssl-key <PATH>         Path to SSL/TLS private key (PEM format)
  -h, --help                   Print help
  -V, --version                Print version
```

---

## Configuration File (.oxitty.toml)

Oxitty automatically searches for a configuration file in the following order:
1. File passed via `--config <path>`
2. `./.oxitty.toml` in the current working directory
3. `~/.config/oxitty/oxitty.toml`
4. `/etc/oxitty/oxitty.toml`

CLI flags automatically override configuration file values if both are supplied.

```toml
[server]
port = 7681
interface = "0.0.0.0"
title = "Oxitty Terminal"
command = "/bin/bash"
args = ["--login"]
readonly = false
shared = false
# credential = "admin:secretpassword"
# ssl_cert = "/etc/ssl/certs/oxitty.crt"
# ssl_key = "/etc/ssl/private/oxitty.key"

[terminal]
font_family = "JetBrains Mono, Menlo, monospace"
font_size = 14
cursor_blink = true

[theme]
# 14 built-in presets:
# tokyo-night, catppuccin, catppuccin-latte, one-dark, dracula, gruvbox,
# nord, rose-pine, kanagawa, everforest, ayu-dark, solarized-dark, github-dark, monokai
preset = "tokyo-night"

[theme.colors]
# Custom ANSI 16-color & truecolor palette override
background = "#1e1e2e"
foreground = "#cdd6f4"
cursor = "#f5e0dc"

[keybindings]
copy = "ctrl+shift+c"
paste = "ctrl+shift+v"
clear = "ctrl+l"
font_increase = "ctrl+="
font_decrease = "ctrl+-"
font_reset = "ctrl+0"
```

---

## Session Sharing & Observer Mode

Oxitty provides collaborative terminal streaming:
- **Shared Sessions (`-s, --shared`)**: When launched in shared mode, multiple web clients attach to the same live PTY session broadcast channel.
- **Read-Only Observer Mode**: Click the **Copy Share Link** button in the tab bar or append `?session=<id>&observer=true` to the URL. Observers can view all terminal activity with zero input privileges.
- **PTY Buffer Replay**: When a new client or observer connects to an active session, Oxitty replays the recent terminal ring buffer so the client immediately views the current screen contents and prompt.
- **Dynamic Resize Negotiation**: Lowest common denominator resizing automatically ensures screen output fits across all active connected viewers.

---

## Multi-Tab & Split-Pane Workspace

Oxitty features a modern multi-tab, resizable split-pane workspace:
- `Ctrl+Shift+T`: Open a new independent terminal tab.
- `Ctrl+Shift+W`: Close the active split pane or tab.
- `Alt+Shift+H`: Split the current tab horizontally (top/bottom).
- `Alt+Shift+V`: Split the current tab vertically (left/right).
- `Ctrl+Shift+C` / `Ctrl+Shift+V`: Copy selection / Paste from clipboard.
- `Ctrl+=` / `Ctrl+-` / `Ctrl+0`: Zoom font size in, out, or reset.

---

## Authentication & TLS Security

### Basic HTTP Authentication
Pass `-u` or `--credential <username:password>` (or set `OXITTY_CREDENTIAL`).
- Unauthorized requests receive `401 Unauthorized` with `WWW-Authenticate: Basic realm="oxitty"`.
- WebSocket handshake validates credentials prior to PTY subscription.

### Native TLS / SSL Termination
Pass `--ssl-cert` and `--ssl-key` pointing to valid PEM-encoded certificate and private key files for direct HTTPS/WSS encryption.

---

## Deployment Modes

### Standalone Binary
```bash
cargo build --release -p oxitty
./target/release/oxitty --port 7681
```

### Debian Package & Systemd
Install `.deb` packages directly:
```bash
sudo dpkg -i oxitty_*.deb
sudo systemctl enable --now oxitty
sudo journalctl -u oxitty -f
```

### Docker & Containerized
```bash
docker run -it --rm -p 7681:7681 ghcr.io/jericbas/oxitty:latest
```

---

## License

Dual-licensed under [MIT](LICENSE-MIT) or [Apache-2.0](LICENSE-APACHE).
