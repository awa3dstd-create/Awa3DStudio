/**
 * Shared lead-capture logic for /api/contact and /api/enroll.
 *
 * Both endpoints accept the same shape (name/email/phone/service/message)
 * and differ only in `source` and which auto-response template is used.
 *
 * For `source: "course"`, the caller may pass extra fields (courseId,
 * courseName, courseTagline, coursePrice, courseCurrency, courseRegion) that
 * trigger the detailed mentorship plan email instead of the generic one.
 */

import { sendEmail, sendEmailSmart, canSendDirectly } from "@/lib/email";
import { createLeadInNotion } from "@/lib/notion";
import { sendTelegramMessage } from "@/lib/telegram";
import {
  autoResponseContactHtml,
  autoResponseEnrollHtml,
  coursePlanHtmlFor,
  notificationHtml,
  telegramMessage,
  forwardReadyWrapper,
  type LeadRecord,
} from "@/lib/templates";
import {
  COURSE_TIERS,
  SOFTWARE_REGISTRY,
  type SoftwareKey,
} from "@/components/awa/data";

const INBOX = "awa3dstd@gmail.com";

export interface IncomingLead {
  name?: unknown;
  email?: unknown;
  phone?: unknown;
  service?: unknown;
  message?: unknown;
  // Course-enrollment extras (optional, only used when source="course")
  courseId?: unknown;
  courseName?: unknown;
  courseTagline?: unknown;
  coursePrice?: unknown;
  courseCurrency?: unknown;
  courseRegion?: unknown;
}

export interface ProcessResult {
  ok: boolean;
  status: number;
  results: {
    autoResponse: Awaited<ReturnType<typeof sendEmail>>;
    internal: Awaited<ReturnType<typeof sendEmail>>;
    notion: Awaited<ReturnType<typeof createLeadInNotion>>;
    telegram: Awaited<ReturnType<typeof sendTelegramMessage>>;
  };
  // The plan HTML that was emailed to the lead. Returned to the API caller
  // so the front-end can display it as a fallback when email delivery fails
  // (e.g. Gmail filtering `onboarding@resend.dev` in trial mode).
  planHtml?: string;
  planSubject?: string;
  // True when the auto-response email was delivered directly to the lead's
  // inbox (Brevo configured OR Resend not in trial mode). False when only
  // Resend trial is available — email goes to studio inbox with
  // [REENVIAR A X] wrapper for manual forwarding.
  directDelivery?: boolean;
  trialMode?: boolean;
  leadEmail?: string;
}

export function validateLead(input: IncomingLead): {
  ok: boolean;
  error?: string;
  data?: LeadRecord;
} {
  const name = typeof input.name === "string" ? input.name.trim() : "";
  const email = typeof input.email === "string" ? input.email.trim() : "";
  const phone = typeof input.phone === "string" ? input.phone.trim() : "";
  const service = typeof input.service === "string" ? input.service.trim() : "";
  const message = typeof input.message === "string" ? input.message.trim() : "";

  if (!name || !email || !message) {
    return { ok: false, error: "Faltan campos obligatorios (name, email, message)" };
  }
  // basic email sanity
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { ok: false, error: "Email inválido" };
  }
  // length guards
  if (name.length > 200 || email.length > 200 || message.length > 5000) {
    return { ok: false, error: "Campo demasiado largo" };
  }

  return {
    ok: true,
    data: { name, email, phone: phone || undefined, service: service || undefined, message, source: "contact" },
  };
}

/**
 * Process a lead end-to-end.
 * `source` and `courseName` customize the auto-response template.
 *
 * For `source: "course"`, if `courseId` is provided, the detailed mentorship
 * plan email is sent instead of the generic "Recibimos tu inscripción" template.
 */
