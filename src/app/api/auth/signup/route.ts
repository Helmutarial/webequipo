import { NextRequest, NextResponse } from "next/server";
import { getDatabase } from "@/lib/db";
import { hashPassword } from "@/lib/auth";
import { boardAdminForEmail } from "@/lib/team";

const normalizeEmail = (email: string) => email.trim().toLowerCase();

export async function POST(request: NextRequest) {
  const body = await request.json();
  const email = normalizeEmail(String(body.email || ""));
  const password = String(body.password || "");
  const boardAccount = boardAdminForEmail(email);

  if (!email || password.length < 8) return NextResponse.json({ error: "Introduce uno de los correos de la junta y una contraseña de al menos 8 caracteres." }, { status: 400 });
  if (!boardAccount) return NextResponse.json({ error: "Este correo no pertenece a una cuenta autorizada de la junta." }, { status: 403 });

  const database = await getDatabase();
  const player = await database.get<{ id: string; name: string }>("SELECT id,name FROM players WHERE id=? AND active=1", boardAccount.playerId);
  if (!player) return NextResponse.json({ error: "Jugador no encontrado." }, { status: 400 });

  const existing = await database.get("SELECT id FROM users WHERE email=?", email);
  if (existing) return NextResponse.json({ error: "Esta cuenta ya está creada. Inicia sesión con tu contraseña." }, { status: 409 });

  const id = crypto.randomUUID();
  await database.run("INSERT INTO users (id,email,passwordHash,name,playerId,role,status,created_at,updated_at,approved_at) VALUES (?,?,?,?,?,'ADMIN','APPROVED',datetime('now'),datetime('now'),datetime('now'))", id, email, hashPassword(password), boardAccount.name, player.id);

  return NextResponse.json({ ok: true });
}

