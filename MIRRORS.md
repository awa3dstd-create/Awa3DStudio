# Mirrors — Configuración de respaldos

Este documento describe la configuración de los 3 mirrors del sitio AWA 3D Studio con failover automático vía Service Worker.

> **Última actualización**: 2026-08-12 — Todos los mirrors operativos ✅, Cron Trigger del Worker activado, failover verificado en producción.

---

## ✅ IMPORTANTE — Qué URL compartir con usuarios finales

**Solo compartes UNA URL**: https://awa3dstudio.pages.dev/

El sistema hace el failover **automáticamente**. El usuario nunca tiene que hacer nada: si Cloudflare no carga, el Service Worker (instalado en la primera visita del navegador) prueba el Worker y luego GitHub Pages, todo sin que el usuario note nada.

### URL que se comparte (la principal)

| # | URL | Por qué |
|---|---|---|
| 🔵 **1 (principal)** | https://awa3dstudio.pages.dev/ | URL única para compartir en redes sociales, tarjetas, firmas de email, etc. |

### URL de respaldo (NO se comparte, solo se usa en caso de emergencia)

| # | URL | Cuándo usarla manualmente |
|---|---|---|
| 🟡 **3 (github)** | https://awa3dstd-create.github.io/Awa3DStudio/ | **Solo** si Cloudflare está caído JUSTO en la primera visita del usuario (el SW aún no se ha instalado y no hay failover posible). Caso rarísimo. |

### URL que NO se comparte (backend invisible)

| # | URL | Qué pasa si la abres |
|---|---|---|
| 🔧 **2 (worker)** | https://awa3d-mirror.dashiellyeneri.workers.dev/ | Verás un JSON con metadata del servicio: `{"ok":true,"service":"awa3d-mirror-worker","version":"1.0.0","endpoints":[...]}`. **Esto es normal** — es un backend de APIs, no un frontend web. El SW lo usa "por detrás" para failover de los formularios. |

### ¿Por qué el Worker no sirve frontend?

Porque Cloudflare Workers tiene un límite de tamaño de script (1 MB comprimido) y no está optimizado para servir archivos estáticos grandes (HTML, CSS, JS, imágenes). El Worker está optimizado para responder rápido a las 4 APIs (`/api/contact`, `/api/enroll`, `/api/quote`, `/api/cron/followup`) en ~50ms. Sirve solo como **backend de failover**: cuando el SW detecta que las APIs del mirror #1 no responden, prueba automáticamente con el Worker.

---

## 🎯 Arquitectura

```
┌─────────────────────────────────────────────────────┐
│        Usuario (cualquier ubicación)                │
└──────────────────────┬──────────────────────────────┘
                       │
                       ▼
        ┌──────────────────────────┐
        │  Service Worker          │
        │  (instalado en 1ra visita)│
        └────────────┬─────────────┘
                     │
        ┌────────────┴────────────┐
        ▼                         │
   Frontend visible              │
   (cualquier mirror)            │
                                 ▼
                    ┌─────────────────────────┐
                    │  Peticiones a /api/*    │
                    └────────────┬────────────┘
                                 │
                                 ▼
                    ┌──────────────────────────────┐
                    │  SW prueba en orden:        │
                    │  1. Mismo dominio            │
                    │  2. awa3dstudio.pages.dev    │
                    │  3. awa3d-mirror.workers.dev │
                    └──────────────────────────────┘
```

**Principio**: el usuario entra por cualquier mirror. El Service Worker (instalado en la primera visita) intercepta todas las peticiones `/api/*` y prueba los 3 backends en orden con timeout de 4 s cada uno. Si el primero responde 5xx o no responde, prueba el siguiente. Para assets estáticos usa cache-first con revalidación en background.

---

## 🌐 Los 3 mirrors

### Mirror #1 — Cloudflare Pages (PRINCIPAL — URL para usuarios finales)

| Atributo | Valor |
|---|---|
| URL | https://awa3dstudio.pages.dev |
| Plataforma | Cloudflare Pages (Workers Unbound con OpenNext) |
| Source | Upload directo con `wrangler pages deploy` (ad-hoc, no Git-connected) |
| Build | `bun run build && bunx @cloudflare/next-on-pages` (local) |
| Output | `.vercel/output/static` → Cloudflare Pages |
| APIs | 4 edge functions: `/api/contact`, `/api/enroll`, `/api/quote`, `/api/cron/followup` |
| Cron | cron-job.org llama a `/api/cron/followup` diario 09:00 UTC (primario) |
| Secrets | 15 env vars en Cloudflare Pages (production + preview) |
| Service Worker | ✅ Sirve `/sw.js` (5607 bytes) y `/offline.html` (2515 bytes) |
| Última release | 2026-08-12 (deploy `bba15b02.awa3dstudio.pages.dev`) |
| Status | ✅ Operativo |

