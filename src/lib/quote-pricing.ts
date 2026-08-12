/**
 * Pricing tiers for automated quote generation.
 *
 * Prices in USD. Lead's country triggers PPP (Purchasing Power Parity)
 * adjustment via applyPppDiscount() — LatAm gets 25% off, others pay full.
 *
 * Source: 02-AUTOMATION-PLAN.md → "Quote pricing tiers"
 */

export type ServiceKey =
  | "interior-render"
  | "exterior-render"
  | "animation"
  | "360-tour"
  | "modeling-3d"
  | "course";

export type Tier = "basic" | "standard" | "premium";

export interface TierPricing {
  label: string;
  price: number;
  description: string;
  deliverables: string[];
  deliveryDays: number;
}

export interface ServicePricing {
  key: ServiceKey;
  label: string;
  tiers: Record<Tier, TierPricing>;
}

export const PRICING: Record<ServiceKey, ServicePricing> = {
  "interior-render": {
    key: "interior-render",
    label: "Render Interior",
    tiers: {
      basic: {
        label: "Básico",
        price: 190,
        description: "1 vista fotorrealista de un espacio interior",
        deliverables: [
          "1 vista en resolución 4K",
          "2 rondas de revisión",
          "Entrega en formato JPG + PNG",
        ],
        deliveryDays: 5,
      },
      standard: {
        label: "Estándar",
        price: 290,
        description: "3 vistas fotorrealistas del mismo espacio",
        deliverables: [
          "3 vistas en resolución 4K",
          "3 rondas de revisión",
          "Entrega en JPG + PNG + PSD",
        ],
        deliveryDays: 7,
      },
      premium: {
        label: "Premium",
        price: 490,
        description: "6 vistas fotorrealistas + variantes de iluminación",
        deliverables: [
          "6 vistas en resolución 4K",
          "3 variantes de iluminación",
          "Rondas de revisión ilimitadas",
          "PSD editables incluidos",
        ],
        deliveryDays: 10,
      },
    },
  },
  "exterior-render": {
    key: "exterior-render",
    label: "Render Exterior",
    tiers: {
      basic: {
        label: "Básico",
        price: 290,
        description: "1 vista exterior fotorrealista",
        deliverables: [
          "1 vista en resolución 4K",
          "2 rondas de revisión",
          "Entrega en JPG + PNG",
        ],
        deliveryDays: 6,
      },
      standard: {
        label: "Estándar",
        price: 490,
        description: "3 vistas exteriores del mismo proyecto",
        deliverables: [
          "3 vistas en resolución 4K",
          "3 rondas de revisión",
          "Entrega en JPG + PNG + PSD",
        ],
        deliveryDays: 9,
      },
      premium: {
        label: "Premium",
        price: 790,
        description: "6 vistas exteriores + variantes de hora del día",
        deliverables: [
          "6 vistas en resolución 4K",
          "Variantes día / atardecer / noche",
          "Rondas de revisión ilimitadas",
          "PSD editables incluidos",
        ],
        deliveryDays: 12,
      },
    },
  },
  animation: {
    key: "animation",
    label: "Animación Arquitectónica",
    tiers: {
      basic: {
        label: "Básico",
        price: 1200,
        description: "Animación arquitectónica de 30 segundos",
        deliverables: [
          "Animación 30s en 1080p",
          "2 rondas de revisión",
          "Música de biblioteca incluida",
        ],
        deliveryDays: 14,
      },
      standard: {
        label: "Estándar",
        price: 1900,
        description: "Animación de 60 segundos con cámara cinematográfica",
        deliverables: [
          "Animación 60s en 1080p",
          "3 rondas de revisión",
          "Sound design + música sincronizada",
        ],
        deliveryDays: 18,
      },
      premium: {
        label: "Premium",
        price: 2900,
        description: "Animación 90s con sound design completo",
        deliverables: [
          "Animación 90s en 4K",
          "Rondas de revisión ilimitadas",
          "Sound design original + locución opcional",
          "Versiones verticales para redes sociales",
        ],
        deliveryDays: 21,
      },
    },
  },
  "360-tour": {
    key: "360-tour",
    label: "Recorrido 360°",
    tiers: {
      basic: {
        label: "Básico",
        price: 690,
        description: "Recorrido 360° con 5 nodos",
        deliverables: [
          "5 nodos 360°",
          "Navegación básica",
          "Hosting por 6 meses",
        ],
        deliveryDays: 8,
      },
      standard: {
        label: "Estándar",
        price: 990,
        description: "Recorrido 360° con hotspots interactivos",
        deliverables: [
          "8 nodos 360°",
          "Hotspots informativos",
          "Plano de ubicación interactivo",
          "Hosting por 12 meses",
        ],
        deliveryDays: 12,
      },
      premium: {
        label: "Premium",
        price: 1490,
        description: "Recorrido 360° + compatibilidad VR",
        deliverables: [
          "12 nodos 360°",
          "Hotspots multimedia (video, audio, texto)",
          "Compatibilidad VR (Meta Quest, etc.)",
          "Hosting por 24 meses",
        ],
        deliveryDays: 16,
      },
    },
  },
  "modeling-3d": {
    key: "modeling-3d",
    label: "Modelado 3D",
    tiers: {
      basic: {
        label: "Básico",
        price: 290,
        description: "Modelo 3D simple (1 objeto o mueble)",
        deliverables: [
          "Modelo 3D en formato .obj + .fbx",
          "Texturas básicas",
          "2 rondas de revisión",
        ],
        deliveryDays: 4,
      },
      standard: {
        label: "Estándar",
        price: 590,
        description: "Modelo 3D medio (habitación o espacio)",
        deliverables: [
          "Modelo 3D en .obj + .fbx + .blend",
          "Texturas PBR",
          "3 rondas de revisión",
        ],
        deliveryDays: 7,
      },
      premium: {
        label: "Premium",
        price: 990,
        description: "Modelo 3D complejo (edificio completo)",
        deliverables: [
          "Modelo 3D en múltiples formatos",
          "Texturas PBR + UV map personalizado",
          "Rondas de revisión ilimitadas",
          "Optimización para renderizado",
        ],
        deliveryDays: 12,
      },
    },
  },
  course: {
    key: "course",
    label: "Curso de Formación",
    tiers: {
      basic: {
        label: "Básico",
        price: 290,
        description: "Curso introductorio — 4 sesiones en vivo",
        deliverables: [
          "4 sesiones en vivo (90 min cada una)",
          "Material descargable",
          "Certificado de finalización",
        ],
        deliveryDays: 0,
      },
      standard: {
        label: "Estándar",
        price: 590,
        description: "Curso completo — 8 sesiones + mentorías",
        deliverables: [
          "8 sesiones en vivo",
          "2 mentorías 1-a-1",
          "Acceso a comunidad Discord",
          "Certificado + portfolio review",
        ],
        deliveryDays: 0,
      },
      premium: {
        label: "Premium",
        price: 990,
        description: "Curso intensivo + mentoría continuada",
        deliverables: [
          "12 sesiones en vivo",
          "6 mentorías 1-a-1",
          "Acceso a comunidad + grabaciones 1 año",
          "Certificado + recomendación LinkedIn",
        ],
        deliveryDays: 0,
      },
    },
  },
};

