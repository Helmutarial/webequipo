import { NextRequest, NextResponse } from "next/server";
import { getDatabase } from "@/lib/db";
import { ADMIN_PROFILE } from "@/lib/team";
import { isAdminRequest } from "@/lib/auth";

export async function GET() {
  const database = await getDatabase();
  const players = await database.all("SELECT id,name,alias,number,position,photo,goals,assists,appearances,bio FROM players ORDER BY number ASC");
  return NextResponse.json(players);
}

export async function PUT(request: NextRequest) {
  if (!(await isAdminRequest())) return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  const body = await request.json();
  if (!body.id || !body.name) return NextResponse.json({ error: "Faltan datos" }, { status: 400 });
  const database = await getDatabase();
  await database.run("UPDATE players SET name=?, alias=?, number=?, position=?, photo=?, goals=?, assists=?, appearances=?, bio=?, updated_at=datetime('now') WHERE id=?", body.name, body.alias ?? "", Number(body.number), body.position ?? "Jugador", body.photo ?? "", Number(body.goals) || 0, Number(body.assists) || 0, Number(body.appearances) || 0, body.bio ?? "", body.id);
  return NextResponse.json({ ...body });
}
