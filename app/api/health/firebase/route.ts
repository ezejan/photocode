import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  // Health simple: no depender de Firebase para permitir compilar/mergear
  return NextResponse.json({
    ok: true,
    service: "firebase-health",
    ts: Date.now(),
  });
}
