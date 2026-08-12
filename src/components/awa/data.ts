/**
 * AWA 3D STUDIO — Static data
 * All content (portfolio, services, courses, pricing, testimonials) lives here.
 */

// ============================================================
// PORTFOLIO
// ============================================================
export type PortfolioCategory = "Interior" | "Exterior";

export interface PortfolioProject {
  id: string;
  title: string;
  category: PortfolioCategory;
  year: string;
  image: string;
  /**
   * Imágenes adicionales del mismo proyecto (galería).
   * Si se especifica, la tarjeta y el lightbox muestran controles
   * para navegar entre `image` y todas las de `gallery`.
   */
  gallery?: string[];
  description: string;
}

export const PORTFOLIO_PROJECTS: PortfolioProject[] = [
  {
    id: "vestibulo-otono",
    title: "Vestíbulo Otoño",
    category: "Interior",
    year: "2024",
    image: "/portfolio/pasillo-salon-otono.jpg",
    description:
      "Vestíbulo de acceso con paleta cálida otoñal. Iluminación cenital suave que enfatiza las texturas de madera nogal y paneles de rattan trenzado.",
  },
  {
    id: "residencia-invernadero",
    title: "Residencia Invernadero",
    category: "Interior",
    year: "2024",
    image: "/portfolio/salon-luminoso.jpg",
    description:
      "Living luminoso orientado al sur. Doble altura, ventanales de piso a techo y vegetación interior que difumina el límite entre dentro y fuera.",
  },
  {
    id: "salon-chimenea-negro",
    title: "Salón Chimenea Negra",
    category: "Interior",
    year: "2024",
    image: "/portfolio/salon-chimenea-negro.jpg",
    gallery: ["/portfolio/salon-chimenea-negro-2.jpg"],
    description:
      "Salón íntimo con chimenea revestida en mármol negro marquina. Contraste dramático entre la calidez del fuego y la severidad del negro.",
  },
];

// ============================================================
// SERVICES
// ============================================================
export interface Service {
  id: string;
  icon: string;
  title: string;
  description: string;
  features: string[];
}

export const SERVICES: Service[] = [
  {
    id: "renders",
    icon: "Camera",
    title: "Renders Fotorrealistas",
    description:
      "Imágenes de alta calidad que capturan cada detalle material, cada sombra y cada reflejo con precisión cinematográfica.",
    features: ["8K resolution", "Materiales PBR", "Iluminación HDRI", "Post-producción"],
  },
  {
    id: "recorridos-360",
    icon: "Compass",
    title: "Recorridos 360°",
    description:
      "Experiencias inmersivas que permiten explorar los espacios desde cualquier ángulo, como si el cliente estuviera caminando dentro del proyecto.",
    features: ["WebGL interactive", "VR compatible", "Hotspots informativos", "Hosting incluido"],
  },
  {
    id: "animacion",
    icon: "Clapperboard",
    title: "Animación Arquitectónica",
    description:
      "Videos cinematográficos que dan vida a los proyectos con cámara, iluminación dinámica y storytelling visual de alto impacto.",
    features: ["4K cinematic", "Cámara cinematic", "Sound design", "Color grading"],
  },
  {
    id: "modelado-3d",
    icon: "Boxes",
    title: "Modelado 3D",
    description:
      "Modelos tridimensionales precisos y detallados listos para fabricación, renderizado o impresión 3D. Geometría limpia y optimizada.",
    features: ["High-poly & low-poly", "UV mapping", "Rigging opcional", "Formatos .obj .fbx .blend"],
  },
];

// ============================================================
// PROCESS
// ============================================================
export interface ProcessStep {
  number: string;
  title: string;
  description: string;
  icon: string;
}

export const PROCESS_STEPS: ProcessStep[] = [
  {
    number: "01",
    title: "Consulta",
    description:
      "Entendemos su visión, requisitos técnicos y referencias estéticas. Definimos alcances, plazos y formato de entrega.",
    icon: "MessagesSquare",
  },
  {
    number: "02",
    title: "Modelado",
    description:
      "Creamos el modelo 3D detallado a partir de planos, bocetos o referencias. Validamos geometría con usted antes de avanzar.",
    icon: "Box",
  },
  {
    number: "03",
    title: "Renderizado",
    description:
      "Aplicamos materiales PBR, iluminación HDRI, vegetación y atrezzo. Iteramos hasta alcanzar el fotorrealismo buscado.",
    icon: "Sparkles",
  },
  {
    number: "04",
    title: "Entrega",
    description:
      "Recibe los archivos finales en máxima calidad, junto con versiones para web, print y redes. Acompañamiento post-entrega.",
    icon: "PackageCheck",
  },
];

