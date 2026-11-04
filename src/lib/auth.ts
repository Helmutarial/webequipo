import { createHmac, randomBytes, scryptSync, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { getDatabase } from "@/lib/db";
import { Role } from "@/lib/team";

export type SessionProfile = { name: string; email: string; role: Role; playerId?: string };

const COOKIE_NAME = "aldapan_session";
const secret = () => process.env.AUTH_SECRET || "local-development-secret-change-me";

export function createSessionToken(profile: SessionProfile) {
  const payload = JSON.stringify({ email: profile.email, name: profile.name, role: profile.role, playerId: profile.playerId || "", issuedAt: Date.now() });
  const encodedPayload = Buffer.from(payload).toString("base64url");
  const signature = createHmac("sha256", secret()).update(encodedPayload).digest("base64url");
  return `${encodedPayload}.${signature}`;
}

export function getSessionFromToken(token: string | undefined): SessionProfile | null {
  if (!token) return null;
  const [encodedPayload, signature] = token.split(".");
  if (!encodedPayload || !signature) return null;
  try {
    const payloadText = Buffer.from(encodedPayload, "base64url").toString("utf8");
    const expected = createHmac("sha256", secret()).update(encodedPayload).digest("base64url");
    if (signature.length === expected.length && timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) {
      const payload = JSON.parse(payloadText);
      const email = String(payload.email || "").toLowerCase();
      const role = String(payload.role || "");
      if ((role === "ADMIN" || role === "NEWS_EDITOR" || role === "USER") && email) return { email, name: String(payload.name || "Usuario"), role: role as Role, playerId: String(payload.playerId || "") };
    }

  } catch {
    return null;
  }
  return null;
}

export async function getRequestSession() {
  const cookieStore = await cookies();
  return getSessionFromToken(cookieStore.get(COOKIE_NAME)?.value);
}

export async function isAdminRequest() {
  const session = await getRequestSession();
  if (session?.role !== "ADMIN") return false;
  const database = await getDatabase();
  const user = await database.get<{ id: string }>("SELECT id FROM users WHERE email=? AND role='ADMIN' AND status='APPROVED'", session.email);
  return Boolean(user);
}

export async function canCreateNewsRequest() {
  return isAdminRequest();
}

export function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, stored: string) {
  const [salt, hash] = stored.split(":");
  if (!salt || !hash) return false;
  const candidate = scryptSync(password, salt, 64).toString("hex");
  return hash.length === candidate.length && timingSafeEqual(Buffer.from(hash), Buffer.from(candidate));
}

export const sessionCookie = COOKIE_NAME;
