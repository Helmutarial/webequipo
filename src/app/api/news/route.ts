import { NextRequest, NextResponse } from "next/server";
import { getDatabase } from "@/lib/db";
import { canCreateNewsRequest, isAdminRequest } from "@/lib/auth";

const fields = "id,title,slug,excerpt,content,tag,date,image,accent,published";
const mapNews = (item: Record<string, unknown>) => ({ ...item, published: Boolean(item.published) });

export async function GET(request: NextRequest) {
  const database = await getDatabase();
  const includeDrafts = request.nextUrl.searchParams.get("all") === "1" && await canCreateNewsRequest();
  const rows = await database.all(`SELECT ${fields} FROM news ${includeDrafts ? "" : "WHERE published = 1"} ORDER BY date DESC, updated_at DESC`);
  return NextResponse.json(rows.map(mapNews));
}

export async function POST(request: NextRequest) {
  if (!(await canCreateNewsRequest())) return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  const body = await request.json();
  if (!body.title || !body.excerpt || !body.content) return NextResponse.json({ error: "Título, resumen y contenido son obligatorios" }, { status: 400 });
  const database = await getDatabase();
  const id = crypto.randomUUID();
  const slug = String(body.slug || body.title).toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
  await database.run("INSERT INTO news (id,title,slug,excerpt,content,tag,date,image,accent,published,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,datetime('now'))", id, body.title, slug, body.excerpt, body.content, body.tag || "CLUB", body.date || new Date().toISOString().slice(0, 10), body.image || "", body.accent || "gold", body.published === false ? 0 : 1);
  return NextResponse.json({ ...body, id, slug, published: body.published !== false }, { status: 201 });
}

export async function PUT(request: NextRequest) {
  if (!(await isAdminRequest())) return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  const body = await request.json();
  if (!body.id || !body.title) return NextResponse.json({ error: "Faltan datos" }, { status: 400 });
  const database = await getDatabase();
  await database.run("UPDATE news SET title=?,slug=?,excerpt=?,content=?,tag=?,date=?,image=?,accent=?,published=?,updated_at=datetime('now') WHERE id=?", body.title, body.slug, body.excerpt || "", body.content || "", body.tag || "CLUB", body.date, body.image || "", body.accent || "gold", body.published ? 1 : 0, body.id);
  return NextResponse.json({ ...body, published: Boolean(body.published) });
}

export async function DELETE(request: NextRequest) {
  if (!(await isAdminRequest())) return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  const id = request.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Falta el identificador" }, { status: 400 });
  const database = await getDatabase();
  await database.run("DELETE FROM news WHERE id=?", id);
  return NextResponse.json({ ok: true });
}
