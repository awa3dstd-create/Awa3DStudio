/**
 * HTML email templates for the contact + enrollment flows.
 *
 * Design language mirrors the site:
 *   - bg #0a0a0f, card #0f0f17, border #1e1e2a
 *   - text #e4e4e7 / muted #a1a1aa / dim #71717a
 *   - accent #00c8b4 (teal)
 */

const SHELL = (inner: string) => `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>AWA 3D Studio</title>
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

// ---------- Contact: auto-response to the lead ----------
export function autoResponseContactHtml(name: string): string {
  return SHELL(`
    <h1 style="color:#ffffff;font-size:24px;font-weight:600;margin:0 0 24px;">
      Hola ${escapeHtml(name)},
    </h1>
    <p style="color:#a1a1aa;font-size:16px;line-height:1.6;margin:0 0 16px;">
      Recibimos tu solicitud y te agradecemos por considerarnos para tu proyecto.
    </p>
    <p style="color:#a1a1aa;font-size:16px;line-height:1.6;margin:0 0 16px;">
      Nuestro equipo revisará tu mensaje y te responderá en menos de
      <strong style="color:#00c8b4;">24 horas</strong> con una propuesta preliminar.
    </p>
    <p style="color:#a1a1aa;font-size:16px;line-height:1.6;margin:0 0 32px;">
      Si tienes alguna pregunta urgente, puedes escribirnos directamente a
      <a href="mailto:awa3dstd@gmail.com" style="color:#00c8b4;text-decoration:none;">awa3dstd@gmail.com</a>.
    </p>
  `);
}

// ---------- Enrollment: auto-response to the student ----------
export function autoResponseEnrollHtml(
  name: string,
  courseName: string
): string {
  return SHELL(`
    <h1 style="color:#ffffff;font-size:24px;font-weight:600;margin:0 0 24px;">
      Hola ${escapeHtml(name)},
    </h1>
    <p style="color:#a1a1aa;font-size:16px;line-height:1.6;margin:0 0 16px;">
      Recibimos tu inscripción al curso
      <strong style="color:#00c8b4;">${escapeHtml(courseName)}</strong>.
    </p>
    <p style="color:#a1a1aa;font-size:16px;line-height:1.6;margin:0 0 16px;">
      Te enviaremos en las próximas
      <strong style="color:#00c8b4;">24 horas</strong>
      los pasos de pago y los detalles de acceso al curso.
    </p>
    <p style="color:#a1a1aa;font-size:16px;line-height:1.6;margin:0 0 32px;">
      Si tienes alguna pregunta, escríbenos a
      <a href="mailto:awa3dstd@gmail.com" style="color:#00c8b4;text-decoration:none;">awa3dstd@gmail.com</a>.
    </p>
  `);
}

// ---------- Internal: notification to awa3dstd@gmail.com ----------
export interface LeadRecord {
  name: string;
  email: string;
  phone?: string;
  service?: string;
  message: string;
  source: "contact" | "course";
  country?: string;
  ip?: string;
}

export function notificationHtml(lead: LeadRecord): string {
  const rows = [
    ["Nombre", lead.name],
    ["Email", `<a href="mailto:${escapeHtml(lead.email)}" style="color:#00c8b4;">${escapeHtml(lead.email)}</a>`],
    ["Teléfono", lead.phone || "—"],
    ["Servicio", lead.service || "—"],
    ["País", lead.country || "—"],
    ["IP", lead.ip || "—"],
    ["Origen", lead.source === "course" ? "Inscripción curso" : "Formulario contacto"],
  ];

  return SHELL(`
    <h1 style="color:#00c8b4;font-size:20px;margin:0 0 24px;">
      ${lead.source === "course" ? "Nueva inscripción" : "Nuevo lead recibido"}
    </h1>
    <table style="width:100%;font-size:14px;line-height:1.6;border-collapse:collapse;">
      ${rows
        .map(
          ([k, v]) =>
            `<tr><td style="color:#71717a;padding:4px 16px 4px 0;width:120px;vertical-align:top;">${escapeHtml(
              k
            )}:</td><td style="color:#ffffff;">${v}</td></tr>`
        )
        .join("")}
    </table>
    <h2 style="color:#71717a;font-size:13px;text-transform:uppercase;letter-spacing:0.1em;margin:32px 0 8px;">
      Mensaje
    </h2>
    <p style="color:#ffffff;font-size:14px;line-height:1.6;background:#0f0f17;padding:16px;border-radius:6px;border:1px solid #1e1e2a;white-space:pre-wrap;">${escapeHtml(
      lead.message
    )}</p>
  `);
}

// ---------- Telegram: compact notification ----------
export function telegramMessage(lead: LeadRecord): string {
  const emoji = lead.source === "course" ? "🎓" : "🟢";
  const label = lead.source === "course" ? "Nueva inscripción" : "Nuevo lead";
  return (
    `${emoji} <b>${label}</b>\n\n` +
    `<b>Nombre:</b> ${escapeHtml(lead.name)}\n` +
    `<b>Email:</b> ${escapeHtml(lead.email)}\n` +
    `<b>Teléfono:</b> ${escapeHtml(lead.phone || "—")}\n` +
    `<b>Servicio:</b> ${escapeHtml(lead.service || "—")}\n` +
    `<b>País:</b> ${escapeHtml(lead.country || "—")}\n\n` +
    `<b>Mensaje:</b>\n${escapeHtml(lead.message.slice(0, 500))}`
  );
}

// ---------- Quote email body (PDF goes as attachment) ----------
export interface QuoteEmailData {
  leadName: string;
  serviceName: string;
  tierLabel: string;
  totalPrice: number;
  currency?: string;
  validUntil: string; // formatted dd/mm/yyyy
  quoteId: string;
}

export function quoteEmailHtml(q: QuoteEmailData): string {
  return SHELL(`
    <h1 style="color:#ffffff;font-size:22px;font-weight:600;margin:0 0 24px;">
      Hola ${escapeHtml(q.leadName)},
    </h1>
    <p style="color:#a1a1aa;font-size:16px;line-height:1.6;margin:0 0 16px;">
      Adjuntamos la cotización para tu proyecto de
      <strong style="color:#00c8b4;">${escapeHtml(q.serviceName)} — ${escapeHtml(
    q.tierLabel
  )}</strong>.
    </p>
    <p style="color:#a1a1aa;font-size:16px;line-height:1.6;margin:0 0 16px;">
      El documento PDF adjunto contiene el detalle completo del alcance,
      los entregables, el plazo de entrega y los métodos de pago.
    </p>
    <div style="background:#0f0f17;border:1px solid #1e1e2a;border-radius:8px;padding:20px;margin:24px 0;">
      <p style="margin:0 0 8px;color:#71717a;font-size:12px;text-transform:uppercase;letter-spacing:0.1em;">Inversión total</p>
      <p style="margin:0 0 16px;color:#00c8b4;font-size:28px;font-weight:700;">$${q.totalPrice.toFixed(2)} ${q.currency || "USD"}</p>
      <p style="margin:0;color:#71717a;font-size:13px;">
        Cotización N° ${escapeHtml(q.quoteId)} · Válida hasta ${escapeHtml(q.validUntil)}
      </p>
    </div>
    <p style="color:#a1a1aa;font-size:16px;line-height:1.6;margin:0 0 16px;">
      Para confirmar el proyecto o resolver cualquier duda, responde a este correo
      o escríbenos a
      <a href="mailto:awa3dstd@gmail.com" style="color:#00c8b4;text-decoration:none;">awa3dstd@gmail.com</a>.
    </p>
    <p style="color:#a1a1aa;font-size:16px;line-height:1.6;margin:0 0 32px;">
      Quedamos a la espera de tus comentarios.
    </p>
  `);
}

// ---------- Follow-up email templates (Day 3, 7, 14) ----------
export interface FollowUpEmailData {
  leadName: string;
  quoteId: string;
  serviceName?: string;
}

export function followUpDay3Html(d: FollowUpEmailData): string {
  return SHELL(`
    <h1 style="color:#ffffff;font-size:22px;font-weight:600;margin:0 0 24px;">
      Hola ${escapeHtml(d.leadName)},
    </h1>
    <p style="color:#a1a1aa;font-size:16px;line-height:1.6;margin:0 0 16px;">
      Te escribimos para confirmar que recibiste nuestra cotización
      ${d.serviceName ? `para el proyecto de <strong style="color:#00c8b4;">${escapeHtml(d.serviceName)}</strong>` : ""}
      (N° ${escapeHtml(d.quoteId)}).
    </p>
    <p style="color:#a1a1aa;font-size:16px;line-height:1.6;margin:0 0 16px;">
      ¿Tuviste chance de revisarla? Si necesitas alguna aclaración sobre el alcance,
      los entregables o el plazo, estamos disponibles para conversarlo.
    </p>
    <p style="color:#a1a1aa;font-size:16px;line-height:1.6;margin:0 0 32px;">
      Responde a este correo o escríbenos a
      <a href="mailto:awa3dstd@gmail.com" style="color:#00c8b4;text-decoration:none;">awa3dstd@gmail.com</a>.
    </p>
  `);
}

export function followUpDay7Html(d: FollowUpEmailData): string {
  return SHELL(`
    <h1 style="color:#ffffff;font-size:22px;font-weight:600;margin:0 0 24px;">
      Hola ${escapeHtml(d.leadName)},
    </h1>
    <p style="color:#a1a1aa;font-size:16px;line-height:1.6;margin:0 0 16px;">
      Hace una semana te enviamos la cotización N° ${escapeHtml(d.quoteId)}
      ${d.serviceName ? `para tu proyecto de ${escapeHtml(d.serviceName)}` : ""}.
      No queremos ser insistente — solo queríamos asegurarnos de que no se haya
      pasado por alto.
    </p>
    <p style="color:#a1a1aa;font-size:16px;line-height:1.6;margin:0 0 16px;">
      Si el proyecto sigue de tu interés, podemos ajustar el alcance o el presupuesto
      para que se ajuste mejor a tus necesidades. Y si ya no aplica, también
      avísanos para no seguir escribiendo.
    </p>
    <p style="color:#a1a1aa;font-size:16px;line-height:1.6;margin:0 0 32px;">
      Quedamos atentos a tu respuesta en
      <a href="mailto:awa3dstd@gmail.com" style="color:#00c8b4;text-decoration:none;">awa3dstd@gmail.com</a>.
    </p>
  `);
}

export function followUpDay14Html(d: FollowUpEmailData): string {
  return SHELL(`
    <h1 style="color:#ffffff;font-size:22px;font-weight:600;margin:0 0 24px;">
      Hola ${escapeHtml(d.leadName)},
    </h1>
    <p style="color:#a1a1aa;font-size:16px;line-height:1.6;margin:0 0 16px;">
      No hemos recibido respuesta sobre la cotización N° ${escapeHtml(d.quoteId)}
      después de dos semanas, así que la marcaremos como inactiva en nuestro sistema.
    </p>
    <p style="color:#a1a1aa;font-size:16px;line-height:1.6;margin:0 0 16px;">
      Si en el futuro retomas el proyecto, escríbenos y retomamos la conversación
      desde donde la dejamos — sin necesidad de repetir todo el proceso.
    </p>
    <p style="color:#a1a1aa;font-size:16px;line-height:1.6;margin:0 0 32px;">
      Te agradecemos por considerarnos. Un saludo del equipo de
      <strong style="color:#00c8b4;">AWA 3D Studio</strong>.
    </p>
  `);
}

// ---------- Internal: quote-sent notification to studio ----------
export function quoteSentInternalHtml(
  leadName: string,
  leadEmail: string,
  serviceName: string,
  tierLabel: string,
  price: number,
  quoteId: string
): string {
  return SHELL(`
    <h1 style="color:#00c8b4;font-size:20px;margin:0 0 24px;">Cotización enviada</h1>
    <table style="width:100%;font-size:14px;line-height:1.6;border-collapse:collapse;">
      <tr><td style="color:#71717a;padding:4px 16px 4px 0;width:120px;">Lead:</td><td style="color:#ffffff;">${escapeHtml(leadName)}</td></tr>
      <tr><td style="color:#71717a;padding:4px 16px 4px 0;">Email:</td><td style="color:#ffffff;"><a href="mailto:${escapeHtml(leadEmail)}" style="color:#00c8b4;">${escapeHtml(leadEmail)}</a></td></tr>
      <tr><td style="color:#71717a;padding:4px 16px 4px 0;">Servicio:</td><td style="color:#ffffff;">${escapeHtml(serviceName)} — ${escapeHtml(tierLabel)}</td></tr>
      <tr><td style="color:#71717a;padding:4px 16px 4px 0;">Precio:</td><td style="color:#00c8b4;font-weight:700;">$${price.toFixed(2)} USD</td></tr>
      <tr><td style="color:#71717a;padding:4px 16px 4px 0;">N° Cotización:</td><td style="color:#ffffff;">${escapeHtml(quoteId)}</td></tr>
    </table>
    <p style="color:#a1a1aa;font-size:14px;line-height:1.6;margin-top:24px;">
      El sistema de follow-up automático está activo: se enviarán recordatorios
      a los 3, 7 y 14 días si no hay respuesta.
    </p>
  `);
}

// ---------- Forward-ready wrappers (trial mode) ----------
// These wrap a "client-facing" email body with a banner that tells the studio
// "this is the email you should forward to the lead", so they can hit
// "Reenviar" / "Forward" in their email client and just paste the lead's address.

export interface ForwardReadyData {
  leadEmail: string;
  leadName: string;
  innerHtml: string; // the actual client-facing email body
  attachmentsNote?: string; // e.g. "PDF adjunto: Cotizacion_AWA3D_xxx.pdf"
}

export function forwardReadyWrapper(d: ForwardReadyData): string {
  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>Para reenviar a ${escapeHtml(d.leadEmail)}</title>
</head>
<body style="margin:0;padding:0;background:#0a0a0f;font-family:ui-sans-serif,system-ui,-apple-system,Segoe UI,Roboto,sans-serif;color:#e4e4e7;">
  <div style="max-width:560px;margin:0 auto;padding:48px 24px;">

    <!-- Forward-ready banner -->
    <div style="background:#1a1a2e;border:2px solid #00c8b4;border-radius:8px;padding:20px;margin-bottom:32px;">
      <p style="margin:0 0 12px;color:#00c8b4;font-size:14px;font-weight:700;letter-spacing:0.05em;text-transform:uppercase;">
        📧 Correo para reenviar manualmente
      </p>
      <p style="margin:0 0 8px;color:#ffffff;font-size:14px;line-height:1.6;">
        <strong>Para:</strong> ${escapeHtml(d.leadEmail)}
      </p>
      <p style="margin:0 0 16px;color:#a1a1aa;font-size:13px;line-height:1.5;">
        Este correo llegó a tu bandeja porque el sistema está en modo trial
        (sin dominio verificado en Resend). Para entregarlo al lead:
      </p>
      <ol style="margin:0 0 16px 0;padding-left:20px;color:#a1a1aa;font-size:13px;line-height:1.7;">
        <li>Abre este correo en tu cliente de email (Gmail, Outlook, etc.)</li>
        <li>Haz click en <strong style="color:#00c8b4;">Reenviar</strong> (o "Forward")</li>
        <li>En el campo <strong>Para:</strong> pega <strong style="color:#ffffff;">${escapeHtml(d.leadEmail)}</strong></li>
        <li>Borra el banner verde de arriba (este bloque)</li>
        <li>Envía${d.attachmentsNote ? ` — el PDF ya va adjunto: <strong style="color:#ffffff;">${escapeHtml(d.attachmentsNote)}</strong>` : ""}</li>
      </ol>
      <p style="margin:0;color:#71717a;font-size:12px;line-height:1.4;">
        Cuando verifiques tu dominio en Resend, este paso deja de ser necesario
        y el sistema envía directo al lead automáticamente.
      </p>
    </div>

    <!-- Divider -->
    <hr style="border:none;border-top:1px dashed #1e1e2a;margin:0 0 32px 0;">

    <!-- Actual client-facing email body (will appear after the user deletes the banner) -->
    ${d.innerHtml}

  </div>
</body>
</html>`;
}

// ---------- Helpers ----------
function escapeHtml(s: string): string {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