// Service classification helper — maps free-text service field to ServiceKey
export function classifyService(service?: string): ServiceKey {
  if (!service) return "interior-render";
  const s = service.toLowerCase();
  if (s.includes("inscripción") || s.includes("curso")) return "course";
  if (s.includes("360") || s.includes("recorrido")) return "360-tour";
  if (s.includes("animación") || s.includes("animacion") || s.includes("video"))
    return "animation";
  if (s.includes("exterior") || s.includes("fachada")) return "exterior-render";
  if (s.includes("modelad")) return "modeling-3d";
  return "interior-render";
}

// PPP discount: LatAm countries get 25% off
const PPP_COUNTRIES = new Set([
  "AR", "BO", "BR", "CL", "CO", "CR", "CU", "DO", "EC", "SV",
  "GT", "HN", "MX", "NI", "PA", "PY", "PE", "PR", "UY", "VE",
]);

export function applyPppDiscount(price: number, country?: string): {
  finalPrice: number;
  discountApplied: boolean;
  discountRate: number;
} {
  if (country && PPP_COUNTRIES.has(country.toUpperCase())) {
    return { finalPrice: Math.round(price * 0.75), discountApplied: true, discountRate: 25 };
  }
  return { finalPrice: price, discountApplied: false, discountRate: 0 };
}
