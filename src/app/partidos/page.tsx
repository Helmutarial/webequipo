"use client";

import Link from "next/link";
import SeasonNav from "@/components/season-nav";
import { useMatches } from "@/components/matches-context";

const formatDate = (date: string) => new Date(date).toLocaleDateString("es-ES", { weekday: "short", day: "2-digit", month: "short", year: "numeric" }).toUpperCase();

export default function MatchesPage() {
  const { matches, loading } = useMatches();

  return <main className="content-page shell">
    <div className="page-intro">
      <div>
        <span className="section-label">PARTIDOS</span>
        <h1>Partidos<span>.</span></h1>
        <p>Resultados, alineaciones y todos los detalles de cada encuentro.</p>
      </div>
    </div>
    <SeasonNav />
    {loading ? <p className="muted">Cargando partidos…</p> : <div className="matches-list">{matches.map((match) => <Link className="match-card" href={`/partidos/${match.id}`} key={match.id}>
      <div className="match-card-date"><span>{formatDate(match.date)}</span><small>{match.competition}</small></div>
      <div className="match-card-teams"><div><b>Aldapan Gora</b><span>ALG</span></div><strong>{match.homeScore} — {match.awayScore}</strong><div><span>{match.opponentShort}</span><b>{match.opponent}</b></div></div>
      <div className="match-card-meta"><span>{match.status === "finished" ? "FINALIZADO" : "PRÓXIMO"}</span><small>{match.venue}</small><i>Ver ficha →</i></div>
    </Link>)}</div>}
  </main>;
}
