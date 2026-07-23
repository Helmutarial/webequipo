import { NextRequest, NextResponse } from "next/server";
import { getDatabase } from "@/lib/db";
import { isAdminRequest } from "@/lib/auth";
import { Match } from "@/lib/matches";
import { calculatePlayerStats } from "@/lib/player-stats";
import { Player } from "@/lib/team";

const parseMatch = (row: Record<string, unknown>): Match => ({
  id: String(row.id),
  season: String(row.season || "2026/27"),
  opponent: String(row.opponent),
  opponentShort: String(row.opponentShort),
  date: String(row.date),
  competition: String(row.competition),
  venue: String(row.venue),
  status: row.status === "upcoming" ? "upcoming" : "finished",
  homeScore: row.homeScore == null ? null : Number(row.homeScore),
  awayScore: row.awayScore == null ? null : Number(row.awayScore),
  starters: JSON.parse(String(row.starters)),
  substitutes: JSON.parse(String(row.substitutes)),
  events: JSON.parse(String(row.events)),
});
const cleanPlayer = (body: Partial<Player>) => ({
  id: body.id || crypto.randomUUID(),
  name: body.name?.trim() || "",
  alias: body.alias?.trim() || body.name?.trim() || "",
  number: Number(body.number) || 0,
  position: body.position?.trim() || "Jugador",
  photo: body.photo || "",
  goals: Number(body.goals) || 0,
  assists: Number(body.assists) || 0,
  appearances: Number(body.appearances) || 0,
  minutes: Number(body.minutes) || 0,
  starterAppearances: Number(body.starterAppearances) || 0,
  substituteAppearances: Number(body.substituteAppearances) || 0,
  mvpCount: Number(body.mvpCount) || 0,
  bio: body.bio?.trim() || "Jugador del Aldapan Gora.",
  active: body.active !== false,
});

export async function GET() {
  const database = await getDatabase();
  const players = await database.all("SELECT id,name,alias,number,position,photo,goals,assists,appearances,minutes,starterAppearances,substituteAppearances,mvpCount,bio,active FROM players ORDER BY active DESC, CASE WHEN number = 0 THEN 999 ELSE number END ASC");
  const matches = (await database.all("SELECT * FROM matches")).map(parseMatch);
  const matchStats = calculatePlayerStats(matches, players.map((player) => player.id));
  return NextResponse.json(players.map((player) => {
    const basePlayer = { ...player, active: Boolean(player.active) };
    const computed = matchStats.get(player.id);
    if (!computed) return basePlayer;
    return {
      ...basePlayer,
      goals: Number(player.goals) + computed.goals,
      assists: Number(player.assists) + computed.assists,
      appearances: Number(player.appearances) + computed.appearances,
      minutes: Number(player.minutes) + computed.minutes,
      starterAppearances: Number(player.starterAppearances) + computed.starterAppearances,
      substituteAppearances: Number(player.substituteAppearances) + computed.substituteAppearances,
      mvpCount: Number(player.mvpCount) + computed.mvpCount,
    };
  }));
}

export async function PUT(request: NextRequest) {
  if (!(await isAdminRequest())) return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  const body = await request.json();
  if (!body.id || !body.name) return NextResponse.json({ error: "Faltan datos" }, { status: 400 });
  const database = await getDatabase();
  await database.run("UPDATE players SET name=?, alias=?, number=?, position=?, photo=?, goals=?, assists=?, appearances=?, minutes=?, starterAppearances=?, substituteAppearances=?, mvpCount=?, bio=?, active=?, updated_at=datetime('now') WHERE id=?", body.name, body.alias ?? "", Number(body.number) || 0, body.position ?? "Jugador", body.photo ?? "", Number(body.goals) || 0, Number(body.assists) || 0, Number(body.appearances) || 0, Number(body.minutes) || 0, Number(body.starterAppearances) || 0, Number(body.substituteAppearances) || 0, Number(body.mvpCount) || 0, body.bio ?? "", body.active === false ? 0 : 1, body.id);
  return NextResponse.json({ ...body, active: body.active !== false });
}

export async function POST(request: NextRequest) {
  if (!(await isAdminRequest())) return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  const player = cleanPlayer(await request.json());
  if (!player.name) return NextResponse.json({ error: "El nombre es obligatorio" }, { status: 400 });
  const database = await getDatabase();
  await database.run("INSERT INTO players (id,name,alias,number,position,photo,goals,assists,appearances,minutes,starterAppearances,substituteAppearances,mvpCount,bio,active,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,datetime('now'))", player.id, player.name, player.alias, player.number, player.position, player.photo, player.goals, player.assists, player.appearances, player.minutes, player.starterAppearances, player.substituteAppearances, player.mvpCount, player.bio, player.active ? 1 : 0);
  return NextResponse.json(player, { status: 201 });
}

export async function DELETE(request: NextRequest) {
  if (!(await isAdminRequest())) return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  const id = request.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Falta el jugador" }, { status: 400 });
  const database = await getDatabase();
  await database.run("DELETE FROM players WHERE id=?", id);
  const matches = await database.all("SELECT * FROM matches");
  for (const row of matches) {
    const match = parseMatch(row);
    const starters = match.starters.filter((playerId) => playerId !== id);
    const substitutes = match.substitutes.filter((playerId) => playerId !== id);
    const events = match.events.filter((event) => event.player !== id && event.relatedPlayer !== id);
    await database.run("UPDATE matches SET starters=?, substitutes=?, events=?, updated_at=datetime('now') WHERE id=?", JSON.stringify(starters), JSON.stringify(substitutes), JSON.stringify(events), match.id);
  }
  return NextResponse.json({ ok: true });
}