### Mirror #2 — Cloudflare Worker (BACKUP 1 — SOLO APIs)

> ⚠️ **NO es para usuarios finales.** Al abrir esta URL en el navegador se ve un JSON con metadata del servicio, no la web. Es un backend invisible usado por el Service Worker para failover de los formularios.

| Atributo | Valor |
|---|---|
| URL | https://awa3d-mirror.dashiellyeneri.workers.dev |
| Plataforma | Cloudflare Workers |
| Source | `cloudflare/worker.js` en este repo |
| Deploy | `wrangler deploy` o API REST directa |
| APIs | 4 handlers: `contact`, `enroll`, `quote`, `cron/followup` |
| Cron | ✅ Worker Cron Trigger activado: `0 9 * * *` (diario 09:00 UTC = 05:00 Cuba) |
| Secrets | 5 secrets (RESEND_API_KEY, NOTION_API_KEY, TELEGRAM_BOT_TOKEN, QUOTE_API_KEY, CRON_SECRET) |
| Plain vars | 3 (RESEND_FROM_EMAIL, NOTION_LEADS_DB_ID, TELEGRAM_CHAT_ID) |
| Service Worker | N/A (Worker no sirve static assets, solo APIs) |
| Frontend | ❌ No sirve frontend HTML — solo JSON para APIs |
| Última release | 2026-08-12 |
| Status | ✅ Operativo |

### Mirror #3 — GitHub Pages (BACKUP 2 — URL para usuarios finales cuando CF falla)

