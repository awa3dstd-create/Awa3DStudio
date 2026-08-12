/**
 * PDF quote generator using pdf-lib.
 *
 * Why pdf-lib instead of @react-pdf/renderer?
 *   - pdf-lib works on Cloudflare Pages edge runtime
 *   - @react-pdf/renderer requires Node.js polyfills not available on edge
 *
 * Output: Uint8Array (PDF bytes)
 *
 * Design language: dark theme matching the site (bg #0a0a0f, accent #00c8b4).
 */

import {
  PDFDocument,
  StandardFonts,
  rgb,
  type PDFFont,
} from "pdf-lib";
import {
  PRICING,
  applyPppDiscount,
  type ServiceKey,
  type Tier,
} from "@/lib/quote-pricing";

const COLORS = {
  bg: rgb(0.039, 0.039, 0.059), // #0a0a0f
  card: rgb(0.059, 0.059, 0.09), // #0f0f17
  border: rgb(0.118, 0.118, 0.165), // #1e1e2a
  text: rgb(0.894, 0.894, 0.918), // #e4e4e7
  muted: rgb(0.631, 0.631, 0.678), // #a1a1aa
  dim: rgb(0.443, 0.443, 0.478), // #71717a
  accent: rgb(0, 0.784, 0.706), // #00c8b4
  white: rgb(1, 1, 1),
  black: rgb(0, 0, 0),
};

export interface QuoteInput {
  // Lead data
  leadName: string;
  leadEmail: string;
  leadCountry?: string;
  // Quote data
  serviceKey: ServiceKey;
  tier: Tier;
  quoteId: string;
  issueDate: Date;
  validUntilDays?: number; // default 30
  customScope?: string; // optional free-text scope notes
  customPrice?: number; // override tier price if set
}

export interface QuoteOutput {
  bytes: Uint8Array;
  filename: string;
}

