import { NextRequest, NextResponse } from "next/server";
import fs from "node:fs/promises";
import path from "node:path";
import * as XLSX from "xlsx";
import { isAdminRequest } from "@/lib/auth";
import { getDatabase } from "@/lib/db";
import { getDataDirectory } from "@/lib/data-directory";
import { privatePlayerProfileSeeds } from "@/lib/private-player-profiles";
import { sanitizeRichText } from "@/lib/rich-text";

const asNumberOrNull = (value: unknown) => {
  const number = Number(value);
  return Number.isFinite(number) && number > 0 ? Math.round(number) : null;
};

type PlayerProfile = { playerId: string; age: number | null; heightCm: number | null; weightKg: number | null; dominantFoot: string; naturalPosition: string; secondaryPositions: string; analysis: string; keysToUse: string; cautions: string; tacticalFit: string; updatedAt?: string };

const playerSheets: Record<string, string> = {
  "mauro-m": "MAURO #2", urko: "URKO #3", juanma: "JUANMA #4", rey: "REY #5", caspilla: "JARE #7", padri: "PADRINO #8", ortiz: "ORTIZ #9", corisco: "SERGIO #10", pedro: "PEDRO #11", javi: "JAVI #13", Jones: "DAN #14", dani: "DANI #15", krepox: "MARTÍN #17", "juan-baroffi": "BAROFFI #18", molinpower: "MOLINA #19", moreno: "MORENO #22", mario: "MARIO #25", ivan: "IVÁN #28", izan: "IZAN #38", anglada: "ANGLADA #79", juanjo: "JUANJO #80",
};

async function excelNarrative(playerId: string) {
  const sheetName = playerSheets[playerId];
  if (!sheetName) return { analysis: "", keysToUse: "", cautions: "", tacticalFit: "" };
  try {
    const source = path.join(getDataDirectory(), "imports", "Aldapan Gora.xlsx");
    const workbook = XLSX.read(await fs.readFile(source), { type: "buffer", cellText: false, cellDates: false });
    const sheet = workbook.Sheets[sheetName];
    const value = (cell: string) => String(sheet?.[cell]?.v || "").trim();
    return { analysis: value("B17"), keysToUse: value("B36"), cautions: value("B55"), tacticalFit: value("B74") };
  } catch { return { analysis: "", keysToUse: "", cautions: "", tacticalFit: "" }; }
}

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await isAdminRequest())) return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  const { id } = await params;
  const database = await getDatabase();
  const stored = await database.get<PlayerProfile>("SELECT player_id as playerId, age, height_cm as heightCm, weight_kg as weightKg, dominant_foot as dominantFoot, natural_position as naturalPosition, secondary_positions as secondaryPositions, analysis, keys_to_use as keysToUse, cautions, tactical_fit as tacticalFit, updated_at as updatedAt FROM player_private_profiles WHERE player_id=?", id);
  const seed = privatePlayerProfileSeeds[id];
  const source = await excelNarrative(id);
  const profile: PlayerProfile = {
    playerId: id, age: stored?.age ?? seed?.age ?? null, heightCm: stored?.heightCm ?? seed?.heightCm ?? null, weightKg: stored?.weightKg ?? seed?.weightKg ?? null,
    dominantFoot: stored?.dominantFoot || seed?.dominantFoot || "", naturalPosition: stored?.naturalPosition || seed?.naturalPosition || "", secondaryPositions: stored?.secondaryPositions || seed?.secondaryPositions || "",
    analysis: stored?.analysis || source.analysis, keysToUse: stored?.keysToUse || source.keysToUse, cautions: stored?.cautions || source.cautions, tacticalFit: stored?.tacticalFit || source.tacticalFit, updatedAt: stored?.updatedAt,
  };
  const comments = await database.all("SELECT comments.id, comments.user_email as userEmail, comments.author_name as authorName, comments.body, comments.created_at as createdAt, comments.updated_at as updatedAt, players.photo as authorPhoto FROM player_profile_comments comments LEFT JOIN users ON users.email=comments.user_email LEFT JOIN players ON players.id=users.playerId WHERE comments.player_id=? ORDER BY comments.created_at DESC", id);
  return NextResponse.json({ profile, comments });
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
    id, asNumberOrNull(body.age), asNumberOrNull(body.heightCm), asNumberOrNull(body.weightKg), String(body.dominantFoot || "").trim(), String(body.naturalPosition || "").trim(), String(body.secondaryPositions || "").trim(), sanitizeRichText(String(body.analysis || "").trim()), sanitizeRichText(String(body.keysToUse || "").trim()), sanitizeRichText(String(body.cautions || "").trim()), sanitizeRichText(String(body.tacticalFit || "").trim()),
  );
  return NextResponse.json({ ok: true });
}
