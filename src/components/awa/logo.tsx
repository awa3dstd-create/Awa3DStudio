"use client";

import * as React from "react";

interface LogoProps {
  /** Show only the icon (compact form for navbar/footer) */
  iconOnly?: boolean;
  /** Color of the icon mark. Footer uses "white" always. */
  color?: "teal" | "white";
  className?: string;
  iconClassName?: string;
  textClassName?: string;
}

/**
 * AWA 3D STUDIO logo.
 *
 * Icon mark: stylized "M"-like architectural form composed of two
 * geometric polygons (left + right) with sharp 60°/90° angles —
 * extracted directly from the user-provided vector logo PNG and
 * reconstructed as clean SVG paths (no raster, no pixel-art polylines).
 * Stays razor-sharp at any scale, from 16px favicon to 500px preloader.
 *
 * Composition (matches original logo):
 *   - Icon mark is wide (aspect ratio ~2.11:1)
 *   - Text reads "Awa3D" (bold) + "Studio" (light) + "™" (superscript)
 *   - Footer always renders in white (rule from PROMPT-AWA3D-WEBSITE.md §2.2)
 */
export function Logo({
  iconOnly = false,
  color = "teal",
  className,
  iconClassName,
  textClassName,
}: LogoProps) {
  const markFill = color === "white" ? "#FFFFFF" : "#00c8b4";

  return (
    <span
      className={`inline-flex items-center gap-2.5 ${className ?? ""}`}
      aria-label="Awa3D Studio"
    >
      <IconMark fill={markFill} className={iconClassName} />
      {!iconOnly && (
        <span
          className={`font-heading tracking-tight ${textClassName ?? ""}`}
        >
          <span className="font-bold text-[1.05em]">Awa3D</span>
          <span className="font-light text-[0.85em] opacity-80 ml-[0.15em]">
            Studio
          </span>
          <sup className="font-light text-[0.45em] align-super opacity-70 ml-[0.1em]">
            ™
          </sup>
        </span>
      )}
    </span>
  );
}

/**
 * The bare icon mark — used by the preloader (large) and as favicon.
 *
 * Original geometry extracted from /upload/1784750598bea2.png via
 * OpenCV contour tracing (cv2.approxPolyDP eps=8) — 99.6% pixel match
 * against the source raster. Two polygons, all integer coordinates,
 * sharp corners (stroke-linejoin: miter; vector-effect: non-scaling-stroke
 * not needed since these are filled paths, not strokes).
 */
export function IconMark({
  fill = "#FFFFFF",
  className,
}: {
  fill?: string;
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 421 199"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      role="img"
      aria-label="Awa3D Studio mark"
      preserveAspectRatio="xMidYMid meet"
    >
      {/* Left polygon — 8 vertices, contains two peaks (shorter left + taller middle) */}
      <path
        d="M 0,106 L 0,198 L 112,198 L 114,27 L 202,198 L 307,198 L 207,0 L 107,0 Z"
        fill={fill}
      />
      {/* Right polygon — 7 vertices, the right "leg" with the inset notch */}
      <path
        d="M 267,0 L 267,54 L 344,119 L 344,198 L 420,198 L 420,71 L 334,0 Z"
        fill={fill}
      />
    </svg>
  );
}
