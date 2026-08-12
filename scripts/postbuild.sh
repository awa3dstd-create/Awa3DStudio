#!/usr/bin/env bash
# Post-build script: restaura API routes después del build de GitHub Pages
set -e

if [ -d "src/app/_api_disabled" ]; then
  echo "[postbuild] Restaurando API routes..."
  rm -rf src/app/api
  mv src/app/_api_disabled src/app/api
  echo "[postbuild] ✓ API routes restauradas"
fi
