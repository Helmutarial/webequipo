import { NextRequest, NextResponse } from "next/server";
import { getDatabase } from "@/lib/db";
import { isAdminRequest } from "@/lib/auth";
import { Match, MatchEvent } from "@/lib/matches";

const parseMatch = (row: Record<string, unknown>) => ({ ...row, starters: JSON.parse(String(row.starters)), substitutes: JSON.parse(String(row.substitutes)), events: JSON.parse(String(row.events)) });
const slug = (text: string) => text.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
const cleanEvents = (events: MatchEvent[] = []) => events.map((event) => ({ minute: Number(event.minute) || 0, type: event.type, player: event.player || "", relatedPlayer: event.relatedPlayer || "", detail: event.detail || "" })).filter((event) => event.type && event.player).sort((a, b) => a.minute - b.minute);
const cleanMatch = (body: Partial<Match>): Match => ({
  id: body.id || `${slug(body.opponent || "rival")}-${Date.now()}`,
  opponent: body.opponent?.trim() || "Rival",
  opponentShort: body.opponentShort?.trim().toUpperCase() || "RIV",
  date: body.date || new Date().toISOString().slice(0, 16),
  competition: body.competition?.trim() || "Amistoso",
  venue: body.venue?.trim() || "Campo Municipal - Gora",
  status: body.status === "finished" ? "finished" : "upcoming",
  homeScore: body.homeScore == null ? null : Number(body.homeScore),
  awayScore: body.awayScore == null ? null : Number(body.awayScore),
  starters: [...new Set(body.starters || [])].filter(Boolean),
  substitutes: [...new Set(body.substitutes || [])].filter(Boolean),
  events: cleanEvents(body.events),
});

export async function GET() { const database = await getDatabase(); const rows = await database.all("SELECT * FROM matches ORDER BY date DESC"); return NextResponse.json(rows.map(parseMatch)); }

export async function POST(request: NextRequest) {
  if (!(await isAdminRequest())) return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  const match = cleanMatch(await request.json());
  const database = await getDatabase();
  await database.run("INSERT INTO matches (id,opponent,opponentShort,date,competition,venue,status,homeScore,awayScore,starters,substitutes,events,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,datetime('now'))", match.id, match.opponent, match.opponentShort, match.date, match.competition, match.venue, match.status, match.homeScore, match.awayScore, JSON.stringify(match.starters), JSON.stringify(match.substitutes), JSON.stringify(match.events));
  return NextResponse.json(match, { status: 201 });
}
