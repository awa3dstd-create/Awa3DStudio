/**
 * Telegram Bot API helper for real-time lead notifications.
 * Docs: https://core.telegram.org/bots/api#sendmessage
 *
 * Env vars:
 *   TELEGRAM_BOT_TOKEN  — from @BotFather
 *   TELEGRAM_CHAT_ID    — chat where the bot will post (group or DM id)
 *
 * If env vars are not set, the function returns { ok: false, skipped: true }
 * so the API route can degrade gracefully.
 */

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;

export interface TelegramResult {
  ok: boolean;
  error?: string;
  skipped?: boolean;
}

export async function sendTelegramMessage(
  text: string
): Promise<TelegramResult> {
  if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) {
    console.warn("[telegram] env vars not set — skipping");
    return { ok: false, skipped: true, error: "Missing Telegram env vars" };
  }

  try {
    const res = await fetch(
      `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: TELEGRAM_CHAT_ID,
          text,
          parse_mode: "HTML",
          disable_web_page_preview: true,
        }),
      }
    );

    if (!res.ok) {
      const errText = await res.text();
      console.error("[telegram] error:", res.status, errText);
      return { ok: false, error: `${res.status}: ${errText}` };
    }

    return { ok: true };
  } catch (err) {
    console.error("[telegram] sendTelegramMessage exception:", err);
    return { ok: false, error: String(err) };
  }
}
