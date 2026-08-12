import { NextResponse } from "next/server";
import { processLead } from "@/lib/leads";

// Edge Runtime — required for Cloudflare Pages compatibility
export const runtime = "edge";

// Basic CORS + method guard
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

  const result = await processLead(body, req, { source: "contact" });

  return NextResponse.json(
    { ok: result.ok, results: result.results },
    {
      status: result.status,
      headers: { "Access-Control-Allow-Origin": "*" },
    }
  );
}

// Health check
export async function GET() {
  return NextResponse.json({
    ok: true,
    endpoint: "/api/contact",
    methods: ["POST"],
    description: "AWA 3D Studio lead capture endpoint",
  });
}
