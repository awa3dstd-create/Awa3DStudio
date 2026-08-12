# Mirrors — Configuración de respaldos

Este documento describe la configuración de los 3 mirrors del sitio AWA 3D Studio con failover automático.

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

## 🌐 Los 3 mirrors

### Mirror #1 — Cloudflare Pages (PRINCIPAL)

| Atributo | Valor |
|---|---|
| URL | https://awa3dstudio.pages.dev |
| Plataforma | Cloudflare Pages |
| Source | Upload directo con `wrangler pages deploy` (ad-hoc, no Git-connected) |
| Build | `bun run build && bunx @cloudflare/next-on-pages` (local) |
| Output | `.vercel/output/static` → Cloudflare Pages |
| APIs | 4 edge functions: `/api/contact`, `/api/enroll`, `/api/quote`, `/api/cron/followup` |
| Cron | Externo (cron-job.org) llama a `/api/cron/followup` diario 09:00 UTC |
| Secrets | 15 env vars en Cloudflare Pages (production + preview) |
| Status | ✅ Producción actual |

**Deployment ID activo**: `2e8ded9d-3219-45d2-8306-3eb9c92c0019` (2026-08-09)

### Mirror #2 — Cloudflare Worker (BACKUP 1)

| Atributo | Valor |
|---|---|
| URL | https://awa3d-mirror.dashiellyeneri.workers.dev |
| Plataforma | Cloudflare Workers |
| Source | `cloudflare/worker.js` en este repo |
| Deploy | `wrangler deploy` (manual o CI) |
| APIs | Worker handlers reescritos para las 4 rutas |
| Cron | Worker Cron Trigger (alternativa a cron-job.org) |
| Secrets | Worker secrets (vía `wrangler secret put`) |

### Mirror #3 — GitHub Pages (BACKUP 2, este repo)

