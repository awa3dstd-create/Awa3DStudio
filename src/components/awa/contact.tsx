"use client";

import { useState, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mail, Phone, MapPin, Send, ArrowUpRight, GraduationCap } from "lucide-react";
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

// ============================================================
// SERVICE DEFINITIONS
// ============================================================
// Each service has a list of "sub-option groups" that expand
// when the user picks that service. The selected options are
// appended to the message body sent to /api/contact so the
// studio receives a structured, more precise quote request.

const SERVICES_OPTIONS = [
  "Renders Fotorrealistas",
  "Recorridos 360°",
  "Animación Arquitectónica",
  "Modelado 3D",
  "Curso de formación",
  "Otro / No estoy seguro",
] as const;

type ServiceName = (typeof SERVICES_OPTIONS)[number];

interface SubOption {
  value: string;
  label: string;
}

interface SubOptionGroup {
  id: string;
  label: string;
  type: "radio" | "checkbox";
  options: SubOption[];
}

const SERVICE_SUBOPTIONS: Record<string, SubOptionGroup[]> = {
  "Renders Fotorrealistas": [
    {
      id: "tipo",
      label: "Tipo de render",
      type: "radio",
      options: [
        { value: "Interior", label: "Interior" },
        { value: "Exterior", label: "Exterior" },
        { value: "Interior + Exterior", label: "Ambos" },
      ],
    },
    {
      id: "vistas",
      label: "Cantidad de vistas",
      type: "radio",
      options: [
        { value: "1 vista", label: "1 vista" },
        { value: "3 vistas", label: "3 vistas" },
        { value: "6+ vistas", label: "6 o más" },
      ],
    },
    {
      id: "espacio",
      label: "Tipología del espacio",
      type: "checkbox",
      options: [
        { value: "Residencial", label: "Residencial" },
        { value: "Comercial", label: "Comercial" },
        { value: "Oficina", label: "Oficina" },
        { value: "Retail", label: "Retail" },
        { value: "Hotel/Restaurante", label: "Hotel/Restaurante" },
        { value: "Otro", label: "Otro" },
      ],
    },
    {
      id: "detalle",
      label: "Nivel de detalle",
      type: "radio",
      options: [
        { value: "Básico (mobiliario + decoración)", label: "Básico" },
        { value: "Estándar (iluminación realista)", label: "Estándar" },
        { value: "Premium (con post-producción)", label: "Premium" },
      ],
    },
    {
      id: "urgencia",
      label: "Urgencia",
      type: "radio",
      options: [
        { value: "Estándar (2-3 semanas)", label: "Estándar" },
        { value: "Express (7-10 días)", label: "Express" },
        { value: "Muy urgente (<7 días)", label: "Muy urgente" },
      ],
    },
  ],
  "Recorridos 360°": [
    {
      id: "nodos",
      label: "Cantidad de nodos 360°",
      type: "radio",
      options: [
        { value: "5 nodos", label: "5 nodos" },
        { value: "8 nodos", label: "8 nodos" },
        { value: "12+ nodos", label: "12 o más" },
      ],
    },
    {
      id: "hotspots",
      label: "Hotspots interactivos",
      type: "radio",
      options: [
        { value: "Sin hotspots", label: "Sin hotspots" },
        { value: "Hotspots básicos", label: "Básicos (texto/links)" },
        { value: "Hotspots multimedia", label: "Multimedia (video/audio)" },
      ],
    },
    {
      id: "vr",
      label: "Compatibilidad VR",
      type: "radio",
      options: [
        { value: "No requiere VR", label: "No" },
        { value: "Sí (Meta Quest, etc.)", label: "Sí" },
      ],
    },
    {
      id: "hosting",
      label: "Hosting del recorrido",
      type: "radio",
      options: [
        { value: "6 meses", label: "6 meses" },
        { value: "12 meses", label: "12 meses" },
        { value: "24 meses", label: "24 meses" },
      ],
    },
    {
      id: "tipologia",
      label: "Tipología",
      type: "checkbox",
      options: [
        { value: "Residencial", label: "Residencial" },
        { value: "Comercial", label: "Comercial" },
        { value: "Hotelero", label: "Hotelero" },
        { value: "Institucional", label: "Institucional" },
      ],
    },
  ],
  "Animación Arquitectónica": [
    {
      id: "duracion",
      label: "Duración",
      type: "radio",
      options: [
        { value: "30 segundos", label: "30 segundos" },
        { value: "60 segundos", label: "60 segundos" },
        { value: "90+ segundos", label: "90 o más" },
      ],
    },
    {
      id: "resolucion",
      label: "Resolución",
      type: "radio",
      options: [
        { value: "1080p", label: "1080p" },
        { value: "4K", label: "4K" },
      ],
    },
    {
      id: "audio",
      label: "Audio y sound design",
      type: "radio",
      options: [
        { value: "Sin audio", label: "Sin audio" },
        { value: "Música de biblioteca", label: "Música biblioteca" },
        { value: "Sound design original + locución", label: "Sound design + locución" },
      ],
    },
    {
      id: "versiones",
      label: "Versiones adicionales",
      type: "checkbox",
      options: [
        { value: "Vertical 9:16 (redes sociales)", label: "Vertical 9:16" },
        { value: "Cuadrado 1:1", label: "Cuadrado 1:1" },
        { value: "Trailer corto (15s)", label: "Trailer corto 15s" },
      ],
    },
    {
      id: "tipologia",
      label: "Tipología de proyecto",
      type: "checkbox",
      options: [
        { value: "Residencial", label: "Residencial" },
        { value: "Comercial", label: "Comercial" },
        { value: "Urbanismo", label: "Urbanismo" },
        { value: "Industrial", label: "Industrial" },
      ],
    },
  ],
  "Modelado 3D": [
    {
      id: "tipo",
      label: "Tipo de modelo",
      type: "radio",
      options: [
        { value: "Mobiliario/objeto único", label: "Mobiliario/objeto" },
        { value: "Habitación o espacio", label: "Habitación/espacio" },
        { value: "Edificio completo", label: "Edificio completo" },
      ],
    },
    {
      id: "formato",
      label: "Formatos requeridos",
      type: "checkbox",
      options: [
        { value: ".obj", label: ".obj" },
        { value: ".fbx", label: ".fbx" },
        { value: ".blend", label: ".blend" },
        { value: ".max", label: ".max" },
        { value: ".skp", label: ".skp" },
      ],
    },
    {
      id: "texturas",
      label: "Nivel de texturizado",
      type: "radio",
      options: [
        { value: "Básicas", label: "Básicas" },
        { value: "PBR", label: "PBR" },
        { value: "PBR + UV map personalizado", label: "PBR + UV custom" },
      ],
    },
    {
      id: "optimizacion",
      label: "Optimización para",
      type: "radio",
      options: [
        { value: "Renderizado", label: "Render" },
        { value: "Tiempo real (Unity/Unreal)", label: "Tiempo real" },
        { value: "Ambos", label: "Ambos" },
      ],
    },
  ],
  // "Curso de formación" → no sub-options, shows the graduation banner instead
  // "Otro / No estoy seguro" → no sub-options, message field is enough
};

