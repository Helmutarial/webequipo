import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { ADMIN_PROFILE } from "@/lib/team";

const COOKIE_NAME = "aldapan_session";
const secret = () => process.env.AUTH_SECRET || "local-development-secret-change-me";

export function createSessionToken() {
  const payload = `${ADMIN_PROFILE.email}.${Date.now()}`;
  const signature = createHmac("sha256", secret()).update(payload).digest("base64url");
  return `${Buffer.from(payload).toString("base64url")}.${signature}`;
}

export function isValidSessionToken(token: string | undefined) {
  if (!token) return false;
  const [encodedPayload, signature] = token.split(".");
  if (!encodedPayload || !signature) return false;
  const payload = Buffer.from(encodedPayload, "base64url").toString("utf8");
  const expected = createHmac("sha256", secret()).update(payload).digest("base64url");
  if (signature.length !== expected.length || !timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) return false;
  return payload.startsWith(`${ADMIN_PROFILE.email}.`);
}

export async function isAdminRequest() {
  const cookieStore = await cookies();
  return isValidSessionToken(cookieStore.get(COOKIE_NAME)?.value);
}

export const sessionCookie = COOKIE_NAME;
