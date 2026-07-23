"use client";

import Link from "next/link";
import { FormEvent, useMemo, useState } from "react";
import { useTeam } from "@/components/team-context";

export default function SignupPage() {
  const { players } = useTeam();
  const activePlayers = useMemo(() => players.filter((player) => player.active), [players]);
  const [form, setForm] = useState({ name: "", email: "", password: "", playerId: "" });
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const update = (field: keyof typeof form, value: string) => setForm((current) => ({ ...current, [field]: value }));
  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setError("");
    setMessage("");
    const response = await fetch("/api/auth/signup", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    const data = await response.json();
    if (!response.ok) {
      setError(data.error || "No se ha podido crear la solicitud.");
      return;
    }
    setMessage("Solicitud enviada. Pedro tendrá que aprobar tu cuenta antes de que puedas entrar.");
    setForm({ name: "", email: "", password: "", playerId: "" });
  };

  return <main className="auth-page">
    <div className="auth-card signup-card">
      <span className="section-label">ALTA DEL EQUIPO</span>
      <h1>Crear cuenta<span>.</span></h1>
      <p>Elige qué jugador eres. Tu cuenta quedará pendiente hasta que el admin la autorice.</p>
      <form onSubmit={submit}>
        <label>Nombre<input value={form.name} onChange={(event) => update("name", event.target.value)} placeholder="Tu nombre" /></label>
        <label>Correo electronico<input type="email" value={form.email} onChange={(event) => update("email", event.target.value)} placeholder="tu@email.com" /></label>
        <label>Contraseña<input type="password" value={form.password} onChange={(event) => update("password", event.target.value)} placeholder="Minimo 6 caracteres" /></label>
        <label>Jugador<select value={form.playerId} onChange={(event) => update("playerId", event.target.value)}><option value="">Selecciona jugador</option>{activePlayers.map((player) => <option value={player.id} key={player.id}>{player.name} {player.number ? `#${player.number}` : ""}</option>)}</select></label>
        {error && <small className="form-error">{error}</small>}
        {message && <small className="form-success">{message}</small>}
        <button className="primary-button" type="submit">Enviar solicitud ↗</button>
      </form>
      <small className="auth-note">¿Ya tienes cuenta? <Link href="/iniciar-sesion">Inicia sesión</Link></small>
    </div>
  </main>;
}

