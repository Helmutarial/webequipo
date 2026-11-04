import { NextRequest, NextResponse } from "next/server";
import { isAdminRequest } from "@/lib/auth";
import { getDatabase } from "@/lib/db";

const asNumberOrNull = (value: unknown) => {
  const number = Number(value);
  return Number.isFinite(number) && number > 0 ? Math.round(number) : null;
};

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await isAdminRequest())) return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  const { id } = await params;
  const database = await getDatabase();
  const profile = await database.get("SELECT player_id as playerId, age, height_cm as heightCm, weight_kg as weightKg, dominant_foot as dominantFoot, natural_position as naturalPosition, secondary_positions as secondaryPositions, analysis, keys_to_use as keysToUse, cautions, tactical_fit as tacticalFit, updated_at as updatedAt FROM player_private_profiles WHERE player_id=?", id);
  const comments = await database.all("SELECT id, user_email as userEmail, author_name as authorName, body, created_at as createdAt, updated_at as updatedAt FROM player_profile_comments WHERE player_id=? ORDER BY created_at DESC", id);
  return NextResponse.json({ profile: profile || { playerId: id, age: null, heightCm: null, weightKg: null, dominantFoot: "", naturalPosition: "", secondaryPositions: "", analysis: "", keysToUse: "", cautions: "", tacticalFit: "" }, comments });
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await isAdminRequest())) return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  const { id } = await params;
  const body = await request.json();
  const database = await getDatabase();
  const player = await database.get<{ id: string }>("SELECT id FROM players WHERE id=?", id);
  if (!player) return NextResponse.json({ error: "Jugador no encontrado" }, { status: 404 });
  await database.run(
    "INSERT INTO player_private_profiles (player_id,age,height_cm,weight_kg,dominant_foot,natural_position,secondary_positions,analysis,keys_to_use,cautions,tactical_fit,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,datetime('now')) ON CONFLICT(player_id) DO UPDATE SET age=excluded.age,height_cm=excluded.height_cm,weight_kg=excluded.weight_kg,dominant_foot=excluded.dominant_foot,natural_position=excluded.natural_position,secondary_positions=excluded.secondary_positions,analysis=excluded.analysis,keys_to_use=excluded.keys_to_use,cautions=excluded.cautions,tactical_fit=excluded.tactical_fit,updated_at=datetime('now')",
    id, asNumberOrNull(body.age), asNumberOrNull(body.heightCm), asNumberOrNull(body.weightKg), String(body.dominantFoot || "").trim(), String(body.naturalPosition || "").trim(), String(body.secondaryPositions || "").trim(), String(body.analysis || "").trim(), String(body.keysToUse || "").trim(), String(body.cautions || "").trim(), String(body.tacticalFit || "").trim(),
  );
  return NextResponse.json({ ok: true });
}
