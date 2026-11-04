import { NextRequest, NextResponse } from "next/server";
import { isAdminRequest } from "@/lib/auth";
import { getDatabase } from "@/lib/db";

const fields = ["overview", "offensive", "defensive", "transitions", "setPieces", "strengths", "conclusions", "needs"] as const;

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await isAdminRequest())) return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  const { id } = await params;
  const database = await getDatabase();
  const report = await database.get("SELECT match_id as matchId, overview, offensive, defensive, transitions, set_pieces as setPieces, strengths, conclusions, needs, updated_at as updatedAt FROM match_private_reports WHERE match_id=?", id);
  const comments = await database.all("SELECT comments.id, comments.user_email as userEmail, comments.author_name as authorName, comments.body, comments.created_at as createdAt, comments.updated_at as updatedAt, players.photo as authorPhoto FROM match_report_comments comments LEFT JOIN users ON users.email=comments.user_email LEFT JOIN players ON players.id=users.playerId WHERE comments.match_id=? ORDER BY comments.created_at DESC", id);
  return NextResponse.json({ report: report || { matchId: id, overview: "", offensive: "", defensive: "", transitions: "", setPieces: "", strengths: "", conclusions: "", needs: "" }, comments });
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await isAdminRequest())) return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  const { id } = await params;
  const body = await request.json();
  const database = await getDatabase();
  const match = await database.get<{ id: string }>("SELECT id FROM matches WHERE id=?", id);
  if (!match) return NextResponse.json({ error: "Partido no encontrado" }, { status: 404 });
  const values = fields.map((field) => String(body[field] || "").trim());
  await database.run("INSERT INTO match_private_reports (match_id,overview,offensive,defensive,transitions,set_pieces,strengths,conclusions,needs,updated_at) VALUES (?,?,?,?,?,?,?,?,?,datetime('now')) ON CONFLICT(match_id) DO UPDATE SET overview=excluded.overview, offensive=excluded.offensive, defensive=excluded.defensive, transitions=excluded.transitions, set_pieces=excluded.set_pieces, strengths=excluded.strengths, conclusions=excluded.conclusions, needs=excluded.needs, updated_at=datetime('now')", id, ...values);
  return NextResponse.json({ ok: true });
}
