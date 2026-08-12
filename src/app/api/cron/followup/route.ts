/**
 * GET /api/cron/followup
 *
 * Cron-triggered endpoint that checks Notion for leads with
 * Status = "Cotización enviada" and sends the appropriate follow-up
 * email based on days elapsed since QuoteSentDate:
 *
 *   Day 3  → "¿Tuviste chance de revisarla?"
 *   Day 7  → "Solo queríamos asegurarnos de que no se haya pasado por alto"
 *   Day 14 → "Marcaremos la cotización como inactiva" + Status → "Rechazado"
 *
 * Auth: CRON_SECRET env var. Send via header:
 *   Authorization: Bearer <CRON_SECRET>
 *
 * Recommended cron schedule: every 12 hours (or daily at 09:00 UTC)
 *
 * External cron trigger options:
 *   - Cloudflare Workers Cron Triggers (free, 5-min granularity)
 *   - cron-job.org (free, 1-min granularity)
 *   - GitHub Actions (free, scheduled workflows)
 *   - Vercel Cron (only if not on Cloudflare)
 */

import { NextResponse } from "next/server";
import { sendEmail } from "@/lib/email";
import {
  getLeadsNeedingFollowUp,
  markFollowUpSent,
} from "@/lib/notion";
import {
  followUpDay3Html,
  followUpDay7Html,
  followUpDay14Html,
} from "@/lib/templates";

export const runtime = "edge";

const INBOX = "awa3dstd@gmail.com";

export async function GET(req: Request) {
  // ===== Auth =====
  const authHeader = req.headers.get("authorization") || "";
  const token = authHeader.replace(/^Bearer\s+/i, "").trim();
  const expected = process.env.CRON_SECRET;
  if (!expected) {
    return NextResponse.json(
      {
        ok: false,
        error:
          "CRON_SECRET not set. Configure it in Cloudflare env vars before invoking this endpoint.",
      },
      { status: 500 }
    );
  }
  if (token !== expected) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  // ===== Query Notion =====
  const query = await getLeadsNeedingFollowUp();
  if (!query.ok || !query.leads) {
    return NextResponse.json(
      { ok: false, error: query.error || "Notion query failed" },
      { status: 502 }
    );
  }

  const now = new Date();
  const processed: Array<{
    pageId: string;
    name: string;
    email: string;
    action: "day3" | "day7" | "day14" | "skipped";
    reason?: string;
  }> = [];

  // ===== Iterate leads =====
  for (const lead of query.leads) {
    if (!lead.quoteSentDate) {
      processed.push({
        pageId: lead.pageId,
        name: lead.name,
        email: lead.email,
        action: "skipped",
        reason: "missing QuoteSentDate",
      });
      continue;
    }

    const daysSinceQuote = Math.floor(
      (now.getTime() - lead.quoteSentDate.getTime()) / (1000 * 60 * 60 * 24)
    );

    // Determine which follow-up to send based on day count + count already sent
    let followUpDay: 3 | 7 | 14 | null = null;
    if (daysSinceQuote >= 14 && lead.followUpCount < 3) {
      followUpDay = 14;
    } else if (daysSinceQuote >= 7 && lead.followUpCount < 2) {
      followUpDay = 7;
    } else if (daysSinceQuote >= 3 && lead.followUpCount < 1) {
      followUpDay = 3;
    }

    if (!followUpDay) {
      processed.push({
        pageId: lead.pageId,
        name: lead.name,
        email: lead.email,
        action: "skipped",
        reason: `no follow-up due (day ${daysSinceQuote}, count ${lead.followUpCount})`,
      });
      continue;
    }

    // ===== Send follow-up email =====
    const quoteId = `Q-${lead.quoteSentDate.getFullYear()}${String(
      lead.quoteSentDate.getMonth() + 1
    ).padStart(2, "0")}${String(lead.quoteSentDate.getDate()).padStart(2, "0")}`;

    const templateData = {
      leadName: lead.name,
      quoteId,
      serviceName: lead.service,
    };

    let html: string;
    let subject: string;
    if (followUpDay === 3) {
      html = followUpDay3Html(templateData);
      subject = "¿Recibiste nuestra cotización?";
    } else if (followUpDay === 7) {
      html = followUpDay7Html(templateData);
      subject = "Seguimiento de tu cotización AWA 3D Studio";
    } else {
      html = followUpDay14Html(templateData);
      subject = "Cierre de cotización — AWA 3D Studio";
    }

    const emailRes = await sendEmail({
      to: lead.email,
      subject,
      html,
      replyTo: INBOX,
    });

    if (!emailRes.ok && !emailRes.skipped) {
      console.error(
        `[followup] email failed for ${lead.email} day ${followUpDay}:`,
        emailRes.error
      );
      processed.push({
        pageId: lead.pageId,
        name: lead.name,
        email: lead.email,
        action: "skipped",
        reason: `email failed: ${emailRes.error}`,
      });
      continue;
    }

    // ===== Update Notion =====
    const notionRes = await markFollowUpSent(lead.pageId, followUpDay);
    if (!notionRes.ok && !notionRes.skipped) {
      console.error(
        `[followup] Notion update failed for ${lead.pageId}:`,
        notionRes.error
      );
    }

    processed.push({
      pageId: lead.pageId,
      name: lead.name,
      email: lead.email,
      action:
        followUpDay === 3 ? "day3" : followUpDay === 7 ? "day7" : "day14",
    });
  }

  // ===== Summary =====
  const summary = {
    totalLeads: query.leads.length,
    day3Sent: processed.filter((p) => p.action === "day3").length,
    day7Sent: processed.filter((p) => p.action === "day7").length,
    day14Sent: processed.filter((p) => p.action === "day14").length,
    skipped: processed.filter((p) => p.action === "skipped").length,
  };

  // ===== Internal notification (optional) =====
  if (summary.day3Sent + summary.day7Sent + summary.day14Sent > 0) {
    await sendEmail({
      to: INBOX,
      subject: `[Cron] Follow-ups enviados — ${summary.day3Sent + summary.day7Sent + summary.day14Sent} leads`,
      html: `<p>Resumen de follow-ups enviados:</p>
        <ul>
          <li>Day 3: ${summary.day3Sent}</li>
          <li>Day 7: ${summary.day7Sent}</li>
          <li>Day 14 (cierre): ${summary.day14Sent}</li>
        </ul>
        <p>Total leads evaluados: ${summary.totalLeads}</p>`,
    }).catch(() => null);
  }

  return NextResponse.json({
    ok: true,
    timestamp: now.toISOString(),
    summary,
    processed,
  });
}

export async function POST(req: Request) {
  // Allow POST too (some cron services prefer POST)
  return GET(req);
}
