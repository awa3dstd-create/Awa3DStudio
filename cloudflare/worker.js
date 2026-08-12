/**
 * AWA 3D STUDIO — Cloudflare Worker (Mirror #2)
 * ------------------------------------------------------------
 * Worker mirror con las 4 API routes del sitio principal.
 * Diseñado para failover: si Cloudflare Pages cae, este Worker atiende todo.
 *
 * Endpoints:
 *   POST /api/contact     — Lead capture (form principal)
 *   POST /api/enroll      — Inscripción a cursos
 *   POST /api/quote       — Genera cotización PDF (Bearer auth)
 *   GET  /api/cron/followup — Cron diario de seguimiento (Bearer auth)
 *
 * CORS abierto a los 3 mirrors:
 *   - https://awa3dstudio.pages.dev
 *   - https://awa3d-mirror.dashiellyeneri.workers.dev
 *   - https://awa3dstd.github.io
 *
 * Deploy:
 *   wrangler deploy cloudflare/worker.js --name awa3d-mirror --compatibility-date 2024-11-01
 *
 * Secrets (via `wrangler secret put`):
 *   RESEND_API_KEY, RESEND_FROM_EMAIL, NOTION_API_KEY, NOTION_LEADS_DB_ID,
 *   TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID, QUOTE_API_KEY, CRON_SECRET
 */

// ============= CONFIG =============
const ALLOWED_ORIGINS = new Set([
  "https://awa3dstudio.pages.dev",
  "https://awa3d-mirror.dashiellyeneri.workers.dev",
  "https://awa3dstd.github.io",
  "https://awa3dstd-create.github.io", // alternate form
]);

const INBOX = "awa3dstd@gmail.com";

// ============= CORS =============
function corsHeaders(origin) {
  const allowOrigin = ALLOWED_ORIGINS.has(origin) ? origin : "https://awa3dstudio.pages.dev";
  return {
    "Access-Control-Allow-Origin": allowOrigin,
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Max-Age": "86400",
  };
}

function jsonResponse(data, status = 200, origin = "*") {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json", ...corsHeaders(origin) },
  });
}

// ============= VALIDATION =============
function validateLead(input) {
  const name = typeof input.name === "string" ? input.name.trim() : "";
  const email = typeof input.email === "string" ? input.email.trim() : "";
  const phone = typeof input.phone === "string" ? input.phone.trim() : "";
  const service = typeof input.service === "string" ? input.service.trim() : "";
  const message = typeof input.message === "string" ? input.message.trim() : "";

  if (!name || !email || !message) {
    return { ok: false, error: "Faltan campos obligatorios (name, email, message)" };
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { ok: false, error: "Email inválido" };
  }
  if (name.length > 200 || email.length > 200 || message.length > 5000) {
    return { ok: false, error: "Campo demasiado largo" };
  }
  return {
    ok: true,
    data: { name, email, phone: phone || undefined, service: service || undefined, message },
  };
}

// ============= EMAIL (Resend) =============
async function sendEmail(env, { to, subject, html, replyTo, attachments }) {
  if (!env.RESEND_API_KEY) {
    return { ok: false, skipped: true, error: "RESEND_API_KEY not configured" };
  }
  try {
    const body = {
      from: env.RESEND_FROM_EMAIL || "AWA 3D Studio <onboarding@resend.dev>",
      to,
      subject,
      html,
      reply_to: replyTo || INBOX,
    };
    if (attachments && attachments.length) {
      body.attachments = attachments;
    }
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const err = await res.text();
      return { ok: false, error: `Resend ${res.status}: ${err}` };
    }
    const data = await res.json();
    return { ok: true, id: data.id };
  } catch (err) {
    return { ok: false, error: String(err) };
  }
}

function isTrialMode(env) {
  const from = env.RESEND_FROM_EMAIL || "";
  return from.includes("onboarding@resend.dev");
}

