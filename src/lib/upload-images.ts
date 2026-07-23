export const imageExtensions: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
  "image/svg+xml": "svg",
};

export async function uploadedImageBuffer(file: File) {
  const buffer = Buffer.from(await file.arrayBuffer());
  if (file.type !== "image/svg+xml") return buffer;

  const svg = buffer.toString("utf8");
  const cleanedSvg = svg
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/\son\w+="[^"]*"/gi, "")
    .replace(/\son\w+='[^']*'/gi, "")
    .replace(/<pattern[\s\S]*?<\/pattern>/gi, "")
    .replace(/<rect\b[^>]*fill=["']url\([^"']+\)["'][^>]*\/?>/gi, "")
    .replace(/<rect\b[^>]*(?:class|id)=["'][^"']*(?:checker|transparent|background|grid)[^"']*["'][^>]*\/?>/gi, "");

  return Buffer.from(cleanedSvg, "utf8");
}

