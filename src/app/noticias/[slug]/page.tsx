"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useNews } from "@/components/news-context";

export default function NewsDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const { news, loading } = useNews();
  const item = news.find((entry) => entry.slug === slug);

  if (loading) return <main className="content-page shell"><p className="muted">Cargando…</p></main>;
  if (!item) return <main className="content-page shell"><h1>Noticia no encontrada<span>.</span></h1><Link className="text-link" href="/noticias">Volver a noticias</Link></main>;

  return <main className="content-page shell news-detail">
    <div className="news-detail-top">
      <Link className="text-link" href="/noticias">← Volver a noticias</Link>
      <span className="section-label">{item.tag}</span>
    </div>
    <h1>{item.title}<span>.</span></h1>
    <time>{item.date}</time>
    {item.image ? <figure className="news-detail-image"><img src={item.image} alt={item.title} /></figure> : null}
    <p className="news-lead">{item.excerpt}</p>
    <div className="news-content">{item.content.split("\n").map((paragraph, index) => <p key={index}>{paragraph}</p>)}</div>
  </main>;
}