// ============================================================
// CONTACT FORM COMPONENT
// ============================================================

export function Contact() {
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    service: "",
    message: "",
  });
  // Sub-options state: { [groupId]: string[] }
  const [subOptions, setSubOptions] = useState<Record<string, string[]>>({});

  const activeSubOptionGroups = useMemo<SubOptionGroup[]>(() => {
    if (!form.service) return [];
    return SERVICE_SUBOPTIONS[form.service] || [];
  }, [form.service]);

  const handleServiceChange = useCallback((v: string) => {
    setForm((prev) => ({ ...prev, service: v }));
    setSubOptions({}); // reset sub-options when service changes
  }, []);

  const toggleCheckbox = useCallback((groupId: string, value: string) => {
    setSubOptions((prev) => {
      const current = prev[groupId] || [];
      const next = current.includes(value)
        ? current.filter((v) => v !== value)
        : [...current, value];
      return { ...prev, [groupId]: next };
    });
  }, []);

  const setRadio = useCallback((groupId: string, value: string) => {
    setSubOptions((prev) => ({ ...prev, [groupId]: [value] }));
  }, []);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!form.name || !form.email || !form.message) {
        toast.error("Por favor completa nombre, email y mensaje.");
        return;
      }

      // Build the final message: user's free-text message + structured sub-options
      let finalMessage = form.message.trim();
      if (activeSubOptionGroups.length > 0) {
        const structuredLines = activeSubOptionGroups
          .map((group) => {
            const selected = subOptions[group.id] || [];
            if (selected.length === 0) return null;
            return `• ${group.label}: ${selected.join(", ")}`;
          })
          .filter((line): line is string => line !== null);

        if (structuredLines.length > 0) {
          finalMessage =
            finalMessage +
            "\n\n── DETALLES DE COTIZACIÓN ──\n" +
            structuredLines.join("\n");
        }
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
            const timeout = setTimeout(() => controller.abort(), 8000);
            const res = await fetch(url, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                ...form,
                message: finalMessage,
              }),
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
          setSubOptions({});
        } else if (!lastErr || (lastErr.message && !lastErr.message.startsWith("HTTP 4"))) {
          toast.error("No se pudo conectar. Revisa tu conexión e inténtalo de nuevo.");
        }
      } catch {
        toast.error("No se pudo conectar. Revisa tu conexión e inténtalo de nuevo.");
      } finally {
        setSubmitting(false);
      }
    },
    [form, subOptions, activeSubOptionGroups]
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
                  onValueChange={handleServiceChange}
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

            {/* ───── EXPANDING SUB-OPTIONS ───── */}
            <AnimatePresence mode="wait">
              {activeSubOptionGroups.length > 0 && (
                <motion.div
                  key={`subopts-${form.service}`}
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.3, ease: "easeInOut" }}
                  className="overflow-hidden"
                >
                  <div className="p-4 md:p-5 border border-[#1e1e2a] bg-[#0a0a0f] rounded-sm space-y-5">
                    <div className="flex items-center gap-2 pb-3 border-b border-[#1e1e2a]">
                      <span className="text-[10px] uppercase tracking-[0.18em] text-[#00c8b4] font-heading font-semibold">
                        Detalles para cotización
                      </span>
                      <span className="text-[10px] text-[#71717a]">
                        (ayúdanos a darte un precio más preciso)
                      </span>
                    </div>
                    {activeSubOptionGroups.map((group) => (
                      <SubOptionGroupRenderer
                        key={group.id}
                        group={group}
                        selectedValues={subOptions[group.id] || []}
                        onToggle={(val) =>
                          group.type === "checkbox"
                            ? toggleCheckbox(group.id, val)
                            : setRadio(group.id, val)
                        }
                      />
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* ───── CURSO DE FORMACIÓN BANNER ───── */}
            <AnimatePresence mode="wait">
              {form.service === "Curso de formación" && (
                <motion.div
                  key="course-banner"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.25 }}
                  className="flex items-start gap-3 p-4 border border-[#00c8b4]/30 bg-[#00c8b4]/5 rounded-sm"
                >
                  <GraduationCap size={18} className="text-[#00c8b4] flex-shrink-0 mt-0.5" />
                  <div className="text-xs leading-relaxed text-[#a1a1aa]">
                    <p className="text-white font-semibold mb-1">¿Quieres inscribirte ya?</p>
                    Puedes usar el formulario de inscripción directa en la sección{" "}
                    <a
                      href="#cursos"
                      className="text-[#00c8b4] underline underline-offset-2 hover:text-[#00e5d0]"
                    >
                      Cursos
                    </a>{" "}
                    (más arriba) — recibirás al instante el plan de estudio completo por correo.
                    También puedes dejar tu mensaje aquí y te orientaremos.
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

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

// ============================================================
// SUB-OPTION GROUP RENDERER
// ============================================================

function SubOptionGroupRenderer({
  group,
  selectedValues,
  onToggle,
}: {
  group: SubOptionGroup;
  selectedValues: string[];
  onToggle: (value: string) => void;
}) {
  return (
    <div>
      <p className="text-[11px] uppercase tracking-[0.15em] text-[#71717a] font-heading font-semibold mb-3">
        {group.label}
        {group.type === "checkbox" && (
          <span className="ml-2 normal-case tracking-normal text-[10px] text-[#52525b]">
            (puedes elegir varios)
          </span>
        )}
      </p>
      <div className="flex flex-wrap gap-2">
        {group.options.map((opt) => {
          const isSelected = selectedValues.includes(opt.value);
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => onToggle(opt.value)}
              className={
                "px-3 py-1.5 text-xs rounded-sm border transition-all " +
                (isSelected
                  ? "border-[#00c8b4] bg-[#00c8b4]/15 text-[#00c8b4] font-medium"
                  : "border-[#1e1e2a] bg-[#0f0f17] text-[#a1a1aa] hover:border-[#00c8b4]/40 hover:text-white")
              }
              aria-pressed={isSelected}
            >
              {opt.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ============================================================
// FORM FIELD + CONTACT ROW HELPERS
// ============================================================

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
