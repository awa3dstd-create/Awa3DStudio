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

import { sendEmail, isTrialMode } from "@/lib/email";
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

  const autoResponseHtml = hasCoursePlan
    ? coursePlanHtmlFor(opts.courseId!, {
        name: lead.name,
        courseName: opts.courseName!,
        courseTagline: opts.courseTagline || "",
        price: opts.coursePrice || "",
        region: opts.courseRegion || "",
      })
    : opts.source === "course" && opts.courseName
      ? autoResponseEnrollHtml(lead.name, opts.courseName)
      : autoResponseContactHtml(lead.name);

  // In trial mode, route the auto-response to the inbox wrapped in a
  // forward-ready banner instead of trying to send to the lead directly
  // (which would fail with 403 because of Resend's trial restriction).
  const trial = isTrialMode();

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

  // Fire all 4 in parallel — Promise.allSettled so one failure doesn't break the rest
  const [autoRes, internalRes, notionRes, telegramRes] = await Promise.allSettled([
    sendEmail(autoResponsePayload),
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
  return { ok: true, status: 200, results };
}
