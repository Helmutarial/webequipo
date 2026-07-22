import { NextRequest, NextResponse } from "next/server";
import { getDatabase } from "@/lib/db";
import { isAdminRequest } from "@/lib/auth";

export async function GET() {
  const database = await getDatabase();
  const players = await database.all("SELECT id,name,alias,number,position,photo,goals,assists,appearances,minutes,starterAppearances,substituteAppearances,mvpCount,bio FROM players ORDER BY CASE WHEN number = 0 THEN 999 ELSE number END ASC");
  return NextResponse.json(players);
}

export async function PUT(request: NextRequest) {
  if (!(await isAdminRequest())) return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  const body = await request.json();
  if (!body.id || !body.name) return NextResponse.json({ error: "Faltan datos" }, { status: 400 });
  const database = await getDatabase();
  await database.run("UPDATE players SET name=?, alias=?, number=?, position=?, photo=?, goals=?, assists=?, appearances=?, minutes=?, starterAppearances=?, substituteAppearances=?, mvpCount=?, bio=?, updated_at=datetime('now') WHERE id=?", body.name, body.alias ?? "", Number(body.number) || 0, body.position ?? "Jugador", body.photo ?? "", Number(body.goals) || 0, Number(body.assists) || 0, Number(body.appearances) || 0, Number(body.minutes) || 0, Number(body.starterAppearances) || 0, Number(body.substituteAppearances) || 0, Number(body.mvpCount) || 0, body.bio ?? "", body.id);
  return NextResponse.json({ ...body });
}
