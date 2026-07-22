import type { Metadata } from "next";
import "./globals.css";
import SiteNav from "@/components/site-nav";
import { AuthProvider } from "@/components/auth-context";
import { TeamProvider } from "@/components/team-context";

export const metadata: Metadata = {
  title: "Aldapan Gora | Equipo de fútbol",
  description: "La casa digital del Aldapan Gora.",
  icons: {
    icon: "/club-crest.png",
    apple: "/club-crest.png",
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es">
      <body><AuthProvider><TeamProvider><SiteNav />{children}</TeamProvider></AuthProvider></body>
    </html>
  );
}
