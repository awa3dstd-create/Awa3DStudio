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
  const courseName = courseNameMatch?.[1]?.trim();

  const result = await processLead(body, req, {
    source: "course",
    courseName,
  });

  return NextResponse.json(
    { ok: result.ok, results: result.results },
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
  });
}
