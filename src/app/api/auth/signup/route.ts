import { NextRequest, NextResponse } from "next/server";
import { getDatabase } from "@/lib/db";
import { hashPassword } from "@/lib/auth";
import { notifyAccountRequest } from "@/lib/email";

const normalizeEmail = (email: string) => email.trim().toLowerCase();

export async function POST(request: NextRequest) {
  const body = await request.json();
  const email = normalizeEmail(String(body.email || ""));
  const name = String(body.name || "").trim();
  const password = String(body.password || "");
  const playerId = String(body.playerId || "").trim();

  if (!email || !name || !playerId || password.length < 6) return NextResponse.json({ error: "Faltan datos o la contrasena es demasiado corta." }, { status: 400 });

  const database = await getDatabase();
  const player = await database.get<{ id: string; name: string }>("SELECT id,name FROM players WHERE id=? AND active=1", playerId);
  if (!player) return NextResponse.json({ error: "Jugador no encontrado." }, { status: 400 });

  const existing = await database.get("SELECT id FROM users WHERE email=?", email);
  if (existing) return NextResponse.json({ error: "Ya existe una solicitud o cuenta con ese correo." }, { status: 409 });

  const id = crypto.randomUUID();
  await database.run("INSERT INTO users (id,email,passwordHash,name,playerId,role,status,created_at,updated_at) VALUES (?,?,?,?,?,'USER','PENDING',datetime('now'),datetime('now'))", id, email, hashPassword(password), name, playerId);
  const emailResult = await notifyAccountRequest({ name, email, playerName: player.name });

  return NextResponse.json({ ok: true, emailSent: emailResult.sent });
}

