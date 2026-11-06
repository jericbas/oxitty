#!/usr/bin/env bash
set -euo pipefail

if [ -z "${CARGO_REGISTRY_TOKEN:-}" ]; then
  echo "Error: CARGO_REGISTRY_TOKEN environment variable is required."
  echo "Usage: CARGO_REGISTRY_TOKEN=\"cio_...\" ./scripts/publish-crates.sh"
  exit 1
fi

echo "==> Building frontend assets..."
bun install
bun run build:frontend

echo "==> Publishing oxitty-protocol v0.0.0..."
cargo publish -p oxitty-protocol --allow-dirty --token "$CARGO_REGISTRY_TOKEN" || true

echo "==> Waiting 30s for crates.io index propagation..."
sleep 30

echo "==> Publishing oxitty-core v0.0.0..."
cargo publish -p oxitty-core --allow-dirty --token "$CARGO_REGISTRY_TOKEN" || true

echo "==> Waiting 30s for crates.io index propagation..."
sleep 30

echo "==> Publishing oxitty v0.0.0..."
cargo publish -p oxitty --allow-dirty --token "$CARGO_REGISTRY_TOKEN"

echo "==> Successfully claimed and published oxitty to crates.io!"
