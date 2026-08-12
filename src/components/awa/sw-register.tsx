"use client";

import { useEffect } from "react";

/**
 * Registra el Service Worker para failover automático entre mirrors.
 * Solo corre en producción (no en dev ni en SSR).
 */
export function ServiceWorkerRegister() {
  useEffect(() => {
    if (
      typeof window !== "undefined" &&
      "serviceWorker" in navigator &&
      process.env.NODE_ENV === "production"
    ) {
      // path del SW relativo (funciona tanto en root como en subpath /Awa3DStudio/)
      const swUrl = `${process.env.NEXT_PUBLIC_BASE_PATH || ""}/sw.js`;

      navigator.serviceWorker
        .register(swUrl, { scope: "/" })
        .then((reg) => {
          console.log("[SW] registrado:", reg.scope);
          // check updates cada hora
          setInterval(() => reg.update().catch(() => {}), 60 * 60 * 1000);
        })
        .catch((err) => {
          console.warn("[SW] fallo registro:", err);
        });

      // Si hay update, recargar
      let refreshing = false;
      navigator.serviceWorker.addEventListener("controllerchange", () => {
        if (!refreshing) {
          refreshing = true;
          window.location.reload();
        }
      });
    }
  }, []);

  return null;
}
