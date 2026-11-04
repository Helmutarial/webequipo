import { NextResponse } from "next/server";

// Las invitaciones por correo se retiraron para evitar cuentas externas.
export async function POST() {
  return NextResponse.json({ error: "Las invitaciones están desactivadas." }, { status: 410 });
}
