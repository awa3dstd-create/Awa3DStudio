"use client";

import { motion } from "framer-motion";
import * as Icons from "lucide-react";
import { SERVICES, type Service } from "./data";
import { fadeUp, stagger, viewportOnce } from "./motion";

export function Services() {
  return (
    <section id="servicios" className="awa-section bg-[#0f0f17]/40">
      <div className="awa-container">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={viewportOnce}
          variants={stagger}
          className="mb-12 md:mb-16"
        >
          <motion.span variants={fadeUp} className="awa-label block mb-4">
            Servicios · Lo que hacemos
          </motion.span>
          <motion.h2
            variants={fadeUp}
            className="awa-heading text-3xl sm:text-4xl md:text-5xl text-white max-w-3xl"
          >
            Cuatro disciplinas, una sola
            <br />
            <span className="text-[#71717a]">obsesión por el detalle.</span>
          </motion.h2>
        </motion.div>

        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={viewportOnce}
          variants={stagger}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6"
        >
          {SERVICES.map((service) => (
            <ServiceCard key={service.id} service={service} />
          ))}
        </motion.div>
      </div>
    </section>
  );
}

function ServiceCard({ service }: { service: Service }) {
  const Icon = (Icons as unknown as Record<string, Icons.LucideIcon>)[service.icon] ?? Icons.Box;

  return (
    <motion.article
      variants={fadeUp}
      className="group relative p-6 md:p-8 rounded-sm border border-[#1e1e2a] bg-[#0a0a0f] awa-card-hover overflow-hidden"
    >
      {/* Top glow line */}
      <div
        aria-hidden
        className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#00c8b4]/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700"
      />

      <div className="w-12 h-12 rounded-sm border border-[#1e1e2a] bg-[#0f0f17] flex items-center justify-center mb-6 group-hover:border-[#00c8b4]/50 transition-colors duration-500">
        <Icon
          size={22}
          strokeWidth={1.5}
          className="text-[#00c8b4]"
        />
      </div>

      <h3 className="font-heading font-bold text-lg text-white mb-3">
        {service.title}
      </h3>

      <p className="text-sm text-[#a1a1aa] leading-relaxed mb-5">
        {service.description}
      </p>

      <ul className="space-y-2">
        {service.features.map((feat) => (
          <li
            key={feat}
            className="flex items-center gap-2 text-xs text-[#71717a]"
          >
            <span className="w-1 h-1 rounded-full bg-[#00c8b4]" />
            {feat}
          </li>
        ))}
      </ul>
    </motion.article>
  );
}