| Atributo | Valor |
|---|---|
| URL | https://awa3dstd-create.github.io/Awa3DStudio/ |
| Plataforma | GitHub Pages (Azure backend) |
| Source | Repositorio `awa3dstd-create/awa3dstudio` (rama `main`) |
| Build | GitHub Action `.github/workflows/deploy-gh-pages.yml` |
| Build command | `GITHUB_PAGES=true bun run build` → genera `out/` (static export con `basePath: /Awa3DStudio`) |
| Output | HTML/CSS/JS estáticos (sin APIs) |
| APIs | Llama al Worker (Mirror #2) y a Pages (Mirror #1) vía failover SW |
| Cron | N/A (GitHub Pages no soporta server-side) |
| Service Worker | ✅ Sirve `/Awa3DStudio/sw.js` y `/Awa3DStudio/offline.html` |
| Última release | 2026-08-12 (commit `141 files initial`) |
| Status | ✅ Operativo |

---

## 🔄 Lógica de failover

### Service Worker (`public/sw.js`)

Versión actual: `v1.0.0-20260812`. Intercepta todas las peticiones GET/POST del navegador:

```javascript
// Para /api/* — failover entre 3 mirrors en orden
const API_MIRRORS = [
  "",                                                  // 1. mismo dominio
  "https://awa3dstudio.pages.dev",                     // 2. CF Pages (absoluto)
  "https://awa3d-mirror.dashiellyeneri.workers.dev"    // 3. CF Worker (absoluto)
];
const FETCH_TIMEOUT_MS = 4000;

async function handleApiRequest(req) {
  for (const mirror of API_MIRRORS) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
      const res = await fetch(mirror ? `${mirror}${path}` : req.url, {
        method: req.method,
        headers: req.headers,
        body: req.method === 'POST' ? await req.clone().text() : undefined,
        signal: controller.signal,
      });
      clearTimeout(timeout);
      if (res.ok) return res;
      if (res.status >= 400 && res.status < 500) return res; // 4xx no reintenta
      // 5xx → probar siguiente mirror
    } catch (err) {
      // timeout/network → probar siguiente mirror
    }
  }
  // Todos fallaron
  return new Response(JSON.stringify({
    ok: false,
    error: "Todos los backends están caídos. Inténtalo más tarde.",
    mirrors_tried: API_MIRRORS.filter(Boolean),
  }), { status: 503, headers: { 'Content-Type': 'application/json' } });
}
```

### Frontend (en `contact.tsx` y `courses.tsx`)

Doble redundancia: si el SW falla (no registrado, navegador antiguo, etc.), el JS también hace failover:

```typescript
const endpoints = [
  CONTACT_INFO.contactApi,                                              // mismo dominio
  ...CONTACT_INFO.mirrors.map(m => `${m}${CONTACT_INFO.contactApi}`)   // 2 mirrors absolutos
];

for (const url of endpoints) {
  try {
    const controller = new AbortController();
    setTimeout(() => controller.abort(), 5000);
    const res = await fetch(url, { signal: controller.signal, ... });
    if (res.ok) { /* éxito */ break; }
    if (res.status >= 400 && res.status < 500) { /* error real, no reintentar */ return res; }
  } catch { /* probar siguiente */ }
}
```

---

## 📋 Estado de cada mirror

| Componente | Mirror 1 (Pages) | Mirror 2 (Worker) | Mirror 3 (GitHub Pages) |
|---|---|---|---|
| Frontend | ✅ | ✅ JSON metadata | ✅ |
| APIs | ✅ 4 propias | ✅ 4 propias | ⚠️ Viaja al Worker/Pages |
| Cron | ✅ cron-job.org → Pages | ✅ Worker Cron Trigger | N/A |
| Failover SW | ✅ Instalado | N/A (es backend) | ✅ Instalado |
| Cache offline | ✅ /offline.html | N/A | ✅ /offline.html |
| Última release | 2026-08-12 | 2026-08-12 | 2026-08-12 |
| Tiempo medio respuesta | ~250 ms | ~100 ms | ~370 ms |

---

## 🚀 Cómo actualizar cada mirror

### Mirror #1 (Cloudflare Pages)

**Tiempo total**: ~3 min (build local + upload).

```bash
# 1. Setup (una sola vez por máquina)
cd /path/to/awa3d_repo
bun install
cp .env.example .env.local  # y rellenar valores reales para build

# 2. Build
bun run build
bunx @cloudflare/next-on-pages

# 3. Deploy
CLOUDFLARE_API_TOKEN=cfut_xxx \
  bunx wrangler pages deploy .vercel/output/static \
  --project-name=awa3dstudio --branch=main

# 4. Verificar (en menos de 30s debería responder)
curl -sI https://awa3dstudio.pages.dev/sw.js | head -1   # HTTP/2 200
curl -sI https://awa3dstudio.pages.dev/offline.html | head -1  # HTTP/2 200
curl -s https://awa3dstudio.pages.dev/api/contact | jq .
```

**Variables de entorno en Pages** (configuradas en dashboard → Settings → Environment variables):

| Env var | Dónde se usa |
|---|---|
| RESEND_API_KEY | API contact (auto-response + email interno) |
| RESEND_FROM_EMAIL | Remitente del auto-response |
| NOTION_API_KEY | API contact + enroll (crear página en DB) |
| NOTION_LEADS_DB_ID | DB destino para leads |
| TELEGRAM_BOT_TOKEN | API contact (notificación) |
| TELEGRAM_CHAT_ID | Chat destino |
| QUOTE_API_KEY | API quote (auth) |
| CRON_SECRET | API cron/followup (auth) |
| NEXT_PUBLIC_SITE_URL | Metadata OG / canonical |
| NEXT_PUBLIC_GA_ID | (opcional) Google Analytics |

### Mirror #2 (Cloudflare Worker)

**Tiempo total**: ~30 s (deploy directo del worker.js).

```bash
# Opción A: con wrangler (necesita wrangler.toml en cloudflare/)
cd cloudflare/
CLOUDFLARE_API_TOKEN=cfut_xxx bunx wrangler deploy

# Opción B: deploy vía API REST (sin wrangler)
# Ver /home/z/my-project/scripts/configure_worker_secrets.py para referencia

# Verificar
curl -s https://awa3d-mirror.dashiellyeneri.workers.dev/ | jq .ok
# → true
```

**Actualizar secrets** (si rotaste alguna credencial):

```bash
cd cloudflare/
bunx wrangler secret put RESEND_API_KEY
bunx wrangler secret put NOTION_API_KEY
bunx wrangler secret put TELEGRAM_BOT_TOKEN
bunx wrangler secret put QUOTE_API_KEY
bunx wrangler secret put CRON_SECRET
# Plain vars están en wrangler.toml [vars] — editar y redeployar
```

**Verificar/activar Cron Trigger** (si se borró o nunca se activó):

```bash
# Verificar
CLOUDFLARE_API_TOKEN=cfut_xxx \
  curl -s "https://api.cloudflare.com/client/v4/accounts/<account_id>/workers/scripts/awa3d-mirror/schedules" \
  -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN" | jq .

# Activar (PUT con array de {cron:...})
CLOUDFLARE_API_TOKEN=cfut_xxx \
  curl -sX PUT \
  "https://api.cloudflare.com/client/v4/accounts/<account_id>/workers/scripts/awa3d-mirror/schedules" \
  -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN" \
  -H "Content-Type: application/json" \
  -d '[{"cron":"0 9 * * *"}]' | jq .
```

### Mirror #3 (GitHub Pages)

**Tiempo total**: ~5-8 min (push + GitHub Action).

```bash
# Cualquier push a main dispara el workflow automáticamente
cd /path/to/awa3d_repo
git add .
git commit -m "update: <descripción>"
git push origin main
```

El workflow `.github/workflows/deploy-gh-pages.yml`:

1. Checkout del código
2. Setup Bun 1.3.x
3. Setup Node 22.x
4. `bun install --frozen-lockfile`
5. `GITHUB_PAGES=true bun run build` (genera `out/` con static export)
6. Verificación de artefactos
7. Upload artifact + deploy a GitHub Pages

**URL disponible** en https://awa3dstd-create.github.io/Awa3DStudio/ tras ~3-5 min del push.

**Verificar deploy**:

```bash
gh run list --limit 5                          # ver último workflow
gh run watch                                   # ver progreso en vivo
curl -sI https://awa3dstd-create.github.io/Awa3DStudio/sw.js | head -1
# → HTTP/2 200
```

---

## 🛟 Runbook de recuperación ante desastre

### Escenario A — Cloudflare Pages caído

**Síntomas**: `curl -I https://awa3dstudio.pages.dev/` devuelve 5xx, timeout, o DNS error.

**Impacto automático** (no requiere acción):
- Usuarios que ya tienen SW instalado → failover automático al Worker (Mirror #2)
- Usuario nuevo sin SW → JS failover en `contact.tsx`/`courses.tsx` prueba los 3 mirrors

**Acción manual** (paralelo):
1. Verificar status Cloudflare: https://www.cloudflarestatus.com/
2. Si es outage global de CF → apuntar usuarios a GitHub Pages (Mirror #3):
   - Twitter/social: "Sitio temporal en https://awa3dstd-create.github.io/Awa3DStudio/"
3. Si es solo tu proyecto → redeployar:
   ```bash
   cd /path/to/awa3d_repo
   bun run build && bunx @cloudflare/next-on-pages
   CLOUDFLARE_API_TOKEN=cfut_xxx bunx wrangler pages deploy .vercel/output/static --project-name=awa3dstudio --branch=main
   ```
4. Verificar: `curl -sI https://awa3dstudio.pages.dev/ | head -1` debe devolver 200
5. Anunciar recuperación: "Sitio principal restaurado ✅"

### Escenario B — Cloudflare Worker caído

**Síntomas**: `curl https://awa3d-mirror.dashiellyeneri.workers.dev/` devuelve error.

**Impacto automático**:
- Cron backup no se ejecuta (cron-job.org sigue llamando a Pages como primario)
- Usuarios en GitHub Pages hacen failover del SW: Pages responde OK (no necesitan Worker)
- Usuarios en CF Pages: no afectados (no usan Worker)

**Acción manual**:
1. Verificar Worker: `curl -s https://awa3d-mirror.dashiellyeneri.workers.dev/ | jq .ok`
2. Si Worker roto por cambio de código → redeployar:
   ```bash
   cd cloudflare/
   CLOUDFLARE_API_TOKEN=cfut_xxx bunx wrangler deploy
   ```
3. Si Worker roto por secret revocado → reconfigurar:
   ```bash
   bunx wrangler secret put RESEND_API_KEY  # y resto
   ```
4. Si Cron Trigger desapareció (raro) → reactivar con curl PUT (ver sección Mirror #2)
5. Verificar: `curl -s https://awa3d-mirror.dashiellyeneri.workers.dev/ | jq .`

### Escenario C — GitHub Pages caído

**Síntomas**: `curl -I https://awa3dstd-create.github.io/Awa3DStudio/` devuelve 5xx.

**Impacto automático**: los otros 2 mirrors (CF Pages + CF Worker) siguen operativos. Usuarios que entraron por GitHub Pages ven error solo si el SW no estaba cacheado.

**Acción manual**:
1. Verificar status GitHub: https://www.githubstatus.com/
2. Si es outage global → esperar recuperación (suele ser <15 min)
3. Si es build roto del workflow:
   ```bash
   gh run list --limit 5
   gh run view <run-id> --log-failed
   # Fix el commit que rompió el build
   git commit --allow-empty -m "ci: retrigger pages build"
   git push origin main
   ```
4. Si es config de GitHub Pages (rama equivocada, permisos):
   - Settings → Pages → Source: GitHub Actions
   - Settings → Actions → General → Workflow permissions: Read and write

### Escenario D — Todo Cloudflare caído (Cuba bloquea CF)

**Síntomas**: Ni Pages ni Worker responden desde IPs cubanas.

**Impacto automático**:
- Usuarios con SW previamente instalado: sitio se ve desde cache, pero APIs fallan
- SW prueba Pages → bloqueado → Worker → bloqueado → devuelve 503 con `{"error":"Todos los backends están caídos"}`
- JS failover en `contact.tsx`: también falla, formulario muestra error genérico
- Usuarios en GitHub Pages (no bloqueado): SW prueba Pages → bloqueado → Worker → bloqueado → usa GitHub Pages APIs → pero GitHub Pages no tiene APIs → 404 → formulario no funciona, pero sitio se ve completo

**Acción manual**:
1. Confirmar el bloqueo: `curl -I https://awa3dstudio.pages.dev/` desde IP cubana
2. Comunicar a usuarios por email/WhatsApp: "Sitio temporalmente en https://awa3dstd-create.github.io/Awa3DStudio/ — formularios deshabilitados temporalmente"
3. **Plan B**: levantar un 4to mirror en Vercel o Netlify (DNS no bloqueado) que sirva APIs:
   ```bash
   # Vercel deploy
   bunx vercel --prod
   # Añadir a API_MIRRORS en sw.js + contact.tsx
   ```
4. Cuando CF se recupere: anunciar en redes sociales que el sitio principal vuelve a estar operativo

### Escenario E — Repositorio GitHub perdido/comprometido

**Síntomas**: repo `awa3dstd-create/awa3dstudio` borrado o hackeado.

**Acción manual**:
1. Tienes backup local en `/home/z/my-project/awa3d_repo/` (completo con git history)
2. Crear nuevo repo:
   ```bash
   gh repo create awa3dstd-create/awa3dstudio --public --source=. --push
   ```
3. Habilitar Pages: Settings → Pages → Source: GitHub Actions
4. Habilitar workflow: Actions → Enable workflows
5. Push para disparar el build
6. Actualizar MIRRORS.md con nuevo URL si cambió el nombre

### Escenario F — Lead perdido (Notion/Resend/Telegram fallan)

**Síntomas**: usuario reporta que envió formulario pero no recibiste respuesta.

**Acción manual**:
1. Revisar logs del Worker:
   ```bash
   # CF Pages logs en dashboard → Pages → awa3dstudio → Functions → Real-time Logs
   # Worker logs en dashboard → Workers → awa3d-mirror → Logs
   ```
2. Si Resend falló → usuario NO recibió auto-response pero el email interno sí llegó (y viceversa)
3. Si Notion falló → lead no se registró en DB, pero Resend y Telegram sí notificaron
4. Si Telegram falló → no recibiste notificación, pero Notion registró el lead
5. Recuperar el lead de cualquiera de los canales que sí funcionaron y registrarlo manualmente en los otros
6. Si TODOS fallaron → solicitar al usuario que reenvíe (su navegador mostrará error 503 genérico)

---

## 📊 Monitoreo continuo

### Health check script (correr manualmente cuando se quiera verificar)

```bash
#!/bin/bash
echo "=== Mirror 1 — CF Pages ==="
curl -s -o /dev/null -w "  GET / → %{http_code} %{time_total}s\n" https://awa3dstudio.pages.dev/
curl -s -o /dev/null -w "  GET /sw.js → %{http_code} %{size_download}b\n" https://awa3dstudio.pages.dev/sw.js
curl -s -o /dev/null -w "  GET /offline.html → %{http_code} %{size_download}b\n" https://awa3dstudio.pages.dev/offline.html
curl -s -o /dev/null -w "  GET /api/contact → %{http_code} %{time_total}s\n" https://awa3dstudio.pages.dev/api/contact

echo ""
echo "=== Mirror 2 — CF Worker ==="
curl -s https://awa3d-mirror.dashiellyeneri.workers.dev/ | jq -c '. | {ok,service,version,endpoints_count: (.endpoints|length)}'
curl -s -o /dev/null -w "  GET /api/contact → %{http_code} %{time_total}s\n" https://awa3d-mirror.dashiellyeneri.workers.dev/api/contact

echo ""
echo "=== Mirror 3 — GitHub Pages ==="
curl -s -o /dev/null -w "  GET / → %{http_code} %{time_total}s\n" https://awa3dstd-create.github.io/Awa3DStudio/
curl -s -o /dev/null -w "  GET /sw.js → %{http_code} %{size_download}b\n" https://awa3dstd-create.github.io/Awa3DStudio/sw.js

echo ""
echo "=== Cron Trigger Worker ==="
CLOUDFLARE_API_TOKEN=cfut_xxx curl -s \
  "https://api.cloudflare.com/client/v4/accounts/<account_id>/workers/scripts/awa3d-mirror/schedules" \
  -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN" | jq '.result.schedules'
```

### URLs de status de plataformas

| Plataforma | URL de status |
|---|---|
| Cloudflare (Pages + Workers) | https://www.cloudflarestatus.com/ |
| GitHub (Pages + Actions) | https://www.githubstatus.com/ |
| Resend (emails) | https://status.resend.com/ |
| Notion | https://status.notion.so/ |
| cron-job.org | https://cron-job.org/portal/status |

---

## 🔐 Configuración de secrets

### Cloudflare Pages (Mirror #1)

15 env vars en dashboard de Cloudflare Pages → Settings → Environment variables. Lista completa en `.env.example`. Setear tanto en `Production` como en `Preview`.

### Cloudflare Worker (Mirror #2)

5 secrets (cifrados, no visibles en dashboard):
- `RESEND_API_KEY`, `NOTION_API_KEY`, `TELEGRAM_BOT_TOKEN`, `QUOTE_API_KEY`, `CRON_SECRET`

3 plain vars (visibles en `wrangler.toml`):
- `RESEND_FROM_EMAIL`, `NOTION_LEADS_DB_ID`, `TELEGRAM_CHAT_ID`

### GitHub (Mirror #3)

No requiere secrets (no tiene APIs). El PAT de GitHub (`ghp_...`) se usa solo para push al repo y para habilitar Pages vía API.

### cron-job.org

1 job configurado:
- URL: `https://awa3dstudio.pages.dev/api/cron/followup`
- Schedule: diario 09:00 UTC
- Headers: `Authorization: Bearer <CRON_SECRET>`

---

## ❓ Troubleshooting común

| Problema | Causa probable | Fix |
|---|---|---|
| 404 en `/sw.js` o `/offline.html` en Pages | Deploy de Pages no incluye archivos nuevos | Redeploy: `bun run build && bunx @cloudflare/next-on-pages && wrangler pages deploy .vercel/output/static` |
| Cron Trigger no se ejecuta | No se activó en dashboard o se borró | `curl -X PUT .../schedules -d '[{"cron":"0 9 * * *"}]'` |
| Formulario no envía notificación a Telegram | Bot token revocado o chat ID equivocado | `wrangler secret put TELEGRAM_BOT_TOKEN` (Worker) + actualizar var en Pages |
| Lead no llega a Notion | Notion API key caducada o DB movida | `wrangler secret put NOTION_API_KEY` (Worker) + actualizar en Pages |
| GitHub Actions build falla | Error en código TS/Next | `gh run view <id> --log-failed` para ver logs |
| SW no se actualiza en navegador | Cache del SW viejo | Incrementar `SW_VERSION` en `sw.js`, push, esperar 24h para auto-update |
| Usuario ve "Todos los backends están caídos" | Los 3 mirrors caídos o IP bloqueada | Verificar cada mirror con `curl -I`, consultar Cloudflare status page |

---

## 📚 Documentación relacionada

- `README.md` — Overview del proyecto + stack + estructura
- `ROLLBACK.md` — Procedimiento de rollback de versión
- `.env.example` — Lista de todas las variables necesarias
- `.github/workflows/deploy-gh-pages.yml` — Workflow de deploy automático a GitHub Pages
- `cloudflare/wrangler.toml` — Configuración del Worker
- `cloudflare/worker.js` — Código del Worker (Mirror #2)
- `public/sw.js` — Service Worker con failover
- `public/offline.html` — Página offline cacheada por el SW
- `src/components/awa/sw-register.tsx` — Registro del SW en el cliente
- `src/components/awa/contact.tsx` — JS failover para formularios
