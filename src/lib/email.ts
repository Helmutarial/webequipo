import { ADMIN_PROFILE } from "@/lib/team";

type AccountRequestEmail = {
  name: string;
  email: string;
  playerName: string;
};

export async function notifyAccountRequest(request: AccountRequestEmail) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return { sent: false, reason: "RESEND_API_KEY no configurada" };

  const adminEmail = process.env.ACCOUNT_APPROVAL_EMAIL || ADMIN_PROFILE.email;
  const from = process.env.EMAIL_FROM || "Aldapan Gora <onboarding@resend.dev>";
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://aldapangora.es";
  const subject = `Nueva solicitud de cuenta · ${request.name}`;
  const html = `
    <div style="font-family:Arial,sans-serif;color:#17181d">
      <h1>Nueva solicitud de cuenta</h1>
      <p><strong>Nombre:</strong> ${request.name}</p>
      <p><strong>Email:</strong> ${request.email}</p>
      <p><strong>Jugador:</strong> ${request.playerName}</p>
      <p>Entra en el panel de administración para aprobarla y asignar rol.</p>
      <p><a href="${siteUrl}/admin">Abrir panel</a></p>
    </div>
  `;

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from, to: adminEmail, subject, html }),
  });

  return { sent: response.ok, reason: response.ok ? "" : await response.text() };
}

