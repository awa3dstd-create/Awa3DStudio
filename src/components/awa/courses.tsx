"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { motion } from "framer-motion";
import { Check, Globe, MapPin } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  COURSE_TIERS,
  COUNTRY_LIST,
  COUNTRY_NAME_BY_CODE,
  getPricingForCountry,
  type CourseTier,
  CONTACT_INFO,
} from "./data";
import { fadeUp, stagger, viewportOnce } from "./motion";

function formatPrice(price: number) {
  // All prices are USD now — always show with $ prefix
  return `$${price.toLocaleString("en-US")}`;
}

export function Courses() {
  // Country code (ISO 3166-1 alpha-2). Empty string = not yet detected.
  const [countryCode, setCountryCode] = useState<string>("");
  // Human-readable country name (for display + enrollment form pre-fill)
  const [detectedCountryName, setDetectedCountryName] = useState<string>("");
  // Whether the current selection was auto-detected (vs. user manual override)
  const [autoDetected, setAutoDetected] = useState<boolean>(false);
  // "Detecting..." flag for the initial mount window
  const [detecting, setDetecting] = useState<boolean>(true);
  const [enrollCourse, setEnrollCourse] = useState<CourseTier | null>(null);

  // Pricing derived from selected country (memoized).
  const pricing = useMemo(() => getPricingForCountry(countryCode), [countryCode]);
  const countryName = useMemo(
    () =>
      countryCode
        ? COUNTRY_NAME_BY_CODE[countryCode] || "Internacional"
        : "Internacional",
    [countryCode]
  );

  // Detect visitor country on mount — three strategies in order:
  //   1) Cloudflare CF-IPCountry header (only on CF Pages deployment)
  //   2) ipapi.co JSON API (works everywhere, ~4s timeout)
  //   3) navigator.language fallback (best-effort)
  useEffect(() => {
    let cancelled = false;

    const detect = async () => {
      // 1) Cloudflare header
      try {
        const cfRes = await fetch("/", { method: "HEAD" });
        const cfCountry = cfRes.headers.get("CF-IPCountry");
        if (cfCountry && cfCountry !== "XX" && !cancelled) {
          setCountryCode(cfCountry);
          setDetectedCountryName(
            COUNTRY_NAME_BY_CODE[cfCountry] || cfCountry
          );
          setAutoDetected(true);
          setDetecting(false);
          return;
        }
      } catch {
        /* local dev */
      }

      // 2) ipapi.co
      try {
        const res = await fetch("https://ipapi.co/json/", {
          signal: AbortSignal.timeout(4000),
        });
        if (res.ok) {
          const data = await res.json();
          const iso = (data?.country_code as string | undefined)?.toUpperCase();
          const name = data?.country_name as string | undefined;
          if (iso && !cancelled) {
            setCountryCode(iso);
            setDetectedCountryName(name || COUNTRY_NAME_BY_CODE[iso] || iso);
            setAutoDetected(true);
            setDetecting(false);
            return;
          }
        }
      } catch {
        /* network blocked / timeout */
      }

      // 3) navigator.language
      try {
        const lang = navigator.language || "en-US";
        const iso = lang.split("-")[1]?.toUpperCase();
        if (iso && !cancelled) {
          setCountryCode(iso);
          setDetectedCountryName(COUNTRY_NAME_BY_CODE[iso] || iso);
          setAutoDetected(true);
          setDetecting(false);
          return;
        }
      } catch {
        /* ignore */
      }

      // 4) Give up — leave empty so user picks manually
      if (!cancelled) setDetecting(false);
    };

    detect();
    return () => {
      cancelled = true;
    };
  }, []);

  // Manual override via dropdown — clears autoDetected flag.
  const handleCountryChange = useCallback((code: string) => {
    setCountryCode(code);
    setDetectedCountryName(COUNTRY_NAME_BY_CODE[code] || code);
    setAutoDetected(false);
  }, []);

  return (
    <section id="cursos" className="awa-section bg-[#0f0f17]/40">
      <div className="awa-container">
        {/* Header */}
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={viewportOnce}
          variants={stagger}
          className="mb-12 md:mb-16"
        >
          <motion.span variants={fadeUp} className="awa-label block mb-4">
            Cursos · Aprende con AWA
          </motion.span>
          <motion.h2
            variants={fadeUp}
            className="awa-heading text-3xl sm:text-4xl md:text-5xl text-white max-w-3xl"
          >
            Formación profesional en
            <br />
            <span className="text-[#71717a]">visualización arquitectónica.</span>
          </motion.h2>
          <motion.p
            variants={fadeUp}
            className="text-[#a1a1aa] mt-6 max-w-xl"
          >
            Cuatro niveles, desde los fundamentos del modelado 3D hasta la
            animación cinematográfica. Precios en USD ajustados a tu país.
          </motion.p>

          {/* Country selector — auto-detected with manual override */}
          <motion.div
            variants={fadeUp}
            className="flex flex-wrap items-center gap-3 mt-8"
          >
            <div className="flex items-center gap-2 text-[#71717a] text-xs">
              <MapPin size={14} />
              <span className="uppercase tracking-[0.15em] font-heading font-semibold">
                Elige tu país:
              </span>
            </div>
            <Select
              value={countryCode || "OTHER"}
              onValueChange={handleCountryChange}
            >
              <SelectTrigger className="w-[260px] bg-[#0a0a0f] border-[#1e1e2a] text-white text-sm">
                <SelectValue placeholder="Selecciona tu país" />
              </SelectTrigger>
              <SelectContent className="bg-[#0f0f17] border-[#1e1e2a] max-h-[320px]">
                {COUNTRY_LIST.map((c) => (
                  <SelectItem
                    key={c.code}
                    value={c.code}
                    className="text-white focus:bg-[#00c8b4]/10 focus:text-[#00c8b4]"
                  >
                    {c.name}
                  </SelectItem>
                ))}
                <SelectItem
                  value="OTHER"
                  className="text-[#a1a1aa] italic focus:bg-[#00c8b4]/10"
                >
                  Internacional / Otro
                </SelectItem>
              </SelectContent>
            </Select>
            {/* Detection status badge */}
            {detecting ? (
              <span className="px-2.5 py-1 text-[10px] font-heading font-semibold uppercase tracking-[0.15em] rounded-full bg-[#1e1e2a] text-[#a1a1aa] border border-[#1e1e2a] flex items-center gap-1.5">
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#a1a1aa] animate-pulse" />
                Detectando…
              </span>
            ) : autoDetected && countryCode ? (
              <span className="px-2.5 py-1 text-[10px] font-heading font-semibold uppercase tracking-[0.15em] rounded-full bg-[#00c8b4]/10 text-[#00c8b4] border border-[#00c8b4]/30">
                Detectado automáticamente
              </span>
            ) : null}
            {/* Regional badge */}
            {pricing.regionalBadge && (
              <span className="px-2.5 py-1 text-[10px] font-heading font-semibold uppercase tracking-[0.15em] rounded-full bg-[#00c8b4]/10 text-[#00c8b4] border border-[#00c8b4]/30">
                {pricing.label}
              </span>
            )}
          </motion.div>

          {/* Detected country line (helps user understand what happened) */}
          {countryCode && (
            <motion.p
              variants={fadeUp}
              className="text-[11px] text-[#71717a] mt-3 flex items-center gap-1.5"
            >
              <Globe size={11} className="text-[#52525b]" />
              {autoDetected
                ? `Tu ubicación detectada: ${detectedCountryName}. Si no es correcto, elige tu país manualmente.`
                : `País seleccionado: ${countryName}.`}
            </motion.p>
          )}
        </motion.div>

        {/* Course grid */}
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={viewportOnce}
          variants={stagger}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6"
        >
          {COURSE_TIERS.map((tier) => (
            <CourseCard
              key={tier.id}
              tier={tier}
              prices={pricing.prices}
              onEnroll={() => setEnrollCourse(tier)}
            />
          ))}
        </motion.div>
      </div>

      {/* Enrollment modal */}
      <EnrollmentDialog
        course={enrollCourse}
        countryCode={countryCode}
        countryName={countryName}
        detectedCountryName={detectedCountryName}
        prices={pricing.prices}
        pricingLabel={pricing.label}
        onClose={() => setEnrollCourse(null)}
      />
    </section>
  );
}

