import { NextResponse } from "next/server";
import { processLead } from "@/lib/leads";

// Edge Runtime — required for Cloudflare Pages compatibility
export const runtime = "edge";

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
}

function asString(v: unknown): string | undefined {
  return typeof v === "string" ? v : undefined;
}

function asNumber(v: unknown): number | undefined {
  return typeof v === "number" && isFinite(v) ? v : undefined;
}

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { ok: false, error: "Invalid JSON body" },
      { status: 400 }
    );
  }

  // The contact form on courses.tsx packs the course name into `service`
  // as "Inscripción curso: <NAME>" — extract it for the email template.
  const service =
    typeof (body as any)?.service === "string" ? (body as any).service : "";
  const courseNameMatch = service.match(/Inscripción curso:\s*(.+)$/i);
  const courseNameFromService = courseNameMatch?.[1]?.trim();

  // The new payload includes explicit course metadata fields sent by courses.tsx
  const courseId = asString((body as any)?.courseId);
  const courseName = asString((body as any)?.courseName) || courseNameFromService;
  const courseTagline = asString((body as any)?.courseTagline);
  const coursePriceNum = asNumber((body as any)?.coursePrice);
  const courseCurrency = asString((body as any)?.courseCurrency);
  const courseRegion = asString((body as any)?.courseRegion);

  // Build the human-readable price string (e.g. "$25 USD")
  const coursePrice =
    coursePriceNum !== undefined
      ? `${coursePriceNum} ${courseCurrency || "USD"}`
      : undefined;

  const result = await processLead(body, req, {
    source: "course",
    courseName,
    courseId,
    courseTagline,
    coursePrice,
    courseRegion,
  });

  return NextResponse.json(
    {
      ok: result.ok,
      results: result.results,
      // Return the plan HTML so the front-end can display it as a fallback
      // when email delivery fails (Gmail filters onboarding@resend.dev).
      planHtml: result.planHtml,
      planSubject: result.planSubject,
      directDelivery: result.directDelivery,
      trialMode: result.trialMode,
      leadEmail: result.leadEmail,
    },
    {
      status: result.status,
      headers: { "Access-Control-Allow-Origin": "*" },
    }
  );
}

export async function GET() {
  return NextResponse.json({
    ok: true,
    endpoint: "/api/enroll",
    methods: ["POST"],
    description: "AWA 3D Studio course enrollment endpoint",
    features: [
      "Sends detailed mentorship plan email based on courseId",
      "Supported courseIds: basic, intermediate, advanced, master",
      "Falls back to generic enroll template if courseId is missing",
    ],
  });
}
