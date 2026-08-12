"use client";

import { motion } from "framer-motion";
import * as Icons from "lucide-react";
import { PROCESS_STEPS, type ProcessStep } from "./data";
import { fadeUp, stagger, viewportOnce, EASE } from "./motion";

export function Process() {
  return (
    <section id="proceso" className="awa-section">
      <div className="awa-container">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={viewportOnce}
          variants={stagger}
          className="mb-12 md:mb-16"
        >
          <motion.span variants={fadeUp} className="awa-label block mb-4">
            Proceso · Cómo trabajamos
          </motion.span>
          <motion.h2
            variants={fadeUp}
            className="awa-heading text-3xl sm:text-4xl md:text-5xl text-white max-w-3xl"
          >
            Cuatro pasos. Cero
            <br />
            <span className="text-[#71717a]">incertidumbre.</span>
          </motion.h2>
        </motion.div>

        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={viewportOnce}
          variants={stagger}
          className="relative grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-4"
        >
          {PROCESS_STEPS.map((step, i) => (
            <ProcessCard
              key={step.number}
              step={step}
              isLast={i === PROCESS_STEPS.length - 1}
            />
          ))}
        </motion.div>
      </div>
    </section>
  );
}

function ProcessCard({
  step,
  isLast,
}: {
  step: ProcessStep;
  isLast: boolean;
}) {
  const Icon = (Icons as unknown as Record<string, Icons.LucideIcon>)[step.icon] ?? Icons.Box;

  return (
    <motion.article variants={fadeUp} className="relative">
      {/* Connector (desktop only) */}
      {!isLast && (
        <div
          aria-hidden
          className="hidden lg:block absolute top-12 left-[calc(50%+48px)] right-[-50%] h-px"
          style={{
            background:
              "linear-gradient(90deg, rgba(0,200,180,0.4) 0%, rgba(30,30,42,0.6) 100%)",
          }}
        />
      )}

      <div className="relative">
        {/* Number + connector line — line aligns with the BASELINE of the number.
          `items-end` puts both elements at the bottom; the line then sits at
          the bottom edge of the number's box. Adding ~6px bottom padding on
          the line shifts it up slightly so it visually aligns with the
          typographic baseline (just above the descender line) rather than
          the very bottom of the text box. */}
        <div className="flex items-end gap-3 mb-6">
          <span className="font-heading font-bold text-5xl md:text-6xl text-transparent bg-clip-text bg-gradient-to-b from-[#00c8b4] to-[#00c8b4]/20 leading-none">
            {step.number}
          </span>
          <div className="flex-1 h-px bg-[#1e1e2a] mb-[6px]" />
        </div>

        {/* Icon */}
        <motion.div
          whileHover={{ scale: 1.05 }}
          transition={{ duration: 0.4, ease: EASE }}
          className="w-12 h-12 rounded-sm border border-[#1e1e2a] bg-[#0f0f17] flex items-center justify-center mb-5"
        >
          <Icon size={20} strokeWidth={1.5} className="text-[#00c8b4]" />
        </motion.div>

        <h3 className="font-heading font-bold text-lg text-white mb-3">
          {step.title}
        </h3>
        <p className="text-sm text-[#a1a1aa] leading-relaxed">
          {step.description}
        </p>
      </div>
    </motion.article>
  );
}
