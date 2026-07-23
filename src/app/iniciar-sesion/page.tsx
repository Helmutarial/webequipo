"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/auth-context";

export default function LoginPage() {
  const router = useRouter();
  const { login, session } = useAuth();
  const [email, setEmail] = useState("pedrojiblanco@gmail.com");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  if (session) {
    router.replace("/admin");
    return null;
  }

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    const result = await login(email, password);
    if (result.ok) router.push("/admin");
    else setError(result.message);
  };

  return <main className="auth-page">
    <div className="auth-card">
      <span className="section-label">PANEL PRIVADO</span>
      <h1>Iniciar sesion<span>.</span></h1>
      <p>Accede para gestionar el contenido autorizado del equipo.</p>
      <form onSubmit={submit}>
        <label>Correo electronico<input type="email" value={email} onChange={(event) => setEmail(event.target.value)} /></label>
        <label>Contrasena<input type="password" value={password} onChange={(event) => setPassword(event.target.value)} /></label>
        {error && <small className="form-error">{error}</small>}
        <button className="primary-button" type="submit">Entrar al panel ↗</button>
      </form>
      <small className="auth-note">¿Eres jugador y no tienes cuenta? <Link href="/crear-cuenta">Crear cuenta</Link></small>
    </div>
  </main>;
}
