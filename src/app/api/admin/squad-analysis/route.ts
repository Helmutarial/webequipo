import { NextRequest, NextResponse } from "next/server";
import { isAdminRequest } from "@/lib/auth";
import { getDatabase } from "@/lib/db";

export async function GET() {
  if (!(await isAdminRequest())) return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  const database = await getDatabase();
  const record = await database.get<{ payload: string; updated_at: string }>("SELECT payload, updated_at FROM squad_analysis WHERE id='2026-27'");
  let analysis = {};
  try { analysis = record?.payload ? JSON.parse(record.payload) : {}; } catch { analysis = {}; }
  return NextResponse.json({ analysis, updatedAt: record?.updated_at || null });
}

export async function PUT(request: NextRequest) {
  if (!(await isAdminRequest())) return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  const analysis = await request.json();
  const database = await getDatabase();
  await database.run("INSERT INTO squad_analysis (id,payload,updated_at) VALUES ('2026-27',?,datetime('now')) ON CONFLICT(id) DO UPDATE SET payload=excluded.payload, updated_at=datetime('now')", JSON.stringify(analysis));
  return NextResponse.json({ ok: true });
}
