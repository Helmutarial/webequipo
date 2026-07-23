import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { ADMIN_PROFILE, Role } from "@/lib/team";

export type SessionProfile = { name: string; email: string; role: Exclude<Role, "USER"> };

const COOKIE_NAME = "aldapan_session";
const secret = () => process.env.AUTH_SECRET || "local-development-secret-change-me";

export function getNewsEditorProfile(): SessionProfile | null {
  const email = process.env.NEWS_EDITOR_EMAIL?.trim().toLowerCase();
  if (!email) return null;
  return {
    email,
    name: process.env.NEWS_EDITOR_NAME?.trim() || "Editor noticias",
    role: "NEWS_EDITOR",
  };
}

export function createSessionToken(profile: SessionProfile = ADMIN_PROFILE) {
  const payload = JSON.stringify({ email: profile.email, name: profile.name, role: profile.role, issuedAt: Date.now() });
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
      if (role === "ADMIN" && email === ADMIN_PROFILE.email) return ADMIN_PROFILE;
      const editor = getNewsEditorProfile();
      if (role === "NEWS_EDITOR" && editor && email === editor.email) return editor;
    }

    const legacyExpected = createHmac("sha256", secret()).update(payloadText).digest("base64url");
    if (signature.length !== legacyExpected.length || !timingSafeEqual(Buffer.from(signature), Buffer.from(legacyExpected))) return null;
    if (payloadText.startsWith(`${ADMIN_PROFILE.email}.`)) return ADMIN_PROFILE;
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
  return (await getRequestSession())?.role === "ADMIN";
}

export async function canCreateNewsRequest() {
  const session = await getRequestSession();
  return session?.role === "ADMIN" || session?.role === "NEWS_EDITOR";
}

export const sessionCookie = COOKIE_NAME;
