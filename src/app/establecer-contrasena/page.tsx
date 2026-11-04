import { redirect } from "next/navigation";

// Ruta heredada: las cuentas de junta ahora se crean directamente desde /crear-cuenta.
export default function LegacyPasswordSetupPage() {
  redirect("/crear-cuenta");
}
