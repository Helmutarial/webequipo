import { NextResponse } from "next/server";
import { getDatabase } from "@/lib/db";
import { isAdminRequest } from "@/lib/auth";

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

