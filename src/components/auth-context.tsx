"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { ADMIN_PROFILE, Role } from "@/lib/team";

type Session = { name: string; email: string; role: Role } | null;
const AuthContext = createContext<{ session: Session; login: (email: string, password: string) => { ok: boolean; message: string }; logout: () => void }>({ session: null, login: () => ({ ok: false, message: "No disponible" }), logout: () => undefined });

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session>(null);
  useEffect(() => { const saved = window.localStorage.getItem("aldapan-session"); if (saved) setSession(JSON.parse(saved)); }, []);
  const login = (email: string, password: string) => {
    if (email.trim().toLowerCase() !== ADMIN_PROFILE.email) return { ok: false, message: "Este correo no tiene permisos de administrador." };
    if (password.length < 4) return { ok: false, message: "La contraseña debe tener al menos 4 caracteres." };
    const savedPassword = window.localStorage.getItem("aldapan-admin-password");
    if (savedPassword && savedPassword !== password) return { ok: false, message: "Contraseña incorrecta." };
    if (!savedPassword) window.localStorage.setItem("aldapan-admin-password", password);
    const next = { ...ADMIN_PROFILE }; setSession(next); window.localStorage.setItem("aldapan-session", JSON.stringify(next)); return { ok: true, message: "" };
  };
  const logout = () => { setSession(null); window.localStorage.removeItem("aldapan-session"); };
  return <AuthContext.Provider value={{ session, login, logout }}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
