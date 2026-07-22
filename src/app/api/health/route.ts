import { NextResponse } from "next/server";

export function GET() {
  return NextResponse.json({ status: "ok", service: "aldapan-gora", timestamp: new Date().toISOString() });
}
