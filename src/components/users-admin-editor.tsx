"use client";

import { useEffect } from "react";
import { useUsers } from "@/components/users-context";
export default function UsersAdminEditor() {
  const { users, refreshUsers } = useUsers();
  useEffect(() => { void refreshUsers(); }, []);

  return <section className="edit-card users-admin-card">
    <span className="section-label">CUENTAS DEL EQUIPO</span>
    <h2>Usuarios</h2>
    <p className="muted">Solo se muestran las cuentas de junta creadas con uno de los cinco correos autorizados. Cada cuenta se asocia automáticamente a su jugador.</p>
    <div className="users-admin-list">
      {users.map((user) => <article className={`user-request ${user.status.toLowerCase()}`} key={user.id}>
        <div>
          <span>ADMINISTRADOR · JUNTA</span>
          <h3>{user.name}</h3>
          <p>{user.email}</p>
          <small>Jugador: {user.playerName || user.playerId || "Sin jugador"}</small>
        </div>
        <div className="user-request-actions"><small>Acceso activo</small></div>
      </article>)}
      {!users.length && <p className="muted">Todavía no hay solicitudes de cuenta.</p>}
    </div>
  </section>;
}

