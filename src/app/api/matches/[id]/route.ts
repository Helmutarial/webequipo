import { NextRequest, NextResponse } from "next/server";
import { getDatabase } from "@/lib/db";
import { isAdminRequest } from "@/lib/auth";
import { Match, MatchEvent } from "@/lib/matches";

const cleanEvents = (events: MatchEvent[] = []) => events.map((event) => ({ minute: Number(event.minute) || 0, type: event.type, player: event.player || "", relatedPlayer: event.relatedPlayer || "", detail: event.detail || "" })).filter((event) => event.type && event.player).sort((a, b) => a.minute - b.minute);
const cleanMatch = (body: Partial<Match>, id: string): Match => ({
  id,
  season: body.season || "2026/27",
  opponent: body.opponent?.trim() || "Rival",
  opponentShort: body.opponentShort?.trim().toUpperCase() || "RIV",
  date: body.date || new Date().toISOString().slice(0, 16),
  competition: body.competition?.trim() || "Amistoso",
  venue: body.venue?.trim() || "Campo Municipal - Gora",
  status: body.status === "finished" ? "finished" : "upcoming",
  duration: Math.max(1, Number(body.duration) || 90),
  homeScore: body.homeScore == null ? null : Number(body.homeScore),
  awayScore: body.awayScore == null ? null : Number(body.awayScore),
  starters: [...new Set(body.starters || [])].filter(Boolean),
  substitutes: [...new Set(body.substitutes || [])].filter(Boolean),
  events: cleanEvents(body.events),
});

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) { const { id } = await params; const database = await getDatabase(); const row = await database.get("SELECT * FROM matches WHERE id = ?", id); if (!row) return NextResponse.json({ error: "Partido no encontrado" }, { status: 404 }); return NextResponse.json({ ...row, duration: Number(row.duration || 90), starters: JSON.parse(row.starters), substitutes: JSON.parse(row.substitutes), events: JSON.parse(row.events) }); }

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await isAdminRequest())) return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  const { id } = await params;
  const match = cleanMatch(await request.json(), id);
  const database = await getDatabase();
  await database.run("UPDATE matches SET season=?, opponent=?, opponentShort=?, date=?, competition=?, venue=?, status=?, duration=?, homeScore=?, awayScore=?, starters=?, substitutes=?, events=?, updated_at=datetime('now') WHERE id=?", match.season, match.opponent, match.opponentShort, match.date, match.competition, match.venue, match.status, match.duration, match.homeScore, match.awayScore, JSON.stringify(match.starters), JSON.stringify(match.substitutes), JSON.stringify(match.events), id);
  return NextResponse.json(match);
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await isAdminRequest())) return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  const { id } = await params;
  const database = await getDatabase();
  await database.run("DELETE FROM matches WHERE id=?", id);
  return NextResponse.json({ ok: true });
}
