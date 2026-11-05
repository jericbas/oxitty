# syntax=docker/dockerfile:1

# -------------------------------------------------------------
# Stage 1: Build React 19 Frontend with Bun
# -------------------------------------------------------------
FROM oven/bun:1-alpine AS frontend-builder
WORKDIR /app

COPY package.json biome.json ./
COPY frontend/package.json ./frontend/
RUN bun install

COPY frontend ./frontend
RUN bun run build:frontend

# -------------------------------------------------------------
# Stage 2: Compile Rust Server Embedding Frontend Dist
# -------------------------------------------------------------
FROM rust:1-alpine AS backend-builder
RUN apk add --no-cache musl-dev

WORKDIR /app
COPY Cargo.toml Cargo.lock ./
COPY crates ./crates
COPY --from=frontend-builder /app/frontend/dist ./frontend/dist

RUN cargo build --release -p oxitty-server

# -------------------------------------------------------------
# Stage 3: Minimal Production Container
# -------------------------------------------------------------
FROM alpine:3.21
RUN apk add --no-cache bash dumb-init ca-certificates

WORKDIR /root
COPY --from=backend-builder /app/target/release/oxitty /usr/local/bin/oxitty

EXPOSE 7681

ENTRYPOINT ["/usr/bin/dumb-init", "--"]
CMD ["oxitty", "--interface", "0.0.0.0", "--port", "7681", "--command", "/bin/bash"]
