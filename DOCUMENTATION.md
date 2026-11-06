# Oxitty Documentation & User Guide

> Comprehensive user guide, CLI reference, and operational manual for **Oxitty**.

---

## 📖 Table of Contents

- [About Oxitty](#about-oxitty)
- [Architecture & Design](#architecture--design)
- [Complete CLI Reference](#complete-cli-reference)
- [Authentication & TLS Security](#authentication--tls-security)
- [Deployment Modes](#deployment-modes)
  - [Standalone Binary](#standalone-binary)
  - [Docker & Containerized](#docker--containerized)
  - [Development with Hot Reloading](#development-with-hot-reloading)
- [Quality Assurance & Verification](#quality-assurance--verification)
- [License](#license)

---

## About Oxitty

**`oxitty`** is a portmanteau of **"Oxidized"** (Rust) and **"TTY"** (Teletypewriter). It brings the modern terminal emulator heritage (`alacritty`, `kitty`, `ghostty`, `ttyd`) into an oxidized, memory-safe web terminal daemon sharing your command line across the web with React 19 responsiveness and Tokio async throughput.

---

## Architecture & Design

- **PTY Process Orchestration**: `portable-pty` interacts directly with OS pseudo-terminals, bridging child process STDIN/STDOUT via Tokio asynchronous task loops.
- **WebSocket Framing**: Bidirectional JSON messages (`ClientMessage` and `ServerMessage`) synchronized across frontend and backend using `ts-rs`.
- **Embedded Frontend**: Built with Vite and Bun, the React 19 UI is embedded directly into the final standalone Rust executable via `rust-embed`.
- **200-Line Axiom**: Strict adherence to <= 200 Source Lines of Code per file ensures high maintainability and modular decoupling.

For deeper protocol details, see [ARCHITECTURE.md](ARCHITECTURE.md).

---

## Complete CLI Reference

```
Usage: oxitty [OPTIONS] [ARGS]...

Arguments:
  [ARGS]...  Command arguments to pass to the spawned process

Options:
  -p, --port <PORT>            Port to listen on [default: 7681]
  -i, --interface <INTERFACE>  Interface to bind to [default: 0.0.0.0]
  -c, --command <COMMAND>      Command to spawn (defaults to user's $SHELL)
  -t, --title <TITLE>          Terminal window title [default: "Oxitty Terminal"]
  -R, --readonly               Run in read-only mode (clients cannot send stdin)
  -s, --shared                 Allow multiple clients to attach to the same session
  -u, --credential <USER:PASS> Basic HTTP authentication credentials (format: username:password)
      --ssl-cert <PATH>        Path to SSL/TLS X.509 certificate (PEM format)
      --ssl-key <PATH>         Path to SSL/TLS private key (PEM format)
  -h, --help                   Print help
  -V, --version                Print version
```

### Examples

```bash
# 1. Custom port and shell
oxitty -p 8080 -c /bin/bash

# 2. Spawn a command with arguments
oxitty -t "Server Logs" -- journalctl -f -u nginx

# 3. Read-only system dashboard
oxitty -c htop -R

# 4. Password-protected terminal
oxitty -u admin:secretpassword123

# 5. HTTPS/WSS with native TLS
oxitty --ssl-cert /etc/ssl/certs/cert.pem --ssl-key /etc/ssl/private/key.pem
```

---

## Authentication & TLS Security

### Basic HTTP Authentication
Pass `-u` or `--credential <username:password>` (or set `OXITTY_CREDENTIAL`).
When enabled:
- Unauthorized HTTP requests receive `401 Unauthorized` with `WWW-Authenticate: Basic realm="oxitty"`.
- WebSocket connection attempts without valid credentials are immediately rejected with `401 Unauthorized`.
- Structured audit logs trace both successful and failed access attempts.

### Native TLS / SSL Termination
Pass `--ssl-cert` and `--ssl-key` pointing to valid PEM-encoded certificate and private key files.
Oxitty uses `rustls` to handle TLS termination in-process without requiring Nginx or Caddy.

---

## Deployment Modes

### Standalone Binary

```bash
# Build frontend and Rust binary
bun install && bun run build
./target/release/oxitty --port 7681
```

### Docker & Containerized

```bash
docker compose up -d
# Or directly:
docker build -t oxitty .
docker run -it --rm -p 7681:7681 oxitty
```

### Development with Hot Reloading

```bash
# Terminal 1: Rust backend daemon
cargo run -p oxitty -- --port 7681

# Terminal 2: Vite dev server with React 19 HMR
bun run dev
```

Visit `http://localhost:3000`.

---

## Quality Assurance & Verification

```bash
# Regenerate TypeScript bindings
bun run gen:types

# Biome linter & code limit checks
bun run check

# Rust tests
cargo test --workspace
```
