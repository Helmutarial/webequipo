"use client";

import Link from "next/link";
import SeasonNav from "@/components/season-nav";
import { useMatches } from "@/components/matches-context";
import { useMemo, useState } from "react";
import { getMatchSeason, getSeasons } from "@/lib/season-utils";

const formatDate = (date: string) => new Date(date).toLocaleDateString("es-ES", { weekday: "short", day: "2-digit", month: "short", year: "numeric" }).toUpperCase();

export default function MatchesPage() {
  const { matches, loading } = useMatches();
  const seasons = useMemo(() => getSeasons(matches), [matches]);
  const [selectedSeason, setSelectedSeason] = useState("2026/27");
  const visibleSeason = seasons.includes(selectedSeason) ? selectedSeason : seasons[0];
  const now = Date.now();
  const leagueMatches = matches
    .filter((match) => getMatchSeason(match) === visibleSeason && match.competition.startsWith("Liga"))
    .sort((first, second) => {
      const firstPlayedDate = new Date(first.date).getTime() < now;
      const secondPlayedDate = new Date(second.date).getTime() < now;
      if (firstPlayedDate !== secondPlayedDate) return firstPlayedDate ? -1 : 1;
      return firstPlayedDate ? second.date.localeCompare(first.date) : first.date.localeCompare(second.date);
    });

  return <main className="content-page shell">
    <div className="page-intro">
      <div>
        <span className="section-label">PARTIDOS</span>
        <h1>Partidos<span>.</span></h1>
        <p>Resultados, alineaciones y todos los detalles de cada encuentro.</p>
      </div><label className="season-selector">Temporada<select value={visibleSeason} onChange={(event) => setSelectedSeason(event.target.value)}>{seasons.map((season) => <option value={season} key={season}>{season}</option>)}</select></label>
    </div>
    <SeasonNav />
    {loading ? <p className="muted">Cargando partidos…</p> : <div className="matches-list">{leagueMatches.map((match) => { const resultPending = match.status === "upcoming" && new Date(match.date).getTime() < now; return <Link className="match-card" href={`/partidos/${encodeURIComponent(match.id)}`} key={match.id} aria-label={`Ver ficha de Aldapan Gora contra ${match.opponent}`}>
      <div className="match-card-date"><span>{formatDate(match.date)}</span><small>{match.competition}</small></div>
      <div className="match-card-teams">{match.status === "bye" ? <strong className="bye-score">DESCANSO</strong> : <><div><b>{match.isHome !== false ? "Aldapan Gora" : match.opponent}</b><span>{match.isHome !== false ? "ALG" : match.opponentShort}</span></div><strong>{match.isHome !== false ? match.homeScore ?? "—" : match.awayScore ?? "—"} — {match.isHome !== false ? match.awayScore ?? "—" : match.homeScore ?? "—"}</strong><div><span>{match.isHome !== false ? match.opponentShort : "ALG"}</span><b>{match.isHome !== false ? match.opponent : "Aldapan Gora"}</b></div></>}</div>
      <div className="match-card-meta"><span>{match.status === "finished" ? "FINALIZADO" : match.status === "bye" ? "JORNADA DE DESCANSO" : resultPending ? "RESULTADO PENDIENTE" : "PRÓXIMO"}</span><small>{match.venue || "Sin partido"}</small><strong className="match-card-action">Ver ficha →</strong></div>
    </Link>; })}</div>}
  </main>;
}
