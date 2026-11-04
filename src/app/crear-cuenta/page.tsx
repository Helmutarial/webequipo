"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";

export default function SignupPage() {
  const [form, setForm] = useState({ email: "", password: "" });
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
    setMessage("Cuenta creada. Ya puedes iniciar sesión en el área de junta.");
    setForm({ email: "", password: "" });
  };

  return <main className="auth-page">
    <div className="auth-card signup-card">
      <span className="section-label">ÁREA DE JUNTA</span>
      <h1>Crear cuenta<span>.</span></h1>
      <p>Utiliza el correo autorizado de la junta. El sistema asociará automáticamente tu cuenta con tu jugador y acceso de administrador.</p>
      <form onSubmit={submit}>
        <label>Correo electrónico<input type="email" value={form.email} onChange={(event) => update("email", event.target.value)} placeholder="tu@email.com" /></label>
        <label>Contraseña<input type="password" value={form.password} onChange={(event) => update("password", event.target.value)} placeholder="Mínimo 8 caracteres" /></label>
        {error && <small className="form-error">{error}</small>}
        {message && <small className="form-success">{message}</small>}
        <button className="primary-button" type="submit">Crear acceso ↗</button>
      </form>
      <small className="auth-note">¿Ya tienes cuenta? <Link href="/iniciar-sesion">Inicia sesión</Link></small>
    </div>
  </main>;
}

