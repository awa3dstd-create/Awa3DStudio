"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ChevronLeft, ChevronRight, Maximize2 } from "lucide-react";
import { PORTFOLIO_PROJECTS, type PortfolioProject } from "./data";
import { fadeUp, stagger, viewportOnce } from "./motion";

/**
 * Devuelve todas las imágenes de un proyecto (portada + galería).
 * Si no tiene galería, devuelve solo la portada.
 */
function projectImages(project: PortfolioProject): string[] {
  return project.gallery && project.gallery.length > 0
    ? [project.image, ...project.gallery]
    : [project.image];
}

export function Portfolio() {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  const projects = PORTFOLIO_PROJECTS;

  const closeLightbox = useCallback(() => setLightboxIndex(null), []);
  const goPrev = useCallback(() => {
    setLightboxIndex((i) =>
      i === null ? i : (i - 1 + projects.length) % projects.length
    );
  }, [projects.length]);
  const goNext = useCallback(() => {
    setLightboxIndex((i) => (i === null ? i : (i + 1) % projects.length));
  }, [projects.length]);

  // Keyboard navigation
  useEffect(() => {
    if (lightboxIndex === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeLightbox();
      if (e.key === "ArrowLeft") goPrev();
      if (e.key === "ArrowRight") goNext();
    };
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [lightboxIndex, closeLightbox, goPrev, goNext]);

  return (
    <section id="portfolio" className="awa-section">
      <div className="awa-container">
        {/* Header */}
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={viewportOnce}
          variants={stagger}
          className="mb-12 md:mb-20"
        >
          <motion.span
            variants={fadeUp}
            className="awa-label block mb-4"
          >
            Portfolio · Selección 2024
          </motion.span>
          <motion.h2
            variants={fadeUp}
            className="awa-heading text-3xl sm:text-4xl md:text-5xl text-white max-w-3xl"
          >
            Proyectos que materializan
            <br />
            <span className="text-[#71717a]">ideas en imágenes.</span>
          </motion.h2>
          <motion.p
            variants={fadeUp}
            className="text-[#a1a1aa] mt-6 max-w-xl"
          >
            Cada render es el resultado de un diálogo entre arquitectura,
            iluminación y materialidad. Una selección curada de trabajos recientes.
          </motion.p>
        </motion.div>

        {/* Editorial 3-image layout — no cropping, generous whitespace.
            Desktop: featured center + 2 flanking cards. Mobile: stacked. */}
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={viewportOnce}
          variants={stagger}
          className="grid grid-cols-1 lg:grid-cols-12 gap-6 md:gap-8 items-stretch"
        >
          {/* Left card */}
          <PortfolioCard
            project={projects[0]}
            index={1}
            total={projects.length}
            onOpen={() => setLightboxIndex(0)}
            variants={fadeUp}
            className="lg:col-span-4 lg:pt-16"
            aspect="aspect-[4/5]"
          />
          {/* Center — featured (larger) */}
          <PortfolioCard
            project={projects[1]}
            index={2}
            total={projects.length}
            onOpen={() => setLightboxIndex(1)}
            variants={fadeUp}
            className="lg:col-span-4"
            aspect="aspect-[4/5]"
            featured
          />
          {/* Right card */}
          <PortfolioCard
            project={projects[2]}
            index={3}
            total={projects.length}
            onOpen={() => setLightboxIndex(2)}
            variants={fadeUp}
            className="lg:col-span-4 lg:pt-16"
            aspect="aspect-[4/5]"
          />
        </motion.div>
      </div>

      {/* Lightbox */}
      {lightboxIndex !== null && (
        <Lightbox
          project={projects[lightboxIndex]}
          onClose={closeLightbox}
          onPrev={goPrev}
          onNext={goNext}
          index={lightboxIndex + 1}
          total={projects.length}
        />
      )}
    </section>
  );
}

/* ---------- Card ---------- */
function PortfolioCard({
  project,
  index,
  total,
  onOpen,
  variants,
  className = "",
  aspect = "aspect-[4/5]",
  featured = false,
}: {
  project: PortfolioProject;
  index: number;
  total: number;
  onOpen: () => void;
  variants: typeof fadeUp;
  className?: string;
  aspect?: string;
  featured?: boolean;
}) {
  const images = useMemo(() => projectImages(project), [project]);
  const hasGallery = images.length > 1;
  const [activeImg, setActiveImg] = useState(0);
  const [prevProjectId, setPrevProjectId] = useState(project.id);
  // Reset to first image when project changes (derived-state pattern,
  // avoids setState-in-effect cascading renders)
  if (project.id !== prevProjectId) {
    setPrevProjectId(project.id);
    setActiveImg(0);
  }

  const goPrevImg = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      e.preventDefault();
      setActiveImg((i) => (i - 1 + images.length) % images.length);
    },
    [images.length]
  );
  const goNextImg = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      e.preventDefault();
      setActiveImg((i) => (i + 1) % images.length);
    },
    [images.length]
  );

  return (
    <motion.div variants={variants} className={className}>
      {/*
        Outer clickable region is a div[role=button] (NOT a <button>)
        because the inner gallery arrows are <button>s — nesting <button>
        inside <button> is invalid HTML and the browser silently drops
        the outer one. Using role=button + keydown handler keeps it
        accessible (Enter/Space open the lightbox).
      */}
      <div
        role="button"
        tabIndex={0}
        onClick={onOpen}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onOpen();
          }
        }}
        className="group block w-full text-left cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-[#00c8b4]/40 rounded-sm"
        aria-label={`Abrir ${project.title} en vista ampliada`}
      >
        {/* Image frame — object-contain so nothing is cropped.
            Background behind the image matches page bg so letterboxing
            (if any) blends seamlessly. */}
        <div
          className={`relative ${aspect} overflow-hidden rounded-sm border ${
            featured ? "border-[#00c8b4]/30" : "border-[#1e1e2a]"
          } bg-[#08080d] awa-card-hover`}
        >
          <AnimatePresence mode="wait">
            <motion.img
              key={images[activeImg]}
              src={images[activeImg]}
              alt={`${project.title} — render ${activeImg + 1}`}
              loading="lazy"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.35, ease: [0.4, 0, 0.2, 1] }}
              className="absolute inset-0 w-full h-full object-contain"
            />
          </AnimatePresence>

          {/* Always-visible index badge — editorial feel */}
          <div className="absolute top-4 left-4 z-10">
            <span className="text-[10px] uppercase tracking-[0.2em] text-[#71717a] font-heading font-semibold tabular-nums">
              {String(index).padStart(2, "0")} / {String(total).padStart(2, "0")}
            </span>
          </div>

          {/* Hover hint — maximize icon */}
          <div className="absolute top-4 right-4 z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
            <Maximize2 size={16} className="text-[#00c8b4]" />
          </div>

          {/* Gallery navigation — only when project has multiple images */}
          {hasGallery && (
            <>
              {/* Side arrows */}
              <button
                type="button"
                onClick={goPrevImg}
                className="absolute left-2 top-1/2 -translate-y-1/2 z-20 p-2 rounded-full bg-[#0a0a0f]/70 border border-[#1e1e2a] text-white/80 hover:text-[#00c8b4] hover:border-[#00c8b4]/50 backdrop-blur-sm transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100"
                aria-label="Imagen anterior del proyecto"
              >
                <ChevronLeft size={18} />
              </button>
              <button
                type="button"
                onClick={goNextImg}
                className="absolute right-2 top-1/2 -translate-y-1/2 z-20 p-2 rounded-full bg-[#0a0a0f]/70 border border-[#1e1e2a] text-white/80 hover:text-[#00c8b4] hover:border-[#00c8b4]/50 backdrop-blur-sm transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100"
                aria-label="Imagen siguiente del proyecto"
              >
                <ChevronRight size={18} />
              </button>

              {/* Dot indicators — bottom center, always visible (so users
                  on touch devices also see this is a gallery) */}
              <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-10 flex items-center gap-2 px-2 py-1.5 rounded-full bg-[#0a0a0f]/55 backdrop-blur-sm border border-[#1e1e2a]/80">
                {images.map((_, i) => (
                  <span
                    key={i}
                    className={`block h-1.5 rounded-full transition-all duration-300 ${
                      i === activeImg
                        ? "w-6 bg-[#00c8b4]"
                        : "w-1.5 bg-white/55 group-hover:bg-white/80"
                    }`}
                  />
                ))}
              </div>

              {/* Image counter badge — bottom right */}
              <div className="absolute bottom-3 right-3 z-10 flex items-center gap-1.5 text-[10px] uppercase tracking-[0.15em] text-white/75 font-heading font-semibold tabular-nums bg-[#0a0a0f]/65 backdrop-blur-sm px-2 py-1 rounded-sm border border-[#1e1e2a]">
                {activeImg + 1} / {images.length}
              </div>
            </>
          )}
        </div>

        {/* Caption below image — always visible (no hover-only reveals) */}
        <div className="mt-5 md:mt-6">
          <p className="text-[10px] uppercase tracking-[0.18em] text-[#00c8b4] mb-2 font-heading font-semibold">
            {project.category} · {project.year}
          </p>
          <h3 className={`font-heading font-bold text-white mb-2 ${
            featured ? "text-2xl md:text-3xl" : "text-xl md:text-2xl"
          }`}>
            {project.title}
          </h3>
          <p className="text-sm text-[#a1a1aa] leading-relaxed max-w-md">
            {project.description}
          </p>
        </div>
      </div>
    </motion.div>
  );
}

