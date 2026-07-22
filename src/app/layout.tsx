import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Aldapan Gora | Equipo de fútbol",
  description: "La casa digital del Aldapan Gora.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