// ============================================================
// TESTIMONIALS
// ============================================================
export interface Testimonial {
  quote: string;
  name: string;
  role: string;
  rating: number;
}

export const TESTIMONIALS: Testimonial[] = [
  {
    quote:
      "El nivel de detalle de los renders superó nuestras expectativas. Lograron capturar exactamente la atmósfera que queríamos para el proyecto. Comunicación impecable durante todo el proceso.",
    name: "Arq. María Fernández",
    role: "Estudio MF Arquitectura · Madrid",
    rating: 5,
  },
  {
    quote:
      "Trabajamos con AWA 3D Studio en una torre residencial de 40 plantas. El recorrido 360° nos ayudó a cerrar preventas antes de iniciar la obra. Profesionales de primer nivel.",
    name: "Carlos Mendoza",
    role: "Director · Mendoza Developments",
    rating: 5,
  },
  {
    quote:
      "La animación arquitectónica fue clave para nuestra presentación ante el ayuntamiento. La calidad cinematográfica convenció al comité en la primera reunión.",
    name: "Arq. João Pereira",
    role: "Pereira & Asociados · Lisboa",
    rating: 5,
  },
  {
    quote:
      "Encargamos el modelado 3D de una pieza industrial compleja. La geometría llegó perfecta para fabricación. Volveremos a trabajar con ellos sin dudas.",
    name: "Ing. Luisa Navarro",
    role: "CTO · Navarro Industrial",
    rating: 5,
  },
  {
    quote:
      "AWA entiende el lenguaje de la arquitectura. No es solo un servicio de renders, es un socio de diseño. Sus aportes mejoraron el proyecto original.",
    name: "Arq. Roberto Silva",
    role: "Silva Studio · Ciudad de México",
    rating: 5,
  },
];

// ============================================================
// COURSES — Pricing by region
// ============================================================
export interface CourseTier {
  id: string;
  name: string;
  tagline: string;
  description: string;
  includes: string[];
  highlighted?: boolean;
  badge?: string;
}

export const COURSE_TIERS: CourseTier[] = [
  {
    id: "basic",
    name: "Curso Básico",
    tagline: "Introducción al modelado 3D arquitectónico",
    description:
      "Fundamentos de modelado 3D aplicado a arquitectura: interfaces, navegación en el espacio 3D, modelado de espacios simples, exportación.",
    includes: [
      "12 horas de video",
      "Proyecto guiado: espacio residencial",
      "Acceso a comunidad Discord",
      "Certificado de finalización",
      "Soporte por email (48h)",
    ],
  },
  {
    id: "intermediate",
    name: "Curso Intermedio",
    tagline: "Rendering fotorrealista y materiales avanzados",
    description:
      "Materiales PBR, iluminación HDRI, cámaras virtuales y post-producción. Lleva tus renders al siguiente nivel con workflows profesionales.",
    includes: [
      "20 horas de video",
      "Proyecto guiado: interior fotorrealista",
      "Librería de 50 materiales PBR",
      "5 HDRI exclusivos",
      "Soporte prioritario (24h)",
    ],
    highlighted: true,
    badge: "Más popular",
  },
  {
    id: "advanced",
    name: "Curso Avanzado",
    tagline: "Animación arquitectónica y recorridos 360°",
    description:
      "Cinematografía 3D, animación de cámara, recorridos 360° interactivos y sound design. Producción de piezas audiovisuales de alto impacto.",
    includes: [
      "28 horas de video",
      "Proyecto guiado: animación cinematográfica",
      "Templates de animación",
      "Sound design kit",
      "Mentoría 1:1 (2 sesiones)",
    ],
  },
  {
    id: "master",
    name: "Curso Master",
    tagline: "Pack completo: modelado + rendering + animación",
    description:
      "El programa definitivo. Combina los tres niveles anteriores más contenido exclusivo de branding de estudio arquitectónico y captación de clientes.",
    includes: [
      "60+ horas de video",
      "4 proyectos guiados completos",
      "Librería completa: 200+ materiales, 20 HDRI",
      "Plantillas de propuesta comercial",
      "Mentoría 1:1 (6 sesiones)",
      "Acceso de por vida",
    ],
  },
];

