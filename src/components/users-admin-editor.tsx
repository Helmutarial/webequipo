"use client";

import { useEffect } from "react";
import { useUsers } from "@/components/users-context";
import { Role } from "@/lib/team";
import { UserStatus } from "@/lib/users";

const statusLabel: Record<UserStatus, string> = { PENDING: "Pendiente", APPROVED: "Aprobado", REJECTED: "Rechazado" };
const roleLabel: Record<Role, string> = { USER: "Jugador", NEWS_EDITOR: "Editor noticias", ADMIN: "Admin" };

export default function UsersAdminEditor() {
  const { users, refreshUsers, updateUser } = useUsers();
  useEffect(() => { void refreshUsers(); }, []);

  return <section className="edit-card users-admin-card">
    <span className="section-label">CUENTAS DEL EQUIPO</span>
    <h2>Usuarios</h2>
    <p className="muted">Aprueba solicitudes, asigna rol y deja preparado quién podrá votar convocatorias, MVP y encuestas.</p>
    <div className="users-admin-list">
      {users.map((user) => <article className={`user-request ${user.status.toLowerCase()}`} key={user.id}>
        <div>
          <span>{statusLabel[user.status]}</span>
          <h3>{user.name}</h3>
          <p>{user.email}</p>
          <small>Jugador: {user.playerName || user.playerId || "Sin jugador"}</small>
        </div>
        <label>Rol<select value={user.role} onChange={(event) => void updateUser(user.id, event.target.value as Role, user.status)}>{Object.entries(roleLabel).map(([value, label]) => <option value={value} key={value}>{label}</option>)}</select></label>
        <label>Estado<select value={user.status} onChange={(event) => void updateUser(user.id, user.role, event.target.value as UserStatus)}>{Object.entries(statusLabel).map(([value, label]) => <option value={value} key={value}>{label}</option>)}</select></label>
        <div className="user-request-actions">
          <button onClick={() => void updateUser(user.id, user.role, "APPROVED")}>Aprobar</button>
          <button onClick={() => void updateUser(user.id, user.role, "REJECTED")}>Rechazar</button>
        </div>
      </article>)}
      {!users.length && <p className="muted">Todavía no hay solicitudes de cuenta.</p>}
    </div>
  </section>;
}

