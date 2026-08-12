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

  const autoResponseHtml =
    opts.source === "course" && opts.courseName
      ? autoResponseEnrollHtml(lead.name, opts.courseName)
      : autoResponseContactHtml(lead.name);

  const trial = isTrialMode(env);
  const autoResponsePayload = trial
    ? {
        to: INBOX,
        subject:
          opts.source === "course"
            ? `[REENVIAR A ${lead.email}] Inscripción recibida — AWA 3D Studio`
            : `[REENVIAR A ${lead.email}] Recibimos tu solicitud — AWA 3D Studio`,
        html: forwardReadyWrapper({
          leadEmail: lead.email,
          leadName: lead.name,
          innerHtml: autoResponseHtml,
        }),
        replyTo: INBOX,
      }
    : {
        to: lead.email,
        subject:
          opts.source === "course"
            ? `Inscripción recibida — AWA 3D Studio`
            : "Recibimos tu solicitud — AWA 3D Studio",
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

  return { ok: true, status: 200, results };
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
        }, 200, origin);
      }
      if (request.method !== "POST") {
        return jsonResponse({ ok: false, error: "Method not allowed" }, 405, origin);
      }
      try {
        const input = await request.json();
        const courseName = (input.service || "Curso").replace(/^Inscripción curso:\s*/, "");
        const result = await processLead(env, input, request, {
          source: "course",
          courseName,
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