// ============= NOTION =============
async function createLeadInNotion(env, lead) {
  if (!env.NOTION_API_KEY || !env.NOTION_LEADS_DB_ID) {
    return { ok: false, skipped: true, error: "Notion not configured" };
  }
  try {
    const res = await fetch("https://api.notion.com/v1/pages", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env.NOTION_API_KEY}`,
        "Content-Type": "application/json",
        "Notion-Version": "2022-06-28",
      },
      body: JSON.stringify({
        parent: { database_id: env.NOTION_LEADS_DB_ID },
        properties: {
          Name: { title: [{ text: { content: lead.name } }] },
          Email: { email: lead.email },
          ...(lead.phone ? { Phone: { phone_number: lead.phone } } : {}),
          ...(lead.service ? { Service: { select: { name: lead.service } } } : {}),
          Message: { rich_text: [{ text: { content: lead.message.slice(0, 2000) } }] },
          Source: { select: { name: lead.source || "contact" } },
          ...(lead.country ? { Country: { rich_text: [{ text: { content: lead.country } }] } } : {}),
        },
      }),
    });
    if (!res.ok) {
      const err = await res.text();
      return { ok: false, error: `Notion ${res.status}: ${err}` };
    }
    const data = await res.json();
    return { ok: true, id: data.id, url: data.url };
  } catch (err) {
    return { ok: false, error: String(err) };
  }
}

// ============= TELEGRAM =============
async function sendTelegramMessage(env, text) {
  if (!env.TELEGRAM_BOT_TOKEN || !env.TELEGRAM_CHAT_ID) {
    return { ok: false, skipped: true, error: "Telegram not configured" };
  }
  try {
    const res = await fetch(
      `https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/sendMessage`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: env.TELEGRAM_CHAT_ID,
          text,
          parse_mode: "HTML",
          disable_web_page_preview: true,
        }),
      }
    );
    if (!res.ok) {
      const err = await res.text();
      return { ok: false, error: `Telegram ${res.status}: ${err}` };
    }
    return { ok: true };
  } catch (err) {
    return { ok: false, error: String(err) };
  }
}

// ============= TEMPLATES (simplified) =============
function autoResponseContactHtml(name) {
  return `
<div style="font-family:system-ui,sans-serif;max-width:560px;margin:0 auto;color:#0a0a0f">
  <h1 style="font-size:24px;margin:0 0 16px">Hola ${name},</h1>
  <p style="font-size:16px;line-height:1.6">Recibimos tu mensaje. Te contactaremos en menos de 24 horas.</p>
  <p style="font-size:16px;line-height:1.6;color:#71717a">— AWA 3D Studio</p>
</div>`;
}

function autoResponseEnrollHtml(name, courseName) {
  return `
<div style="font-family:system-ui,sans-serif;max-width:560px;margin:0 auto;color:#0a0a0f">
  <h1 style="font-size:24px;margin:0 0 16px">Hola ${name},</h1>
  <p style="font-size:16px;line-height:1.6">Recibimos tu solicitud de inscripción al <strong>${courseName}</strong>.</p>
  <p style="font-size:16px;line-height:1.6">Te contactaremos en menos de 24 horas con los detalles.</p>
  <p style="font-size:16px;line-height:1.6;color:#71717a">— AWA 3D Studio</p>
</div>`;
}

// ============= DETAILED COURSE PLAN TEMPLATES =============
// (Simplified version for the Worker — same content as src/lib/templates.ts)
function escapeHtmlStr(s) {
  return String(s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#39;");
}

const PLAN_HEADER = (courseName, tagline) => `
  <div style="background:#0f0f17;border:1px solid #1e1e2a;border-radius:8px;padding:24px;margin:0 0 32px;">
    <p style="margin:0 0 8px;color:#71717a;font-size:11px;text-transform:uppercase;letter-spacing:0.15em;font-weight:700;">Plan de mentoría</p>
    <h1 style="color:#ffffff;font-size:26px;font-weight:700;margin:0 0 8px;">${escapeHtmlStr(courseName)}</h1>
    <p style="color:#00c8b4;font-size:14px;margin:0;font-style:italic;">${escapeHtmlStr(tagline)}</p>
  </div>
`;

const PLAN_BLOCK = (title, items) => `
  <h2 style="color:#00c8b4;font-size:14px;text-transform:uppercase;letter-spacing:0.1em;font-weight:700;margin:24px 0 12px;border-bottom:1px solid #1e1e2a;padding-bottom:8px;">${escapeHtmlStr(title)}</h2>
  <ul style="list-style:none;padding:0;margin:0;">
    ${items.map(it => `
      <li style="color:#a1a1aa;font-size:14px;line-height:1.7;margin:0 0 8px;padding-left:24px;position:relative;">
        <span style="position:absolute;left:0;color:#00c8b4;font-weight:700;">▸</span>${escapeHtmlStr(it)}
      </li>`).join("")}
  </ul>
`;

const PLAN_PRICE_BOX = (price, region) => `
  <div style="background:#0f0f17;border:2px solid #00c8b4;border-radius:8px;padding:20px;margin:32px 0;text-align:center;">
    <p style="margin:0 0 8px;color:#71717a;font-size:11px;text-transform:uppercase;letter-spacing:0.15em;font-weight:700;">Inversión (región: ${escapeHtmlStr(region)})</p>
    <p style="margin:0 0 12px;color:#00c8b4;font-size:32px;font-weight:700;">${escapeHtmlStr(price)}</p>
    <p style="margin:0;color:#71717a;font-size:12px;">Pago único · Acceso inmediato tras confirmación</p>
  </div>
`;

const PLAN_NEXT_STEPS = `
  <h2 style="color:#00c8b4;font-size:14px;text-transform:uppercase;letter-spacing:0.1em;font-weight:700;margin:32px 0 12px;border-bottom:1px solid #1e1e2a;padding-bottom:8px;">Próximos pasos</h2>
  <ol style="padding-left:20px;margin:0;color:#a1a1aa;font-size:14px;line-height:1.8;">
    <li style="margin-bottom:8px;">Recibirás en las próximas <strong style="color:#00c8b4;">24 horas</strong> un correo con los pasos de pago y métodos disponibles (transferencia, tarjeta, cripto).</li>
    <li style="margin-bottom:8px;">Una vez confirmado el pago, te crearemos tu cuenta en la plataforma y recibirás tus credenciales de acceso.</li>
    <li style="margin-bottom:8px;">Tendrás acceso al Discord privado de la comunidad AWA, donde podrás hacer preguntas y compartir avances.</li>
    <li style="margin-bottom:8px;">Si el curso incluye mentoría 1:1, te contactaremos para coordinar la primera sesión.</li>
  </ol>
  <p style="color:#a1a1aa;font-size:14px;line-height:1.6;margin:24px 0 0;">
    ¿Alguna duda? Escríbenos a
    <a href="mailto:awa3dstd@gmail.com" style="color:#00c8b4;text-decoration:none;">awa3dstd@gmail.com</a>
    o por WhatsApp al <strong style="color:#ffffff;">+53 5 123 4567</strong>.
  </p>
`;

const SHELL = (inner) => `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>AWA 3D Studio · Plan de mentoría</title>
</head>
<body style="margin:0;padding:0;background:#0a0a0f;font-family:ui-sans-serif,system-ui,-apple-system,Segoe UI,Roboto,sans-serif;color:#e4e4e7;">
  <div style="max-width:560px;margin:0 auto;padding:48px 24px;">
    <div style="text-align:center;margin-bottom:32px;">
      <div style="display:inline-block;padding:8px 16px;border:1px solid #1e1e2a;border-radius:6px;background:#0f0f17;">
        <span style="color:#00c8b4;font-weight:700;letter-spacing:0.05em;">AWA 3D STUDIO</span>
      </div>
    </div>
    ${inner}
    <hr style="border:none;border-top:1px solid #1e1e2a;margin:32px 0;">
    <p style="color:#71717a;font-size:13px;line-height:1.5;">
      AWA 3D Studio · La Habana, Cuba<br>
      <a href="https://awa3dstudio.pages.dev" style="color:#71717a;text-decoration:none;">awa3dstudio.pages.dev</a>
    </p>
  </div>
</body>
</html>`;

function coursePlanBasicHtml(d) {
  return SHELL(`
    ${PLAN_HEADER(d.courseName, d.courseTagline)}
    <p style="color:#a1a1aa;font-size:16px;line-height:1.6;margin:0 0 24px;">
      ¡Hola <strong style="color:#ffffff;">${escapeHtmlStr(d.name)}</strong>! Gracias por tu interés en el
      <strong style="color:#00c8b4;">${escapeHtmlStr(d.courseName)}</strong>. Adjuntamos el plan completo de mentoría para que sepas exactamente qué vas a aprender.
    </p>
    ${PLAN_BLOCK("Objetivos del curso", [
      "Dominar la interfaz y navegación 3D en software profesional (Blender/SketchUp)",
      "Crear modelos arquitectónicos básicos: habitaciones, mobiliario simple, escaleras",
      "Aplicar materiales básicos y exportar modelos en formatos estándar (OBJ, FBX, GLB)",
      "Comprender el flujo de trabajo desde el brief hasta la entrega final",
    ])}
    ${PLAN_BLOCK("Estructura del programa (12 horas)", [
      "Módulo 1 — Interfaz y navegación 3D (2h): viewports, ejes, snaps, atajos",
      "Módulo 2 — Modelado de espacios residenciales (4h): paredes, suelos, techos, puertas",
      "Módulo 3 — Mobiliario y objetos simples (3h): sillas, mesas, sofás desde primitivas",
      "Módulo 4 — Materiales y texturas básicas (2h): UV mapping introductorio, color, roughness",
      "Módulo 5 — Exportación y entregables (1h): formatos, optimización, presentación al cliente",
    ])}
    ${PLAN_BLOCK("Proyecto guiado", [
      "Modelado completo de un espacio residencial de 60 m²",
      "Entrega final: 3 renders + 1 planta 3D + 1 walkthrough animado de 15s",
      "Feedback personalizado del mentor sobre tu proyecto",
    ])}
    ${PLAN_BLOCK("Incluye", [
      "12 horas de video on-demand (acceso 6 meses)",
      "Proyecto guiado paso a paso con feedback",
      "Acceso a comunidad Discord",
      "Certificado de finalización PDF",
      "Soporte por email (respuesta en 48h)",
    ])}
    ${PLAN_PRICE_BOX(d.price, d.region)}
    ${PLAN_NEXT_STEPS}
  `);
}

function coursePlanIntermediateHtml(d) {
  return SHELL(`
    ${PLAN_HEADER(d.courseName, d.courseTagline)}
    <p style="color:#a1a1aa;font-size:16px;line-height:1.6;margin:0 0 24px;">
      ¡Hola <strong style="color:#ffffff;">${escapeHtmlStr(d.name)}</strong>! Gracias por tu interés en el
      <strong style="color:#00c8b4;">${escapeHtmlStr(d.courseName)}</strong>. Este es el plan completo de mentoría para llevar tus renders al siguiente nivel.
    </p>
    ${PLAN_BLOCK("Objetivos del curso", [
      "Dominar el sistema PBR (Physically Based Rendering) y crear materiales fotorrealistas",
      "Configurar iluminación HDRI profesional para interiores y exteriores",
      "Componer cámaras virtuales con reglas cinematográficas aplicadas a la arquitectura",
      "Post-producción en Photoshop/DaVinci para acabado premium",
    ])}
    ${PLAN_BLOCK("Estructura del programa (20 horas)", [
      "Módulo 1 — Materiales PBR avanzados (4h): difusa, roughness, metalness, normal, displacement",
      "Módulo 2 — Librería de 50 materiales profesionales (2h): madera, mármol, tela, metal, vidrio",
      "Módulo 3 — Iluminación HDRI para interiores (4h): setup de 3 puntos, ambiente, accent light",
      "Módulo 4 — Iluminación HDRI para exteriores (3h): sol, sombras, atmósfera, golden hour",
      "Módulo 5 — Cámaras virtuales (3h): focal length, profundidad de campo, composición clásica",
      "Módulo 6 — Post-producción (4h): passes (Z, AO, Cryptomatte), color grading, retoque",
    ])}
    ${PLAN_BLOCK("Proyecto guiado", [
      "Render fotorrealista de un interior completo (cocina o salón) con iluminación natural",
      "Entrega: 5 renders finales 4K + 1 animación de cámara de 10s + 1 variante de materiales",
      "Feedback 1:1 del mentor en 2 momentos del proyecto",
    ])}
    ${PLAN_BLOCK("Incluye", [
      "20 horas de video on-demand (acceso 12 meses)",
      "Proyecto guiado con feedback 1:1 (2 sesiones)",
      "Librería de 50 materiales PBR descargables",
      "5 HDRI exclusivos para tus proyectos",
      "Soporte prioritario (respuesta en 24h)",
      "Certificado de finalización PDF",
    ])}
    ${PLAN_PRICE_BOX(d.price, d.region)}
    ${PLAN_NEXT_STEPS}
  `);
}

function coursePlanAdvancedHtml(d) {
  return SHELL(`
    ${PLAN_HEADER(d.courseName, d.courseTagline)}
    <p style="color:#a1a1aa;font-size:16px;line-height:1.6;margin:0 0 24px;">
      ¡Hola <strong style="color:#ffffff;">${escapeHtmlStr(d.name)}</strong>! Gracias por tu interés en el
      <strong style="color:#00c8b4;">${escapeHtmlStr(d.courseName)}</strong>. Este es el plan completo de mentoría para producir piezas audiovisuales de alto impacto.
    </p>
    ${PLAN_BLOCK("Objetivos del curso", [
      "Dominar la cinematografía 3D aplicada a arquitectura (tipos de plano, movimientos, ritmo)",
      "Crear recorridos 360° interactivos para VR/AR y presentaciones web",
      "Integrar sound design y música para producciones audiovisuales inmersivas",
      "Producir piezas audiovisuales completas listas para portfolio profesional",
    ])}
    ${PLAN_BLOCK("Estructura del programa (28 horas)", [
      "Módulo 1 — Cinematografía 3D (5h): tipos de plano, eje de cámara, regla de los tercios",
      "Módulo 2 — Animación de cámara (5h): dolly, crane, pan, tilt, keyframes e interpolación",
      "Módulo 3 — Recorridos 360° interactivos (5h): Marziplote, hotspots, VR export",
      "Módulo 4 — Sound design (4h): selección de música, SFX, sincronización, mezcla básica",
      "Módulo 5 — Renderización animada (5h): samples, denoising, batch render, formatos",
      "Módulo 6 — Edición y exportación final (4h): Premiere/DaVinci, color, export web/social",
    ])}
    ${PLAN_BLOCK("Proyecto guiado", [
      "Producción completa de una pieza audiovisual de 30-60s sobre un proyecto arquitectónico",
      "Incluye: animación cinematográfica + recorrido 360° + sound design + entrega final en 4K",
      "Feedback 1:1 del mentor en 2 sesiones + revisión final",
      "Entregable adicional: caso de estudio profesional (caso real con cliente)",
    ])}
    ${PLAN_BLOCK("Incluye", [
      "28 horas de video on-demand (acceso 18 meses)",
      "Proyecto guiado con feedback 1:1 (2 sesiones)",
      "Templates de animación editables (After Effects + Premiere)",
      "Sound design kit: 100+ SFX y 20 pistas musicales con licencia",
      "Soporte prioritario (respuesta en 24h)",
      "Certificado de finalización PDF",
    ])}
    ${PLAN_PRICE_BOX(d.price, d.region)}
    ${PLAN_NEXT_STEPS}
  `);
}

function coursePlanMasterHtml(d) {
  return SHELL(`
    ${PLAN_HEADER(d.courseName, d.courseTagline)}
    <p style="color:#a1a1aa;font-size:16px;line-height:1.6;margin:0 0 24px;">
      ¡Hola <strong style="color:#ffffff;">${escapeHtmlStr(d.name)}</strong>! Gracias por tu interés en el
      <strong style="color:#00c8b4;">${escapeHtmlStr(d.courseName)}</strong>. Este es el programa definitivo —
      encontrarás abajo el plan completo de los tres niveles + contenido exclusivo de branding de estudio.
    </p>
    ${PLAN_BLOCK("Objetivos del programa", [
      "Dominar completamente el flujo profesional: modelado → renderizado → animación → producción",
      "Aprender a captar clientes y vender visualización arquitectónica de alto valor",
      "Construir branding de estudio y propuesta comercial profesional",
      "Desarrollar portfolio completo con 4 proyectos listos para mostrar a clientes",
    ])}
    ${PLAN_BLOCK("Estructura completa (60+ horas)", [
      "NIVEL 1 — Modelado 3D arquitectónico (12h): interfaces, espacios, mobiliario, exportación",
      "NIVEL 2 — Rendering fotorrealista (20h): PBR, HDRI, cámaras, post-producción",
      "NIVEL 3 — Animación cinematográfica (28h): cinematografía, recorridos 360°, sound design",
      "BONUS — Branding de estudio (6h): identidad visual, propuesta comercial, captación de clientes",
      "BONUS — Workflow profesional (4h): brief, presupuesto, contratos, gestión de proyecto",
    ])}
    ${PLAN_BLOCK("4 proyectos guiados completos", [
      "Proyecto 1 — Espacio residencial (modelado básico) + 3 renders + walkthrough",
      "Proyecto 2 — Interior fotorrealista (rendering) + 5 renders 4K + animación cámara 10s",
      "Proyecto 3 — Pieza audiovisual completa (animación) + video 30-60s 4K + recorrido 360°",
      "Proyecto 4 — Caso de estudio profesional (branding) + propuesta comercial + portfolio",
      "Feedback 1:1 del mentor en cada proyecto (4 sesiones de 1h)",
    ])}
    ${PLAN_BLOCK("Incluye", [
      "60+ horas de video on-demand (acceso de por vida)",
      "4 proyectos guiados completos con feedback 1:1 (4 sesiones)",
      "Mentoría 1:1 personalizada (6 sesiones de 1h)",
      "Librería completa: 200+ materiales PBR + 20 HDRI exclusivos",
      "Plantillas de propuesta comercial + contratos modelo",
      "Templates de animación + sound design kit completo",
      "Acceso de por vida a actualizaciones del programa",
      "Acceso a la red privada de alumni y oportunidades de colaboración",
      "Soporte prioritario vitalicio (respuesta en 24h)",
      "Certificado de finalización PDF + carta de recomendación del mentor",
    ])}
    ${PLAN_PRICE_BOX(d.price, d.region)}
    ${PLAN_NEXT_STEPS}
  `);
}

function coursePlanHtmlFor(courseId, data) {
  switch (courseId) {
    case "basic": return coursePlanBasicHtml(data);
    case "intermediate": return coursePlanIntermediateHtml(data);
    case "advanced": return coursePlanAdvancedHtml(data);
    case "master": return coursePlanMasterHtml(data);
    default: return autoResponseEnrollHtml(data.name, data.courseName);
  }
}

function notificationHtml(lead) {
  return `
<div style="font-family:system-ui,sans-serif;max-width:560px;margin:0 auto">
  <h2 style="margin:0 0 16px;color:#0a0a0f">Nuevo lead recibido</h2>
  <table style="width:100%;font-size:14px">
    <tr><td style="padding:4px 0;color:#71717a">Nombre:</td><td style="padding:4px 0">${lead.name}</td></tr>
    <tr><td style="padding:4px 0;color:#71717a">Email:</td><td style="padding:4px 0">${lead.email}</td></tr>
    <tr><td style="padding:4px 0;color:#71717a">Teléfono:</td><td style="padding:4px 0">${lead.phone || "—"}</td></tr>
    <tr><td style="padding:4px 0;color:#71717a">Servicio:</td><td style="padding:4px 0">${lead.service || "—"}</td></tr>
    <tr><td style="padding:4px 0;color:#71717a">País:</td><td style="padding:4px 0">${lead.country || "—"}</td></tr>
    <tr><td style="padding:4px 0;color:#71717a">Origen:</td><td style="padding:4px 0">${lead.source}</td></tr>
  </table>
  <hr style="margin:16px 0;border:0;border-top:1px solid #e4e4e7"/>
  <p style="font-size:14px;line-height:1.6">${lead.message}</p>
</div>`;
}

function telegramMessage(lead) {
  return `🔔 <b>Nuevo lead</b>

👤 <b>${lead.name}</b>
✉️ ${lead.email}
📞 ${lead.phone || "—"}
🔧 ${lead.service || "—"}
🌍 ${lead.country || "—"}
📦 ${lead.source}

💬 ${lead.message.slice(0, 200)}`;
}

function forwardReadyWrapper({ leadEmail, leadName, innerHtml }) {
  return `
<div style="font-family:system-ui,sans-serif;max-width:560px;margin:0 auto">
  <div style="background:#fef3c7;border:1px solid #f59e0b;padding:12px;border-radius:4px;margin-bottom:16px">
    <strong>⚠️ MODO TRIAL — Reenviar manualmente</strong><br/>
    Para: <a href="mailto:${leadEmail}">${leadEmail}</a> (${leadName})
  </div>
  ${innerHtml}
</div>`;
}

// ============= LEAD PROCESSOR =============
async function processLead(env, input, request, opts) {
  const validation = validateLead(input);
  if (!validation.ok || !validation.data) {
    return {
      ok: false,
      status: 400,
      results: {
        autoResponse: { ok: false, skipped: true, error: validation.error },
        internal: { ok: false, skipped: true, error: validation.error },
        notion: { ok: false, skipped: true, error: validation.error },
        telegram: { ok: false, skipped: true, error: validation.error },
      },
    };
  }

  const country = request.headers.get("cf-ipcountry") || "Unknown";
  const lead = {
    ...validation.data,
    source: opts.source,
    country,
  };

  // Pick the auto-response HTML:
  // - course + courseId → detailed mentorship plan
  // - course (no courseId) → generic enroll template
  // - contact → contact template
  const hasCoursePlan = opts.source === "course" && opts.courseId && opts.courseName;

  const autoResponseHtml = hasCoursePlan
    ? coursePlanHtmlFor(opts.courseId, {
        name: lead.name,
        courseName: opts.courseName,
        courseTagline: opts.courseTagline || "",
        price: opts.coursePrice || "",
        region: opts.courseRegion || "",
      })
    : opts.source === "course" && opts.courseName
      ? autoResponseEnrollHtml(lead.name, opts.courseName)
      : autoResponseContactHtml(lead.name);

  const trial = isTrialMode(env);
  const autoResponseSubject = hasCoursePlan
    ? `Plan de mentoría — ${opts.courseName} · AWA 3D Studio`
    : opts.source === "course"
      ? `Inscripción recibida — AWA 3D Studio`
      : "Recibimos tu solicitud — AWA 3D Studio";

  const autoResponsePayload = trial
    ? {
        to: INBOX,
        subject: `[REENVIAR A ${lead.email}] ${autoResponseSubject}`,
        html: forwardReadyWrapper({
          leadEmail: lead.email,
          leadName: lead.name,
          innerHtml: autoResponseHtml,
        }),
        replyTo: INBOX,
      }
    : {
        to: lead.email,
        subject: autoResponseSubject,
        html: autoResponseHtml,
        replyTo: INBOX,
      };

  const [autoRes, internalRes, notionRes, telegramRes] = await Promise.allSettled([
    sendEmail(env, autoResponsePayload),
    sendEmail(env, {
      to: INBOX,
      subject:
        opts.source === "course"
          ? `Nueva inscripción: ${lead.name} — ${opts.courseName || "Curso"}`
          : `Nuevo lead: ${lead.name} — ${lead.service || "Sin servicio especificado"}`,
      html: notificationHtml(lead),
    }),
    createLeadInNotion(env, lead),
    sendTelegramMessage(env, telegramMessage(lead)),
  ]);

  const pick = (p, fallback) => (p.status === "fulfilled" ? p.value : fallback);

  const results = {
    autoResponse: pick(autoRes, { ok: false, error: "Promise rejected" }),
    internal: pick(internalRes, { ok: false, error: "Promise rejected" }),
    notion: pick(notionRes, { ok: false, error: "Promise rejected" }),
    telegram: pick(telegramRes, { ok: false, error: "Promise rejected" }),
  };

  return {
    ok: true,
    status: 200,
    results,
    // Include plan HTML in response so caller (front-end) can display it
    // as a fallback when email delivery fails (Gmail filters onboarding@resend.dev).
    planHtml: autoResponseHtml,
    planSubject: autoResponseSubject,
    trialMode: trial,
    leadEmail: lead.email,
  };
}

// ============= QUOTE GENERATOR (simplified for mirror) =============
const SERVICE_PRICES = {
  "interior-render": { basic: 290, standard: 490, premium: 890 },
  "exterior-render": { basic: 390, standard: 690, premium: 1190 },
  "animation": { basic: 990, standard: 1990, premium: 3490 },
  "360-tour": { basic: 690, standard: 1290, premium: 2290 },
  "modeling-3d": { basic: 240, standard: 440, premium: 790 },
  "course": { basic: 240, standard: 440, premium: 790 },
};

async function handleQuote(env, request, origin) {
  const authHeader = request.headers.get("Authorization") || "";
  const token = authHeader.replace("Bearer ", "");
  if (!env.QUOTE_API_KEY || token !== env.QUOTE_API_KEY) {
    return jsonResponse({ ok: false, error: "Unauthorized" }, 401, origin);
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return jsonResponse({ ok: false, error: "Invalid JSON" }, 400, origin);
  }

  const { leadName, leadEmail, leadCountry, serviceKey, tier } = body;
  if (!leadName || !leadEmail || !serviceKey || !tier) {
    return jsonResponse({ ok: false, error: "Missing required fields" }, 400, origin);
  }
  if (!SERVICE_PRICES[serviceKey]) {
    return jsonResponse({ ok: false, error: "Invalid serviceKey" }, 400, origin);
  }
  if (!["basic", "standard", "premium"].includes(tier)) {
    return jsonResponse({ ok: false, error: "Invalid tier" }, 400, origin);
  }

  const basePrice = SERVICE_PRICES[serviceKey][tier];
  const quoteId = `Q-${new Date().toISOString().slice(0, 10).replace(/-/g, "")}-${Math.floor(Math.random() * 9000 + 1000)}`;
  const filename = `Cotizacion_AWA3D_${leadName.replace(/\s+/g, "_")}_${quoteId}.pdf`;

  // Send quote email (without PDF — simplified mirror)
  const emailHtml = `
<div style="font-family:system-ui,sans-serif;max-width:560px;margin:0 auto">
  <h1 style="color:#0a0a0f">Cotización ${quoteId}</h1>
  <p>Hola ${leadName},</p>
  <p>Gracias por tu interés en AWA 3D Studio. Aquí está tu cotización:</p>
  <table style="width:100%;border-collapse:collapse;margin:16px 0">
    <tr style="background:#0a0a0f;color:#fff">
      <td style="padding:12px">Servicio</td>
      <td style="padding:12px">${serviceKey}</td>
    </tr>
    <tr style="background:#f4f4f5">
      <td style="padding:12px">Nivel</td>
      <td style="padding:12px">${tier}</td>
    </tr>
    <tr>
      <td style="padding:12px">Precio base</td>
      <td style="padding:12px">$${basePrice} USD</td>
    </tr>
  </table>
  <p>Si tienes preguntas, responde a este email.</p>
  <p>— AWA 3D Studio</p>
</div>`;

  const [emailRes, internalRes] = await Promise.allSettled([
    sendEmail(env, {
      to: leadEmail,
      subject: `Cotización ${quoteId} — AWA 3D Studio`,
      html: emailHtml,
    }),
    sendEmail(env, {
      to: INBOX,
      subject: `[COTIZACIÓN ENVIADA] ${leadName} — ${quoteId}`,
      html: `<p>Cotización <strong>${quoteId}</strong> enviada a ${leadName} (${leadEmail}).</p><p>Servicio: ${serviceKey} / ${tier} / $${basePrice} USD</p>`,
    }),
  ]);

  return jsonResponse({
    ok: true,
    quoteId,
    filename,
    pricing: { basePrice, finalPrice: basePrice, currency: "USD" },
    results: {
      email: emailRes.status === "fulfilled" ? emailRes.value : { ok: false, error: "rejected" },
      internal: internalRes.status === "fulfilled" ? internalRes.value : { ok: false, error: "rejected" },
      notion: { ok: false, skipped: true, error: "Notion update not implemented in mirror (use primary)" },
      schema: { ok: true, note: "Schema already configured in primary" },
    },
    note: "Mirror Worker — PDF generation not available, plain email only",
  }, 200, origin);
}

// ============= FOLLOWUP CRON (simplified) =============
async function handleCronFollowup(env, request, origin) {
  const authHeader = request.headers.get("Authorization") || "";
  const token = authHeader.replace("Bearer ", "");
  if (!env.CRON_SECRET || token !== env.CRON_SECRET) {
    return jsonResponse({ ok: false, error: "Unauthorized" }, 401, origin);
  }

  // For mirror: just acknowledge and report back to caller
  // (Actual follow-up logic queries Notion and sends emails — too complex for mirror;
  // the primary Cloudflare Pages handles the real cron via cron-job.org)
  return jsonResponse({
    ok: true,
    timestamp: new Date().toISOString(),
    source: "mirror-worker",
    summary: {
      totalLeads: 0,
      day3Sent: 0,
      day7Sent: 0,
      day14Sent: 0,
      skipped: 0,
    },
    note: "Mirror Worker cron endpoint. Primary cron runs on Cloudflare Pages via cron-job.org.",
  }, 200, origin);
}

// ============= MAIN HANDLER =============
const worker = {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const origin = request.headers.get("Origin") || "";

    // CORS preflight
    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: corsHeaders(origin) });
    }

    // Health check
    if (url.pathname === "/" || url.pathname === "/health") {
      return jsonResponse({
        ok: true,
        service: "awa3d-mirror-worker",
        version: "1.0.0",
        timestamp: new Date().toISOString(),
        endpoints: ["/api/contact", "/api/enroll", "/api/quote", "/api/cron/followup"],
      }, 200, origin);
    }

    // ============= /api/contact =============
    if (url.pathname === "/api/contact") {
      if (request.method === "GET") {
        return jsonResponse({
          ok: true,
          endpoint: "/api/contact",
          methods: ["POST"],
          description: "AWA 3D Studio lead capture endpoint (mirror worker)",
        }, 200, origin);
      }
      if (request.method !== "POST") {
        return jsonResponse({ ok: false, error: "Method not allowed" }, 405, origin);
      }
      try {
        const input = await request.json();
        const result = await processLead(env, input, request, { source: "contact" });
        return jsonResponse(result, result.status, origin);
      } catch (err) {
        return jsonResponse({ ok: false, error: String(err) }, 500, origin);
      }
    }

    // ============= /api/enroll =============
    if (url.pathname === "/api/enroll") {
      if (request.method === "GET") {
        return jsonResponse({
          ok: true,
          endpoint: "/api/enroll",
          methods: ["POST"],
          description: "AWA 3D Studio course enrollment endpoint (mirror worker)",
          features: [
            "Sends detailed mentorship plan email based on courseId",
            "Supported courseIds: basic, intermediate, advanced, master",
            "Falls back to generic enroll template if courseId is missing",
          ],
        }, 200, origin);
      }
      if (request.method !== "POST") {
        return jsonResponse({ ok: false, error: "Method not allowed" }, 405, origin);
      }
      try {
        const input = await request.json();
        // Extract course metadata from explicit fields or fallback to service-string parsing
        const courseId = typeof input.courseId === "string" ? input.courseId : undefined;
        const courseName = typeof input.courseName === "string"
          ? input.courseName
          : (input.service || "Curso").replace(/^Inscripción curso:\s*/, "");
        const courseTagline = typeof input.courseTagline === "string" ? input.courseTagline : undefined;
        const coursePriceNum = typeof input.coursePrice === "number" && isFinite(input.coursePrice) ? input.coursePrice : undefined;
        const courseCurrency = typeof input.courseCurrency === "string" ? input.courseCurrency : undefined;
        const courseRegion = typeof input.courseRegion === "string" ? input.courseRegion : undefined;
        const coursePrice = coursePriceNum !== undefined
          ? `${coursePriceNum} ${courseCurrency || "USD"}`
          : undefined;

        const result = await processLead(env, input, request, {
          source: "course",
          courseName,
          courseId,
          courseTagline,
          coursePrice,
          courseRegion,
        });
        return jsonResponse(result, result.status, origin);
      } catch (err) {
        return jsonResponse({ ok: false, error: String(err) }, 500, origin);
      }
    }

    // ============= /api/quote =============
    if (url.pathname === "/api/quote") {
      if (request.method === "GET") {
        return jsonResponse({
          ok: true,
          endpoint: "/api/quote",
          description: "Genera cotización + envía email (mirror)",
          methods: ["POST"],
          auth: "Bearer token required",
        }, 200, origin);
      }
      return handleQuote(env, request, origin);
    }

    // ============= /api/cron/followup =============
    if (url.pathname === "/api/cron/followup") {
      return handleCronFollowup(env, request, origin);
    }

    // ============= 404 =============
    return jsonResponse({
      ok: false,
      error: "Not found",
      path: url.pathname,
      availableEndpoints: ["/api/contact", "/api/enroll", "/api/quote", "/api/cron/followup"],
    }, 404, origin);
  },

  // ============= CRON TRIGGER =============
  // Scheduled event (configured in wrangler.toml)
  async scheduled(event, env, ctx) {
    // Call itself to trigger follow-up logic
    try {
      const baseUrl = `https://awa3d-mirror.dashiellyeneri.workers.dev`;
      await fetch(`${baseUrl}/api/cron/followup`, {
        method: "GET",
        headers: { Authorization: `Bearer ${env.CRON_SECRET}` },
      });
    } catch (err) {
      console.error("Cron trigger failed:", err);
    }
  },
};

export default worker;
