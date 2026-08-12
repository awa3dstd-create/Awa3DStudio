"use client";

import { motion } from "framer-motion";
import { MapPin } from "lucide-react";
import { ABOUT_STATS } from "./data";
import { fadeUp, slideInLeft, slideInRight, stagger, viewportOnce } from "./motion";

export function About() {
  return (
    <section id="conocenos" className="awa-section bg-[#0f0f17]/40">
      <div className="awa-container">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
          {/* LEFT — copy */}
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={viewportOnce}
            variants={stagger}
          >
            <motion.span variants={fadeUp} className="awa-label block mb-4">
              Conócenos · Sobre el estudio
            </motion.span>
            <motion.h2
              variants={fadeUp}
              className="awa-heading text-3xl sm:text-4xl md:text-5xl text-white mb-6"
            >
              Nueve años transformando
              <br />
              <span className="text-[#71717a]">planos en experiencias.</span>
            </motion.h2>

            <motion.p
              variants={fadeUp}
              className="text-[#a1a1aa] leading-relaxed mb-5"
            >
              AWA 3D Studio nace en La Habana con una premisa clara: la
              visualización arquitectónica debe emocionar antes que informar.
              Combinamos rigor técnico —modelado preciso, iluminación físicamente
              correcta, materiales PBR calibrados— con sensibilidad estética
              heredada de la tradición cubana y latinoamericana.
            </motion.p>

            <motion.p
              variants={fadeUp}
              className="text-[#a1a1aa] leading-relaxed mb-8"
            >
              Trabajamos con estudios de arquitectura, desarrolladores
              inmobiliarios y diseñadores de interiores en proyectos que van
              desde residencias unifamiliares hasta torres de uso mixto. Cada
              encargo se aborda como una colaboración, no como un servicio
              transaccional.
            </motion.p>

            <motion.div
              variants={fadeUp}
              className="flex items-center gap-2 text-sm text-[#a1a1aa] mb-10"
            >
              <MapPin size={16} className="text-[#00c8b4]" />
              <span>La Habana, Cuba · Trabajamos con clientes globales</span>
            </motion.div>

            <motion.dl
              variants={fadeUp}
              className="grid grid-cols-2 sm:grid-cols-4 gap-6"
            >
              {ABOUT_STATS.map((stat) => (
                <div key={stat.label}>
                  <dt className="text-2xl md:text-3xl font-heading font-bold text-white">
                    {stat.value}
                  </dt>
                  <dd className="text-[11px] text-[#71717a] uppercase tracking-wider mt-1">
                    {stat.label}
                  </dd>
                </div>
              ))}
            </motion.dl>
          </motion.div>

          {/* RIGHT — image collage */}
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={viewportOnce}
            variants={stagger}
            className="relative grid grid-cols-2 gap-4"
          >
            <motion.div
              variants={slideInLeft}
              className="space-y-4 pt-12"
            >
              <div className="aspect-[3/4] overflow-hidden rounded-sm border border-[#1e1e2a]">
                <img
                  src="/portfolio/salon-boiserie-3x.jpg"
                  alt="Detalle de salón con boiserie clásica"
                  loading="lazy"
                  className="w-full h-full object-cover"
                />
              </div>
            </motion.div>

            <motion.div
              variants={slideInRight}
              className="space-y-4"
            >
              <div className="aspect-square overflow-hidden rounded-sm border border-[#1e1e2a]">
                <img
                  src="/portfolio/dormitorio-natural-3x.jpg"
                  alt="Detalle de dormitorio natural"
                  loading="lazy"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="aspect-[3/4] overflow-hidden rounded-sm border border-[#1e1e2a]">
                <img
                  src="/portfolio/torre-curva-ocaso-3x.jpg"
                  alt="Detalle de torre curva al ocaso"
                  loading="lazy"
                  className="w-full h-full object-cover"
                />
              </div>
            </motion.div>

            {/* Decorative overlay */}
            <div
              aria-hidden
              className="absolute inset-0 pointer-events-none"
              style={{
                background:
                  "radial-gradient(circle at 50% 50%, transparent 0%, rgba(10,10,15,0.4) 100%)",
              }}
            />
          </motion.div>
        </div>
      </div>
    </section>
  );
}
