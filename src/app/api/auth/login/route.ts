import { NextRequest, NextResponse } from "next/server";
import { ADMIN_PROFILE } from "@/lib/team";
import { createSessionToken, getNewsEditorProfile, sessionCookie, SessionProfile } from "@/lib/auth";

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
  const profile = validProfile(String(email), String(password));
  if (!profile) return NextResponse.json({ error: "Correo o contrasena incorrectos." }, { status: 401 });
  const response = NextResponse.json({ session: profile });
  response.cookies.set(sessionCookie, createSessionToken(profile), { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", maxAge: 60 * 60 * 24 * 7, path: "/" });
  return response;
}
