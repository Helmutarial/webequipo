"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import SeasonNav from "@/components/season-nav";
import { useMatches } from "@/components/matches-context";
import { getMatchSeason, getSeasons } from "@/lib/season-utils";

const formatDate = (date: string) => new Date(date).toLocaleDateString("es-ES", { weekday: "short", day: "2-digit", month: "short", year: "numeric" }).toUpperCase();

export default function FriendliesPage() {
  const { matches, loading } = useMatches();
  const seasons = useMemo(() => getSeasons(matches), [matches]);
  const [selectedSeason, setSelectedSeason] = useState("2026/27");
  const visibleSeason = seasons.includes(selectedSeason) ? selectedSeason : seasons[0];
  const friendlies = matches.filter((match) => getMatchSeason(match) === visibleSeason && !match.competition.startsWith("Liga")).sort((a, b) => b.date.localeCompare(a.date));

  return <main className="content-page shell">
    <div className="page-intro">
      <div><span className="section-label">PARTIDOS NO OFICIALES</span><h1>Amistosos<span>.</span></h1><p>Partidos de preparación y sus detalles. No cuentan para la clasificación ni las estadísticas de liga.</p></div>
      <label className="season-selector">Temporada<select value={visibleSeason} onChange={(event) => setSelectedSeason(event.target.value)}>{seasons.map((season) => <option value={season} key={season}>{season}</option>)}</select></label>
    </div>
    <SeasonNav />
    {loading ? <p className="muted">Cargando amistosos…</p> : friendlies.length ? <div className="matches-list">{friendlies.map((match) => <Link className="match-card" href={`/partidos/${encodeURIComponent(match.id)}`} key={match.id} aria-label={`Ver ficha del amistoso contra ${match.opponent}`}>
      <div className="match-card-date"><span>{formatDate(match.date)}</span><small>{match.competition}</small></div>
      <div className="match-card-teams"><div><b>{match.isHome !== false ? "Aldapan Gora" : match.opponent}</b><span>{match.isHome !== false ? "ALG" : match.opponentShort}</span></div><strong>{match.isHome !== false ? match.homeScore ?? "—" : match.awayScore ?? "—"} — {match.isHome !== false ? match.awayScore ?? "—" : match.homeScore ?? "—"}</strong><div><span>{match.isHome !== false ? match.opponentShort : "ALG"}</span><b>{match.isHome !== false ? match.opponent : "Aldapan Gora"}</b></div></div>
      <div className="match-card-meta"><span>{match.status === "finished" ? "FINALIZADO" : "PRÓXIMO"}</span><small>{match.venue || "Campo por confirmar"}</small><strong className="match-card-action">Ver ficha →</strong></div>
    </Link>)}</div> : <p className="muted">Aún no hay amistosos en esta temporada.</p>}
  </main>;
}
