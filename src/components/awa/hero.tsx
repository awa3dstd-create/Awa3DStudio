"use client";

import { motion } from "framer-motion";
import { ArrowRight, ArrowDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { HERO_STATS } from "./data";
import { fadeUp, stagger, viewportOnce, EASE } from "./motion";

export function Hero() {
  return (
    <section
      id="top"
      className="relative pt-32 md:pt-40 pb-16 md:pb-24 overflow-hidden"
    >
      {/* Background gradient — subtle teal to transparent */}
      <div
        aria-hidden
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 80% 60% at 70% 0%, rgba(0,200,180,0.08) 0%, transparent 60%)",
        }}
      />
      {/* Hairline grid pattern */}
      <div
        aria-hidden
        className="absolute inset-0 pointer-events-none opacity-[0.04]"
        style={{
          backgroundImage:
            "linear-gradient(to right, #fff 1px, transparent 1px), linear-gradient(to bottom, #fff 1px, transparent 1px)",
          backgroundSize: "80px 80px",
        }}
      />

      <div className="awa-container relative">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* LEFT — copy */}
          <motion.div
            initial="hidden"
            animate="visible"
            variants={stagger}
          >
            <motion.div
              variants={fadeUp}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-[#1e1e2a] bg-[#0f0f17] mb-6"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-[#00c8b4] animate-pulse" />
              <span className="text-[10px] font-heading font-semibold uppercase tracking-[0.18em] text-[#a1a1aa]">
                Estudio · La Habana, Cuba
              </span>
            </motion.div>

            <motion.h1
              variants={fadeUp}
              className="awa-heading text-4xl sm:text-5xl lg:text-6xl xl:text-7xl text-white mb-6"
            >
              Visualización
              <br />
              Arquitectónica de
              <br />
              <span className="text-[#00c8b4]">Alta Gama</span>
            </motion.h1>

            <motion.p
              variants={fadeUp}
              className="text-base md:text-lg text-[#a1a1aa] max-w-xl mb-8 leading-relaxed"
            >
              Renders fotorrealistas, recorridos 360°, animación arquitectónica
              y modelado 3D que transforman sus proyectos en experiencias
              visuales impactantes.
            </motion.p>

            <motion.div
              variants={fadeUp}
              className="flex flex-col sm:flex-row gap-4 mb-12"
            >
              <Button
                asChild
                size="lg"
                className="bg-[#00c8b4] text-[#0a0a0f] hover:bg-[#00e5d0] font-semibold h-12 px-8 text-base group"
              >
                <a href="#portfolio">
                  Ver Portfolio
                  <ArrowRight
                    size={18}
                    className="transition-transform group-hover:translate-x-1"
                  />
                </a>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="border-[#1e1e2a] text-white hover:border-[#00c8b4] hover:text-[#00c8b4] bg-transparent h-12 px-8 text-base"
              >
                <a href="#contacto">Cotizar Proyecto</a>
              </Button>
            </motion.div>

            {/* Stats */}
            <motion.dl
              variants={fadeUp}
              className="grid grid-cols-3 gap-4 sm:gap-8 max-w-md"
            >
              {HERO_STATS.map((stat) => (
                <div key={stat.label} className="border-l border-[#1e1e2a] pl-4">
                  <dt className="text-2xl sm:text-3xl font-heading font-bold text-white">
                    {stat.value}
                  </dt>
                  <dd className="text-[11px] sm:text-xs text-[#71717a] uppercase tracking-wider mt-1">
                    {stat.label}
                  </dd>
                </div>
              ))}
            </motion.dl>
          </motion.div>

          {/* RIGHT — hero image */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1.2, ease: EASE, delay: 0.3 }}
            className="relative"
          >
            <div className="relative aspect-[4/5] sm:aspect-[5/6] lg:aspect-[4/5] overflow-hidden rounded-sm border border-[#1e1e2a]">
              <img
                src="/portfolio/interior-dining-organic.jpg"
                alt="Render fotorrealista de comedor orgánico con mesa ovalada de madera y lámparas escultóricas escalonadas"
                loading="eager"
                className="w-full h-full object-cover"
              />
              {/* Vignette + bottom gradient — softens image edges so the
                  border doesn't read as a hard cut against the dark bg */}
              <div
                aria-hidden
                className="absolute inset-0 pointer-events-none"
                style={{
                  background:
                    "radial-gradient(ellipse 95% 85% at 50% 45%, transparent 45%, rgba(6,6,10,0.75) 100%), linear-gradient(180deg, rgba(6,6,10,0.3) 0%, transparent 25%, transparent 55%, rgba(6,6,10,0.8) 100%)",
                }}
              />
              {/* Floating tag */}
              <div className="absolute bottom-6 left-6 right-6 flex items-center justify-between">
                <div>
                  <p className="text-[10px] uppercase tracking-[0.18em] text-[#a1a1aa] mb-1">
                    Featured · Interior
                  </p>
                  <p className="text-lg font-heading font-semibold text-white">
                    Comedor Orgánico
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] uppercase tracking-[0.18em] text-[#71717a]">
                    8K · 2024
                  </p>
                </div>
              </div>
            </div>

            {/* Floating decorative ring */}
            <motion.div
              aria-hidden
              animate={{ rotate: 360 }}
              transition={{
                duration: 60,
                repeat: Infinity,
                ease: "linear",
              }}
              className="absolute -top-6 -right-6 w-24 h-24 border border-[#00c8b4]/30 rounded-full pointer-events-none"
            />
          </motion.div>
        </div>

        {/* Scroll cue */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2, duration: 0.8 }}
          className="hidden md:flex flex-col items-center gap-2 mt-16 text-[#71717a]"
        >
          <span className="text-[10px] uppercase tracking-[0.2em]">Scroll</span>
          <ArrowDown size={14} className="animate-bounce" />
        </motion.div>
      </div>
    </section>
  );
}