function Lightbox({
  project,
  onClose,
  onPrev,
  onNext,
  index,
  total,
}: {
  project: PortfolioProject;
  onClose: () => void;
  onPrev: () => void;
  onNext: () => void;
  index: number;
  total: number;
}) {
  const images = useMemo(() => projectImages(project), [project]);
  const hasGallery = images.length > 1;
  const [activeImg, setActiveImg] = useState(0);
  const [prevProjectId, setPrevProjectId] = useState(project.id);
  // Reset to first image when project changes (derived-state pattern)
  if (project.id !== prevProjectId) {
    setPrevProjectId(project.id);
    setActiveImg(0);
  }

  const goPrevImg = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      setActiveImg((i) => (i - 1 + images.length) % images.length);
    },
    [images.length]
  );
  const goNextImg = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      setActiveImg((i) => (i + 1) % images.length);
    },
    [images.length]
  );

  // Inner-image keyboard navigation (when gallery present):
  // ↑/↓ or PageUp/PageDown to switch between images of the same project
  useEffect(() => {
    if (!hasGallery) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowUp" || e.key === "PageUp") {
        e.preventDefault();
        setActiveImg((i) => (i - 1 + images.length) % images.length);
      }
      if (e.key === "ArrowDown" || e.key === "PageDown") {
        e.preventDefault();
        setActiveImg((i) => (i + 1) % images.length);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [hasGallery, images.length]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4 }}
      className="fixed inset-0 z-[100] bg-[#0a0a0f]/95 backdrop-blur-xl flex flex-col"
      onClick={onClose}
    >
      {/* Top bar */}
      <div className="flex items-center justify-between p-4 md:p-6 text-[#a1a1aa]">
        <div>
          <p className="text-[10px] uppercase tracking-[0.2em] text-[#00c8b4]">
            {project.category} · {project.year}
          </p>
          <h3 className="text-lg md:text-2xl font-heading font-semibold text-white mt-1">
            {project.title}
          </h3>
        </div>
        <div className="flex items-center gap-3 md:gap-5">
          {/* Project counter */}
          <span className="text-xs md:text-sm tabular-nums">
            Proyecto {String(index).padStart(2, "0")} / {String(total).padStart(2, "0")}
          </span>
          <button
            type="button"
            onClick={onClose}
            className="p-2 hover:text-white transition-colors"
            aria-label="Cerrar"
          >
            <X size={22} />
          </button>
        </div>
      </div>

      {/* Image */}
      <div
        className="flex-1 flex items-center justify-center px-4 md:px-12 pb-4 md:pb-6 relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Prev project (always visible) */}
        <button
          type="button"
          onClick={onPrev}
          className="absolute left-2 md:left-6 p-3 rounded-full border border-[#1e1e2a] bg-[#0f0f17]/80 text-white hover:border-[#00c8b4] hover:text-[#00c8b4] transition-colors"
          aria-label="Proyecto anterior"
          title="Proyecto anterior"
        >
          <ChevronLeft size={20} />
        </button>

        {/* Image stage — relative so we can stack inner-image arrows */}
        <div className="relative flex items-center justify-center max-w-[78vw]">
          <AnimatePresence mode="wait">
            <motion.img
              key={images[activeImg]}
              src={images[activeImg]}
              alt={`${project.title} — render ${activeImg + 1}`}
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
              className="max-h-[75vh] max-w-full object-contain rounded-sm"
            />
          </AnimatePresence>

          {/* Inner-image arrows — only when gallery present.
              Placed slightly inside the project arrows so they don't overlap. */}
          {hasGallery && (
            <>
              <button
                type="button"
                onClick={goPrevImg}
                className="absolute -left-2 md:-left-4 top-1/2 -translate-y-1/2 p-2 rounded-full border border-[#1e1e2a] bg-[#0f0f17]/85 text-white/85 hover:border-[#00c8b4] hover:text-[#00c8b4] backdrop-blur-sm transition-colors"
                aria-label="Imagen anterior del proyecto"
                title="Imagen anterior del proyecto (↑)"
              >
                <ChevronLeft size={18} />
              </button>
              <button
                type="button"
                onClick={goNextImg}
                className="absolute -right-2 md:-right-4 top-1/2 -translate-y-1/2 p-2 rounded-full border border-[#1e1e2a] bg-[#0f0f17]/85 text-white/85 hover:border-[#00c8b4] hover:text-[#00c8b4] backdrop-blur-sm transition-colors"
                aria-label="Imagen siguiente del proyecto"
                title="Imagen siguiente del proyecto (↓)"
              >
                <ChevronRight size={18} />
              </button>

              {/* Inner image counter — small badge under image */}
              <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-2">
                {images.map((_, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setActiveImg(i);
                    }}
                    aria-label={`Ir a imagen ${i + 1}`}
                    className={`block h-1.5 rounded-full transition-all duration-300 ${
                      i === activeImg
                        ? "w-6 bg-[#00c8b4]"
                        : "w-1.5 bg-white/35 hover:bg-white/60"
                    }`}
                  />
                ))}
                <span className="ml-2 text-[10px] uppercase tracking-[0.18em] text-white/55 font-heading tabular-nums">
                  {activeImg + 1} / {images.length}
                </span>
              </div>
            </>
          )}
        </div>

        {/* Next project (always visible) */}
        <button
          type="button"
          onClick={onNext}
          className="absolute right-2 md:right-6 p-3 rounded-full border border-[#1e1e2a] bg-[#0f0f17]/80 text-white hover:border-[#00c8b4] hover:text-[#00c8b4] transition-colors"
          aria-label="Proyecto siguiente"
          title="Proyecto siguiente"
        >
          <ChevronRight size={20} />
        </button>
      </div>

      {/* Caption */}
      <div
        className={`px-4 md:px-12 pb-6 md:pb-10 max-w-3xl mx-auto ${
          hasGallery ? "mt-4" : ""
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        <p className="text-sm md:text-base text-[#a1a1aa] leading-relaxed text-center">
          {project.description}
        </p>
      </div>
    </motion.div>
  );
}
