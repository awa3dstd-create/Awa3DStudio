/**
 * Resend email helper.
 * Docs: https://resend.com/docs/api-reference/emails/send-email
 *
 * Env vars:
 *   RESEND_API_KEY     — required, from https://resend.com/api-keys
 *   RESEND_FROM_EMAIL  — optional, defaults to "onboarding@resend.dev" (testing only)
 *
 * IMPORTANT: "onboarding@resend.dev" can ONLY send to the email associated with the
 * Resend account (awa3dstd@gmail.com). For production auto-response to leads,
 * verify awa3dstudio.com in https://resend.com/domains and set:
 *   RESEND_FROM_EMAIL=AWA 3D Studio <noreply@awa3dstudio.com>
 */

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const RESEND_FROM_EMAIL =
  process.env.RESEND_FROM_EMAIL || "AWA 3D Studio <onboarding@resend.dev>";

/**
 * Trial-mode detector.
 *
 * When `RESEND_FROM_EMAIL` is the default `onboarding@resend.dev`,
 * Resend only allows sending to the account owner's email (awa3dstd@gmail.com).
 * In that case, the API routes switch to "forward-ready" mode: instead of
 * trying to email the lead directly (which would fail with 403), they send
 * a wrapped copy to the inbox that the studio can manually forward.
 *
 * Once the user verifies a custom domain in Resend and sets
 * `RESEND_FROM_EMAIL=AWA 3D Studio <noreply@awa3dstudio.com>`,
 * `isTrialMode()` returns false and the system goes back to direct delivery.
 */
export function isTrialMode(): boolean {
  const from = (process.env.RESEND_FROM_EMAIL || "").toLowerCase();
  return from.includes("onboarding@resend.dev");
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
}

export async function sendEmail({
  to,
  subject,
  html,
  replyTo,
  attachments,
}: EmailParams): Promise<EmailResult> {
  if (!RESEND_API_KEY) {
    console.warn("[email] RESEND_API_KEY not set — skipping email send");
    return { ok: false, skipped: true, error: "Missing RESEND_API_KEY" };
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
      return { ok: false, error: `${res.status}: ${errorText}` };
    }

    const data = await res.json();
    return { ok: true, id: data.id };
  } catch (err) {
    console.error("[email] sendEmail exception:", err);
    return { ok: false, error: String(err) };
  }
}
