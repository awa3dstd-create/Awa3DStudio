/**
 * AWA 3D Studio — Service Worker con failover automático
 * ------------------------------------------------------------
 * Este SW intercepta peticiones a /api/* y prueba 3 backends en orden:
 *   1. Mismo dominio (donde se sirve el frontend)
 *   2. Cloudflare Pages (awa3dstudio.pages.dev)
 *   3. Cloudflare Worker (awa3d-mirror.workers.dev)
 *
 * Para peticiones de assets estáticos (HTML, CSS, JS, imágenes) usa
 * cache-first con fallback a red.
 *
 * Si todos los backends fallan, sirve versión cacheada (offline mode).
 */

const SW_VERSION = "v1.1.0-20260815";
const CACHE_NAME = `awa3d-${SW_VERSION}`;

// Backends para /api/* failover (en orden de prioridad)
const API_MIRRORS = [
  "", // mismo dominio (donde se sirve el frontend, ej: GitHub Pages o Pages mismo)
  "https://awa3dstudio.pages.dev",
  "https://awa3d-mirror.dashiellyeneri.workers.dev",
];

// Timeout para considerar un backend como "caído"
const FETCH_TIMEOUT_MS = 4000;

// Patrones que NO deben ser interceptados (delegar al navegador)
const BYPASS_PATTERNS = [
  /^https:\/\/ipapi\.co\//, // GeoIP externo
  /^https:\/\/api\.resend\.com\//, // (no debería llamarse desde cliente)
  /^https:\/\/api\.notion\.com\//, // (no debería llamarse desde cliente)
  /^https:\/\/api\.telegram\.org\//, // (no debería llamarse desde cliente)
];

// ============= INSTALL =============
self.addEventListener("install", (event) => {
  console.log(`[SW ${SW_VERSION}] Installing…`);
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then(() => {
      console.log(`[SW ${SW_VERSION}] Cache opened`);
    })
  );
});

// ============= ACTIVATE =============
self.addEventListener("activate", (event) => {
  console.log(`[SW ${SW_VERSION}] Activating…`);
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))
        )
      )
      .then(() => self.clients.claim())
  );
});

// ============= FETCH =============
self.addEventListener("fetch", (event) => {
  const req = event.request;

  // Solo manejar GET y POST
  if (req.method !== "GET" && req.method !== "POST") return;

  const url = new URL(req.url);

  // Bypass para dominios externos no relacionados
  if (BYPASS_PATTERNS.some((p) => p.test(req.url))) return;

  // ====== API calls → failover entre mirrors ======
  if (url.pathname.startsWith("/api/")) {
    event.respondWith(handleApiRequest(req));
    return;
  }

  // ===== Same-origin requests → cache-first con fallback ======
  if (url.origin === self.location.origin) {
    event.respondWith(handleAssetRequest(req));
    return;
  }

  // Para otros origins, dejar al navegador manejarlo
});

// ============= API failover =============
async function handleApiRequest(req) {
  // Si el request es mismo-origin /api/*, probamos los mirrors
  // Si el request ya viene a un mirror absoluto, lo dejamos pasar
  for (const mirror of API_MIRRORS) {
    const targetUrl = mirror
      ? `${mirror}${new URL(req.url).pathname}${new URL(req.url).search}`
      : req.url;

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

      const init = {
        method: req.method,
        headers: req.headers,
        signal: controller.signal,
      };

      if (req.method === "POST") {
        try {
          init.body = await req.clone().text();
        } catch {
          init.body = await req.clone().blob();
        }
      }

      const res = await fetch(targetUrl, init);
      clearTimeout(timeout);

      if (res.ok) {
        return res;
      }
      if (res.status >= 400 && res.status < 500) {
        // Error de cliente (validación, etc.) — no reintentar
        return res;
      }
      // 5xx → probar siguiente mirror
      console.warn(`[SW ${SW_VERSION}] ${targetUrl} returned ${res.status}, trying next mirror…`);
    } catch (err) {
      console.warn(`[SW ${SW_VERSION}] ${targetUrl} failed: ${err.message}, trying next mirror…`);
    }
  }

  // Todos los mirrors fallaron
  return new Response(
    JSON.stringify({
      ok: false,
      error: "Todos los backends están caídos. Inténtalo más tarde.",
      mirrors_tried: API_MIRRORS.filter(Boolean),
    }),
    {
      status: 503,
      headers: { "Content-Type": "application/json" },
    }
  );
}

// ============= Asset cache-first =============
async function handleAssetRequest(req) {
  const cache = await caches.open(CACHE_NAME);

  // 1. Intentar cache primero
  const cached = await cache.match(req);
  if (cached) {
    // Revalidar en background
    fetch(req)
      .then((res) => {
        if (res && res.ok) cache.put(req, res.clone());
      })
      .catch(() => {});
    return cached;
  }

  // 2. Si no está cacheado, ir a red
  try {
    const res = await fetch(req);
    if (res && res.ok && req.method === "GET") {
      cache.put(req, res.clone());
    }
    return res;
  } catch (err) {
    // 3. Si la red falla y no está en cache → fallback a página offline simple
    if (req.mode === "navigate") {
      const offlinePage = await cache.match("/offline.html");
      if (offlinePage) return offlinePage;
    }
    return new Response("Offline", { status: 503, statusText: "Offline" });
  }
}

// ============= MESSAGE (para forzar update) =============
self.addEventListener("message", (event) => {
  if (event.data === "SKIP_WAITING") self.skipWaiting();
  if (event.data === "GET_VERSION") {
    event.ports[0].postMessage({ version: SW_VERSION });
  }
});
