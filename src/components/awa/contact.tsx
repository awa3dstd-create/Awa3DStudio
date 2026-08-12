"use client";

import { useState, useCallback } from "react";
import { motion } from "framer-motion";
import { Mail, Phone, MapPin, Send, ArrowUpRight } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { CONTACT_INFO } from "./data";
import { fadeUp, stagger, viewportOnce } from "./motion";

const SERVICES_OPTIONS = [
  "Renders Fotorrealistas",
  "Recorridos 360°",
  "Animación Arquitectónica",
  "Modelado 3D",
  "Curso de formación",
  "Otro / No estoy seguro",
];

export function Contact() {
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    service: "",
    message: "",
  });

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!form.name || !form.email || !form.message) {
        toast.error("Por favor completa nombre, email y mensaje.");
        return;
      }
      setSubmitting(true);
      try {
        // Failover automático: prueba mismo dominio, luego mirrors en orden
        const endpoints = [
          CONTACT_INFO.contactApi, // 1. mismo dominio (Pages o GitHub Pages con SW)
          ...CONTACT_INFO.mirrors.map((m) => `${m}${CONTACT_INFO.contactApi}`), // 2. mirrors absolutos
        ];
        let success = false;
        let lastErr: any = null;
        for (const url of endpoints) {
          try {
            const controller = new AbortController();
            const timeout = setTimeout(() => controller.abort(), 5000);
            const res = await fetch(url, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(form),
              signal: controller.signal,
            });
            clearTimeout(timeout);
            if (res.ok) {
              success = true;
              break;
            } else if (res.status >= 400 && res.status < 500) {
              // 4xx = error real del servidor (validación, etc.) — no reintentar
              const data = await res.json().catch(() => ({}));
              toast.error(data?.error || "Error al enviar. Inténtalo nuevamente.");
              lastErr = new Error(`HTTP ${res.status}`);
              break;
            }
            // 5xx = servidor caído, probar siguiente
            lastErr = new Error(`HTTP ${res.status}`);
          } catch (err) {
            lastErr = err;
            // network error / timeout → probar siguiente
            continue;
          }
        }
        if (success) {
          toast.success("¡Mensaje enviado! Nos pondremos en contacto pronto.");
          setForm({ name: "", email: "", phone: "", service: "", message: "" });
        } else if (!lastErr || (lastErr.message && !lastErr.message.startsWith("HTTP 4"))) {
          toast.error("No se pudo conectar. Revisa tu conexión e inténtalo de nuevo.");
        }
      } catch {
        toast.error("No se pudo conectar. Revisa tu conexión e inténtalo de nuevo.");
      } finally {
        setSubmitting(false);
      }
    },
    [form]
  );

  return (
    <section id="contacto" className="awa-section">
      <div className="awa-container">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-20">
          {/* LEFT — info */}
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={viewportOnce}
            variants={stagger}
          >
            <motion.span variants={fadeUp} className="awa-label block mb-4">
              Contacto · Hablemos
            </motion.span>
            <motion.h2
              variants={fadeUp}
              className="awa-heading text-3xl sm:text-4xl md:text-5xl text-white mb-6"
            >
              Cuéntanos tu
              <br />
              <span className="text-[#71717a]">próximo proyecto.</span>
            </motion.h2>
            <motion.p
              variants={fadeUp}
              className="text-[#a1a1aa] leading-relaxed mb-10 max-w-md"
            >
              Respondemos en menos de 24 horas. Cuéntanos qué necesitas —
              incluso si solo tienes una idea inicial, podemos asesorarte sobre
              el formato de visualización más adecuado.
            </motion.p>

            <motion.div
              variants={fadeUp}
              className="space-y-1"
            >
              <ContactRow
                icon={<Mail size={18} />}
                label="Email"
                value={CONTACT_INFO.email}
                href={`mailto:${CONTACT_INFO.email}`}
              />
              <ContactRow
                icon={<Phone size={18} />}
                label="Teléfono"
                value={CONTACT_INFO.phone}
                href={`tel:${CONTACT_INFO.phone.replace(/\s/g, "")}`}
              />
              <ContactRow
                icon={<MapPin size={18} />}
                label="Ubicación"
                value={CONTACT_INFO.location}
              />
            </motion.div>

            {/* Decorative map / coordinates */}
            <motion.div
              variants={fadeUp}
              className="mt-10 p-5 border border-[#1e1e2a] bg-[#0f0f17] rounded-sm"
            >
              <p className="text-[10px] uppercase tracking-[0.18em] text-[#71717a] mb-2">
                Coordenadas
              </p>
              <p className="font-mono text-sm text-white">
                23.1136° N · 82.3666° W
              </p>
              <p className="text-xs text-[#71717a] mt-1">
                La Habana — Cuba Standard Time (UTC-5)
              </p>
            </motion.div>
          </motion.div>

          {/* RIGHT — form */}
          <motion.form
            initial="hidden"
            whileInView="visible"
            viewport={viewportOnce}
            variants={stagger}
            onSubmit={handleSubmit}
            className="space-y-5 p-6 md:p-8 border border-[#1e1e2a] bg-[#0f0f17] rounded-sm"
          >
            <motion.div variants={fadeUp} className="grid sm:grid-cols-2 gap-4">
              <Field label="Nombre" htmlFor="name">
                <Input
                  id="name"
                  type="text"
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="bg-[#0a0a0f] border-[#1e1e2a] text-white focus:border-[#00c8b4]"
                  placeholder="Tu nombre"
                />
              </Field>
              <Field label="Email" htmlFor="email">
                <Input
                  id="email"
                  type="email"
                  required
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="bg-[#0a0a0f] border-[#1e1e2a] text-white focus:border-[#00c8b4]"
                  placeholder="tucorreo@ejemplo.com"
                />
              </Field>
            </motion.div>

            <motion.div variants={fadeUp} className="grid sm:grid-cols-2 gap-4">
              <Field label="Teléfono (opcional)" htmlFor="phone">
                <Input
                  id="phone"
                  type="tel"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  className="bg-[#0a0a0f] border-[#1e1e2a] text-white focus:border-[#00c8b4]"
                  placeholder="+53 5 123 4567"
                />
              </Field>
              <Field label="Servicio" htmlFor="service">
                <Select
                  value={form.service}
                  onValueChange={(v) => setForm({ ...form, service: v })}
                >
                  <SelectTrigger
                    id="service"
                    className="bg-[#0a0a0f] border-[#1e1e2a] text-white focus:border-[#00c8b4]"
                  >
                    <SelectValue placeholder="Selecciona un servicio" />
                  </SelectTrigger>
                  <SelectContent className="bg-[#0f0f17] border-[#1e1e2a]">
                    {SERVICES_OPTIONS.map((s) => (
                      <SelectItem
                        key={s}
                        value={s}
                        className="text-white focus:bg-[#00c8b4]/10 focus:text-[#00c8b4]"
                      >
                        {s}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
            </motion.div>

            <motion.div variants={fadeUp}>
              <Field label="Mensaje" htmlFor="message">
                <Textarea
                  id="message"
                  required
                  value={form.message}
                  onChange={(e) => setForm({ ...form, message: e.target.value })}
                  rows={6}
                  className="bg-[#0a0a0f] border-[#1e1e2a] text-white focus:border-[#00c8b4] resize-none"
                  placeholder="Cuéntanos sobre tu proyecto: tipología, plazos, formato deseado, referencias..."
                />
              </Field>
            </motion.div>

            <motion.div variants={fadeUp}>
              <Button
                type="submit"
                disabled={submitting}
                className="w-full sm:w-auto bg-[#00c8b4] text-[#0a0a0f] hover:bg-[#00e5d0] font-semibold h-12 px-8 group"
              >
                {submitting ? "Enviando..." : "Enviar mensaje"}
                {!submitting && (
                  <Send
                    size={16}
                    className="transition-transform group-hover:translate-x-1"
                  />
                )}
              </Button>
            </motion.div>

            <motion.p
              variants={fadeUp}
              className="text-[11px] text-[#71717a] leading-relaxed"
            >
              Al enviar aceptas ser contactado por AWA 3D Studio en relación a
              tu consulta. No compartimos tus datos con terceros.
            </motion.p>
          </motion.form>
        </div>
      </div>
    </section>
  );
}

function Field({
  label,
  htmlFor,
  children,
}: {
  label: string;
  htmlFor: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <Label
        htmlFor={htmlFor}
        className="text-[11px] uppercase tracking-[0.15em] text-[#71717a] font-heading font-semibold mb-2 block"
      >
        {label}
      </Label>
      {children}
    </div>
  );
}

function ContactRow({
  icon,
  label,
  value,
  href,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  href?: string;
}) {
  const Wrapper = href ? "a" : "div";
  return (
    <Wrapper
      {...(href ? { href } : {})}
      className="group flex items-center gap-4 py-4 border-b border-[#1e1e2a] last:border-0 transition-colors"
    >
      <div className="w-10 h-10 rounded-sm border border-[#1e1e2a] bg-[#0f0f17] flex items-center justify-center text-[#00c8b4] flex-shrink-0 group-hover:border-[#00c8b4]/40 transition-colors">
        {icon}
      </div>
      <div className="flex-1">
        <p className="text-[10px] uppercase tracking-[0.18em] text-[#71717a] font-heading font-semibold">
          {label}
        </p>
        <p className="text-white text-sm mt-0.5">{value}</p>
      </div>
      {href && (
        <ArrowUpRight
          size={16}
          className="text-[#71717a] group-hover:text-[#00c8b4] transition-colors"
        />
      )}
    </Wrapper>
  );
}
