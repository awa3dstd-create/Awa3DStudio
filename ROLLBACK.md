# Plan de Rollback — AWA 3D Studio

**Creado:** 2026-08-04
**Estado estable actual:** commit `8b89b0a` · deployment `b0c30568`

---

## TL;DR — Cómo revertir en 30 segundos

```bash
cd /home/z/my-project
bash scripts/rollback.sh
```

Eso hace: `git reset --hard pre-automation-stable` → rebuild → redeploy.
Si incluso eso falla, ver **Capa 3** abajo (rollback manual vía dashboard de Cloudflare).

---

## Las 4 capas de protección

Cada capa es independiente. Si una falla, la siguiente te salva.

### Capa 1 — Git tag (código fuente)

**Tag creado:** `pre-automation-stable` sobre el commit `8b89b0a`

```bash
# Verificar que existe
git tag -l | grep pre-automation

# Ver qué commit señala
git rev-list -n 1 pre-automation-stable
# → 8b89b0a11b8524afb77a6cc59cbed170927e924e
```

**Rollback de código:**
```bash
git reset --hard pre-automation-stable
# Limpia cualquier archivo no commiteado
git clean -fd
```

### Capa 2 — Deployment anterior de Cloudflare Pages (producción)

Cada deploy de CF Pages genera un alias **inmutable** que queda vivo para siempre, incluso después de nuevos deploys.

| Campo | Valor |
|---|---|
| **Deployment ID** | `b0c30568-78d3-410d-a3ac-d93e40a4c1f6` |
| **URL inmutable** | https://b0c30568.awa3dstudio.pages.dev |
| **URL pública** | https://awa3dstudio.pages.dev |
| **Creado** | 2026-08-04 16:55:29 UTC |
| **Estado** | success (verificado 200 OK) |

**Rollback vía dashboard (recomendado si wrangler falla):**
1. Ir a https://dash.cloudflare.com → Pages → `awa3dstudio` → Deployments
2. Buscar el deployment con ID empezando en `b0c30568` (fecha 4 Aug 16:55)
3. Click en **⋮** → **"Retry deployment"** o **"Rollback to this deployment"**
4. Confirmar. Tarda ~60s.

**Rollback vía wrangler (CLI):**
```bash
cd /home/z/my-project
CLOUDFLARE_API_TOKEN=cfut_xxx npx wrangler pages deployment rollback \
  b0c30568-78d3-410d-a3ac-d93e40a4c1f6 \
  --project-name=awa3dstudio
```

**Rollback vía API directa:**
```bash
curl -X POST "https://api.cloudflare.com/client/v4/accounts/29b40f5c76f58a5e101d22226337cf46/pages/projects/awa3dstudio/deployments/b0c30568-78d3-410d-a3ac-d93e40a4c1f6/rollback" \
  -H "Authorization: Bearer cfut_xxx" \
  -H "Content-Type: application/json"
```

### Capa 3 — ZIP offline (código + assets + docs)

Si git y CF Pages ambos fallan (p.ej. borraste el repo o perdiste el token):

**Ruta:** `/home/z/my-project/download/awa3d-full-backup.zip` (40 MB, 140 archivos)

**Restaurar desde cero:**
```bash
# En una máquina limpia con Node 20+ y bun
unzip awa3d-full-backup.zip
cd awa3d-full-backup/source
cp .env.example .env   # rellenar secretos
bun install
bunx prisma generate
bun run build

# Redeploy a Cloudflare
CLOUDFLARE_API_TOKEN=cfut_xxx npx wrangler pages deploy .next/ \
  --project-name=awa3dstudio \
  --branch=main
```

### Capa 4 — Variables de entorno (snapshot)

Antes de cada cambio de env vars (Fase 1 añadirá NOTION_TOKEN, TELEGRAM_BOT_TOKEN, etc.),
registrar el estado anterior en `worklog.md` para poder revertir.

**Estado actual (snapshot inicial):**
```
DATABASE_URL=file:/home/z/my-project/db/custom.db
# (no hay otros secretos configurados todavía)
```

**CF Pages env vars:** ir a dashboard → Pages → awa3dstudio → Settings → Environment variables.
Hacer captura antes de cada modificación.

---

## Procedimiento completo de rollback (si las automatizaciones rompen algo)

### Escenario A: "El build falla y la página se cae"

CF Pages **no** reemplaza el deployment production si el nuevo build falla — el último
deployment bueno sigue sirviendo. Solo necesitas arreglar el código y reintentar:
```bash
git reset --hard pre-automation-stable   # descartar cambios rotos
bun run build                            # confirmar que build local pasa
# Si build local pasa, push para retrigger deploy
git push origin main
```

### Escenario B: "El deploy pasó pero la página se rompió en runtime"

```bash
# Opción 1: Wrangler rollback (rápido, ~60s)
bash scripts/rollback.sh

# Opción 2: Dashboard manual (si CLI falla)
# Ver Capa 2 arriba
```

### Escenario C: "Perdí acceso al servidor o el repo está corrupto"

1. Descargar ZIP backup desde donde lo guardaste offline
2. Seguir pasos de Capa 3 arriba
3. Si también perdiste el token de Cloudflare, crear uno nuevo en dashboard → My Profile → API Tokens

---

## Verificación post-rollback

Después de cualquier rollback, verificar:

```bash
# 1. Homepage carga
curl -s -o /dev/null -w "Home: %{http_code}\n" https://awa3dstudio.pages.dev

# 2. API route sigue funcionando
curl -s -o /dev/null -w "API: %{http_code}\n" https://awa3dstudio.pages.dev/api

# 3. Assets cargan
curl -s -o /dev/null -w "Favicon: %{http_code}\n" https://awa3dstudio.pages.dev/favicon.ico
curl -s -o /dev/null -w "Portfolio: %{http_code}\n" https://awa3dstudio.pages.dev/portfolio/salon-luminoso.jpg

# 4. Header de deployment actual
curl -s -I https://awa3dstudio.pages.dev | grep -i "cf-page"
```

**Resultado esperado:**
- Home: 200
- API: 200 (o 405 si solo POST)
- Favicon: 200
- Portfolio: 200
- `cf-page` header indica el deployment ID activo

---

## Reglas de oro durante las automatizaciones

1. **Cada fase termina con un nuevo git tag** (`post-fase-1`, `post-fase-2`, …)
   — así tienes checkpoints granulares, no solo el snapshot inicial.

2. **Nunca borrar el tag `pre-automation-stable`** aunque termines las 6 fases con éxito.
   Es tu último refugio si en producción se descubre un bug semanas después.

3. **Antes de añadir env vars nuevas**, anotar el estado anterior en `worklog.md`.

4. **Hacer un deploy pequeño por fase**, no acumular 5 cambios en un solo deploy.
   Si algo se rompe, sabrás exactamente qué fase lo causó.

5. **Smoke test post-deploy** siempre (los 4 curls de arriba).

---

## Datos críticos (anotarlos en tu gestor de contraseñas)

| Item | Valor |
|---|---|
| Git commit estable | `8b89b0a11b8524afb77a6cc59cbed170927e924e` |
| Git tag | `pre-automation-stable` |
| CF Account ID | `29b40f5c76f58a5e101d22226337cf46` |
| CF Pages project | `awa3dstudio` |
| CF Deployment ID estable | `b0c30568-78d3-410d-a3ac-d93e40a4c1f6` |
| CF Deployment URL inmutable | https://b0c30568.awa3dstudio.pages.dev |
| ZIP backup local | `/home/z/my-project/download/awa3d-full-backup.zip` |
| Production URL | https://awa3dstudio.pages.dev |
