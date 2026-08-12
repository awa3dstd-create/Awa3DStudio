/**
 * Quick local test for the quote PDF generator.
 * Run: bun /home/z/my-project/scripts/test_quote_pdf.ts
 */
import { generateQuotePdf } from "../src/lib/quote-pdf";
import { writeFileSync, mkdirSync } from "fs";

async function main() {
  const { bytes, filename } = await generateQuotePdf({
    leadName: "María González Pérez",
    leadEmail: "maria.gonzalez@example.com",
    leadCountry: "MX",
    serviceKey: "interior-render",
    tier: "standard",
    quoteId: "Q-20260805-1A2B",
    issueDate: new Date(),
    validUntilDays: 30,
    customScope:
      "Renderizado de salón principal + comedor. Se incluye modelado de mobiliario personalizado según planos adjuntos por el cliente.",
  });

  mkdirSync("/home/z/my-project/scripts/test-output", { recursive: true });
  const outPath = `/home/z/my-project/scripts/test-output/${filename}`;
  writeFileSync(outPath, bytes);
  console.log(`✓ PDF generated: ${outPath}`);
  console.log(`  Size: ${(bytes.length / 1024).toFixed(1)} KB`);
  console.log(`  Filename: ${filename}`);
}

main().catch((err) => {
  console.error("✗ Error:", err);
  process.exit(1);
});