function CourseCard({
  tier,
  prices,
  onEnroll,
}: {
  tier: CourseTier;
  prices: Record<"basic" | "intermediate" | "advanced" | "master", number>;
  onEnroll: () => void;
}) {
  const price = prices[tier.id as keyof typeof prices];

  return (
    <motion.article
      variants={fadeUp}
      className={`relative p-6 md:p-7 rounded-sm border bg-[#0a0a0f] awa-card-hover flex flex-col ${
        tier.highlighted
          ? "border-[#00c8b4]/40"
          : "border-[#1e1e2a]"
      }`}
    >
      {tier.badge && (
        <span className="absolute -top-3 left-6 px-3 py-1 text-[10px] font-heading font-semibold uppercase tracking-[0.15em] rounded-full bg-[#00c8b4] text-[#0a0a0f]">
          {tier.badge}
        </span>
      )}

      <h3 className="font-heading font-bold text-lg text-white mb-1">
        {tier.name}
      </h3>
      <p className="text-xs text-[#71717a] mb-5 min-h-[2.5rem]">
        {tier.tagline}
      </p>

      <div className="mb-5">
        <div className="flex items-baseline gap-1.5">
          <span className="text-3xl md:text-4xl font-heading font-bold text-white">
            {formatPrice(price)}
          </span>
          <span className="text-xs text-[#71717a]">USD</span>
        </div>
      </div>

      <p className="text-xs text-[#a1a1aa] leading-relaxed mb-5 min-h-[4.5rem]">
        {tier.description}
      </p>

      <ul className="space-y-2.5 mb-7 flex-1">
        {tier.includes.map((inc) => (
          <li
            key={inc}
            className="flex items-start gap-2 text-xs text-[#a1a1aa]"
          >
            <Check
              size={14}
              className="text-[#00c8b4] flex-shrink-0 mt-0.5"
              strokeWidth={2.5}
            />
            <span>{inc}</span>
          </li>
        ))}
      </ul>

      <Button
        type="button"
        onClick={onEnroll}
        className="w-full bg-[#00c8b4] text-[#0a0a0f] hover:bg-[#00e5d0] font-semibold h-11"
      >
        Inscribirme
      </Button>
    </motion.article>
  );
}

