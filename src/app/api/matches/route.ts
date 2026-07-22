import { NextResponse } from "next/server";
import { getDatabase } from "@/lib/db";

const parseMatch = (row: Record<string, unknown>) => ({ ...row, starters: JSON.parse(String(row.starters)), substitutes: JSON.parse(String(row.substitutes)), events: JSON.parse(String(row.events)) });

export async function GET() { const database = await getDatabase(); const rows = await database.all("SELECT * FROM matches ORDER BY date DESC"); return NextResponse.json(rows.map(parseMatch)); }
