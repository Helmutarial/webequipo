import { NextRequest, NextResponse } from "next/server";
import { readOfficialCompetition, syncOfficialCompetition } from "@/lib/madrid-competition";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  return NextResponse.json(await readOfficialCompetition(request.nextUrl.searchParams.get("season") || "2026/27"));
}

export async function POST(request: NextRequest) {
  const secret = process.env.MADRID_SYNC_SECRET;
  if (!secret || request.headers.get("x-madrid-sync-secret") !== secret) return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  try { return NextResponse.json(await syncOfficialCompetition(request.nextUrl.searchParams.get("season") || "2026/27")); }
  catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : "No se pudo sincronizar" }, { status: 502 }); }
}
