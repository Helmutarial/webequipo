"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { ADMIN_PROFILE, Role } from "@/lib/team";

type Session = { name: string; email: string; role: Role } | null;
const AuthContext = createContext<{ session: Session; login: (email: string, password: string) => Promise<{ ok: boolean; message: string }>; logout: () => void }>({ session: null, login: async () => ({ ok: false, message: "No disponible" }), logout: () => undefined });

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session>(null);
  useEffect(() => { fetch("/api/auth/session").then((response) => response.json()).then((data) => setSession(data.session)).catch(() => setSession(null)); }, []);
  const login = async (email: string, password: string) => {
    if (email.trim().toLowerCase() !== ADMIN_PROFILE.email) return { ok: false, message: "Este correo no tiene permisos de administrador." };
    if (password.length < 4) return { ok: false, message: "La contraseña debe tener al menos 4 caracteres." };
    const response = await fetch("/api/auth/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email, password }) });
    if (!response.ok) return { ok: false, message: "Correo o contraseña incorrectos." };
    const data = await response.json(); setSession(data.session); return { ok: true, message: "" };
  };
  const logout = () => { void fetch("/api/auth/logout", { method: "POST" }); setSession(null); };
  return <AuthContext.Provider value={{ session, login, logout }}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
