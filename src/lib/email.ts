/**
 * Email helper with Brevo + Resend fallback.
 *
 * Strategy:
 *   1. If BREVO_API_KEY is set → try Brevo first (can send to ANY recipient)
 *   2. Otherwise → use Resend (which in trial mode can ONLY send to the
 *      account owner's email, awa3dstd@gmail.com)
 *
 * Brevo free tier allows sending 300 emails/day FROM a verified sender
 * email (awa3dstd@gmail.com) TO any recipient — perfect for delivering
 * the mentorship plan directly to the client's inbox without needing
 * to buy/verify a custom domain.
 *
 * Docs:
 *   - Brevo: https://developers.brevo.com/reference/sendtransacemail
 *   - Resend: https://resend.com/docs/api-reference/emails/send-email
 */

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const RESEND_FROM_EMAIL =
  process.env.RESEND_FROM_EMAIL || "AWA 3D Studio <onboarding@resend.dev>";

const BREVO_API_KEY = process.env.BREVO_API_KEY;
const BREVO_SENDER_EMAIL =
  process.env.BREVO_SENDER_EMAIL || "awa3dstd@gmail.com";
const BREVO_SENDER_NAME =
  process.env.BREVO_SENDER_NAME || "AWA 3D Studio";

/**
 * Trial-mode detector for Resend.
 *
 * When `RESEND_FROM_EMAIL` is the default `onboarding@resend.dev`,
 * Resend only allows sending to the account owner's email (awa3dstd@gmail.com).
 * In that case, the API routes switch to "forward-ready" mode: instead of
 * trying to email the lead directly (which would fail with 403), they send
 * a wrapped copy to the inbox that the studio can manually forward.
 *
 * Once the user verifies a custom domain in Resend and sets
 * `RESEND_FROM_EMAIL=AWA 3D Studio <noreply@awa3dstudio.com>`,
 * `isTrialMode()` returns false and Resend can deliver to anyone.
 *
 * NOTE: `canSendDirectly()` is the master switch — it returns true if
 * EITHER Brevo is configured OR Resend is not in trial mode.
 */
export function isTrialMode(): boolean {
  const from = (process.env.RESEND_FROM_EMAIL || "").toLowerCase();
  return from.includes("onboarding@resend.dev");
}

/**
 * Returns true if we can deliver emails directly to ANY recipient
 * (i.e. not just the studio inbox). This is possible when:
 *   - Brevo is configured (BREVO_API_KEY is set), OR
 *   - Resend is NOT in trial mode (custom domain verified)
 */
export function canSendDirectly(): boolean {
  return !!BREVO_API_KEY || !isTrialMode();
}

export interface EmailAttachment {
  filename: string;
  content: string; // base64-encoded
}

export interface EmailParams {
  to: string | string[];
  subject: string;
  html: string;
  replyTo?: string;
  attachments?: EmailAttachment[];
}

export interface EmailResult {
  ok: boolean;
  id?: string;
  error?: string;
  skipped?: boolean;
  provider?: "brevo" | "resend" | "none";
}

/**
 * Send an email via Brevo (Brevo free tier).
 *
 * Brevo allows sending from a verified sender email (BREVO_SENDER_EMAIL)
 * to ANY recipient — no domain verification required for the sender email
 * (only the sender email itself needs to be confirmed in Brevo's dashboard).
 *
 * API: POST https://api.brevo.com/v3/smtp/email
 * Auth: `api-key` header
 */
export async function sendEmailViaBrevo({
  to,
  subject,
  html,
  replyTo,
  attachments,
}: EmailParams): Promise<EmailResult> {
  if (!BREVO_API_KEY) {
    return { ok: false, skipped: true, error: "Missing BREVO_API_KEY", provider: "none" };
  }

  try {
    const recipients = Array.isArray(to) ? to : [to];
    const payload: Record<string, unknown> = {
      sender: {
        name: BREVO_SENDER_NAME,
        email: BREVO_SENDER_EMAIL,
      },
      to: recipients.map((email) => ({ email })),
      subject,
      htmlContent: html,
    };
    if (replyTo) {
      payload.replyTo = { email: replyTo };
    }
    if (attachments && attachments.length > 0) {
      payload.attachment = attachments.map((a) => ({
        name: a.filename,
        content: a.content,
      }));
    }

    const res = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: {
        "api-key": BREVO_API_KEY,
        "Content-Type": "application/json",
        accept: "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const errorText = await res.text();
      console.error("[email] Brevo error:", res.status, errorText);
      return { ok: false, error: `Brevo ${res.status}: ${errorText}`, provider: "brevo" };
    }

    const data = await res.json().catch(() => ({}));
    return {
      ok: true,
      id: data.messageId || data.id || `brevo-${Date.now()}`,
      provider: "brevo",
    };
  } catch (err) {
    console.error("[email] sendEmailViaBrevo exception:", err);
    return { ok: false, error: String(err), provider: "brevo" };
  }
}

/**
 * Send an email via Resend.
 * Docs: https://resend.com/docs/api-reference/emails/send-email
 *
 * IMPORTANT: "onboarding@resend.dev" can ONLY send to the email associated
 * with the Resend account (awa3dstd@gmail.com). For production auto-response
 * to leads, verify awa3dstudio.com in https://resend.com/domains and set:
 *   RESEND_FROM_EMAIL=AWA 3D Studio <noreply@awa3dstudio.com>
 */
export async function sendEmail({
  to,
  subject,
  html,
  replyTo,
  attachments,
}: EmailParams): Promise<EmailResult> {
  if (!RESEND_API_KEY) {
    console.warn("[email] RESEND_API_KEY not set — skipping email send");
    return { ok: false, skipped: true, error: "Missing RESEND_API_KEY", provider: "none" };
  }

  try {
    const payload: Record<string, unknown> = {
      from: RESEND_FROM_EMAIL,
      to,
      subject,
      html,
    };
    if (replyTo) payload.replyTo = replyTo;
    if (attachments && attachments.length > 0) {
      payload.attachments = attachments.map((a) => ({
        filename: a.filename,
        content: a.content,
      }));
    }

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const errorText = await res.text();
      console.error("[email] Resend error:", res.status, errorText);
      return { ok: false, error: `${res.status}: ${errorText}`, provider: "resend" };
    }

    const data = await res.json();
    return { ok: true, id: data.id, provider: "resend" };
  } catch (err) {
    console.error("[email] sendEmail exception:", err);
    return { ok: false, error: String(err), provider: "resend" };
  }
}

/**
 * Smart email send: tries Brevo first (if configured), falls back to Resend.
 *
 * Use this for the auto-response to clients — it can deliver to ANY email
 * address when Brevo is available. Falls back to Resend trial mode (which
 * only delivers to awa3dstd@gmail.com) when Brevo is not configured.
 */
export async function sendEmailSmart(params: EmailParams): Promise<EmailResult> {
  if (BREVO_API_KEY) {
    const result = await sendEmailViaBrevo(params);
    if (result.ok) return result;
    console.warn(
      "[email] Brevo failed, falling back to Resend:",
      result.error
    );
  }
  return sendEmail(params);
}
