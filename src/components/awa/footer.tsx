"use client";

import { motion } from "framer-motion";
import { ArrowUp, Instagram, Linkedin } from "lucide-react";
import { Logo } from "./logo";
import { NAV_LINKS, SOCIAL_LINKS, CONTACT_INFO } from "./data";
import { fadeUp, stagger, viewportOnce } from "./motion";

export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="relative bg-[#06060a] border-t-2 border-[#1e1e2a]">
      {/* Subtle top fade so the footer reads as a clear end-of-page */}
      <div
        aria-hidden
        className="absolute -top-px left-0 right-0 h-24 pointer-events-none"
        style={{
          background:
            "linear-gradient(180deg, rgba(0,0,0,0) 0%, rgba(6,6,10,0.9) 100%)",
        }}
      />

      <div className="awa-container relative">
        <div className="pt-32 md:pt-40 pb-12 md:pb-16">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={viewportOnce}
          variants={stagger}
          className="grid gap-12 md:gap-16 md:grid-cols-12"
        >
          {/* Brand */}
          <motion.div
            variants={fadeUp}
            className="md:col-span-5"
          >
            {/* CRITICAL: footer logo is ALWAYS white, never teal */}
            <Logo
              color="white"
              iconClassName="h-8 md:h-9 w-auto"
              textClassName="text-lg text-white"
            />
            <p className="text-sm text-[#71717a] leading-relaxed mt-5 max-w-sm">
              Estudio de visualización arquitectónica de alta gama. Renders
              fotorrealistas, recorridos 360°, animación y modelado 3D que
              transforman proyectos en experiencias visuales impactantes.
            </p>

            <div className="flex items-center gap-3 mt-6">
              {SOCIAL_LINKS.map((social) => (
                <a
                  key={social.label}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={social.label}
                  className="w-10 h-10 rounded-sm border border-[#1e1e2a] bg-[#0f0f17] flex items-center justify-center text-[#71717a] hover:text-white hover:border-[#00c8b4]/50 transition-all duration-300"
                >
                  <SocialIcon name={social.icon} />
                </a>
              ))}
            </div>
          </motion.div>

          {/* Navigation */}
          <motion.div variants={fadeUp} className="md:col-span-3">
            <p className="awa-label mb-5">Navegación</p>
            <ul className="space-y-3">
              {NAV_LINKS.map((link) => (
                <li key={link.href}>
                  <a
                    href={link.href}
                    className="text-sm text-[#a1a1aa] hover:text-[#00c8b4] transition-colors duration-300"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </motion.div>

          {/* Contact */}
          <motion.div variants={fadeUp} className="md:col-span-4">
            <p className="awa-label mb-5">Contacto</p>
            <ul className="space-y-3 text-sm">
              <li>
                <a
                  href={`mailto:${CONTACT_INFO.email}`}
                  className="text-[#a1a1aa] hover:text-[#00c8b4] transition-colors duration-300"
                >
                  {CONTACT_INFO.email}
                </a>
              </li>
              <li>
                <a
                  href={`tel:${CONTACT_INFO.phone.replace(/\s/g, "")}`}
                  className="text-[#a1a1aa] hover:text-[#00c8b4] transition-colors duration-300"
                >
                  {CONTACT_INFO.phone}
                </a>
              </li>
              <li className="text-[#a1a1aa]">{CONTACT_INFO.location}</li>
            </ul>

            <a
              href="#contacto"
              className="inline-flex items-center gap-2 mt-6 px-5 py-2.5 rounded-sm border border-[#00c8b4]/40 text-[#00c8b4] text-xs font-heading font-semibold uppercase tracking-[0.15em] hover:bg-[#00c8b4]/10 transition-colors"
            >
              Iniciar proyecto
            </a>
          </motion.div>
        </motion.div>

        {/* Bottom bar */}
        <motion.div
          variants={fadeUp}
          initial="hidden"
          whileInView="visible"
          viewport={viewportOnce}
          className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-20 pt-8 border-t border-[#2a2a3a]"
        >
          <p className="text-sm text-[#c4c4c8] text-center sm:text-left font-medium">
            &copy; {year} AWA 3D STUDIO. Todos los derechos reservados.
          </p>
          <button
            type="button"
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            className="group inline-flex items-center gap-2 text-sm text-[#a1a1aa] hover:text-white transition-colors"
            aria-label="Volver arriba"
          >
            Volver arriba
            <span className="w-8 h-8 rounded-full border border-[#1e1e2a] flex items-center justify-center group-hover:border-[#00c8b4]/50 group-hover:text-[#00c8b4] transition-colors">
              <ArrowUp size={14} />
            </span>
          </button>
        </motion.div>
        </div>
      </div>
    </footer>
  );
}

function SocialIcon({ name }: { name: string }) {
  if (name === "instagram") return <Instagram size={18} />;
  if (name === "linkedin") return <Linkedin size={18} />;
  if (name === "behance") {
    return (
      <svg
        viewBox="0 0 24 24"
        width="18"
        height="18"
        fill="currentColor"
        aria-hidden
      >
        <path d="M22 7h-7V5h7v2zm1.726 10c-.442 1.297-2.029 3-5.101 3-3.074 0-5.564-1.729-5.564-5.675 0-3.91 2.325-5.92 5.466-5.92 3.082 0 4.964 1.782 5.375 4.426.078.506.109 1.188.095 2.14H15.97c.13 3.211 3.483 3.312 4.588 2.029h3.168zm-7.686-5h4.965c-.105-1.547-1.136-2.219-2.477-2.219-1.466 0-2.277.768-2.488 2.219zm-9.574 6.988H0V5.021h6.953c5.476.081 5.58 5.444 2.72 6.906 3.461 1.26 3.577 8.061-3.207 8.061zM3 11h3.584c2.508 0 2.906-3-.312-3H3v3zm3.391 3H3v3.016h3.341c3.055 0 2.868-3.016.05-3.016z" />
      </svg>
    );
  }
  return null;
}
