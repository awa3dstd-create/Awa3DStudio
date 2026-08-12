/**
 * AWA 3D STUDIO — Cloudflare Worker (API proxy for contact form)
 *
 * Deploy:
 *   wrangler deploy --name awa3d-api-proxy --compatibility-date 2024-11-01
 *
 * Environment variables (set via wrangler secret or dashboard):
 *   - EMAILJS_SERVICE_ID
 *   - EMAILJS_TEMPLATE_ID
 *   - EMAILJS_USER_ID
 *   - RESEND_API_KEY   (alternative)
 *   - ALLOWED_ORIGIN   (https://awa3dstudio.pages.dev)
 *
 * Endpoint:
 *   POST /contact  { name, email, phone, service, message }
 */

const CORS = (origin) => ({
  "Access-Control-Allow-Origin": origin || "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
});

const worker = {
  async fetch(request, env) {
    const origin = request.headers.get("Origin") || env.ALLOWED_ORIGIN || "*";

    if (request.method === "OPTIONS") {
      return new Response(null, { headers: CORS(origin) });
    }

    if (request.method !== "POST") {
      return new Response("Method not allowed", {
        status: 405,
        headers: CORS(origin),
      });
    }

    try {
      const data = await request.json();
      const { name, email, phone, service, message } = data;

      if (!name || !email || !message) {
        return new Response(
          JSON.stringify({ error: "Missing required fields" }),
          {
            status: 400,
            headers: {
              "Content-Type": "application/json",
              ...CORS(origin),
            },
          }
        );
      }

      // Preferred path: Resend
      if (env.RESEND_API_KEY) {
        const res = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${env.RESEND_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            from: "AWA 3D Studio <noreply@awa3dstudio.pages.dev>",
            to: "awa3dstd@gmail.com",
            subject: `Nuevo mensaje de ${name} — ${service || "Contacto"}`,
            reply_to: email,
            html: `
              <h2>Nuevo mensaje desde awa3dstudio.pages.dev</h2>
              <p><strong>Nombre:</strong> ${name}</p>
              <p><strong>Email:</strong> ${email}</p>
              <p><strong>Teléfono:</strong> ${phone || "—"}</p>
              <p><strong>Servicio:</strong> ${service || "—"}</p>
              <hr/>
              <p>${message}</p>
            `,
          }),
        });
        if (!res.ok) {
          const err = await res.text();
          return new Response(
            JSON.stringify({ error: "Email service error", detail: err }),
            { status: 502, headers: { "Content-Type": "application/json", ...CORS(origin) } }
          );
        }
      } else if (env.EMAILJS_USER_ID) {
        // Fallback: EmailJS REST API
        const res = await fetch("https://api.emailjs.com/api/v1.0/email/send", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            service_id: env.EMAILJS_SERVICE_ID,
            template_id: env.EMAILJS_TEMPLATE_ID,
            user_id: env.EMAILJS_USER_ID,
            template_params: { name, email, phone, service, message },
          }),
        });
        if (!res.ok) {
          const err = await res.text();
          return new Response(
            JSON.stringify({ error: "EmailJS error", detail: err }),
            { status: 502, headers: { "Content-Type": "application/json", ...CORS(origin) } }
          );
        }
      } else {
        // No backend configured — log and simulate success in dev
        console.log("[awa3d] No email backend configured. Received:", {
          name,
          email,
          phone,
          service,
          message,
        });
      }

      return new Response(JSON.stringify({ success: true }), {
        headers: { "Content-Type": "application/json", ...CORS(origin) },
      });
    } catch (err) {
      return new Response(
        JSON.stringify({ error: "Server error", detail: String(err) }),
        {
          status: 500,
          headers: { "Content-Type": "application/json", ...CORS(origin) },
        }
      );
    }
  },
};

export default worker;
