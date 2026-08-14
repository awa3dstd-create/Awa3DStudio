/**
 * CallMeBot WhatsApp API helper for real-time lead notifications.
 *
 * Sends a WhatsApp message to the studio owner's phone via the CallMeBot
 * webhook-style API. Useful for high-priority lead alerts that need to
 * cut through email/Telegram noise.
 *
 * Docs: https://www.callmebot.com/blog/free-api-whatsapp-messages/
 *
 * Env vars (configured in Cloudflare Pages → Settings → Environment variables):
 *   CALLMEBOT_PHONE   — full international phone number with country code,
 *                       no '+', no spaces (e.g. "5351234567" for Cuba)
 *   CALLMEBOT_APIKEY  — API key issued by CallMeBot after authorizing the bot
 *
 * If env vars are not set, the function returns { ok: false, skipped: true }
 * so the API route can degrade gracefully (same pattern as telegram.ts).
 *
 * IMPORTANT: env vars are read at runtime (not build time) by Cloudflare
 * Pages Edge runtime, so they're always fresh — no need for rebuild when
 * rotating credentials.
 */

const CALLMEBOT_PHONE = process.env.CALLMEBOT_PHONE;
const CALLMEBOT_APIKEY = process.env.CALLMEBOT_APIKEY;

export interface WhatsAppResult {
  ok: boolean;
  error?: string;
  skipped?: boolean;
}

/**
 * Send a WhatsApp message via CallMeBot.
 *
 * The CallMeBot API is a simple GET request with query params:
 *   https://api.callmebot.com/whatsapp.php?phone=...&text=...&apikey=...
 *
 * Response body is plain text (not JSON), e.g. "Message successfully queued..."
 * Errors come back as 4xx with a plain-text reason.
 */
export async function sendWhatsAppMessage(
  text: string
): Promise<WhatsAppResult> {
  if (!CALLMEBOT_PHONE || !CALLMEBOT_APIKEY) {
    console.warn("[whatsapp] env vars not set — skipping");
    return { ok: false, skipped: true, error: "Missing CallMeBot env vars" };
  }

  // CallMeBot has a hard limit of ~1000 chars per message; truncate defensively.
  // WhatsApp doesn't render HTML, so we send plain text.
  const safeText = text.length > 980 ? text.slice(0, 977) + "..." : text;

  try {
    const url =
      "https://api.callmebot.com/whatsapp.php" +
      "?phone=" + encodeURIComponent(CALLMEBOT_PHONE) +
      "&apikey=" + encodeURIComponent(CALLMEBOT_APIKEY) +
      "&text=" + encodeURIComponent(safeText);

    const res = await fetch(url, {
      method: "GET",
      // GET with no body — CallMeBot reads everything from the query string.
      headers: { Accept: "text/plain, application/json" },
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error("[whatsapp] CallMeBot error:", res.status, errText);
      return { ok: false, error: `${res.status}: ${errText}` };
    }

    // CallMeBot returns 200 even when the message is queued but not yet
    // delivered. Verify the body indicates success.
    const body = await res.text();
    if (/invalid|error|unauthor/i.test(body)) {
      console.error("[whatsapp] CallMeBot returned error body:", body);
      return { ok: false, error: body };
    }

    return { ok: true };
  } catch (err) {
    console.error("[whatsapp] sendWhatsAppMessage exception:", err);
    return { ok: false, error: String(err) };
  }
}
