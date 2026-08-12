# AWA 3D Studio

> Visualización Arquitectónica & Modelado 3D · La Habana, Cuba

[![Deploy to GitHub Pages](https://github.com/awa3dstd-create/Awa3DStudio/actions/workflows/deploy-gh-pages.yml/badge.svg)](https://github.com/awa3dstd-create/Awa3DStudio/actions/workflows/deploy-gh-pages.yml)

---

## 🌐 Despliegues (3 mirrors con failover automático)

Este repositorio es **mirror #3** del sitio AWA 3D Studio. Los 3 despliegues funcionan como espejos con failover automático vía Service Worker.

| # | URL | Plataforma | Stack | Función |
|---|---|---|---|---|
| 1 | https://awa3dstudio.pages.dev | Cloudflare Pages | Next.js + Edge Functions | **Principal** — frontend + APIs |
| 2 | https://awa3d-mirror.workers.dev | Cloudflare Worker | Worker (JS) | **Backup 1** — frontend + APIs |
| 3 | https://awa3dstd.github.io/Awa3DStudio | GitHub Pages | Next.js static export | **Backup 2** — frontend, APIs vía Worker |

### 🔄 Failover automático

El sitio incluye un **Service Worker** (`public/sw.js`) que intercepta las peticiones a `/api/*` y prueba los 3 backends en orden:

1. Mismo dominio (donde se sirve el frontend)
2. `https://awa3dstudio.pages.dev` (Cloudflare Pages)
3. `https://awa3d-mirror.workers.dev` (Worker)

El primero que responde exitosamente sirve la respuesta. Si todos fallan, se muestra `/offline.html` con opciones de contacto directo (email + WhatsApp).

Para los **assets estáticos** (HTML, CSS, JS, imágenes), el SW usa cache-first con revalidación en background → el sitio carga instantáneamente en visitas repetidas, incluso sin conexión.

---

## 🛠️ Stack técnico

- **Framework**: Next.js 16 (App Router)
- **Lenguaje**: TypeScript
- **Estilos**: Tailwind CSS 4 + shadcn/ui
- **Runtime**: Bun
- **Backend**: Cloudflare Pages Edge Functions (4 API routes)
- **CRM**: Notion (database de Leads)
- **Email**: Resend (transactional)
- **Alertas**: Telegram Bot + CallMeBot (WhatsApp)
- **Build**: `next build` con `output: 'export'` para GitHub Pages

---

## 📦 Desarrollo local

```bash
# 1. Instalar dependencias
bun install

# 2. Copiar .env.example a .env y rellenar valores
cp .env.example .env

# 3. Modo desarrollo
bun run dev

# 4. Build estático (igual que GitHub Pages)
GITHUB_PAGES=true bun run build
# output en ./out/

# 5. Sirver localmente para probar
bunx serve out -p 3000
```

---

## 🔐 Variables de entorno

Ver `.env.example` para la lista completa. **Los secretos reales NUNCA se commitean** — viven en:

- **Cloudflare Pages env vars** (producción): configurados vía dashboard o API
- **Cloudflare Worker secrets** (mirror): configurados vía `wrangler secret put`
- **Local `.env`**: solo para desarrollo local, en `.gitignore`

---

## 📁 Estructura del proyecto

```
.
├── .github/workflows/
│   └── deploy-gh-pages.yml      # CI/CD: build + deploy automático
├── cloudflare/
│   └── worker.js                # Worker mirror (deploy aparte)
├── public/
│   ├── portfolio/               # Imágenes de portfolio (8 renders)
│   ├── sw.js                    # Service Worker (failover)
│   ├── offline.html             # Página offline (SW fallback)
│   ├── _headers                 # Headers de seguridad
│   └── robots.txt
├── scripts/                     # Utilidades (sin secretos)
├── src/
│   ├── app/
│   │   ├── api/                 # 4 API routes (contact, enroll, quote, cron/followup)
│   │   ├── globals.css
│   │   ├── layout.tsx           # Registra Service Worker
│   │   └── page.tsx
│   ├── components/
│   │   ├── awa/                  # Componentes del sitio
│   │   └── ui/                  # shadcn/ui components
│   └── lib/
│       ├── email.ts             # Resend integration
│       ├── leads.ts             # Lead capture logic (shared)
│       ├── notion.ts            # Notion API client
│       ├── telegram.ts          # Telegram bot
│       ├── quote-pdf.ts         # PDF generation (pdf-lib)
│       ├── quote-pricing.ts     # Pricing logic with PPP
│       └── templates.ts         # Email HTML templates
├── prisma/schema.prisma
├── next.config.ts               # Config condicional (Pages vs Pages)
├── open-next.config.ts          # @opennextjs/cloudflare adapter
└── package.json
```

---

## 🚀 CI/CD

El workflow `.github/workflows/deploy-gh-pages.yml` se ejecuta en cada push a `main`:

1. Instala Bun + dependencias
2. Configura GitHub Pages
3. Build estático con `GITHUB_PAGES=true` (output: 'export', basePath: '/Awa3DStudio')
4. Sube `out/` como artifact
5. Deploy automático a `https://awa3dstd.github.io/Awa3DStudio/`

---

## 📚 Documentación adicional

- `MIRRORS.md` — Configuración detallada de los 3 mirrors
- `worklog.md` — Historial de cambios del proyecto
- `ROLLBACK.md` — Procedimiento de rollback

---

## 📞 Contacto

- Email: awa3dstd@gmail.com
- WhatsApp: +53 5 123 4567
- Instagram: @awa3dstudio
- LinkedIn: /company/awa3dstudio
- Behance: /awa3dstudio

© AWA 3D Studio · La Habana, Cuba
