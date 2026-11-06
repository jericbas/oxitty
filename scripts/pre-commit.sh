#!/usr/bin/env bash
set -euo pipefail

export PATH="$HOME/.cargo/bin:$HOME/.bun/bin:$PATH"

# Collect staged files (Added, Copied, Modified, Renamed)
STAGED_FILES=$(git diff --cached --name-only --diff-filter=ACMR)

if [ -z "${STAGED_FILES}" ]; then
  exit 0
fi

echo "🔍 Running pre-commit checks on staged files..."

# 1. Check line limits on staged source files (.rs, .ts, .tsx)
LIMIT_FILES=()
while IFS= read -r file; do
  if [[ "$file" =~ \.(rs|ts|tsx)$ ]] && [ -f "$file" ]; then
    LIMIT_FILES+=("$file")
  fi
done <<< "$STAGED_FILES"

if [ ${#LIMIT_FILES[@]} -gt 0 ]; then
  echo "==> Verifying 200-line limit on ${#LIMIT_FILES[@]} file(s)..."
  bun ./scripts/check-line-limits.ts "${LIMIT_FILES[@]}"
fi

# 2. Run Biome check on staged web / config files (.ts, .tsx, .js, .jsx, .json)
BIOME_FILES=()
while IFS= read -r file; do
  if [[ "$file" =~ \.(ts|tsx|js|jsx|json|jsonc)$ ]] && [ -f "$file" ]; then
    BIOME_FILES+=("$file")
  fi
done <<< "$STAGED_FILES"

if [ ${#BIOME_FILES[@]} -gt 0 ]; then
  echo "==> Running Biome lint on ${#BIOME_FILES[@]} file(s)..."
  bun x biome check --no-errors-on-unmatched "${BIOME_FILES[@]}"
fi

# 3. Check Rust formatting on staged Rust files (.rs)
RS_FILES=()
while IFS= read -r file; do
  if [[ "$file" =~ \.rs$ ]] && [ -f "$file" ]; then
    RS_FILES+=("$file")
  fi
done <<< "$STAGED_FILES"

if [ ${#RS_FILES[@]} -gt 0 ]; then
  echo "==> Checking Rust formatting on ${#RS_FILES[@]} file(s)..."
  rustfmt --edition 2021 --check "${RS_FILES[@]}"
fi

echo "✨ Pre-commit checks passed!"
