"use client";

import Image from "next/image";
import Link from "next/link";
import NewsPreview from "@/components/news-preview";
import { useMatches } from "@/components/matches-context";

function Crest({ small = false }: { small?: boolean }) { return <Image src="/club-crest.png" alt="Escudo Aldapan Gora" width={small ? 42 : 88} height={small ? 42 : 88} className={small ? "crest small" : "crest"} priority />; }
const matchDate = (date: string) => new Date(date).toLocaleDateString("es-ES", { weekday: "short", day: "2-digit", month: "short" }).toUpperCase();
const matchTime = (date: string) => new Date(date).toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" });

export default function Home() {
  const { matches, loading } = useMatches();
  const nextMatch = [...matches].filter((match) => match.season === "2026/27" && match.competition.startsWith("Liga") && match.status === "upcoming" && new Date(match.date).getTime() >= Date.now()).sort((a, b) => a.date.localeCompare(b.date))[0];

  return <main>
    <section id="inicio" className="hero shell"><div className="hero-copy"><p className="eyebrow"><span className="live-dot" /> Temporada 2026/27 · Liga</p><h1>Esto no es solo<br /><em>fútbol.</em></h1><p className="hero-text">Un equipo. Una ciudad. Una temporada para vivir cada partido.</p><Link href="/jornadas" className="primary-button">Ver jornadas <span>→</span></Link></div><div className="hero-match"><div className="match-top"><span>PRÓXIMO PARTIDO</span><strong>{nextMatch?.competition || "TEMPORADA 2026/27"}</strong></div>{loading ? <p className="muted">Cargando jornadas…</p> : nextMatch ? <><div className="match-date">{matchDate(nextMatch.date)} <b>{matchTime(nextMatch.date)}</b></div><div className="versus"><div className={nextMatch.isHome !== false ? "" : "opponent"}>{nextMatch.isHome !== false ? <Crest /> : <div className="opponent-mark">{nextMatch.opponentShort}</div>}<span>{nextMatch.isHome !== false ? "Aldapan\nGora" : nextMatch.opponent}</span></div><p>VS</p><div className={nextMatch.isHome !== false ? "opponent" : ""}>{nextMatch.isHome !== false ? <div className="opponent-mark">{nextMatch.opponentShort}</div> : <Crest />}<span>{nextMatch.isHome !== false ? nextMatch.opponent : "Aldapan\nGora"}</span></div></div><div className="match-place">◉ {nextMatch.venue}</div></> : <div className="empty-next-match">Jornadas pendientes de próximos encuentros.</div>}</div></section>
    <section id="partidos" className="result-strip"><div className="shell result-inner"><div><span className="section-label">TEMPORADA 2026/27</span><p className="result-title">Las jornadas ya están listas</p></div><div className="score"><strong>12</strong><span>PARTIDOS</span></div><div className="result-meta"><span>1 JORNADA DE DESCANSO</span><small>18 OCT 2026 · 07 FEB 2027</small></div><Link className="text-link" href="/jornadas">Ver jornadas →</Link></div></section>
    <section id="noticias" className="section shell"><div className="section-heading"><div><span className="section-label">DESDE EL VESTUARIO</span><h2>Últimas noticias</h2></div><Link className="text-link" href="/noticias">Ver todas →</Link></div><NewsPreview /></section>
    <footer className="footer shell"><div className="brand"><Crest small /><span>ALDAPAN<br /><i>GORA</i></span></div><p>Más que un equipo.</p><span>© 2026 Aldapan Gora</span></footer>
  </main>;
}