export interface RegionPricing {
  code: string;
  label: string;
  currency: string;
  symbol: string;
  prices: Record<"basic" | "intermediate" | "advanced" | "master", number>;
  regionalBadge?: boolean;
}

/**
 * Pricing calibrated to PPP (Purchasing Power Parity) of each region.
 * Base reference: international tier ≈ USD 149 / 299 / 499 / 899.
 */
export const PRICING_BY_REGION: RegionPricing[] = [
  {
    code: "US",
    label: "Estados Unidos",
    currency: "USD",
    symbol: "$",
    prices: { basic: 149, intermediate: 299, advanced: 499, master: 899 },
  },
  {
    code: "CA",
    label: "Canadá",
    currency: "CAD",
    symbol: "C$",
    prices: { basic: 199, intermediate: 399, advanced: 669, master: 1199 },
  },
  {
    code: "EU",
    label: "Europa (Eurozona)",
    currency: "EUR",
    symbol: "€",
    prices: { basic: 139, intermediate: 279, advanced: 469, master: 849 },
  },
  {
    code: "UK",
    label: "Reino Unido",
    currency: "GBP",
    symbol: "£",
    prices: { basic: 119, intermediate: 239, advanced: 399, master: 729 },
  },
  {
    code: "LATAM",
    label: "América Latina",
    currency: "USD",
    symbol: "$",
    prices: { basic: 49, intermediate: 99, advanced: 169, master: 299 },
    regionalBadge: true,
  },
  {
    code: "CU",
    label: "Cuba",
    currency: "USD",
    symbol: "$",
    prices: { basic: 25, intermediate: 49, advanced: 89, master: 159 },
    regionalBadge: true,
  },
  {
    code: "MX",
    label: "México",
    currency: "MXN",
    symbol: "$",
    prices: { basic: 899, intermediate: 1799, advanced: 2999, master: 5499 },
    regionalBadge: true,
  },
  {
    code: "BR",
    label: "Brasil",
    currency: "BRL",
    symbol: "R$",
    prices: { basic: 249, intermediate: 499, advanced: 849, master: 1549 },
    regionalBadge: true,
  },
  {
    code: "AR",
    label: "Argentina",
    currency: "ARS",
    symbol: "$",
    prices: { basic: 14999, intermediate: 29999, advanced: 49999, master: 89999 },
    regionalBadge: true,
  },
  {
    code: "JP",
    label: "Japón",
    currency: "JPY",
    symbol: "¥",
    prices: { basic: 19900, intermediate: 39900, advanced: 66900, master: 119900 },
  },
  {
    code: "CN",
    label: "China",
    currency: "CNY",
    symbol: "¥",
    prices: { basic: 699, intermediate: 1399, advanced: 2399, master: 4299 },
  },
  {
    code: "IN",
    label: "India",
    currency: "INR",
    symbol: "₹",
    prices: { basic: 4999, intermediate: 9999, advanced: 16999, master: 29999 },
    regionalBadge: true,
  },
  {
    code: "KR",
    label: "Corea del Sur",
    currency: "KRW",
    symbol: "₩",
    prices: { basic: 149000, intermediate: 299000, advanced: 499000, master: 899000 },
  },
  {
    code: "AU",
    label: "Australia",
    currency: "AUD",
    symbol: "A$",
    prices: { basic: 219, intermediate: 439, advanced: 739, master: 1329 },
  },
  {
    code: "AE",
    label: "Emiratos Árabes",
    currency: "AED",
    symbol: "د.إ",
    prices: { basic: 549, intermediate: 1099, advanced: 1839, master: 3299 },
  },
  {
    code: "SA",
    label: "Arabia Saudí",
    currency: "SAR",
    symbol: "﷼",
    prices: { basic: 559, intermediate: 1129, advanced: 1889, master: 3379 },
  },
  {
    code: "ZA",
    label: "Sudáfrica",
    currency: "ZAR",
    symbol: "R",
    prices: { basic: 1499, intermediate: 2999, advanced: 4999, master: 8999 },
    regionalBadge: true,
  },
  {
    code: "NG",
    label: "Nigeria",
    currency: "NGN",
    symbol: "₦",
    prices: { basic: 39999, intermediate: 79999, advanced: 134999, master: 244999 },
    regionalBadge: true,
  },
  {
    code: "EG",
    label: "Egipto",
    currency: "EGP",
    symbol: "E£",
    prices: { basic: 1999, intermediate: 3999, advanced: 6699, master: 11999 },
    regionalBadge: true,
  },
  {
    code: "OTHER",
    label: "Internacional",
    currency: "USD",
    symbol: "$",
    prices: { basic: 149, intermediate: 299, advanced: 499, master: 899 },
  },
];

