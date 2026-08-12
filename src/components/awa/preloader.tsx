"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { IconMark } from "./logo";

/**
 * Cinematic preloader for AWA 3D Studio.
 *
 * Sequence (total ~9s):
 *   0.0–2.0s  Icon fades in + scales 0.9 → 1.0
 *   2.0–3.0s  Hairline expands beneath icon
 *   3.0–4.5s  "Awa3D" + "Studio" + "™" fade in
 *   4.5–7.5s  Hold
 *   7.5–9.0s  Whole preloader fades out (1.5s)
 *
 * Only shown on first visit per session (sessionStorage).
 */
export function Preloader() {
  // Lazy initializer reads sessionStorage synchronously — no setState in effect.
  const [shouldRender, setShouldRender] = useState<boolean>(() => {
    if (typeof window === "undefined") return false; // SSR: don't render
    try {
      return sessionStorage.getItem("awa-seen") !== "1";
    } catch {
      return true;
    }
  });
  const [phase, setPhase] = useState(0);
  const [fadingOut, setFadingOut] = useState(false);

  useEffect(() => {
    if (!shouldRender) {
      document.body.classList.add("awa-custom-cursor");
      return;
    }

    const t1 = window.setTimeout(() => setPhase(1), 50); // icon visible
    const t2 = window.setTimeout(() => setPhase(2), 2000); // line expand
    const t3 = window.setTimeout(() => setPhase(3), 3000); // text fade
    const t4 = window.setTimeout(() => setFadingOut(true), 7500); // start fade-out
    const t5 = window.setTimeout(() => {
      setShouldRender(false);
      try {
        sessionStorage.setItem("awa-seen", "1");
      } catch {
        /* ignore */
      }
      document.body.classList.add("awa-custom-cursor");
    }, 9000);

    return () => {
      [t1, t2, t3, t4, t5].forEach(clearTimeout);
    };
  }, [shouldRender]);

  if (!shouldRender) return null;

  return (
    <AnimatePresence>
      <motion.div
        key="preloader"
        className="awa-preloader"
        initial={{ opacity: 1 }}
        animate={{ opacity: fadingOut ? 0 : 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 1.5, ease: [0.4, 0, 0.2, 1] }}
      >
        {/* Phase 1: Icon */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{
            opacity: phase >= 1 ? 1 : 0,
            scale: phase >= 1 ? 1 : 0.9,
          }}
          transition={{ duration: 1.5, ease: [0.4, 0, 0.2, 1] }}
          className="flex flex-col items-center"
        >
          <IconMark fill="#FFFFFF" className="awa-preloader-icon" />

          {/* Phase 2: Line */}
          <motion.div
            className="awa-preloader-line"
            initial={{ width: 0, opacity: 0 }}
            animate={{
              width: phase >= 2
                ? typeof window !== "undefined" && window.innerWidth < 768
                  ? "25vw"
                  : "140px"
                : 0,
              opacity: phase >= 2 ? 1 : 0,
            }}
            transition={{ duration: 0.8, ease: [0.4, 0, 0.2, 1] }}
          />

          {/* Phase 3: Text */}
          <motion.div
            className="awa-preloader-text"
            initial={{ opacity: 0, y: 8 }}
            animate={{
              opacity: phase >= 3 ? 1 : 0,
              y: phase >= 3 ? 0 : 8,
            }}
            transition={{ duration: 0.8, ease: [0.4, 0, 0.2, 1] }}
          >
            <span style={{ fontWeight: 700, fontSize: "2rem" }}>Awa3D</span>
            <span
              style={{
                fontWeight: 300,
                fontSize: "1.4rem",
                marginLeft: "0.4rem",
              }}
            >
              Studio
            </span>
            <span
              style={{
                fontWeight: 300,
                fontSize: "0.6rem",
                marginLeft: "0.15rem",
                alignSelf: "flex-start",
                marginTop: "0.4rem",
              }}
            >
              ™
            </span>
          </motion.div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
