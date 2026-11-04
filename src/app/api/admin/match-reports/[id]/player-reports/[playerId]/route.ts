import { NextRequest, NextResponse } from "next/server";
import { isAdminRequest } from "@/lib/auth";
import { getDatabase } from "@/lib/db";

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string; playerId: string }> }) {
  if (!(await isAdminRequest())) return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  const { id: matchId, playerId } = await params;
  const database = await getDatabase();
  const report = await database.get("SELECT match_id as matchId, player_id as playerId, evaluation, updated_at as updatedAt FROM match_player_reports WHERE match_id=? AND player_id=?", matchId, playerId);
  const comments = await database.all("SELECT comments.id, comments.user_email as userEmail, comments.author_name as authorName, comments.body, comments.created_at as createdAt, comments.updated_at as updatedAt, players.photo as authorPhoto FROM match_player_report_comments comments LEFT JOIN users ON users.email=comments.user_email LEFT JOIN players ON players.id=users.playerId WHERE comments.match_id=? AND comments.player_id=? ORDER BY comments.created_at DESC", matchId, playerId);
  return NextResponse.json({ report: report || { matchId, playerId, evaluation: "" }, comments });
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string; playerId: string }> }) {
  if (!(await isAdminRequest())) return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  const { id: matchId, playerId } = await params;
  const body = await request.json();
  const database = await getDatabase();
  const player = await database.get<{ id: string }>("SELECT id FROM players WHERE id=?", playerId);
  const match = await database.get<{ id: string }>("SELECT id FROM matches WHERE id=?", matchId);
  if (!player || !match) return NextResponse.json({ error: "Jugador o partido no encontrado" }, { status: 404 });
  await database.run("INSERT INTO match_player_reports (match_id,player_id,evaluation,updated_at) VALUES (?,?,?,datetime('now')) ON CONFLICT(match_id,player_id) DO UPDATE SET evaluation=excluded.evaluation, updated_at=datetime('now')", matchId, playerId, String(body.evaluation || "").trim());
  return NextResponse.json({ ok: true });
}
