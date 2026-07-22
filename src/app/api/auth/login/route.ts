import { NextRequest, NextResponse } from "next/server";
import { ADMIN_PROFILE } from "@/lib/team";
import { createSessionToken, sessionCookie } from "@/lib/auth";

export async function POST(request: NextRequest) {
  const { email, password } = await request.json();
  const configuredPassword = process.env.ADMIN_PASSWORD;
  if (!configuredPassword || email?.trim().toLowerCase() !== ADMIN_PROFILE.email || password !== configuredPassword) return NextResponse.json({ error: "Correo o contraseña incorrectos." }, { status: 401 });
  const response = NextResponse.json({ session: ADMIN_PROFILE });
  response.cookies.set(sessionCookie, createSessionToken(), { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", maxAge: 60 * 60 * 24 * 7, path: "/" });
  return response;
}
