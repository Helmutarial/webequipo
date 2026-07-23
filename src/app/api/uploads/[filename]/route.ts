import fs from "node:fs/promises";
import path from "node:path";
import { NextRequest, NextResponse } from "next/server";

const contentTypes: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
  ".gif": "image/gif",
  ".svg": "image/svg+xml",
};

export async function GET(_request: NextRequest, { params }: { params: Promise<{ filename: string }> }) {
  const { filename } = await params;
  const safeFilename = path.basename(filename);
  if (safeFilename !== filename) return NextResponse.json({ error: "Archivo no valido" }, { status: 400 });

  const extension = path.extname(safeFilename).toLowerCase();
  const contentType = contentTypes[extension];
  if (!contentType) return NextResponse.json({ error: "Archivo no valido" }, { status: 400 });

  try {
    const file = await fs.readFile(path.join(process.cwd(), "data", "uploads", safeFilename));
    return new Response(file, {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch {
    return NextResponse.json({ error: "Archivo no encontrado" }, { status: 404 });
  }
}
