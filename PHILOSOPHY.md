# 🌟 Oxyd Philosophy & Principle Guidelines

Oxyd is engineered as the modern, high-performance successor to `ttyd`. Where traditional tools lean on legacy C runtime idioms and ad-hoc string protocols, Oxyd adheres to uncompromising software craftsmanship principles rooted in Rust's memory safety and modern TypeScript/React declarative paradigms.

---

## 🏛️ Core Principles

### 1. The 200-Line Axiom (Radical Modularity)
* **Rule**: No source code file (`*.rs`, `*.ts`, `*.tsx`) may exceed **200 Source Lines of Code (SLOC)**, excluding comments and blank lines.
* **Rationale**: Monoliths are the graveyard of maintainability. By enforcing a hard 200-line limit:
  - Every component or module has a Single Responsibility (SRP).
  - Code review cognitive fatigue drops dramatically.
  - Testability and refactorability become immediate necessities rather than afterthoughts.
* **Enforcement**: Integrated via `bun run check:lines` and validated in every build and CI pipeline.

### 2. End-to-End Type Contract (Zero Protocol Drift)
* **Rule**: Frontend and backend never maintain separate definitions of network payloads.
* **Implementation**: The Rust crate `oxyd-protocol` serves as the authoritative single source of truth. Using `ts-rs`, TypeScript interfaces are auto-generated directly from Rust structs and enums (`ClientMessage`, `ServerMessage`, `ClientConfig`, `ResizePayload`).
* **Benefit**: Complete compile-time type safety across network boundaries. Breaking protocol changes immediately fail both Rust tests and TypeScript builds.

### 3. Zero-Allocation Streaming & Memory Safety
* **Rule**: Never copy or buffer terminal bytes without explicit need.
* **Implementation**: Raw PTY reader streams output directly through bounded Tokio channels into WebSocket frames.
* **Safety**: Written in 100% safe Rust at the application level. Eliminates classic C terminal daemon vulnerabilities (buffer overflows, uninitialized memory reads, dangling file descriptors).

### 4. Single-Binary Self-Sufficiency
* **Rule**: Deployment must be a single static binary with zero external runtime dependencies.
* **Implementation**: The production React 19 bundle is compiled and statically embedded into the Rust executable via `rust-embed`.
* **Ergonomics**: Run `oxyd` on a headless server, Docker container, or workstation—no Node.js, Bun, or web server needed in production.

### 5. Dual-Mode Developer Experience
* **Rule**: Developer iteration speed should never be compromised by single-binary packaging.
* **Development**: Instant Hot Module Replacement (HMR) powered by Bun and Vite on `http://localhost:3000`, with WebSocket proxying to the local Rust daemon on port `7681`.
* **Production**: `bun run build` generates optimized assets and `cargo build --release` produces the standalone binary.

### 6. Declarative React 19 Terminal Architecture
* **Rule**: Keep imperative terminal emulation isolated from declarative state.
* **Implementation**: The imperative `xterm.js` canvas/WebGL engine is encapsulated inside custom hooks (`useTerminal`), while React 19 manages reactive preferences, themes, connection lifecycle, and UI layout.
