import fs from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { canCreateNewsRequest } from "@/lib/auth";
import { imageExtensions, uploadedImageBuffer } from "@/lib/upload-images";

const allowedTypes = imageExtensions;

const maxImageSize = 8 * 1024 * 1024;

export async function POST(request: NextRequest) {
  if (!(await canCreateNewsRequest())) return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  const formData = await request.formData();
  const image = formData.get("image");
  if (!(image instanceof File)) return NextResponse.json({ error: "Falta la imagen" }, { status: 400 });
  if (!allowedTypes[image.type]) return NextResponse.json({ error: "Formato no soportado" }, { status: 400 });
  if (image.size > maxImageSize) return NextResponse.json({ error: "La imagen es demasiado grande" }, { status: 400 });

  const uploadsDirectory = path.join(process.cwd(), "data", "uploads");
  await fs.mkdir(uploadsDirectory, { recursive: true });
  const extension = allowedTypes[image.type];
  const filename = `news-${randomUUID()}.${extension}`;
  await fs.writeFile(path.join(uploadsDirectory, filename), await uploadedImageBuffer(image));

  return NextResponse.json({ image: `/api/uploads/${filename}` });
}
