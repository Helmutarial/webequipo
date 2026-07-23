import { NextRequest, NextResponse } from "next/server";
import { getDatabase } from "@/lib/db";
import { ADMIN_PROFILE } from "@/lib/team";
import { createSessionToken, getNewsEditorProfile, sessionCookie, SessionProfile, verifyPassword } from "@/lib/auth";

const validProfile = (email: string, password: string): SessionProfile | null => {
  const normalizedEmail = email.trim().toLowerCase();
  const adminPassword = process.env.ADMIN_PASSWORD;
  if (adminPassword && normalizedEmail === ADMIN_PROFILE.email && password === adminPassword) return ADMIN_PROFILE;

  const editor = getNewsEditorProfile();
  const editorPassword = process.env.NEWS_EDITOR_PASSWORD;
  if (editor && editorPassword && normalizedEmail === editor.email && password === editorPassword) return editor;

  return null;
};

export async function POST(request: NextRequest) {
  const { email = "", password = "" } = await request.json();
  const normalizedEmail = String(email).trim().toLowerCase();
  let profile = validProfile(normalizedEmail, String(password));
  if (!profile) {
    const database = await getDatabase();
    const user = await database.get<{ email: string; passwordHash: string; name: string; role: SessionProfile["role"]; status: string; playerId: string }>("SELECT email,passwordHash,name,role,status,playerId FROM users WHERE email=?", normalizedEmail);
    if (user?.status === "PENDING") return NextResponse.json({ error: "Tu cuenta esta pendiente de aprobacion." }, { status: 403 });
    if (user?.status === "REJECTED") return NextResponse.json({ error: "Tu cuenta no esta autorizada." }, { status: 403 });
    if (user?.status === "APPROVED" && verifyPassword(String(password), user.passwordHash)) profile = { email: user.email, name: user.name, role: user.role, playerId: user.playerId };
  }
  if (!profile) return NextResponse.json({ error: "Correo o contrasena incorrectos." }, { status: 401 });
  const response = NextResponse.json({ session: profile });
  response.cookies.set(sessionCookie, createSessionToken(profile), { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", maxAge: 60 * 60 * 24 * 7, path: "/" });
  return response;
}
