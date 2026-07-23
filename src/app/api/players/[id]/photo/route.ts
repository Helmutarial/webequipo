import fs from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { getDatabase } from "@/lib/db";
import { isAdminRequest } from "@/lib/auth";

const allowedTypes: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
};

const maxPhotoSize = 5 * 1024 * 1024;

async function removeOldUploadedPhoto(photo: string) {
  if (!photo.startsWith("/api/uploads/")) return;
  const filename = photo.split("/").pop();
  if (!filename) return;
  await fs.rm(path.join(process.cwd(), "data", "uploads", filename), { force: true }).catch(() => undefined);
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await isAdminRequest())) return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  const { id } = await params;
  const database = await getDatabase();
  const player = await database.get<{ photo: string }>("SELECT photo FROM players WHERE id = ?", id);
  if (!player) return NextResponse.json({ error: "Jugador no encontrado" }, { status: 404 });

  const formData = await request.formData();
  const photo = formData.get("photo");
  if (!(photo instanceof File)) return NextResponse.json({ error: "Falta la foto" }, { status: 400 });
  if (!allowedTypes[photo.type]) return NextResponse.json({ error: "Formato no soportado" }, { status: 400 });
  if (photo.size > maxPhotoSize) return NextResponse.json({ error: "La foto es demasiado grande" }, { status: 400 });

  const uploadsDirectory = path.join(process.cwd(), "data", "uploads");
  await fs.mkdir(uploadsDirectory, { recursive: true });
  const extension = allowedTypes[photo.type];
  const filename = `${id}-${randomUUID()}.${extension}`;
  const filePath = path.join(uploadsDirectory, filename);
  await fs.writeFile(filePath, Buffer.from(await photo.arrayBuffer()));

  const photoUrl = `/api/uploads/${filename}`;
  await database.run("UPDATE players SET photo=?, updated_at=datetime('now') WHERE id=?", photoUrl, id);
  await removeOldUploadedPhoto(player.photo || "");

  return NextResponse.json({ photo: photoUrl });
}
