import { NextRequest, NextResponse } from "next/server";
import { getRequestSession, isAdminRequest } from "@/lib/auth";
import { getDatabase } from "@/lib/db";

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await isAdminRequest())) return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  const session = await getRequestSession();
  const { id: matchId } = await params;
  const body = String((await request.json()).body || "").trim();
  if (!body || body.length > 3000) return NextResponse.json({ error: "El comentario debe tener entre 1 y 3.000 caracteres." }, { status: 400 });
  const database = await getDatabase();
  const match = await database.get<{ id: string }>("SELECT id FROM matches WHERE id=?", matchId);
  if (!match) return NextResponse.json({ error: "Partido no encontrado" }, { status: 404 });
  await database.run("INSERT INTO match_report_comments (id,match_id,user_email,author_name,body,created_at,updated_at) VALUES (?,?,?,?,?,datetime('now'),datetime('now'))", crypto.randomUUID(), matchId, session?.email || "", session?.name || "Junta", body);
  return NextResponse.json({ ok: true });
}
