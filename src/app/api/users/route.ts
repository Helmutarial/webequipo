import { NextRequest, NextResponse } from "next/server";
import { getDatabase } from "@/lib/db";
import { isAdminRequest } from "@/lib/auth";
import { Role } from "@/lib/team";
import { UserStatus } from "@/lib/users";

const allowedRoles = new Set<Role>(["USER", "NEWS_EDITOR", "ADMIN"]);
const allowedStatuses = new Set<UserStatus>(["PENDING", "APPROVED", "REJECTED"]);

export async function GET() {
  if (!(await isAdminRequest())) return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  const database = await getDatabase();
  const users = await database.all(`
    SELECT users.id, users.email, users.name, users.playerId, users.role, users.status, users.created_at as createdAt, users.updated_at as updatedAt, users.approved_at as approvedAt, players.name as playerName
    FROM users
    LEFT JOIN players ON players.id = users.playerId
    ORDER BY CASE users.status WHEN 'PENDING' THEN 0 WHEN 'APPROVED' THEN 1 ELSE 2 END, users.created_at DESC
  `);
  return NextResponse.json(users);
}

export async function PUT(request: NextRequest) {
  if (!(await isAdminRequest())) return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  const body = await request.json();
  const id = String(body.id || "");
  const role = String(body.role || "USER") as Role;
  const status = String(body.status || "PENDING") as UserStatus;
  if (!id || !allowedRoles.has(role) || !allowedStatuses.has(status)) return NextResponse.json({ error: "Datos invalidos" }, { status: 400 });

  const database = await getDatabase();
  await database.run("UPDATE users SET role=?, status=?, approved_at=CASE WHEN ?='APPROVED' THEN COALESCE(approved_at, datetime('now')) ELSE approved_at END, updated_at=datetime('now') WHERE id=?", role, status, status, id);
  return NextResponse.json({ ok: true });
}

