import { NextRequest, NextResponse } from "next/server";
import { getRequestSession } from "@/lib/auth";
import { getDatabase } from "@/lib/db";

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const database = await getDatabase();
  const totals = await database.all<{ player_id: string; votes: number }[]>("SELECT player_id, COUNT(*) AS votes FROM match_votes WHERE match_id=? GROUP BY player_id ORDER BY votes DESC, player_id ASC", id);
  const session = await getRequestSession();
  const mine = session ? await database.get<{ player_id: string }>("SELECT player_id FROM match_votes WHERE match_id=? AND user_email=?", id, session.email) : undefined;
  return NextResponse.json({ totals, selectedPlayerId: mine?.player_id || null });
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getRequestSession();
  if (!session) return NextResponse.json({ error: "Inicia sesión para votar." }, { status: 401 });
  const { id } = await params;
  const { playerId } = await request.json() as { playerId?: string };
  if (!playerId?.trim()) return NextResponse.json({ error: "Selecciona un jugador." }, { status: 400 });
  const database = await getDatabase();
  const match = await database.get<{ status: string; starters: string; substitutes: string }>("SELECT status, starters, substitutes FROM matches WHERE id=?", id);
  if (!match) return NextResponse.json({ error: "Partido no encontrado." }, { status: 404 });
  if (match.status !== "finished") return NextResponse.json({ error: "La votación se abrirá al finalizar el partido." }, { status: 409 });
  const calledUp = new Set([...JSON.parse(match.starters), ...JSON.parse(match.substitutes)]);
  const player = await database.get<{ id: string }>("SELECT id FROM players WHERE id=? AND active=1", playerId);
  if (!player || (calledUp.size && !calledUp.has(playerId))) return NextResponse.json({ error: "Solo puedes votar a jugadores convocados." }, { status: 400 });
  await database.run("INSERT INTO match_votes (match_id,user_email,player_id,created_at,updated_at) VALUES (?,?,?,datetime('now'),datetime('now')) ON CONFLICT(match_id,user_email) DO UPDATE SET player_id=excluded.player_id, updated_at=datetime('now')", id, session.email, playerId);
  return GET(request, { params: Promise.resolve({ id }) });
}
