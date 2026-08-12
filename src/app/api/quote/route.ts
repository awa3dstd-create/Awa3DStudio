/**
 * POST /api/quote
 *
 * Generates a PDF quote for a lead, sends it via email (PDF attachment),
 * and updates Notion with the new status ("Cotización enviada").
 *
 * Auth: simple bearer token via QUOTE_API_KEY env var (so the route is
 * protected if exposed publicly). Skips auth check in dev if no key is set.
 *
 * Body:
 *   {
 *     leadName: string,
 *     leadEmail: string,
 *     leadCountry?: string,
 *     serviceKey: ServiceKey,
 *     tier: Tier,
 *     notionPageId?: string,  // if set, Notion row will be updated
 *     customPrice?: number,   // override tier price
 *     customScope?: string,   // free-text scope notes added to PDF
 *   }
 *
 * Returns:
 *   200 { ok: true, quoteId, filename, results: { email, notion } }
 *   400 { ok: false, error } validation error
 *   401 { ok: false, error } missing/invalid auth
 */

import { NextResponse } from "next/server";
import { sendEmail, isTrialMode } from "@/lib/email";
import {
  markQuoteSent,
  ensureNotionSchema,
} from "@/lib/notion";
import { generateQuotePdf } from "@/lib/quote-pdf";
import {
  PRICING,
  applyPppDiscount,
  type ServiceKey,
  type Tier,
} from "@/lib/quote-pricing";
import {
  quoteEmailHtml,
  quoteSentInternalHtml,
  forwardReadyWrapper,
} from "@/lib/templates";

export const runtime = "edge";

const INBOX = "awa3dstd@gmail.com";
const VALID_SERVICE_KEYS = new Set<ServiceKey>([
  "interior-render",
  "exterior-render",
  "animation",
  "360-tour",
  "modeling-3d",
  "course",
]);
const VALID_TIERS = new Set<Tier>(["basic", "standard", "premium"]);

