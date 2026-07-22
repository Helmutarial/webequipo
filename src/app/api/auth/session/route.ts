import { NextResponse } from "next/server";
import { isAdminRequest } from "@/lib/auth";
import { ADMIN_PROFILE } from "@/lib/team";

export async function GET() {
  return (await isAdminRequest()) ? NextResponse.json({ session: ADMIN_PROFILE }) : NextResponse.json({ session: null });
}
