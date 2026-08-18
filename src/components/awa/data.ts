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

/**
 * Software logos available for courses.
 * Each entry references an SVG in /public/software-logos/.
 */
export type SoftwareKey =
  | "sketchup"
  | "vray"
  | "photoshop"
  | "3dsmax"
  | "illustrator"
  | "ai-generic";

export interface SoftwareInfo {
  key: SoftwareKey;
  name: string;
  logo: string; // path to SVG
  vendor: string;
}

/**
 * Master registry of software used across all courses.
 * Order matters — the rendering will preserve this order.
 */
export const SOFTWARE_REGISTRY: Record<SoftwareKey, SoftwareInfo> = {
  sketchup: {
    key: "sketchup",
    name: "SketchUp",
    logo: "/software-logos/sketchup.svg",
    vendor: "Trimble",
  },
  vray: {
    key: "vray",
    name: "Chaos V-Ray",
    logo: "/software-logos/vray.svg",
    vendor: "Chaos",
  },
  photoshop: {
    key: "photoshop",
    name: "Photoshop",
    logo: "/software-logos/photoshop.svg",
    vendor: "Adobe",
  },
  "3dsmax": {
    key: "3dsmax",
    name: "3ds Max",
    logo: "/software-logos/3dsmax.svg",
    vendor: "Autodesk",
  },
  illustrator: {
    key: "illustrator",
    name: "Illustrator",
    logo: "/software-logos/illustrator.svg",
    vendor: "Adobe",
  },
  "ai-generic": {
    key: "ai-generic",
    name: "AI Generativa",
    logo: "/software-logos/ai-generic.svg",
    vendor: "Multi-modelo",
  },
};

export interface StudyPlanModule {
  title: string;
  duration: string;
  topics: string[];
  deliverable?: string;
}

export interface StudyPlan {
  totalHours: string;
  methodology: string;
  modules: StudyPlanModule[];
  materials: string[];
  evaluation: string;
  certification: string;
}

export interface CourseTier {
  id: string;
  name: string;
  tagline: string;
  description: string;
  includes: string[];
  /** Software keys taught in this course (cumulative across levels). */
  software: SoftwareKey[];
  /** Ultra-detailed study plan used in the auto-response email. */
  studyPlan: StudyPlan;
  highlighted?: boolean;
  badge?: string;
}