export async function POST(req: Request) {
  // ===== Auth =====
  const authHeader = req.headers.get("authorization") || "";
  const token = authHeader.replace(/^Bearer\s+/i, "").trim();
  const expectedToken = process.env.QUOTE_API_KEY;
  if (expectedToken && token !== expectedToken) {
    return NextResponse.json(
      { ok: false, error: "Unauthorized" },
      { status: 401 }
    );
  }

  // ===== Parse body =====
  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { ok: false, error: "Invalid JSON body" },
      { status: 400 }
    );
  }

  const leadName = String(body.leadName || "").trim();
  const leadEmail = String(body.leadEmail || "").trim();
  const leadCountry = body.leadCountry
    ? String(body.leadCountry).trim()
    : undefined;
  const serviceKey = body.serviceKey as ServiceKey;
  const tier = body.tier as Tier;
  const notionPageId = body.notionPageId
    ? String(body.notionPageId)
    : undefined;
  const customPrice =
    typeof body.customPrice === "number" && body.customPrice > 0
      ? body.customPrice
      : undefined;
  const customScope = body.customScope
    ? String(body.customScope).slice(0, 1000)
    : undefined;

  // ===== Validation =====
  if (!leadName || !leadEmail) {
    return NextResponse.json(
      { ok: false, error: "Faltan leadName o leadEmail" },
      { status: 400 }
    );
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(leadEmail)) {
    return NextResponse.json(
      { ok: false, error: "Email inválido" },
      { status: 400 }
    );
  }
  if (!VALID_SERVICE_KEYS.has(serviceKey)) {
    return NextResponse.json(
      {
        ok: false,
        error: `serviceKey inválido. Valores permitidos: ${[...VALID_SERVICE_KEYS].join(", ")}`,
      },
      { status: 400 }
    );
  }
  if (!VALID_TIERS.has(tier)) {
    return NextResponse.json(
      {
        ok: false,
        error: `tier inválido. Valores permitidos: ${[...VALID_TIERS].join(", ")}`,
      },
      { status: 400 }
    );
  }

  // ===== Generate quote ID =====
  const quoteId = generateQuoteId();
  const issueDate = new Date();
  const validUntil = new Date(issueDate);
  validUntil.setDate(validUntil.getDate() + 30);

  // ===== Generate PDF =====
  let pdfBytes: Uint8Array;
  let pdfFilename: string;
  try {
    const pdf = await generateQuotePdf({
      leadName,
      leadEmail,
      leadCountry,
      serviceKey,
      tier,
      quoteId,
      issueDate,
      validUntilDays: 30,
      customScope,
      customPrice,
    });
    pdfBytes = pdf.bytes;
    pdfFilename = pdf.filename;
  } catch (err) {
    console.error("[quote] PDF generation failed:", err);
    return NextResponse.json(
      { ok: false, error: "PDF generation failed" },
      { status: 500 }
    );
  }

  // ===== Pricing =====
  const service = PRICING[serviceKey];
  const tierData = service.tiers[tier];
  const basePrice = customPrice ?? tierData.price;
  const ppp = applyPppDiscount(basePrice, leadCountry);

  // ===== Email body =====
  const validUntilStr = `${String(validUntil.getDate()).padStart(2, "0")}/${String(
    validUntil.getMonth() + 1
  ).padStart(2, "0")}/${validUntil.getFullYear()}`;

  const clientHtml = quoteEmailHtml({
    leadName,
    serviceName: service.label,
    tierLabel: tierData.label,
    totalPrice: ppp.finalPrice,
    validUntil: validUntilStr,
    quoteId,
  });

  // Convert Uint8Array → base64 (edge-safe)
  const pdfBase64 = uint8ToBase64(pdfBytes);

  // ===== Determine recipient strategy =====
  // In trial mode (onboarding@resend.dev), we can ONLY send to awa3dstd@gmail.com.
  // Instead of failing, we route the "client email" to the inbox wrapped in a
  // forward-ready banner so the studio can manually forward it.
  const trial = isTrialMode();

  const leadEmailPayload = trial
    ? {
        to: INBOX,
        subject: `[REENVIAR A ${leadEmail}] Cotización AWA 3D Studio — ${service.label} (${tierData.label})`,
        html: forwardReadyWrapper({
          leadEmail,
          leadName,
          innerHtml: clientHtml,
          attachmentsNote: pdfFilename,
        }),
        replyTo: INBOX,
        attachments: [{ filename: pdfFilename, content: pdfBase64 }],
      }
    : {
        to: leadEmail,
        subject: `Cotización AWA 3D Studio — ${service.label} (${tierData.label})`,
        html: clientHtml,
        replyTo: INBOX,
        attachments: [{ filename: pdfFilename, content: pdfBase64 }],
      };

  // ===== Fire: email to lead (or forward-ready) + internal notification + Notion update =====
  const [emailRes, internalRes, notionRes, schemaRes] = await Promise.allSettled([
    sendEmail(leadEmailPayload),
    sendEmail({
      to: INBOX,
      subject: trial
        ? `[Trial] Cotización generada: ${leadName} — ${service.label} ${tierData.label} (reenviar manualmente)`
        : `Cotización enviada: ${leadName} — ${service.label} ${tierData.label}`,
      html: quoteSentInternalHtml(
        leadName,
        leadEmail,
        service.label,
        tierData.label,
        ppp.finalPrice,
        quoteId
      ),
    }),
    notionPageId
      ? markQuoteSent(notionPageId, quoteId)
      : Promise.resolve({ ok: false, skipped: true, error: "No notionPageId provided" }),
    // Ensure schema has Phase 2 properties (idempotent)
    ensureNotionSchema(),
  ]);

  const pick = <T>(p: PromiseSettledResult<T>, fallback: T): T =>
    p.status === "fulfilled" ? p.value : fallback;

  const emailResult = pick(emailRes, { ok: false, error: "Promise rejected" });
  const internalResult = pick(internalRes, { ok: false, error: "Promise rejected" });
  const notionResult = pick(notionRes, {
    ok: false,
    skipped: true,
    error: "Promise rejected",
  });
  const schemaResult = pick(schemaRes, {
    ok: false,
    added: [],
    skipped: [],
    error: "Promise rejected",
  });

  return NextResponse.json({
    ok: true,
    quoteId,
    filename: pdfFilename,
    pricing: {
      basePrice,
      finalPrice: ppp.finalPrice,
      discountApplied: ppp.discountApplied,
      discountRate: ppp.discountRate,
      currency: "USD",
    },
    results: {
      email: emailResult,
      internal: internalResult,
      notion: notionResult,
      schema: schemaResult,
    },
  });
}

// ===== GET health check =====
export async function GET() {
  return NextResponse.json({
    ok: true,
    endpoint: "/api/quote",
    description: "Genera cotización PDF + envía email + actualiza Notion",
    methods: ["POST"],
    auth: process.env.QUOTE_API_KEY ? "Bearer token required" : "open (set QUOTE_API_KEY)",
  });
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    },
  });
}

// ===== Helpers =====

function generateQuoteId(): string {
  // Format: Q-YYYYMMDD-XXXX  (XXXX = random 4 hex chars)
  const d = new Date();
  const ymd =
    d.getFullYear().toString() +
    String(d.getMonth() + 1).padStart(2, "0") +
    String(d.getDate()).padStart(2, "0");
  const rand = Math.random().toString(16).slice(2, 6).toUpperCase();
  return `Q-${ymd}-${rand}`;
}

function uint8ToBase64(bytes: Uint8Array): string {
  // Edge runtime: no Buffer available, use btoa with binary string
  let binary = "";
  const chunkSize = 0x8000; // 32 KB chunks (avoid call stack limits)
  for (let i = 0; i < bytes.length; i += chunkSize) {
    const chunk = bytes.subarray(i, i + chunkSize);
    binary += String.fromCharCode.apply(
      null,
      Array.from(chunk) as unknown as number[]
    );
  }
  return btoa(binary);
}
