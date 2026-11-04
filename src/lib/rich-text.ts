const allowed = /^(strong|b|em|i|u|p|div|br|ul|ol|li|span)$/i;

export function sanitizeRichText(value: string) {
  const source = String(value || "").replace(/<(script|style)[^>]*>[\s\S]*?<\/\1>/gi, "");
  return source.replace(/<\/?[a-z][^>]*>/gi, (tag) => {
    const closing = /^<\//.test(tag);
    const match = tag.match(/^<\/?\s*([a-z0-9]+)/i);
    const name = match?.[1] || "";
    if (!allowed.test(name)) return "";
    if (closing || !/^span$/i.test(name)) return closing ? `</${name.toLowerCase()}>` : `<${name.toLowerCase()}>`;
    const color = tag.match(/(?:color\s*:\s*|color\s*=\s*["']?)(#[0-9a-f]{3,8})/i)?.[1];
    return color ? `<span style="color:${color.toLowerCase()}">` : "<span>";
  });
}

export function renderRichText(value: string) {
  if (/<\/?[a-z][^>]*>/i.test(value || "")) return sanitizeRichText(value);
  return String(value || "").split(/\n{2,}/).filter(Boolean).map((paragraph) => `<p>${paragraph.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/\n/g, "<br>")}</p>`).join("");
}
