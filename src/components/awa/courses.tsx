"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { Check, Globe } from "lucide-react";
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
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  COURSE_TIERS,
  PRICING_BY_REGION,
  COUNTRY_TO_REGION,
  type RegionPricing,
  type CourseTier,
  CONTACT_INFO,
} from "./data";
import { fadeUp, stagger, viewportOnce } from "./motion";

function formatPrice(price: number, symbol: string) {
  // Format with thousands separator; symbol prepended (EUR/USD/GBP) or appended (¥/₩)
  const formatted = price.toLocaleString("en-US");
  const suffixCurrencies = ["¥", "₩", "﷼", "د.إ"];
  const isSuffix = suffixCurrencies.includes(symbol);
  return isSuffix ? `${formatted}${symbol}` : `${symbol}${formatted}`;
}

/**
 * Best-effort ISO 3166-1 alpha-2 → country name mapping.
 * Covers all countries referenced in COUNTRY_TO_REGION (data.ts) plus a few
 * extras so the enrollment form is pre-filled correctly when ipapi.co returns
 * only a country code (e.g. Cloudflare CF-IPCountry header path).
 */
const ISO_TO_COUNTRY_NAME: Record<string, string> = {
  US: "Estados Unidos",
  CA: "Canadá",
  MX: "México",
  GT: "Guatemala",
  BZ: "Belice",
  SV: "El Salvador",
  HN: "Honduras",
  NI: "Nicaragua",
  CR: "Costa Rica",
  PA: "Panamá",
  CU: "Cuba",
  DO: "República Dominicana",
  PR: "Puerto Rico",
  CO: "Colombia",
  VE: "Venezuela",
  EC: "Ecuador",
  PE: "Perú",
  BO: "Bolivia",
  CL: "Chile",
  AR: "Argentina",
  UY: "Uruguay",
  PY: "Paraguay",
  BR: "Brasil",
  ES: "España",
  PT: "Portugal",
  AD: "Andorra",
  GQ: "Guinea Ecuatorial",
  GB: "Reino Unido",
  IE: "Irlanda",
  DE: "Alemania",
  FR: "Francia",
  IT: "Italia",
  NL: "Países Bajos",
  BE: "Bélgica",
  LU: "Luxemburgo",
  CH: "Suiza",
  AT: "Austria",
  SE: "Suecia",
  NO: "Noruega",
  DK: "Dinamarca",
  FI: "Finlandia",
  IS: "Islandia",
  JP: "Japón",
  KR: "Corea del Sur",
  CN: "China",
  TW: "Taiwán",
  HK: "Hong Kong",
  SG: "Singapur",
  MY: "Malasia",
  TH: "Tailandia",
  VN: "Vietnam",
  ID: "Indonesia",
  PH: "Filipinas",
  IN: "India",
  PK: "Pakistán",
  BD: "Bangladés",
  AU: "Australia",
  NZ: "Nueva Zelanda",
  FJ: "Fiyi",
  PG: "Papúa Nueva Guinea",
  SA: "Arabia Saudita",
  AE: "Emiratos Árabes Unidos",
  QA: "Catar",
  KW: "Kuwait",
  BH: "Baréin",
  OM: "Omán",
  IR: "Irán",
  IQ: "Irak",
  IL: "Israel",
  JO: "Jordania",
  LB: "Líbano",
  SY: "Siria",
  YE: "Yemen",
  PS: "Palestina",
  TR: "Turquía",
  EG: "Egipto",
  LY: "Libia",
  TN: "Túnez",
  DZ: "Argelia",
  MA: "Marruecos",
  SD: "Sudán",
  SS: "Sudán del Sur",
  ET: "Etiopía",
  ER: "Eritrea",
  DJ: "Yibuti",
  SO: "Somalia",
  KE: "Kenia",
  UG: "Uganda",
  TZ: "Tanzania",
  RW: "Ruanda",
  BI: "Burundi",
  MZ: "Mozambique",
  ZW: "Zimbabue",
  ZA: "Sudáfrica",
  NA: "Namibia",
  BW: "Botsuana",
  AO: "Angola",
  ZM: "Zambia",
  MW: "Malaui",
  MG: "Madagascar",
  CM: "Camerún",
  NG: "Nigeria",
  GH: "Ghana",
  CI: "Costa de Marfil",
  SN: "Senegal",
  ML: "Mali",
  BF: "Burkina Faso",
  NE: "Níger",
  TD: "Chad",
  CF: "República Centroafricana",
  CG: "Congo",
  CD: "República Democrática del Congo",
  GA: "Gabón",
  GQ: "Guinea Ecuatorial",
  RU: "Rusia",
  UA: "Ucrania",
  BY: "Bielorrusia",
  PL: "Polonia",
  CZ: "Chequia",
  SK: "Eslovaquia",
  HU: "Hungría",
  RO: "Rumania",
  BG: "Bulgaria",
  RS: "Serbia",
  HR: "Croacia",
  SI: "Eslovenia",
  BA: "Bosnia y Herzegovina",
  MK: "Macedonia del Norte",
  ME: "Montenegro",
  AL: "Albania",
  GR: "Grecia",
  EE: "Estonia",
  LV: "Letonia",
  LT: "Lituania",
  MD: "Moldavia",
};

