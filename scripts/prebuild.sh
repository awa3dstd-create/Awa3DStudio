#!/usr/bin/env bash
# Pre-build script: deshabilita API routes cuando se construye para GitHub Pages
# (GitHub Pages no puede ejecutar API routes, son innecesarias en el static export)
set -e

if [ "$GITHUB_PAGES" = "true" ]; then
  echo "[prebuild] GITHUB_PAGES=true — deshabilitando API routes..."
  if [ -d "src/app/api" ]; then
    rm -rf src/app/_api_disabled
    mv src/app/api src/app/_api_disabled
    echo "[prebuild] ✓ API routes movidas a src/app/_api_disabled (se restaurarán post-build)"
  fi
fi