| Atributo | Valor |
|---|---|
| URL | https://awa3dstd.github.io/Awa3DStudio/ |
| Plataforma | GitHub Pages (Azure backend) |
| Source | Este repositorio (`awa3dstd-create/Awa3DStudio`) |
| Build | GitHub Action: `bun install` → `GITHUB_PAGES=true bun run build` → `out/` |
| Output | Static export (HTML/CSS/JS), sin APIs |
| APIs | Llama al Worker (Mirror #2) |
| Cron | N/A (no puede haber cron en Pages) |
| Branch | `main` → build automático |
| Status | 🟡 Pendiente activación |

## 🔄 Lógica de failover

### Service Worker (`public/sw.js`)

El SW intercepta todas las peticiones del navegador:

```javascript
// Para /api/* — failover entre mirrors
async function handleApiRequest(req) {
  const API_MIRRORS = [
    "",                                // 1. mismo dominio
    "https://awa3dstudio.pages.dev",   // 2. CF Pages
    "https://awa3d-mirror.dashiellyeneri.workers.dev" // 3. CF Worker
  ];
  
  for (const mirror of API_MIRRORS) {
    try {
      const res = await fetch(mirror + req.url, { ... });
      if (res.ok) return res;
      // 4xx → no reintentar (error real)
      // 5xx → probar siguiente mirror
    } catch {
      // timeout/network → probar siguiente mirror
    }
  }
  
  // Todos fallaron
  return new Response(JSON.stringify({ ok: false, ... }), { status: 503 });
}

// Para assets — cache-first
async function handleAssetRequest(req) {
  const cached = await cache.match(req);
  if (cached) {
    // revalidar en background
    fetch(req).then(res => cache.put(req, res.clone()));
    return cached;
  }
  return fetch(req);
}
```

### Frontend (en `contact.tsx` y `courses.tsx`)

Doble redundancia: el JS también hace failover (por si el SW falla):

```typescript
const endpoints = [
  CONTACT_INFO.contactApi,                                    // mismo dominio
  ...CONTACT_INFO.mirrors.map(m => `${m}${CONTACT_INFO.contactApi}`)  // mirrors absolutos
];

for (const url of endpoints) {
  try {
    const res = await fetch(url, { ... });
    if (res.ok) { /* éxito */ break; }
  } catch { /* probar siguiente */ }
}
```

## 📋 Estado de cada mirror

| Componente | Mirror 1 (Pages) | Mirror 2 (Worker) | Mirror 3 (GitHub Pages) |
|---|---|---|---|
| Frontend | ✅ | ✅ | ✅ |
| APIs | ✅ Propias | ✅ Propias | ⚠️ Viaja al Worker |
| Cron | ✅ cron-job.org | ✅ Worker Cron Trigger | N/A |
| Failover SW | ✅ Instalado | ✅ Instalado | ✅ Instalado |
| Cache offline | ✅ | ✅ | ✅ |
| Última release | 2026-08-09 | Pendiente | Pendiente |

## 🚀 Cómo actualizar cada mirror

### Mirror #1 (Cloudflare Pages)

Desde la máquina local con el código fuente:

```bash
bun install
bun run build && bunx @cloudflare/next-on-pages
CLOUDFLARE_API_TOKEN=cfut_xxx bunx wrangler pages deploy .vercel/output/static \
  --project-name=awa3dstudio --branch=main
```

### Mirror #2 (Cloudflare Worker)

```bash
cd cloudflare/
CLOUDFLARE_API_TOKEN=cfut_xxx bunx wrangler deploy worker.js --name awa3d-mirror --compatibility-date 2024-09-01
```

### Mirror #3 (GitHub Pages — este repo)

Cualquier push a `main` dispara automáticamente el workflow:

```bash
git add .
git commit -m "update: <descripción>"
git push origin main
```

El workflow de Actions:
1. Instala Bun
2. `bun install --frozen-lockfile`
3. `GITHUB_PAGES=true bun run build`
4. Sube `out/` a GitHub Pages
5. URL disponible en ~3-5 min

## 🔐 Configuración de secrets

### Cloudflare Pages (Mirror #1)

Las 15 env vars están en el dashboard de Cloudflare Pages → Settings → Environment variables. Lista en `.env.example`.

### Cloudflare Worker (Mirror #2)

```bash
# Configurar cada secret del Worker:
cd cloudflare/
bunx wrangler secret put RESEND_API_KEY
bunx wrangler secret put NOTION_API_KEY
bunx wrangler secret put NOTION_LEADS_DB_ID
bunx wrangler secret put TELEGRAM_BOT_TOKEN
bunx wrangler secret put TELEGRAM_CHAT_ID
bunx wrangler secret put QUOTE_API_KEY
bunx wrangler secret put CRON_SECRET
```

### GitHub (Mirror #3)

No requiere secrets (no tiene APIs). El PAT de GitHub (`ghp_...`) se usa solo una vez para el push inicial.

## 📊 Monitoreo

| Mirror | Cómo verificar | URL de status |
|---|---|---|
| Cloudflare Pages | `curl -I https://awa3dstudio.pages.dev` | https://www.cloudflarestatus.com/ |
| Cloudflare Worker | `curl -I https://awa3d-mirror.dashiellyeneri.workers.dev` | https://www.cloudflarestatus.com/ |
| GitHub Pages | `curl -I https://awa3dstd.github.io/Awa3DStudio/` | https://www.githubstatus.com/ |

## 🛟 Recuperación ante desastre

### Si Cloudflare Pages cae
1. SW del navegador detecta timeout y salta al Worker
2. Worker atiende todas las peticiones (frontend + APIs)
3. GitHub Pages también disponible como respaldo adicional
4. Cuando Pages vuelve, SW lo reintenta primero

### Si Cloudflare Worker cae
1. SW salta a Pages (sigue funcionando)
2. GitHub Pages sigue disponible
3. Cron: si Worker Cron Trigger no funciona, cron-job.org sigue llamando a Pages

### Si GitHub Pages cae
1. Los otros 2 mirrors siguen funcionando
2. Usuario solo nota si entró por GitHub Pages y el SW no estaba instalado
3. Recuperación: GitHub usualmente se recupera en minutos

### Si todo Cuba bloquea Cloudflare
1. Usuario entra por `https://awa3dstd.github.io/Awa3DStudio/` (GitHub no bloqueado)
2. SW se instala desde GitHub Pages
3. SW prueba Pages → bloqueado → prueba Worker → bloqueado → usa su propia copia cacheada + JS failover intenta Pages/Worker absolutos
4. Si ni Pages ni Worker accesibles: el formulario muestra error, pero el sitio se ve completo