export const COURSE_TIERS: CourseTier[] = [
  {
    id: "basic",
    name: "Curso Básico",
    tagline: "Introducción al modelado 3D arquitectónico",
    description:
      "Fundamentos de modelado 3D aplicado a arquitectura: interfaces, navegación en el espacio 3D, modelado de espacios simples, exportación. Se trabaja con SketchUp y Chaos V-Ray desde el primer módulo.",
    includes: [
      "12 horas de video",
      "Proyecto guiado: espacio residencial",
      "Acceso a comunidad Discord",
      "Certificado de finalización",
      "Soporte por email (48h)",
    ],
    software: ["sketchup", "vray"],
    studyPlan: {
      totalHours: "12 horas",
      methodology:
        "Aprendizaje basado en proyectos (PBL). Cada módulo combina teoría corta + demostración en vivo + práctica guiada + ejercicio independiente.",
      modules: [
        {
          title: "Módulo 1 · Introducción a SketchUp",
          duration: "3 horas",
          topics: [
            "Interfaz, navegación y atajos esenciales",
            "Configuración de unidades y plantillas arquitectónicas",
            "Herramientas de dibujo básicas: línea, rectángulo, círculo, arco",
            "Extrusión y empuje/tirón (Push/Pull)",
            "Organización: grupos, componentes y capas",
          ],
          deliverable: "Modelo de un cubículo 3x3m",
        },
        {
          title: "Módulo 2 · Modelado arquitectónico en SketchUp",
          duration: "3 horas",
          topics: [
            "Importar planos CAD como referencia",
            "Modelado de muros, puertas y ventanas paramétricas",
            "Escaleras, muebles fijos y mobiliario básico",
            "Topografía y terreno (Sandbox)",
            "Geometría limpia y buenas prácticas",
          ],
          deliverable: "Vivienda unifamiliar completa",
        },
        {
          title: "Módulo 3 · Introducción a Chaos V-Ray",
          duration: "3 horas",
          topics: [
            "Instalación y configuración del render engine",
            "Tipos de luz en V-Ray: Sun, Sky, IES, Rectangular Light",
            "Cámaras V-Ray: físicas, exposición y profundidad de campo",
            "Materiales V-Ray básicos: Generic, Diffuse, Reflection",
            "Render settings: calidad vs. velocidad",
          ],
          deliverable: "Render interior con luz natural",
        },
        {
          title: "Módulo 4 · Render final y exportación",
          duration: "3 horas",
          topics: [
            "Setup de escena para render final",
            "Bucket vs. Progressive rendering",
            "Elementos de render (canal alfa, Z-depth, reflection)",
            "Exportación a PNG/TIFF en alta resolución",
            "Introducción a post-producción básica",
          ],
          deliverable: "Render fotorrealista de proyecto residencial",
        },
      ],
      materials: [
        "Licencia SketchUp Make 2017 (gratis) o Pro (trial 30 días)",
        "V-Ray SketchUp trial 30 días",
        "Librería de componentes 3D (Sketchup 3D Warehouse)",
        "5 escenas demo descargables",
      ],
      evaluation:
        "Evaluación continua con feedback del instructor. Proyecto final evaluado con rúbrica (modelado, iluminación, materiales, composición).",
      certification:
        "Certificado digital de finalización emitido por AWA 3D Studio al aprobar el proyecto final.",
    },
  },
  {
    id: "intermediate",
    name: "Curso Intermedio",
    tagline: "Rendering fotorrealista y materiales avanzados",
    description:
      "Materiales PBR, iluminación HDRI, cámaras virtuales y post-producción con Photoshop. Lleva tus renders al siguiente nivel con workflows profesionales. Software: SketchUp, V-Ray y Photoshop.",
    includes: [
      "20 horas de video",
      "Proyecto guiado: interior fotorrealista",
      "Librería de 50 materiales PBR",
      "5 HDRI exclusivos",
      "Soporte prioritario (24h)",
    ],
    software: ["sketchup", "vray", "photoshop"],
    studyPlan: {
      totalHours: "20 horas",
      methodology:
        "Workshop intensivo con feedback 1:1 en cada proyecto. Énfasis en técnicas profesionales usadas en estudios de arquitectura top.",
      modules: [
        {
          title: "Módulo 1 · Repaso y setup profesional",
          duration: "2 horas",
          topics: [
            "Workflow profesional SketchUp → V-Ray",
            "Optimización de geometría para render",
            "Escenas proxy y componentes V-Ray",
            "Organización de materiales y librerías",
          ],
          deliverable: "Escena optimizada lista para render",
        },
        {
          title: "Módulo 2 · Materiales PBR avanzados en V-Ray",
          duration: "5 horas",
          topics: [
            "Material VRayMtl en profundidad: reflection, refraction, BRDF",
            "Texturas PBR: Albedo, Roughness, Normal, Bump, Displacement",
            "Creación de materiales realistas: madera, metal, vidrio, tela, hormigón",
            "Subsurface scattering (piel, mármol, cera)",
            "Librería personal de materiales",
          ],
          deliverable: "Set de 10 materiales PBR propios",
        },
        {
          title: "Módulo 3 · Iluminación HDRI y cámaras",
          duration: "4 horas",
          topics: [
            "HDRI: captura, edición y uso como luz ambiental",
            "Sun system + Sky en exteriores arquitectónicos",
            "Tres puntos de luz y luz natural cinematográfica",
            "Cámaras físicas: focal length, exposure, white balance",
            "Composición: thirds, leading lines, framing arquitectónico",
          ],
          deliverable: "Render interior día y noche de la misma escena",
        },
        {
          title: "Módulo 4 · Post-producción con Photoshop",
          duration: "6 horas",
          topics: [
            "Workspace de Photoshop para arquitectura",
            "Render elements: cómo usar canal alfa, Z-depth, reflection",
            "Ajustes no destructivos: niveles, curvas, HSL, balance color",
            "Composición y collage de personas, vegetación, mobiliario",
            "Máscaras y blend modes para realismo",
            "Ajustes finales: dodge, burn, vignette, grain",
          ],
          deliverable: "Render post-producido nivel portafolio",
        },
        {
          title: "Módulo 5 · Proyecto final",
          duration: "3 horas",
          topics: [
            "Brief del proyecto: interior completo a elegir",
            "Modelado + materiales + iluminación + render",
            "Post-producción en Photoshop",
            "Presentación final y feedback grupal",
          ],
          deliverable: "Render fotorrealista con post-producción",
        },
      ],
      materials: [
        "Todos los materiales del Curso Básico",
        "Licencia Adobe Photoshop (trial 7 días o Photography Plan)",
        "Librería de 50 materiales PBR profesionales",
        "5 HDRI exclusivos AWA 3D Studio",
        "10 texturas de alta resolución (8K)",
        "Acceso a comunidad Discord premium",
      ],
      evaluation:
        "Proyecto final evaluado con rúbrica profesional (materiales, iluminación, composición, post-producción). Feedback detallado por escrito.",
      certification:
        "Certificado digital de finalización + sello de calidad AWA 3D Studio si el proyecto final supera 85/100.",
    },
    highlighted: true,
    badge: "Más popular",
  },
  {
    id: "advanced",
    name: "Curso Avanzado",
    tagline: "Animación arquitectónica y recorridos 360°",
    description:
      "Cinematografía 3D, animación de cámara, recorridos 360° interactivos y sound design. Software: SketchUp, V-Ray, 3ds Max y Photoshop para post-producción de alto impacto.",
    includes: [
      "28 horas de video",
      "Proyecto guiado: animación cinematográfica",
      "Templates de animación",
      "Sound design kit",
      "Mentoría 1:1 (2 sesiones)",
    ],
    software: ["sketchup", "vray", "photoshop", "3dsmax"],
    studyPlan: {
      totalHours: "28 horas",
      methodology:
        "Clase magistral + mentoring 1:1 (2 sesiones incluidas). Enfoque cinematográfico aplicado a arquitectura.",
      modules: [
        {
          title: "Módulo 1 · Introducción a 3ds Max",
          duration: "4 horas",
          topics: [
            "Interfaz, navegación y personalización de 3ds Max",
            "Importar modelos desde SketchUp: geometría y materiales",
            "Modelado avanzado: polígonos, modifiers, booleanos",
            "Organización: layers, grupos, xrefs",
          ],
          deliverable: "Escena migrada de SketchUp a 3ds Max",
        },
        {
          title: "Módulo 2 · V-Ray para 3ds Max",
          duration: "5 horas",
          topics: [
            "Diferencias entre V-Ray SketchUp y V-Ray 3ds Max",
            "VRayMtl avanzado: coat, sheen, displacement",
            "VRayLight: plane, dome, mesh, IES",
            "VRayCamera: physical, exposure, lens effects",
            "Render settings avanzados: DMC sampler, GI, caustics",
          ],
          deliverable: "Render estático nivel portafolio en 3ds Max",
        },
        {
          title: "Módulo 3 · Animación arquitectónica",
          duration: "6 horas",
          topics: [
            "Cámaras animadas: keyframes, trajectory, path constraint",
            "Movimiento cinematográfico: dolly, crane, gimbal",
            "Animación de objetos: puertas, vehículos, personas",
            "Timeline, track view y animación no lineal",
            "Render de secuencias: frame rate, resolution, output",
          ],
          deliverable: "Animación de 15 segundos renderizada",
        },
        {
          title: "Módulo 4 · Recorridos 360° interactivos",
          duration: "4 horas",
          topics: [
            "Setup de cámara 360° (spherical) en V-Ray",
            "Render stereo para VR (side-by-side)",
            "Hotspots y navegación: software (Pano2VR, Marzipano)",
            "Hosting y publicación web",
            "Integración con Google Cardboard / Quest",
          ],
          deliverable: "Recorrido 360° navegable publicado",
        },
        {
          title: "Módulo 5 · Post-producción avanzada en Photoshop",
          duration: "5 horas",
          topics: [
            "Post-producción de video frames: secuencia → timeline",
            "Color grading profesional: LUTs y ajustes",
            "Composición de personas, vehículos, vegetación animada",
            "Pintura digital y matte painting",
            "Output para web, cine y redes sociales",
          ],
          deliverable: "Animación finalizada con post-producción",
        },
        {
          title: "Módulo 6 · Sound design y entrega",
          duration: "4 horas",
          topics: [
            "Sound design kit incluido: ambientes, SFX, música",
            "Edición de audio en Adobe Audition / DaVinci Resolve",
            "Sincronización de audio con video",
            "Output final: MP4, MOV, H.264, H.265",
            "Estructura de presentación al cliente",
          ],
          deliverable: "Animación arquitectónica completa con audio",
        },
      ],
      materials: [
        "Todos los materiales de niveles anteriores",
        "Licencia Autodesk 3ds Max (trial 30 días o Educational 3 años)",
        "Adobe Photoshop (incluido en plan Creative Cloud)",
        "Templates de animación AWA 3D Studio (5 incluidos)",
        "Sound design kit: 50 archivos de audio profesionales",
        "Librería de cámaras y rigs de animación",
      ],
      evaluation:
        "Proyecto final: animación arquitectónica de 30-60 segundos + recorrido 360°. Evaluación con rúbrica cinematográfica (movimiento, composición, iluminación, sound design).",
      certification:
        "Certificado digital avanzado + mención en portafolio AWA 3D Studio (con permiso del estudiante).",
    },
  },
  {
    id: "master",
    name: "Curso Master",
    tagline: "Programa completo + branding + marketing para arquitectos",
    description:
      "El programa definitivo. Combina los tres niveles anteriores más branding personal, marketing digital y plan de negocio para que el estudiante salga con marca propia lista. Software: SketchUp, V-Ray, Photoshop, 3ds Max, Adobe Illustrator e IA generativa para marketing.",
    includes: [
      "60+ horas de video",
      "4 proyectos guiados completos",
      "Librería completa: 200+ materiales, 20 HDRI",
      "Plantillas de propuesta comercial",
      "Mentoría 1:1 (6 sesiones)",
      "Acceso de por vida",
      "Marca personal + web + plan de marketing",
    ],
    software: ["sketchup", "vray", "photoshop", "3dsmax", "illustrator", "ai-generic"],
    studyPlan: {
      totalHours: "60+ horas",
      methodology:
        "Programa inmersivo con mentoría 1:1 (6 sesiones). Combinación de clases técnicas + workshops de branding + sprints de marketing. El estudiante sale con marca personal y plan de marketing operativos.",
      modules: [
        {
          title: "Bloque A · Fundamentos (Curso Básico)",
          duration: "12 horas",
          topics: [
            "Módulo completo de SketchUp",
            "Módulo completo de Chaos V-Ray básico",
            "Modelado arquitectónico y render inicial",
          ],
          deliverable: "Proyecto residencial renderizado",
        },
        {
          title: "Bloque B · Rendering fotorrealista (Curso Intermedio)",
          duration: "20 horas",
          topics: [
            "Materiales PBR avanzados en V-Ray",
            "Iluminación HDRI y composición",
            "Post-producción con Photoshop",
            "Proyecto interior fotorrealista",
          ],
          deliverable: "Render fotorrealista con post-producción",
        },
        {
          title: "Bloque C · Animación y 360° (Curso Avanzado)",
          duration: "28 horas",
          topics: [
            "3ds Max y V-Ray avanzado",
            "Animación arquitectónica cinematográfica",
            "Recorridos 360° interactivos",
            "Post-producción de video y sound design",
          ],
          deliverable: "Animación arquitectónica + recorrido 360°",
        },
        {
          title: "Bloque D · Branding personal con Adobe Illustrator",
          duration: "8 horas",
          topics: [
            "Workspace de Illustrator para branding",
            "Diseño de logotipo personal: tipografía, isotipo, paleta",
            "Sistema de marca: tarjetas, hoja membrete, plantillas",
            "Manual de marca simplificado (brand book)",
            "Aplicación a redes sociales (avatar, banner, plantillas)",
          ],
          deliverable: "Logotipo + manual de marca básico",
        },
        {
          title: "Bloque E · Sitio web personal",
          duration: "6 horas",
          topics: [
            "Estructura de portafolio web: home, proyectos, about, contacto",
            "Plataformas: Cargo, Squarespace, Webflow, Framer, WordPress",
            "Optimización de renders para web (formato, peso, SEO)",
            "Formularios de contacto integrados",
            "Analytics y tracking (Google Analytics, Meta Pixel)",
          ],
          deliverable: "Portafolio web publicado y operativo",
        },
        {
          title: "Bloque F · Marketing con IA generativa",
          duration: "6 horas",
          topics: [
            "IA para contenido: ChatGPT, Claude, Jasper (textos, propuestas)",
            "IA para visuales: Midjourney, DALL-E, Stable Diffusion (moodboards)",
            "Automatización de redes sociales: Buffer, Later, Metricool",
            "Email marketing: Mailchimp, Brevo (plantillas, secuencias)",
            "Estrategia de contenido: calendario, formatos, hashtags",
          ],
          deliverable: "Plan de marketing 90 días con prompts IA",
        },
        {
          title: "Bloque G · Plan de negocio y captación de clientes",
          duration: "4 horas",
          topics: [
            "Estructura de precios: por hora, por proyecto, paquetes",
            "Propuesta comercial (plantilla incluida)",
            "Contratos y términos de pago",
            "Captación de clientes: LinkedIn, Instagram, plataformas freelance",
            "Pipeline de leads y CRM básico (Notion / Trello)",
          ],
          deliverable: "Plan de negocio documentado",
        },
        {
          title: "Bloque H · Mentoría y entrega final",
          duration: "6 horas",
          topics: [
            "6 sesiones 1:1 con instructor AWA 3D Studio",
            "Revisión de portafolio completo",
            "Revisión de marca personal y web",
            "Revisión de plan de marketing",
            "Demo day: presentación final del estudiante",
          ],
          deliverable: "Demo final + portafolio completo",
        },
      ],
      materials: [
        "Todos los materiales de los 3 niveles anteriores",
        "Adobe Illustrator (incluido en Creative Cloud)",
        "Acceso a IA generativa (ChatGPT Plus, Midjourney)",
        "Plantillas de marca: logo, tarjetas, manual (10 plantillas)",
        "Plantillas web: Cargo, Squarespace, Framer",
        "Plantillas de propuesta comercial (5 incluidas)",
        "Plan de marketing 90 días (plantilla editable)",
        "Librería completa: 200+ materiales PBR, 20 HDRI",
        "Mentoría 1:1 (6 sesiones de 1 hora)",
        "Acceso de por vida a actualizaciones",
      ],
      evaluation:
        "Evaluación por bloques con feedback continuo. Demo day final: presentación completa del estudiante (portafolio + marca + web + plan de marketing). Aprobación requiere superar 80/100 en cada bloque.",
      certification:
        "Certificado Master AWA 3D Studio + sello de excelencia + recomendación LinkedIn escrita por el instructor + oportunidad de colaboración como freelancer asociado al estudio.",
    },
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

// ============================================================
// COUNTRY-BASED PRICING (v8 — USD only, all countries included)
// ============================================================
// Pricing tiers calibrated to Purchasing Power Parity (PPP).
// All prices are in USD — the currency the studio charges in.
// Visitors are auto-detected by IP (Cloudflare CF-IPCountry header,
// then ipapi.co fallback) and may override manually in the dropdown.

export type PriceTier = "HIGH" | "MID" | "LATAM" | "LOW" | "CUBA";

export const PRICE_TIERS: Record<
  PriceTier,
  {
    prices: Record<"basic" | "intermediate" | "advanced" | "master", number>;
    label: string;
    regionalBadge: boolean;
  }
> = {
  HIGH: {
    prices: { basic: 149, intermediate: 299, advanced: 499, master: 899 },
    label: "Tarifa internacional",
    regionalBadge: false,
  },
  MID: {
    prices: { basic: 99, intermediate: 199, advanced: 349, master: 629 },
    label: "Tarifa regional",
    regionalBadge: true,
  },
  LATAM: {
    prices: { basic: 49, intermediate: 99, advanced: 169, master: 299 },
    label: "Tarifa Latinoamérica",
    regionalBadge: true,
  },
  LOW: {
    prices: { basic: 35, intermediate: 69, advanced: 119, master: 219 },
    label: "Tarifa regional",
    regionalBadge: true,
  },
  CUBA: {
    prices: { basic: 25, intermediate: 49, advanced: 89, master: 159 },
    label: "Tarifa Cuba",
    regionalBadge: true,
  },
};

// ISO 3166-1 alpha-2 → PPP tier. Covers all 195 UN-recognized countries
// + a few notable territories. Falls back to HIGH (international) if missing.
export const COUNTRY_TIER: Record<string, PriceTier> = {
  // ── CUBA (special pricing) ──
  CU: "CUBA",

  // ── LATAM (excl. Cuba, Mexico, Chile, Uruguay, Panamá, Costa Rica — those are MID) ──
  BR: "LATAM", AR: "LATAM", CO: "LATAM", PE: "LATAM", VE: "LATAM",
  EC: "LATAM", BO: "LATAM", PY: "LATAM", GT: "LATAM", HN: "LATAM",
  SV: "LATAM", NI: "LATAM", DO: "LATAM", BZ: "LATAM", HT: "LATAM",
  PR: "LATAM", JM: "LATAM", TT: "LATAM", BS: "LATAM", BB: "LATAM",
  GY: "LATAM", SR: "LATAM", AG: "LATAM", DM: "LATAM", GD: "LATAM",
  KN: "LATAM", LC: "LATAM", VC: "LATAM", BQ: "LATAM", CW: "LATAM",
  SX: "LATAM", AW: "LATAM", BL: "LATAM", MF: "LATAM", VG: "LATAM",
  VI: "LATAM", KY: "LATAM", BM: "LATAM", TC: "LATAM", MS: "LATAM",
  AI: "LATAM", SH: "LATAM", FK: "LATAM", GS: "LATAM",

  // ── MID (Mexico, Chile, Uruguay, Panamá, Costa Rica + Europe non-euro + Middle East + parts Asia) ──
  MX: "MID", CL: "MID", UY: "MID", PA: "MID", CR: "MID",
  // Eastern Europe non-Euro
  PL: "MID", CZ: "MID", SK: "MID", HU: "MID", RO: "MID", BG: "MID",
  RS: "MID", HR: "MID", BA: "MID", MK: "MID", ME: "MID", AL: "MID",
  LT: "MID", LV: "MID", EE: "MID", MD: "MID", UA: "MID", BY: "MID",
  RU: "MID", GE: "MID", AM: "MID", AZ: "MID", KZ: "MID", UZ: "MID",
  TM: "MID", KG: "MID", TJ: "MID",
  // Middle East
  TR: "MID", LB: "MID", JO: "MID", IQ: "MID", SY: "MID", YE: "MID",
  IR: "MID", AF: "MID", PS: "MID",
  // Asia
  MY: "MID", TH: "MID", BN: "MID", MV: "MID", CN: "MID",
  // Africa (upper-mid)
  ZA: "MID", MU: "MID", SC: "MID", BW: "MID", NA: "MID", GA: "MID",
  GQ: "MID", LY: "MID",

  // ── LOW (India-tier: South Asia, SE Asia, subsaharan Africa, North Africa) ──
  IN: "LOW", PK: "LOW", BD: "LOW", LK: "LOW", NP: "LOW", BT: "LOW",
  VN: "LOW", ID: "LOW", PH: "LOW", KH: "LOW", LA: "LOW", MM: "LOW",
  TL: "LOW",
  EG: "LOW", MA: "LOW", TN: "LOW", DZ: "LOW", SD: "LOW",
  SS: "LOW", ET: "LOW", ER: "LOW", DJ: "LOW", SO: "LOW", KE: "LOW",
  UG: "LOW", TZ: "LOW", RW: "LOW", BI: "LOW", MZ: "LOW", ZW: "LOW",
  ZM: "LOW", MW: "LOW", MG: "LOW", CM: "LOW", NG: "LOW", GH: "LOW",
  CI: "LOW", SN: "LOW", ML: "LOW", BF: "LOW", NE: "LOW", TD: "LOW",
  CF: "LOW", CG: "LOW", CD: "LOW", AO: "LOW", GM: "LOW", GN: "LOW",
  LR: "LOW", SL: "LOW", MR: "LOW", TG: "LOW", BJ: "LOW", EH: "LOW",
  ST: "LOW", KM: "LOW", CV: "LOW", GW: "LOW",

  // ── HIGH (US, CA, Western Europe, Nordics, Oceania, JP/KR/SG/HK, Gulf) ──
  // Default tier — also covers any country not explicitly listed.
  US: "HIGH", CA: "HIGH",
  // Eurozone + Western Europe
  DE: "HIGH", FR: "HIGH", ES: "HIGH", IT: "HIGH", NL: "HIGH", BE: "HIGH",
  AT: "HIGH", IE: "HIGH", FI: "HIGH", PT: "HIGH", GR: "HIGH", LU: "HIGH",
  SI: "HIGH", CY: "HIGH", MT: "HIGH",
  // Non-Euro Western Europe
  GB: "HIGH", CH: "HIGH", NO: "HIGH", SE: "HIGH", DK: "HIGH", IS: "HIGH",
  LI: "HIGH", MC: "HIGH", SM: "HIGH", VA: "HIGH", AD: "HIGH",
  // Oceania
  AU: "HIGH", NZ: "HIGH", FJ: "HIGH", PG: "HIGH", SB: "HIGH", VU: "HIGH",
  WS: "HIGH", TO: "HIGH", KI: "HIGH", TV: "HIGH", NR: "HIGH", PW: "HIGH",
  MH: "HIGH", FM: "HIGH", CK: "HIGH", NU: "HIGH", NC: "HIGH", PF: "HIGH",
  // East Asia (developed)
  JP: "HIGH", KR: "HIGH", SG: "HIGH", HK: "HIGH", TW: "HIGH", MO: "HIGH",
  // Gulf
  AE: "HIGH", SA: "HIGH", QA: "HIGH", KW: "HIGH", BH: "HIGH", OM: "HIGH",
  IL: "HIGH",
  // Caribbean (developed)
  GL: "HIGH",
};

// All countries for the dropdown — ISO 3166-1 alpha-2 + Spanish name.
// Sorted alphabetically by Spanish name (with "España" using ñ ordering).
export const COUNTRY_LIST: { code: string; name: string }[] = [
  { code: "AF", name: "Afganistán" },
  { code: "AL", name: "Albania" },
  { code: "DE", name: "Alemania" },
  { code: "AD", name: "Andorra" },
  { code: "AO", name: "Angola" },
  { code: "AG", name: "Antigua y Barbuda" },
  { code: "SA", name: "Arabia Saudita" },
  { code: "DZ", name: "Argelia" },
  { code: "AR", name: "Argentina" },
  { code: "AM", name: "Armenia" },
  { code: "AU", name: "Australia" },
  { code: "AT", name: "Austria" },
  { code: "AZ", name: "Azerbaiyán" },
  { code: "BS", name: "Bahamas" },
  { code: "BD", name: "Bangladés" },
  { code: "BB", name: "Barbados" },
  { code: "BH", name: "Baréin" },
  { code: "BE", name: "Bélgica" },
  { code: "BZ", name: "Belice" },
  { code: "BJ", name: "Benín" },
  { code: "BY", name: "Bielorrusia" },
  { code: "BO", name: "Bolivia" },
  { code: "BA", name: "Bosnia y Herzegovina" },
  { code: "BW", name: "Botsuana" },
  { code: "BR", name: "Brasil" },
  { code: "BN", name: "Brunéi" },
  { code: "BG", name: "Bulgaria" },
  { code: "BF", name: "Burkina Faso" },
  { code: "BI", name: "Burundi" },
  { code: "BT", name: "Bután" },
  { code: "CV", name: "Cabo Verde" },
  { code: "KH", name: "Camboya" },
  { code: "CM", name: "Camerún" },
  { code: "CA", name: "Canadá" },
  { code: "TD", name: "Chad" },
  { code: "CL", name: "Chile" },
  { code: "CN", name: "China" },
  { code: "CY", name: "Chipre" },
  { code: "VA", name: "Ciudad del Vaticano" },
  { code: "CO", name: "Colombia" },
  { code: "KM", name: "Comoras" },
  { code: "CG", name: "Congo" },
  { code: "KP", name: "Corea del Norte" },
  { code: "KR", name: "Corea del Sur" },
  { code: "CI", name: "Costa de Marfil" },
  { code: "CR", name: "Costa Rica" },
  { code: "HR", name: "Croacia" },
  { code: "CU", name: "Cuba" },
  { code: "CW", name: "Curazao" },
  { code: "DK", name: "Dinamarca" },
  { code: "DM", name: "Dominica" },
  { code: "EC", name: "Ecuador" },
  { code: "EG", name: "Egipto" },
  { code: "SV", name: "El Salvador" },
  { code: "AE", name: "Emiratos Árabes Unidos" },
  { code: "ER", name: "Eritrea" },
  { code: "SK", name: "Eslovaquia" },
  { code: "SI", name: "Eslovenia" },
  { code: "ES", name: "España" },
  { code: "US", name: "Estados Unidos" },
  { code: "EE", name: "Estonia" },
  { code: "SZ", name: "Esuatini" },
  { code: "ET", name: "Etiopía" },
  { code: "PH", name: "Filipinas" },
  { code: "FI", name: "Finlandia" },
  { code: "FJ", name: "Fiyi" },
  { code: "FR", name: "Francia" },
  { code: "GA", name: "Gabón" },
  { code: "GM", name: "Gambia" },
  { code: "GE", name: "Georgia" },
  { code: "GH", name: "Ghana" },
  { code: "GI", name: "Gibraltar" },
  { code: "GD", name: "Granada" },
  { code: "GR", name: "Grecia" },
  { code: "GL", name: "Groenlandia" },
  { code: "GT", name: "Guatemala" },
  { code: "GG", name: "Guernsey" },
  { code: "GN", name: "Guinea" },
  { code: "GQ", name: "Guinea Ecuatorial" },
  { code: "GW", name: "Guinea-Bisáu" },
  { code: "GY", name: "Guyana" },
  { code: "HT", name: "Haití" },
  { code: "HN", name: "Honduras" },
  { code: "HK", name: "Hong Kong" },
  { code: "HU", name: "Hungría" },
  { code: "IN", name: "India" },
  { code: "ID", name: "Indonesia" },
  { code: "IQ", name: "Irak" },
  { code: "IR", name: "Irán" },
  { code: "IE", name: "Irlanda" },
  { code: "IS", name: "Islandia" },
  { code: "BM", name: "Islas Bermudas" },
  { code: "KY", name: "Islas Caimán" },
  { code: "CK", name: "Islas Cook" },
  { code: "FO", name: "Islas Feroe" },
  { code: "MH", name: "Islas Marshall" },
  { code: "PN", name: "Islas Pitcairn" },
  { code: "SB", name: "Islas Salomón" },
  { code: "TC", name: "Islas Turcas y Caicos" },
  { code: "VG", name: "Islas Vírgenes Británicas" },
  { code: "VI", name: "Islas Vírgenes de EE.UU." },
  { code: "IM", name: "Isla de Man" },
  { code: "JE", name: "Isla de Jersey" },
  { code: "NU", name: "Isla Niue" },
  { code: "IL", name: "Israel" },
  { code: "IT", name: "Italia" },
  { code: "JM", name: "Jamaica" },
  { code: "JP", name: "Japón" },
  { code: "JO", name: "Jordania" },
  { code: "KZ", name: "Kazajistán" },
  { code: "KE", name: "Kenia" },
  { code: "KG", name: "Kirguistán" },
  { code: "KI", name: "Kiribati" },
  { code: "KW", name: "Kuwait" },
  { code: "LA", name: "Laos" },
  { code: "LS", name: "Lesoto" },
  { code: "LV", name: "Letonia" },
  { code: "LB", name: "Líbano" },
  { code: "LR", name: "Liberia" },
  { code: "LY", name: "Libia" },
  { code: "LI", name: "Liechtenstein" },
  { code: "LT", name: "Lituania" },
  { code: "LU", name: "Luxemburgo" },
  { code: "MO", name: "Macao" },
  { code: "MK", name: "Macedonia del Norte" },
  { code: "MG", name: "Madagascar" },
  { code: "MY", name: "Malasia" },
  { code: "MW", name: "Malaui" },
  { code: "MV", name: "Maldivas" },
  { code: "ML", name: "Mali" },
  { code: "MT", name: "Malta" },
  { code: "FK", name: "Malvinas" },
  { code: "MA", name: "Marruecos" },
  { code: "MR", name: "Mauritania" },
  { code: "MU", name: "Mauricio" },
  { code: "YT", name: "Mayotte" },
  { code: "MX", name: "México" },
  { code: "FM", name: "Micronesia" },
  { code: "MD", name: "Moldavia" },
  { code: "MC", name: "Mónaco" },
  { code: "MN", name: "Mongolia" },
  { code: "ME", name: "Montenegro" },
  { code: "MS", name: "Montserrat" },
  { code: "MZ", name: "Mozambique" },
  { code: "MM", name: "Myanmar" },
  { code: "NA", name: "Namibia" },
  { code: "NR", name: "Nauru" },
  { code: "NP", name: "Nepal" },
  { code: "NI", name: "Nicaragua" },
  { code: "NE", name: "Níger" },
  { code: "NG", name: "Nigeria" },
  { code: "NC", name: "Nueva Caledonia" },
  { code: "NZ", name: "Nueva Zelanda" },
  { code: "OM", name: "Omán" },
  { code: "NL", name: "Países Bajos" },
  { code: "PK", name: "Pakistán" },
  { code: "PW", name: "Palaos" },
  { code: "PS", name: "Palestina" },
  { code: "PA", name: "Panamá" },
  { code: "PG", name: "Papúa Nueva Guinea" },
  { code: "PY", name: "Paraguay" },
  { code: "PE", name: "Perú" },
  { code: "PF", name: "Polinesia Francesa" },
  { code: "PL", name: "Polonia" },
  { code: "PT", name: "Portugal" },
  { code: "GB", name: "Reino Unido" },
  { code: "CF", name: "República Centroafricana" },
  { code: "CD", name: "República Democrática del Congo" },
  { code: "DO", name: "República Dominicana" },
  { code: "RE", name: "Reunión" },
  { code: "RW", name: "Ruanda" },
  { code: "RO", name: "Rumania" },
  { code: "RU", name: "Rusia" },
  { code: "EH", name: "Sáhara Occidental" },
  { code: "WS", name: "Samoa" },
  { code: "AS", name: "Samoa Americana" },
  { code: "BL", name: "San Bartolomé" },
  { code: "KN", name: "San Cristóbal y Nieves" },
  { code: "SM", name: "San Marino" },
  { code: "MF", name: "San Martín" },
  { code: "PM", name: "San Pedro y Miquelón" },
  { code: "VC", name: "San Vicente y las Granadinas" },
  { code: "SH", name: "Santa Elena" },
  { code: "LC", name: "Santa Lucía" },
  { code: "ST", name: "Santo Tomé y Príncipe" },
  { code: "SN", name: "Senegal" },
  { code: "RS", name: "Serbia" },
  { code: "SC", name: "Seychelles" },
  { code: "SL", name: "Sierra Leona" },
  { code: "SG", name: "Singapur" },
  { code: "SX", name: "Sint Maarten" },
  { code: "SY", name: "Siria" },
  { code: "SO", name: "Somalia" },
  { code: "LK", name: "Sri Lanka" },
  { code: "ZA", name: "Sudáfrica" },
  { code: "SD", name: "Sudán" },
  { code: "SS", name: "Sudán del Sur" },
  { code: "SE", name: "Suecia" },
  { code: "CH", name: "Suiza" },
  { code: "SR", name: "Surinam" },
  { code: "TH", name: "Tailandia" },
  { code: "TW", name: "Taiwán" },
  { code: "TZ", name: "Tanzania" },
  { code: "TJ", name: "Tayikistán" },
  { code: "TF", name: "Territorios Australes Franceses" },
  { code: "TL", name: "Timor Oriental" },
  { code: "TG", name: "Togo" },
  { code: "TK", name: "Tokelau" },
  { code: "TO", name: "Tonga" },
  { code: "TT", name: "Trinidad y Tobago" },
  { code: "TN", name: "Túnez" },
  { code: "TM", name: "Turkmenistán" },
  { code: "TR", name: "Turquía" },
  { code: "TV", name: "Tuvalu" },
  { code: "UA", name: "Ucrania" },
  { code: "UG", name: "Uganda" },
  { code: "UY", name: "Uruguay" },
  { code: "UZ", name: "Uzbekistán" },
  { code: "VU", name: "Vanuatu" },
  { code: "VE", name: "Venezuela" },
  { code: "VN", name: "Vietnam" },
  { code: "WF", name: "Wallis y Futuna" },
  { code: "YE", name: "Yemen" },
  { code: "DJ", name: "Yibuti" },
  { code: "ZM", name: "Zambia" },
  { code: "ZW", name: "Zimbabue" },
];

// Map ISO code → Spanish country name (lookup for COUNTRY_LIST).
export const COUNTRY_NAME_BY_CODE: Record<string, string> = Object.fromEntries(
  COUNTRY_LIST.map(({ code, name }) => [code, name])
);

/**
 * Returns the pricing tier + USD prices for a given ISO country code.
 * Falls back to HIGH (international USD pricing) for unknown codes.
 */
export function getPricingForCountry(iso: string | undefined | null): {
  tier: PriceTier;
  prices: Record<"basic" | "intermediate" | "advanced" | "master", number>;
  label: string;
  regionalBadge: boolean;
} {
  if (!iso) return { tier: "HIGH", ...PRICE_TIERS.HIGH };
  const tier = COUNTRY_TIER[iso.toUpperCase()] ?? "HIGH";
  return { tier, ...PRICE_TIERS[tier] };
}

// ============================================================
// LEGACY COMPATIBILITY — keep old exports as no-ops / aliases
// so existing imports in courses.tsx don't break before migration.
// These will be removed once courses.tsx is fully migrated.
// ============================================================
export const PRICING_BY_REGION: RegionPricing[] = [
  {
    code: "US",
    label: "Estados Unidos",
    currency: "USD",
    symbol: "$",
    prices: { basic: 149, intermediate: 299, advanced: 499, master: 899 },
  },
  {
    code: "OTHER",
    label: "Internacional",
    currency: "USD",
    symbol: "$",
    prices: { basic: 149, intermediate: 299, advanced: 499, master: 899 },
  },
];

export const COUNTRY_TO_REGION: Record<string, string> = {
  US: "US",
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
    "https://awa3d-mirror.dashiellyeneri.workers.dev",       // Backup 1 — Cloudflare Worker
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
