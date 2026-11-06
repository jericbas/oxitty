#!/usr/bin/env bash
set -euo pipefail

BINARY_PATH="${1:-target/release/oxitty}"
VERSION="${2:-0.0.0}"
RAW_ARCH="${3:-x86_64}"
OUTPUT_DIR="${4:-dist}"

case "${RAW_ARCH}" in
  x86_64|amd64)
    DEB_ARCH="amd64"
    ;;
  aarch64|arm64)
    DEB_ARCH="arm64"
    ;;
  *)
    DEB_ARCH="${RAW_ARCH}"
    ;;
esac

WORK_DIR=$(mktemp -d)
trap 'rm -rf "${WORK_DIR}"' EXIT

PKG_DIR="${WORK_DIR}/oxitty_${VERSION}_${DEB_ARCH}"
mkdir -p "${PKG_DIR}/DEBIAN"
mkdir -p "${PKG_DIR}/usr/bin"
mkdir -p "${PKG_DIR}/usr/lib/systemd/system"
mkdir -p "${PKG_DIR}/etc/oxitty"
mkdir -p "${OUTPUT_DIR}"

cp "${BINARY_PATH}" "${PKG_DIR}/usr/bin/oxitty"
chmod 755 "${PKG_DIR}/usr/bin/oxitty"

if [ -f "oxitty.service" ]; then
  cp "oxitty.service" "${PKG_DIR}/usr/lib/systemd/system/oxitty.service"
  chmod 644 "${PKG_DIR}/usr/lib/systemd/system/oxitty.service"
fi

if [ -f ".oxitty.toml.example" ]; then
  cp ".oxitty.toml.example" "${PKG_DIR}/etc/oxitty/oxitty.toml.example"
  chmod 644 "${PKG_DIR}/etc/oxitty/oxitty.toml.example"
fi

cat <<EOF > "${PKG_DIR}/DEBIAN/control"
Package: oxitty
Version: ${VERSION}
Section: net
Priority: optional
Architecture: ${DEB_ARCH}
Maintainer: Jeric Bas <jeric.codes@proton.me>
Description: High-performance Web TTY daemon built with Rust, React 19, Bun, Vite & tsrs
 Oxitty serves fully-featured terminal sessions over WebSockets with multi-tab,
 split-pane grid layouts, TLS encryption, and observer sharing capabilities.
EOF

DEB_FILE="${OUTPUT_DIR}/oxitty_${VERSION}_${DEB_ARCH}.deb"

if command -v dpkg-deb >/dev/null 2>&1; then
  dpkg-deb --build --root-owner-group "${PKG_DIR}" "${DEB_FILE}"
else
  # Fallback packaging using standard ar and tar
  echo "2.0" > "${WORK_DIR}/debian-binary"
  tar -czf "${WORK_DIR}/control.tar.gz" -C "${PKG_DIR}/DEBIAN" .
  tar -czf "${WORK_DIR}/data.tar.gz" --exclude="./DEBIAN" -C "${PKG_DIR}" .
  ar -rc "${DEB_FILE}" "${WORK_DIR}/debian-binary" "${WORK_DIR}/control.tar.gz" "${WORK_DIR}/data.tar.gz"
fi

echo "Created Debian package: ${DEB_FILE}"
