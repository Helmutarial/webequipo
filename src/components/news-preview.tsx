"use client";

import Link from "next/link";
import { useNews } from "@/components/news-context";

export default function NewsPreview() {
  const { news, loading } = useNews();
  if (loading) return <div className="news-grid"><p className="muted">Cargando noticias…</p></div>;
  return <div className="news-grid">{news.slice(0, 3).map((item) => <Link href={`/noticias/${item.slug}`} className={`news-card ${item.accent}`} key={item.id}><div className="news-image">{item.image ? <img src={item.image} alt="" /> : <span>{item.accent === "gold" ? "AG" : item.accent === "dark" ? "✦" : "G"}</span>}</div><div className="news-info"><span className="tag">{item.tag}</span><h3>{item.title}</h3><time>{new Date(`${item.date}T12:00:00`).toLocaleDateString("es-ES", { day: "2-digit", month: "short", year: "numeric" }).toUpperCase()}</time></div></Link>)}</div>;
}