export async function generateQuotePdf(
  input: QuoteInput
): Promise<QuoteOutput> {
  const pdfDoc = await PDFDocument.create();
  pdfDoc.setTitle(`Cotización AWA 3D Studio — ${input.leadName}`);
  pdfDoc.setAuthor("AWA 3D Studio");
  pdfDoc.setSubject("Cotización de servicios");
  pdfDoc.setCreator("AWA 3D Studio");
  pdfDoc.setProducer("AWA 3D Studio");

  const helvetica = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const helveticaOblique = await pdfDoc.embedFont(
    StandardFonts.HelveticaOblique
  );

  // A4 portrait: 595.28 × 841.89 pt
  const page = pdfDoc.addPage([595.28, 841.89]);
  const { width, height } = page.getSize();

  // ===== Background =====
  page.drawRectangle({
    x: 0,
    y: 0,
    width,
    height,
    color: COLORS.bg,
  });

  // ===== Header band =====
  page.drawRectangle({
    x: 0,
    y: height - 90,
    width,
    height: 90,
    color: COLORS.card,
  });
  page.drawRectangle({
    x: 0,
    y: height - 92,
    width,
    height: 2,
    color: COLORS.accent,
  });

  // Logo text
  drawText(page, "AWA 3D STUDIO", 40, height - 50, helveticaBold, 18, COLORS.accent, {
    charSpacing: 2,
  });
  drawText(
    page,
    "Visualización Arquitectónica & Modelado 3D",
    40,
    height - 70,
    helvetica,
    9,
    COLORS.dim
  );

  // Right side: quote ID + date
  const issueDateStr = formatDate(input.issueDate);
  drawTextRight(
    page,
    `Cotización N° ${input.quoteId}`,
    width - 40,
    height - 50,
    helveticaBold,
    11,
    COLORS.text
  );
  drawTextRight(
    page,
    `Emitida: ${issueDateStr}`,
    width - 40,
    height - 68,
    helvetica,
    9,
    COLORS.muted
  );

  // ===== Client info block =====
  let y = height - 130;
  drawText(page, "COTIZACIÓN PARA", 40, y, helveticaBold, 8, COLORS.dim, {
    charSpacing: 1,
  });
  y -= 16;
  drawText(page, input.leadName, 40, y, helveticaBold, 14, COLORS.text);
  y -= 14;
  drawText(page, input.leadEmail, 40, y, helvetica, 10, COLORS.muted);
  if (input.leadCountry && input.leadCountry !== "Unknown") {
    y -= 14;
    drawText(page, `País: ${input.leadCountry}`, 40, y, helvetica, 10, COLORS.muted);
  }

  // ===== Validity (right) =====
  const validDays = input.validUntilDays ?? 30;
  const validUntil = new Date(input.issueDate);
  validUntil.setDate(validUntil.getDate() + validDays);
  drawTextRight(
    page,
    `Válida hasta: ${formatDate(validUntil)}`,
    width - 40,
    height - 130,
    helvetica,
    10,
    COLORS.muted
  );

  // ===== Service card =====
  y -= 50;
  const service = PRICING[input.serviceKey];
  const tierData = service.tiers[input.tier];

  // Card background
  const cardHeight = 60 + tierData.deliverables.length * 16 + 40;
  page.drawRectangle({
    x: 40,
    y: y - cardHeight,
    width: width - 80,
    height: cardHeight,
    color: COLORS.card,
    borderColor: COLORS.border,
    borderWidth: 1,
  });

  // Accent stripe
  page.drawRectangle({
    x: 40,
    y: y - cardHeight,
    width: 3,
    height: cardHeight,
    color: COLORS.accent,
  });

  // Service label
  drawText(page, service.label.toUpperCase(), 56, y - 24, helveticaBold, 9, COLORS.accent, {
    charSpacing: 1,
  });
  drawText(page, tierData.label, 56, y - 42, helveticaBold, 16, COLORS.text);
  drawText(page, tierData.description, 56, y - 58, helvetica, 10, COLORS.muted);

  // Deliverables
  let deliverY = y - 80;
  drawText(page, "INCLUIDO", 56, deliverY, helveticaBold, 8, COLORS.dim, {
    charSpacing: 1,
  });
  deliverY -= 16;
  for (const item of tierData.deliverables) {
    // Bullet
    page.drawCircle({
      x: 60,
      y: deliverY + 3,
      size: 1.5,
      color: COLORS.accent,
    });
    drawText(page, item, 68, deliverY, helvetica, 10, COLORS.text);
    deliverY -= 16;
  }

  // Delivery time
  if (tierData.deliveryDays > 0) {
    deliverY -= 8;
    drawText(
      page,
      `Plazo de entrega: ${tierData.deliveryDays} días hábiles`,
      56,
      deliverY,
      helveticaOblique,
      9,
      COLORS.muted
    );
  }

  y = y - cardHeight - 30;

  // ===== Custom scope notes (if any) =====
  if (input.customScope) {
    drawText(page, "NOTAS ADICIONALES", 40, y, helveticaBold, 8, COLORS.dim, {
      charSpacing: 1,
    });
    y -= 16;
    const lines = wrapText(input.customScope, helvetica, 10, width - 80);
    for (const line of lines) {
      drawText(page, line, 40, y, helvetica, 10, COLORS.muted);
      y -= 14;
    }
    y -= 20;
  }

  // ===== Pricing breakdown =====
  const basePrice = input.customPrice ?? tierData.price;
  const ppp = applyPppDiscount(basePrice, input.leadCountry);

  drawText(page, "RESUMEN ECONÓMICO", 40, y, helveticaBold, 8, COLORS.dim, {
    charSpacing: 1,
  });
  y -= 20;

  // Price table background
  const tableHeight = ppp.discountApplied ? 80 : 50;
  page.drawRectangle({
    x: 40,
    y: y - tableHeight,
    width: width - 80,
    height: tableHeight,
    color: COLORS.card,
    borderColor: COLORS.border,
    borderWidth: 1,
  });

  drawText(page, "Subtotal", 56, y - 18, helvetica, 10, COLORS.muted);
  drawTextRight(
    page,
    `$${basePrice.toFixed(2)} USD`,
    width - 56,
    y - 18,
    helvetica,
    10,
    COLORS.text
  );

  if (ppp.discountApplied) {
    drawText(
      page,
      `Descuento PPP (${ppp.discountRate}%) — ${input.leadCountry}`,
      56,
      y - 36,
      helvetica,
      10,
      COLORS.muted
    );
    const discountAmount = basePrice - ppp.finalPrice;
    drawTextRight(
      page,
      `-$${discountAmount.toFixed(2)} USD`,
      width - 56,
      y - 36,
      helvetica,
      10,
      COLORS.accent
    );
  }

  // Total line
  page.drawRectangle({
    x: 40,
    y: y - tableHeight + 4,
    width: width - 80,
    height: 0.5,
    color: COLORS.border,
  });
  drawText(
    page,
    "TOTAL",
    56,
    y - tableHeight + 16,
    helveticaBold,
    12,
    COLORS.text
  );
  drawTextRight(
    page,
    `$${ppp.finalPrice.toFixed(2)} USD`,
    width - 56,
    y - tableHeight + 16,
    helveticaBold,
    14,
    COLORS.accent
  );

  y = y - tableHeight - 30;

  // ===== Payment methods =====
  drawText(page, "MÉTODOS DE PAGO", 40, y, helveticaBold, 8, COLORS.dim, {
    charSpacing: 1,
  });
  y -= 16;
  const paymentLines = [
    "• Transferencia bancaria (WISE) — datos tras confirmación",
    "• PayPal (con recargo del 4% por comisiones)",
    "• Cripto: USDT (TRC-20 / BEP-20)",
    "• 50% anticipo para iniciar · 50% contra entrega",
  ];
  for (const line of paymentLines) {
    drawText(page, line, 40, y, helvetica, 9, COLORS.muted);
    y -= 13;
  }

  y -= 14;

  // ===== Terms =====
  drawText(page, "TÉRMINOS Y CONDICIONES", 40, y, helveticaBold, 8, COLORS.dim, {
    charSpacing: 1,
  });
  y -= 16;
  const termsLines = [
    "1. Esta cotización es válida por 30 días desde la fecha de emisión.",
    "2. El plazo de entrega comienza tras la recepción del anticipo.",
    "3. Las rondas de revisión no acumulativas se realizan dentro del plazo.",
    "4. Cambios de alcance fuera del brief inicial se cotizan aparte.",
    "5. El cliente mantiene los derechos de uso comercial de los entregables.",
  ];
  for (const line of termsLines) {
    const wrapped = wrapText(line, helvetica, 8, width - 80);
    for (const w of wrapped) {
      drawText(page, w, 40, y, helvetica, 8, COLORS.dim);
      y -= 11;
    }
  }

  // ===== Footer =====
  page.drawRectangle({
    x: 0,
    y: 0,
    width,
    height: 50,
    color: COLORS.card,
  });
  page.drawRectangle({
    x: 0,
    y: 50,
    width,
    height: 1,
    color: COLORS.border,
  });

  drawText(
    page,
    "AWA 3D Studio · La Habana, Cuba",
    40,
    30,
    helvetica,
    9,
    COLORS.muted
  );
  drawText(
    page,
    "awa3dstd@gmail.com · awa3dstudio.pages.dev",
    40,
    16,
    helvetica,
    8,
    COLORS.dim
  );
  drawTextRight(
    page,
    `Generada automáticamente · ${issueDateStr}`,
    width - 40,
    22,
    helvetica,
    8,
    COLORS.dim
  );

  const bytes = await pdfDoc.save();
  const safeName = input.leadName
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]/g, "_")
    .slice(0, 40);
  const filename = `Cotizacion_AWA3D_${safeName || "cliente"}_${input.quoteId}.pdf`;

  return { bytes, filename };
}