// Country code → region code mapping (subset; falls back to OTHER)
export const COUNTRY_TO_REGION: Record<string, string> = {
  US: "US",
  CA: "CA",
  // Eurozone (subset)
  DE: "EU", FR: "EU", ES: "EU", IT: "EU", NL: "EU", BE: "EU", AT: "EU",
  IE: "EU", FI: "EU", PT: "EU", GR: "EU", LU: "EU", SK: "EU", SI: "EU",
  LT: "EU", LV: "EU", EE: "EU", CY: "EU", MT: "EU",
  // Non-euro EU
  PL: "EU", CZ: "EU", HU: "EU", RO: "EU", BG: "EU", HR: "EU", SE: "EU",
  DK: "EU", NO: "EU", IS: "EU", LI: "EU", CH: "EU",
  GB: "UK",
  // LATAM
  MX: "MX", BR: "BR", AR: "AR",
  CO: "LATAM", CL: "LATAM", PE: "LATAM", VE: "LATAM", EC: "LATAM",
  UY: "LATAM", PY: "LATAM", BO: "LATAM", CR: "LATAM", PA: "LATAM",
  GT: "LATAM", HN: "LATAM", SV: "LATAM", NI: "LATAM", DO: "LATAM",
  CU: "CU",
  // Asia
  JP: "JP", CN: "CN", IN: "IN", KR: "KR",
  // Oceania
  AU: "AU", NZ: "AU",
  // Middle East
  AE: "AE", SA: "SA", QA: "AE", KW: "AE", BH: "AE", OM: "AE",
  IL: "AE", JO: "AE", LB: "AE",
  // Africa
  ZA: "ZA", NG: "NG", EG: "EG",
  KE: "ZA", GH: "ZA", MA: "EG", TN: "EG", DZ: "EG",
};

// ============================================================
// NAVIGATION
// ============================================================
export const NAV_LINKS = [
  { href: "#portfolio", label: "Portfolio" },
  { href: "#servicios", label: "Servicios" },
  { href: "#proceso", label: "Proceso" },
  { href: "#conocenos", label: "Conócenos" },
  { href: "#testimonios", label: "Testimonios" },
  { href: "#cursos", label: "Cursos" },
  { href: "#contacto", label: "Contacto" },
];

// ============================================================
// SOCIAL
// ============================================================
export const SOCIAL_LINKS = [
  { label: "Instagram", href: "https://www.instagram.com/awa3dstudio", icon: "instagram" },
  { label: "LinkedIn", href: "https://linkedin.com/company/awa3dstudio", icon: "linkedin" },
  { label: "Behance", href: "https://behance.net/awa3dstudio", icon: "behance" },
];

// ============================================================
// CONTACT INFO
// ============================================================
export const CONTACT_INFO = {
  email: "awa3dstd@gmail.com",
  phone: "+53 5 123 4567",
  location: "La Habana, Cuba",
  // API endpoints (relativos — el Service Worker hará failover automático entre los 3 backends)
  contactApi: "/api/contact",
  enrollApi: "/api/enroll",
  // Mirrors disponibles para failover (el SW los prueba en orden)
  mirrors: [
    "https://awa3dstudio.pages.dev",         // Primary — Cloudflare Pages
    "https://awa3d-mirror.workers.dev",       // Backup 1 — Cloudflare Worker
    // Backup 2: mismo dominio actual (GitHub Pages o donde se sirva)
  ],
};

// ============================================================
// STATS (hero + about)
// ============================================================
export const HERO_STATS = [
  { value: "50+", label: "Proyectos entregados" },
  { value: "9+", label: "Años de experiencia" },
  { value: "100%", label: "Satisfacción" },
];

export const ABOUT_STATS = [
  { value: "9+", label: "Años de experiencia" },
  { value: "50+", label: "Proyectos completados" },
  { value: "30+", label: "Clientes satisfechos" },
  { value: "4", label: "Países atendidos" },
];