function EnrollmentDialog({
  course,
  countryCode,
  countryName,
  detectedCountryName,
  prices,
  pricingLabel,
  onClose,
}: {
  course: CourseTier | null;
  countryCode: string;
  countryName: string;
  detectedCountryName: string;
  prices: Record<"basic" | "intermediate" | "advanced" | "master", number>;
  pricingLabel: string;
  onClose: () => void;
}) {
  const [submitting, setSubmitting] = useState(false);
  // Pre-fill the country field with the IP-detected country name.
  // `key` on the form forces re-mount when `course` changes so the field
  // re-syncs with the latest detectedCountryName value each time the dialog opens.
  const [form, setForm] = useState({
    name: "",
    email: "",
    country: detectedCountryName || countryName,
  });

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!course) return;
      if (!form.name || !form.email) {
        toast.error("Por favor completa nombre y email.");
        return;
      }
      setSubmitting(true);
      try {
        // Failover automático: mismo dominio → mirrors
        const endpoints = [
          CONTACT_INFO.enrollApi,
          ...CONTACT_INFO.mirrors.map((m) => `${m}${CONTACT_INFO.enrollApi}`),
        ];
        const payload = {
          name: form.name,
          email: form.email,
          service: `Inscripción curso: ${course.name}`,
          message: `Inscripción al ${course.name} (${course.tagline}). País: ${form.country}. Tarifa aplicada: ${pricingLabel}. Precio mostrado: ${formatPrice(
            prices[course.id as keyof typeof prices]
          )} USD.`,
        };
        let success = false;
        let lastErr: any = null;
        let validationError: string | null = null;
        for (const url of endpoints) {
          try {
            const controller = new AbortController();
            const timeout = setTimeout(() => controller.abort(), 5000);
            const res = await fetch(url, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(payload),
              signal: controller.signal,
            });
            clearTimeout(timeout);
            if (res.ok) {
              success = true;
              break;
            } else if (res.status >= 400 && res.status < 500) {
              const data = await res.json().catch(() => ({}));
              validationError = data?.error || "Error al enviar. Inténtalo nuevamente.";
              lastErr = new Error(`HTTP ${res.status}`);
              break;
            }
            lastErr = new Error(`HTTP ${res.status}`);
          } catch (err) {
            lastErr = err;
            continue;
          }
        }
        if (success) {
          toast.success("¡Solicitud de inscripción enviada! Te contactaremos en 24h.");
          setForm({ name: "", email: "", country: detectedCountryName || countryName });
          onClose();
        } else if (validationError) {
          toast.error(validationError);
        } else if (!lastErr || (lastErr.message && !lastErr.message.startsWith("HTTP 4"))) {
          toast.error("No se pudo conectar. Revisa tu conexión e inténtalo de nuevo.");
        }
      } catch {
        toast.error("No se pudo conectar. Revisa tu conexión e inténtalo de nuevo.");
      } finally {
        setSubmitting(false);
      }
    },
    [course, form, onClose, prices, pricingLabel, detectedCountryName, countryName]
  );

  return (
    <Dialog open={!!course} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="bg-[#0f0f17] border-[#1e1e2a] text-white max-w-md p-8">
        <DialogHeader>
          <DialogTitle className="font-heading font-bold text-2xl text-white">
            Inscripción · {course?.name}
          </DialogTitle>
          <DialogDescription className="text-[#a1a1aa] text-sm mt-2">
            Completa el formulario y te enviaremos los pasos de pago y acceso
            al curso. Precio aplicado:{" "}
            <span className="text-[#00c8b4] font-semibold">
              {course &&
                formatPrice(prices[course.id as keyof typeof prices])}{" "}
              USD
            </span>
            <span className="text-[#71717a]"> · {pricingLabel}</span>
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div>
            <Label htmlFor="enroll-name" className="text-xs uppercase tracking-wider text-[#a1a1aa]">
              Nombre completo
            </Label>
            <Input
              id="enroll-name"
              type="text"
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="bg-[#0a0a0f] border-[#1e1e2a] text-white mt-2 focus:border-[#00c8b4]"
              placeholder="Tu nombre"
            />
          </div>
          <div>
            <Label htmlFor="enroll-email" className="text-xs uppercase tracking-wider text-[#a1a1aa]">
              Email
            </Label>
            <Input
              id="enroll-email"
              type="email"
              required
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="bg-[#0a0a0f] border-[#1e1e2a] text-white mt-2 focus:border-[#00c8b4]"
              placeholder="tucorreo@ejemplo.com"
            />
          </div>
          <div>
            <Label htmlFor="enroll-country" className="text-xs uppercase tracking-wider text-[#a1a1aa]">
              País {detectedCountryName && <span className="text-[#00c8b4] normal-case tracking-normal font-normal ml-1">(detectado automáticamente)</span>}
            </Label>
            <Input
              id="enroll-country"
              type="text"
              value={form.country}
              onChange={(e) => setForm({ ...form, country: e.target.value })}
              className="bg-[#0a0a0f] border-[#1e1e2a] text-white mt-2 focus:border-[#00c8b4]"
              placeholder="Tu país"
            />
          </div>

          <Button
            type="submit"
            disabled={submitting}
            className="w-full bg-[#00c8b4] text-[#0a0a0f] hover:bg-[#00e5d0] font-semibold h-12 mt-2"
          >
            {submitting ? "Enviando..." : "Confirmar inscripción"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
