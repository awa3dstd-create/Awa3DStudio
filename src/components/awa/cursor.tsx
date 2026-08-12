"use client";

import { useEffect, useRef } from "react";

/**
 * Custom cursor for AWA 3D Studio.
 *
 * Minimal, non-intrusive:
 * - Dot (8px) tracks the pointer instantly.
 * - Ring (36px) follows with lerp 0.35 — fluid, never laggy.
 * - mix-blend-mode: difference so it stays visible on any background.
 * - NO hover scaling/growth — the cursor stays the same size over
 *   interactive elements, per user request (kept the look pro & subtle).
 * - Hidden on touch devices (CSS handles display:none for pointer:coarse).
 * - NO CSS transitions on the cursor itself — all motion via rAF + lerp.
 */
export function CustomCursor() {
  const dotRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    // Skip on touch devices
    if (window.matchMedia("(pointer: coarse)").matches) return;

    const dot = dotRef.current;
    const ring = ringRef.current;
    if (!dot || !ring) return;

    let mouseX = window.innerWidth / 2;
    let mouseY = window.innerHeight / 2;
    let ringX = mouseX;
    let ringY = mouseY;
    let rafId = 0;

    // Fixed sizes — no growth on hover
    const DOT_SIZE = 8;
    const RING_SIZE = 36;

    const onMove = (e: MouseEvent) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
      // Dot tracks instantly — set transform directly
      dot.style.transform = `translate3d(${mouseX - DOT_SIZE / 2}px, ${
        mouseY - DOT_SIZE / 2
      }px, 0)`;
    };

    const onLeave = () => {
      dot.style.opacity = "0";
      ring.style.opacity = "0";
    };
    const onEnter = () => {
      dot.style.opacity = "1";
      ring.style.opacity = "1";
    };

    const tick = () => {
      // Lerp factor 0.35 — fluid but no perceptible delay
      ringX += (mouseX - ringX) * 0.35;
      ringY += (mouseY - ringY) * 0.35;
      ring.style.transform = `translate3d(${ringX - RING_SIZE / 2}px, ${
        ringY - RING_SIZE / 2
      }px, 0)`;
      rafId = requestAnimationFrame(tick);
    };

    window.addEventListener("mousemove", onMove, { passive: true });
    document.addEventListener("mouseleave", onLeave);
    document.addEventListener("mouseenter", onEnter);
    rafId = requestAnimationFrame(tick);

    return () => {
      window.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseleave", onLeave);
      document.removeEventListener("mouseenter", onEnter);
      cancelAnimationFrame(rafId);
    };
  }, []);

  return (
    <>
      <div ref={dotRef} className="awa-cursor-dot" aria-hidden />
      <div ref={ringRef} className="awa-cursor-ring" aria-hidden />
    </>
  );
}
