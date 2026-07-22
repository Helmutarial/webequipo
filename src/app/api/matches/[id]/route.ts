import { NextRequest, NextResponse } from "next/server";
import { getDatabase } from "@/lib/db";

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) { const { id } = await params; const database = await getDatabase(); const row = await database.get("SELECT * FROM matches WHERE id = ?", id); if (!row) return NextResponse.json({ error: "Partido no encontrado" }, { status: 404 }); return NextResponse.json({ ...row, starters: JSON.parse(row.starters), substitutes: JSON.parse(row.substitutes), events: JSON.parse(row.events) }); }