function isoToCountryName(iso: string): string | undefined {
  return ISO_TO_COUNTRY_NAME[iso.toUpperCase()];
}

export function Courses() {
  const [region, setRegion] = useState<RegionPricing>(PRICING_BY_REGION[0]);
  const [detectedCountry, setDetectedCountry] = useState<string>("");
  const [enrollCourse, setEnrollCourse] = useState<CourseTier | null>(null);

  // Detect visitor region AND country name on mount
  useEffect(() => {
    let cancelled = false;

    const detect = async () => {
      // 1) Try Cloudflare header (only available when deployed behind CF)
      try {
        const cfRes = await fetch("/", { method: "HEAD" });
        const cfCountry = cfRes.headers.get("CF-IPCountry");
        if (cfCountry && cfCountry !== "XX") {
          const regionCode = COUNTRY_TO_REGION[cfCountry] ?? "OTHER";
          const r = PRICING_BY_REGION.find((p) => p.code === regionCode);
          if (r && !cancelled) setRegion(r);
          // Map ISO code to country name (best-effort)
          const countryName = isoToCountryName(cfCountry);
          if (countryName && !cancelled) setDetectedCountry(countryName);
          return;
        }
      } catch {
        /* ignore — local dev */
      }

      // 2) Try ipapi.co — returns both country_code AND country_name
      try {
        const res = await fetch("https://ipapi.co/json/", {
          signal: AbortSignal.timeout(4000),
        });
        if (res.ok) {
          const data = await res.json();
          const countryCode = data?.country_code as string | undefined;
          const countryName = data?.country_name as string | undefined;
          if (countryCode) {
            const regionCode = COUNTRY_TO_REGION[countryCode] ?? "OTHER";
            const r = PRICING_BY_REGION.find((p) => p.code === regionCode);
            if (r && !cancelled) setRegion(r);
          }
          if (countryName && !cancelled) setDetectedCountry(countryName);
          return;
        }
      } catch {
        /* ignore */
      }

      // 3) Fallback: navigator.language
      try {
        const lang = navigator.language || "en-US";
        const country = lang.split("-")[1]?.toUpperCase();
        if (country) {
          const regionCode = COUNTRY_TO_REGION[country] ?? "OTHER";
          const r = PRICING_BY_REGION.find((p) => p.code === regionCode);
          if (r && !cancelled) setRegion(r);
          const countryName = isoToCountryName(country);
          if (countryName && !cancelled) setDetectedCountry(countryName);
        }
      } catch {
        /* ignore */
      }
    };

    detect();
    return () => {
      cancelled = true;
    };
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
            animación cinematográfica. Precios ajustados a tu región.
          </motion.p>

          {/* Region selector */}
          <motion.div
            variants={fadeUp}
            className="flex flex-wrap items-center gap-3 mt-8"
          >
            <div className="flex items-center gap-2 text-[#71717a] text-xs">
              <Globe size={14} />
              <span className="uppercase tracking-[0.15em] font-heading font-semibold">
                Región:
              </span>
            </div>
            <Select
              value={region.code}
              onValueChange={(code) => {
                const r = PRICING_BY_REGION.find((p) => p.code === code);
                if (r) setRegion(r);
              }}
            >
              <SelectTrigger className="w-[260px] bg-[#0a0a0f] border-[#1e1e2a] text-white text-sm">
                <SelectValue placeholder="Selecciona tu región" />
              </SelectTrigger>
              <SelectContent className="bg-[#0f0f17] border-[#1e1e2a] max-h-[300px]">
                {PRICING_BY_REGION.map((r) => (
                  <SelectItem
                    key={r.code}
                    value={r.code}
                    className="text-white focus:bg-[#00c8b4]/10 focus:text-[#00c8b4]"
                  >
                    {r.label} · {r.currency}
                    {r.regionalBadge ? " · Precio regional" : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {region.regionalBadge && (
              <span className="px-2.5 py-1 text-[10px] font-heading font-semibold uppercase tracking-[0.15em] rounded-full bg-[#00c8b4]/10 text-[#00c8b4] border border-[#00c8b4]/30">
                Precio regional aplicado
              </span>
            )}
          </motion.div>
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
              region={region}
              onEnroll={() => setEnrollCourse(tier)}
            />
          ))}
        </motion.div>
      </div>

      {/* Enrollment modal */}
      <EnrollmentDialog
        course={enrollCourse}
        region={region}
        detectedCountry={detectedCountry}
        onClose={() => setEnrollCourse(null)}
      />
    </section>
  );
}

function CourseCard({
  tier,
  region,
  onEnroll,
}: {
  tier: CourseTier;
  region: RegionPricing;
  onEnroll: () => void;
}) {
  const price = region.prices[tier.id as keyof typeof region.prices];

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
            {formatPrice(price, region.symbol)}
          </span>
          <span className="text-xs text-[#71717a]">{region.currency}</span>
        </div>
        {region.regionalBadge && (
          <p className="text-[10px] text-[#00c8b4] mt-1 uppercase tracking-[0.15em] font-heading font-semibold">
            Precio regional
          </p>
        )}
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
  region,
  detectedCountry,
  onClose,
}: {
  course: CourseTier | null;
  region: RegionPricing;
  detectedCountry: string;
  onClose: () => void;
}) {
  const [submitting, setSubmitting] = useState(false);
  // Plan HTML recibido del backend tras la inscripción exitosa.
  // Se muestra en un diálogo aparte como fallback cuando el email no llega
  // (Gmail filtra onboarding@resend.dev en modo trial).
  const [planHtml, setPlanHtml] = useState<string | null>(null);
  const [planSubject, setPlanSubject] = useState<string>("");
  // Pre-fill the country field with the IP-detected country name.
  // useEffect sincroniza el formulario cada vez que `detectedCountry` se actualiza
  // (la detección de IP es async y puede llegar después de montado el componente)
  // o cuando se abre el modal con un nuevo `course`.
  const [form, setForm] = useState({
    name: "",
    email: "",
    country: detectedCountry || region.label,
  });
  // Trackea si el usuario editó manualmente el campo país para no sobreescribirlo
  const [countryTouched, setCountryTouched] = useState(false);

  useEffect(() => {
    // Solo auto-actualizar si el usuario no ha editado el campo manualmente
    if (!countryTouched && (detectedCountry || region.label)) {
      setForm((f) => ({
        ...f,
        country: detectedCountry || region.label,
      }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [detectedCountry, region.label, course?.id]);

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
          message: `Inscripción al ${course.name} (${course.tagline}). País: ${form.country}. Precio mostrado: ${formatPrice(
            region.prices[course.id as keyof typeof region.prices],
            region.symbol
          )} ${region.currency}.`,
          // Metadatos extra para que el backend sepa qué plan enviar
          courseId: course.id,
          courseName: course.name,
          courseTagline: course.tagline,
          coursePrice: region.prices[course.id as keyof typeof region.prices],
          courseCurrency: region.currency,
          courseRegion: region.label,
        };
        let success = false;
        let lastErr: any = null;
        let validationError: string | null = null;
        let planData: {
          planHtml?: string;
          planSubject?: string;
          trialMode?: boolean;
          directDelivery?: boolean;
        } = {};
        for (const url of endpoints) {
          try {
            const controller = new AbortController();
            const timeout = setTimeout(() => controller.abort(), 8000);
            const res = await fetch(url, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(payload),
              signal: controller.signal,
            });
            clearTimeout(timeout);
            if (res.ok) {
              success = true;
              // Captura el HTML del plan si el backend lo devuelve
              try {
                const data = await res.json();
                if (data && typeof data.planHtml === "string") {
                  planData = {
                    planHtml: data.planHtml,
                    planSubject: data.planSubject,
                    trialMode: data.trialMode,
                    directDelivery: data.directDelivery,
                  };
                }
              } catch {
                /* JSON parse falla → no hay plan para mostrar */
              }
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
          // Toast según si el email llegó directo al cliente o no
          if (planData.directDelivery) {
            // Email enviado directamente al cliente (vía Brevo o Resend producción)
            toast.success(
              "¡Inscripción enviada! Te enviamos el plan del curso por email. También lo mostramos a continuación."
            );
          } else {
            // Modo trial: el email va al inbox del estudio para reenvío manual.
            // Mostrar el plan aquí mismo como fallback.
            toast.success(
              "¡Inscripción recibida! Te mostramos el plan de mentoría a continuación."
            );
          }
          // Guardar el plan para mostrarlo en el diálogo de resultado
          if (planData.planHtml) {
            setPlanHtml(planData.planHtml);
            setPlanSubject(planData.planSubject || "Plan de mentoría");
          } else {
            // No hay plan HTML → cerrar el diálogo de inscripción
            setForm({ name: "", email: "", country: detectedCountry || region.label });
            setCountryTouched(false);
            onClose();
          }
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
    [course, form, onClose, region, detectedCountry]
  );

  return (
    <Dialog open={!!course} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="bg-[#0f0f17] border-[#1e1e2a] text-white max-w-md p-8">
        <DialogHeader>
          <DialogTitle className="font-heading font-bold text-2xl text-white">
            Inscripción · {course?.name}
          </DialogTitle>
          <DialogDescription className="text-[#a1a1aa] text-sm mt-2">
            Completa el formulario y te enviaremos por email el plan de mentoría
            detallado del curso. Precio aplicado:{" "}
            <span className="text-[#00c8b4] font-semibold">
              {course &&
                formatPrice(
                  region.prices[course.id as keyof typeof region.prices],
                  region.symbol
                )}{" "}
              {region.currency}
            </span>
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
              País {detectedCountry && <span className="text-[#00c8b4] normal-case tracking-normal font-normal ml-1">(detectado: {detectedCountry})</span>}
            </Label>
            <Input
              id="enroll-country"
              type="text"
              value={form.country}
              onChange={(e) => {
                setForm({ ...form, country: e.target.value });
                setCountryTouched(true);
              }}
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

      {/* Diálogo con el plan de mentoría tras inscripción exitosa.
          Se muestra como fallback cuando el email no llega (modo trial de
          Resend: Gmail filtra onboarding@resend.dev). */}
      <PlanDisplayDialog
        html={planHtml}
        subject={planSubject}
        courseName={course?.name}
        onClose={() => {
          setPlanHtml(null);
          setPlanSubject("");
          setForm({ name: "", email: "", country: detectedCountry || region.label });
          setCountryTouched(false);
          onClose();
        }}
      />
    </Dialog>
  );
}

/**
 * Diálogo scrollable que renderiza el HTML del plan de mentoría recibido del
 * backend. Se usa `dangerouslySetInnerHTML` porque el HTML ya fue generado
 * por el backend con plantillas controladas (sin input del usuario crudo).
 */
function PlanDisplayDialog({
  html,
  subject,
  courseName,
  onClose,
}: {
  html: string | null;
  subject: string;
  courseName?: string;
  onClose: () => void;
}) {
  return (
    <Dialog open={!!html} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="bg-[#0f0f17] border-[#1e1e2a] text-white max-w-3xl max-h-[90vh] overflow-y-auto p-8">
        <DialogHeader>
          <DialogTitle className="font-heading font-bold text-2xl text-white">
            {subject || `Plan de mentoría${courseName ? ` — ${courseName}` : ""}`}
          </DialogTitle>
          <DialogDescription className="text-[#a1a1aa] text-sm mt-2">
            También te enviamos este plan por email. Si no lo recibes en los próximos
            minutos, revisa tu carpeta de spam o promociones.
          </DialogDescription>
        </DialogHeader>
        <div
          className="mt-4 prose prose-invert max-w-none"
          dangerouslySetInnerHTML={{ __html: html || "" }}
        />
        <div className="mt-6 flex justify-end gap-3">
          <Button
            type="button"
            onClick={onClose}
            className="bg-[#00c8b4] text-[#0a0a0f] hover:bg-[#00e5d0] font-semibold"
          >
            Cerrar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
