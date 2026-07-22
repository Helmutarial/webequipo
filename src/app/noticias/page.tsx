"use client";

import Link from "next/link";
import { useNews } from "@/components/news-context";

export default function NewsPage() { const { news, loading } = useNews(); return <main className="content-page shell"><span className="section-label">DESDE EL VESTUARIO</span><h1>Noticias<span>.</span></h1><p className="page-intro">Todo lo que pasa alrededor del Aldapan Gora.</p>{loading ? <p className="muted">Cargando noticias…</p> : <div className="news-grid news-page-grid">{news.map((item) => <Link href={`/noticias/${item.slug}`} className={`news-card ${item.accent}`} key={item.id}><div className="news-image">{item.image ? <img src={item.image} alt="" /> : <span>{item.accent === "gold" ? "AG" : item.accent === "dark" ? "✦" : "G"}</span>}</div><div className="news-info"><span className="tag">{item.tag}</span><h3>{item.title}</h3><p>{item.excerpt}</p><time>{item.date}</time></div></Link>)}</div>}</main>; }