export async function processLead(
  input: IncomingLead,
  req: Request,
  opts: {
    source: "contact" | "course";
    courseName?: string;
    courseId?: string;
    courseTagline?: string;
    coursePrice?: string; // pre-formatted string, e.g. "$25 USD"
    courseRegion?: string;
  }
): Promise<ProcessResult> {
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

  // Detect country from Cloudflare request headers
  const country = req.headers.get("cf-ipcountry") || "Unknown";
  const ip = req.headers.get("cf-connecting-ip") || "Unknown";

  const lead: LeadRecord = {
    ...validation.data,
    source: opts.source,
    country,
    ip,
  };

  // Pick the auto-response HTML:
  // - course + courseId → detailed mentorship plan
  // - course (no courseId) → generic enroll template
  // - contact → contact template
  const hasCoursePlan = opts.source === "course" && opts.courseId && opts.courseName;

  // Resolve the course tier from COURSE_TIERS so we can pull the `software` array
  // and inject it into the plan email (v4 — 2026-08-15).
  const courseTier = opts.courseId
    ? COURSE_TIERS.find((c) => c.id === opts.courseId) || null
    : null;
  const courseSoftware = courseTier?.software
    ? courseTier.software
        .map((k: SoftwareKey) => {
          const sw = SOFTWARE_REGISTRY[k];
          return sw ? { name: sw.name, vendor: sw.vendor } : null;
        })
        .filter((x): x is { name: string; vendor: string } => x !== null)
    : [];

  const autoResponseHtml = hasCoursePlan
    ? coursePlanHtmlFor(opts.courseId!, {
        name: lead.name,
        courseName: opts.courseName!,
        courseTagline: opts.courseTagline || "",
        price: opts.coursePrice || "",
        region: opts.courseRegion || "",
        software: courseSoftware,
      })
    : opts.source === "course" && opts.courseName
      ? autoResponseEnrollHtml(lead.name, opts.courseName)
      : autoResponseContactHtml(lead.name);

  // Decide whether we can deliver directly to the lead's email.
  // - Brevo configured → can send to ANY email
  // - Resend not in trial mode → can send to ANY email
  // - Otherwise → must wrap and send to studio inbox for manual forwarding
  const canDirect = canSendDirectly();
  const trial = !canDirect; // legacy alias for backward compat

  const autoResponseSubject = hasCoursePlan
    ? `Plan de mentoría — ${opts.courseName} · AWA 3D Studio`
    : opts.source === "course"
      ? `Inscripción recibida — AWA 3D Studio`
      : "Recibimos tu solicitud — AWA 3D Studio";

  const autoResponsePayload = canDirect
    ? {
        // Direct delivery to the lead's inbox (Brevo or non-trial Resend)
        to: lead.email,
        subject: autoResponseSubject,
        html: autoResponseHtml,
        replyTo: INBOX,
      }
    : {
        // Trial mode only — send to studio inbox wrapped in forward banner
        to: INBOX,
        subject: `[REENVIAR A ${lead.email}] ${autoResponseSubject}`,
        html: forwardReadyWrapper({
          leadEmail: lead.email,
          leadName: lead.name,
          innerHtml: autoResponseHtml,
        }),
        replyTo: INBOX,
      };

  // Fire all 4 in parallel — Promise.allSettled so one failure doesn't break the rest
  // - Auto-response uses sendEmailSmart (tries Brevo first, falls back to Resend)
  //   so it can deliver to ANY recipient when Brevo is configured.
  // - Internal notification uses sendEmail (Resend) since it always goes to
  //   the studio inbox, which Resend trial mode can deliver to.
  const [autoRes, internalRes, notionRes, telegramRes] = await Promise.allSettled([
    sendEmailSmart(autoResponsePayload),
    sendEmail({
      to: INBOX,
      subject:
        opts.source === "course"
          ? `Nueva inscripción: ${lead.name} — ${opts.courseName || "Curso"}`
          : `Nuevo lead: ${lead.name} — ${lead.service || "Sin servicio especificado"}`,
      html: notificationHtml(lead),
    }),
    createLeadInNotion({ ...lead }),
    sendTelegramMessage(telegramMessage(lead)),
  ]);

  const pick = <T>(p: PromiseSettledResult<T>, fallback: T): T =>
    p.status === "fulfilled" ? p.value : fallback;

  const results = {
    autoResponse: pick(autoRes, { ok: false, error: "Promise rejected" }),
    internal: pick(internalRes, { ok: false, error: "Promise rejected" }),
    notion: pick(notionRes, { ok: false, error: "Promise rejected" }),
    telegram: pick(telegramRes, { ok: false, error: "Promise rejected" }),
  };

  // Log failures for debugging (don't fail the request)
  (["autoResponse", "internal", "notion", "telegram"] as const).forEach((k) => {
    const r = results[k];
    if (!r.ok && !r.skipped) {
      console.error(`[processLead] ${k} failed:`, r.error);
    }
  });

  // The HTTP response is ok:true as long as the request was valid.
  // Individual failures are surfaced in `results` for transparency.
  // directDelivery: true when the auto-response email actually reached the
  // lead's inbox (via Brevo or non-trial Resend).
  const directDelivery = canDirect && results.autoResponse.ok;
  return {
    ok: true,
    status: 200,
    results,
    // Include the plan HTML in the response so the front-end can display it
    // as a fallback when email delivery fails. This is critical because
    // Resend trial mode uses `onboarding@resend.dev` which Gmail often
    // filters to spam or blocks entirely.
    planHtml: autoResponseHtml,
    planSubject: autoResponseSubject,
    directDelivery,
    trialMode: trial,
    leadEmail: lead.email,
  };
}
