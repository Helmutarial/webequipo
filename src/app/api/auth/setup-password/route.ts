import { NextResponse } from "next/server";

// No hay invitaciones ni contraseñas temporales: cada integrante autorizado se registra directamente.
export async function POST() {
  return NextResponse.json({ error: "Esta ruta ya no se utiliza. Crea tu cuenta desde /crear-cuenta." }, { status: 410 });
}
