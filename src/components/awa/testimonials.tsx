"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, Star, Quote } from "lucide-react";
import { TESTIMONIALS } from "./data";
import { fadeUp, stagger, viewportOnce, EASE } from "./motion";

const AUTOPLAY_MS = 6000;

export function Testimonials() {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  const goPrev = useCallback(
    () => setIndex((i) => (i - 1 + TESTIMONIALS.length) % TESTIMONIALS.length),
    []
  );
  const goNext = useCallback(
    () => setIndex((i) => (i + 1) % TESTIMONIALS.length),
    []
  );

  useEffect(() => {
    if (paused) return;
    const id = window.setInterval(goNext, AUTOPLAY_MS);
    return () => window.clearInterval(id);
  }, [paused, goNext]);

  const current = TESTIMONIALS[index];

  return (
    <section
      id="testimonios"
      className="awa-section"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div className="awa-container">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={viewportOnce}
          variants={stagger}
          className="mb-12 md:mb-16 text-center"
        >
          <motion.span variants={fadeUp} className="awa-label block mb-4">
            Testimonios · Lo que dicen
          </motion.span>
          <motion.h2
            variants={fadeUp}
            className="awa-heading text-3xl sm:text-4xl md:text-5xl text-white"
          >
            Clientes que volvieron
            <br />
            <span className="text-[#71717a]">a confiar en nosotros.</span>
          </motion.h2>
        </motion.div>

        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={viewportOnce}
          variants={fadeUp}
          className="relative max-w-4xl mx-auto"
        >
          <div className="relative px-6 md:px-16 py-12 md:py-16 border border-[#1e1e2a] bg-[#0f0f17] rounded-sm overflow-hidden">
            {/* Big quote decoration */}
            <Quote
              size={120}
              className="absolute top-6 left-6 text-[#00c8b4]/5 pointer-events-none"
              strokeWidth={1}
            />

            <AnimatePresence mode="wait">
              <motion.blockquote
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.5, ease: EASE }}
                className="relative"
              >
                <div className="flex gap-1 mb-6">
                  {Array.from({ length: current.rating }).map((_, i) => (
                    <Star
                      key={i}
                      size={16}
                      className="text-[#00c8b4] fill-[#00c8b4]"
                    />
                  ))}
                </div>

                <p className="text-lg md:text-2xl font-heading font-light text-white leading-relaxed mb-8 italic">
                  &ldquo;{current.quote}&rdquo;
                </p>

                <footer className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#00c8b4] to-[#00c8b4]/30 flex items-center justify-center text-[#0a0a0f] font-heading font-bold text-lg">
                    {current.name.charAt(0)}
                  </div>
                  <div>
                    <p className="font-heading font-semibold text-white">
                      {current.name}
                    </p>
                    <p className="text-xs text-[#71717a] mt-0.5">
                      {current.role}
                    </p>
                  </div>
                </footer>
              </motion.blockquote>
            </AnimatePresence>

            {/* Pagination dots */}
            <div className="flex justify-center gap-2 mt-10">
              {TESTIMONIALS.map((_, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setIndex(i)}
                  className={`h-1.5 rounded-full transition-all duration-500 ${
                    i === index
                      ? "w-8 bg-[#00c8b4]"
                      : "w-1.5 bg-[#1e1e2a] hover:bg-[#3a3a4a]"
                  }`}
                  aria-label={`Ir al testimonio ${i + 1}`}
                />
              ))}
            </div>
          </div>

          {/* Navigation arrows */}
          <button
            type="button"
            onClick={goPrev}
            className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-2 md:-translate-x-6 p-3 rounded-full border border-[#1e1e2a] bg-[#0f0f17] text-white hover:border-[#00c8b4] hover:text-[#00c8b4] transition-colors"
            aria-label="Testimonio anterior"
          >
            <ChevronLeft size={18} />
          </button>
          <button
            type="button"
            onClick={goNext}
            className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-2 md:translate-x-6 p-3 rounded-full border border-[#1e1e2a] bg-[#0f0f17] text-white hover:border-[#00c8b4] hover:text-[#00c8b4] transition-colors"
            aria-label="Testimonio siguiente"
          >
            <ChevronRight size={18} />
          </button>
        </motion.div>
      </div>
    </section>
  );
}