// ============ Helpers ============

function drawText(
  page: ReturnType<PDFDocument["addPage"]>,
  text: string,
  x: number,
  y: number,
  font: PDFFont,
  size: number,
  color: ReturnType<typeof rgb>,
  opts?: { charSpacing?: number }
) {
  // pdf-lib's drawText supports character spacing via separate property
  // (some versions accept `charSpacing`, others require manual letter-by-letter).
  // Use try/catch to be resilient to API differences.
  try {
    (page.drawText as any)(text, {
      x,
      y,
      font,
      size,
      color,
      ...(opts?.charSpacing ? { charSpacing: opts.charSpacing } : {}),
    });
  } catch {
    page.drawText(text, { x, y, font, size, color });
  }
}

function drawTextRight(
  page: ReturnType<PDFDocument["addPage"]>,
  text: string,
  rightX: number,
  y: number,
  font: PDFFont,
  size: number,
  color: ReturnType<typeof rgb>
) {
  const width = font.widthOfTextAtSize(text, size);
  page.drawText(text, {
    x: rightX - width,
    y,
    font,
    size,
    color,
  });
}

function formatDate(date: Date): string {
  const d = String(date.getDate()).padStart(2, "0");
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const y = date.getFullYear();
  return `${d}/${m}/${y}`;
}

function wrapText(
  text: string,
  font: PDFFont,
  size: number,
  maxWidth: number
): string[] {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let current = "";
  for (const word of words) {
    const trial = current ? `${current} ${word}` : word;
    if (font.widthOfTextAtSize(trial, size) > maxWidth) {
      if (current) lines.push(current);
      current = word;
    } else {
      current = trial;
    }
  }
  if (current) lines.push(current);
  return lines;
}
