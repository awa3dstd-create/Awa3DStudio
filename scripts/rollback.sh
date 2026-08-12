#!/usr/bin/env bash
# scripts/rollback.sh — Revierte AWA 3D Studio al estado pre-automatización
#
# Uso:
#   bash scripts/rollback.sh             # rollback a pre-automation-stable
#   bash scripts/rollback.sh <git-tag>   # rollback a un tag distinto
#
# Qué hace:
#   1. git reset --hard al tag estable
#   2. Limpia cachés de build
#   3. Reconstruye el proyecto
#   4. Despliega a Cloudflare Pages (production)
#   5. Smoke test de verificación
#
# Requiere: bun, wrangler (npx), CLOUDFLARE_API_TOKEN en env.

set -euo pipefail

PROJECT_ROOT="/home/z/my-project"
PROJECT_NAME="awa3dstudio"
TAG="${1:-pre-automation-stable}"
cd "$PROJECT_ROOT"

echo "================================================"
echo "  AWA 3D Studio — Rollback a '$TAG'"
echo "================================================"
echo ""

# ---- 1. Sanity check ----
if ! git rev-parse "$TAG" >/dev/null 2>&1; then
  echo "ERROR: tag '$TAG' no existe."
  echo "Tags disponibles:"
  git tag -l
  exit 1
fi

CURRENT=$(git rev-parse HEAD)
TARGET=$(git rev-parse "$TAG")
echo "Commit actual:  $CURRENT"
echo "Commit target:  $TARGET"
echo ""

if [ "$CURRENT" = "$TARGET" ]; then
  read -p "Ya estás en el commit target. ¿Rebuild + redeploy de todas formas? [y/N] " yn
  [ "$yn" = "y" ] || exit 0
fi

# ---- 2. Snapshot del estado actual (por si acaso) ----
SNAPSHOT_TAG="pre-rollback-$(date +%Y%m%d-%H%M%S)"
echo ">>> Creando snapshot de seguridad: $SNAPSHOT_TAG"
git tag -a "$SNAPSHOT_TAG" -m "Snapshot antes de rollback a $TAG" || true
echo "    (si necesitas volver a este punto: git reset --hard $SNAPSHOT_TAG)"
echo ""

# ---- 3. Reset al tag estable ----
echo ">>> git reset --hard $TAG"
git reset --hard "$TAG"
git clean -fd
echo ""

# ---- 4. Limpiar cachés ----
echo ">>> Limpiando cachés de build…"
rm -rf .next .vercel node_modules/.cache 2>/dev/null || true
echo ""

# ---- 5. Reinstalar deps (por si package.json cambió) ----
echo ">>> Reinstalando dependencias…"
if command -v bun >/dev/null 2>&1; then
  bun install
else
  npm install
fi
echo ""

# ---- 6. Build ----
echo ">>> Build de producción…"
if command -v bun >/dev/null 2>&1; then
  bun run build
else
  npm run build
fi
echo ""

# ---- 7. Deploy a Cloudflare Pages ----
if [ -z "${CLOUDFLARE_API_TOKEN:-}" ]; then
  echo ">>> CLOUDFLARE_API_TOKEN no seteado."
  echo "    Saltando deploy automático. Hazlo manual con:"
  echo "    npx wrangler pages deploy .next --project-name=$PROJECT_NAME --branch=main"
  echo "    O desde el dashboard de CF Pages: 'Retry deployment' sobre b0c30568"
else
  echo ">>> Deploy a Cloudflare Pages…"
  npx wrangler pages deploy .next \
    --project-name="$PROJECT_NAME" \
    --branch=main
fi
echo ""

# ---- 8. Smoke test ----
echo ">>> Smoke test…"
sleep 10  # dar tiempo a que el deploy se propague

URL="https://awa3dstudio.pages.dev"
for path in "" "favicon.ico" "portfolio/salon-luminoso.jpg"; do
  code=$(curl -s -o /dev/null -w "%{http_code}" "https://awa3dstudio.pages.dev/$path")
  printf "  %-40s %s\n" "/$path" "$code"
done

echo ""
echo "================================================"
echo "  Rollback completo."
echo "  Snapshot previo: $SNAPSHOT_TAG"
echo "  Estado actual:   $TAG ($TARGET)"
echo "================================================"
