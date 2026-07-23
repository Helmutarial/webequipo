"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useMatches } from "@/components/matches-context";
import { jdmStandings2025 } from "@/lib/jdm-2025-26";

const formatDate = (date: string) => new Date(date).toLocaleDateString("es-ES", { weekday: "short", day: "2-digit", month: "short", year: "numeric" }).toUpperCase();

export default function MatchesPage() {
  const { matches, loading } = useMatches();
  const seasons = useMemo(() => [...new Set(matches.map((match) => match.season || "2026/27"))].sort().reverse(), [matches]);
  const [selectedSeason, setSelectedSeason] = useState("2025/26");
  const visibleSeason = seasons.includes(selectedSeason) ? selectedSeason : seasons[0] || "2025/26";
  const seasonMatches = matches.filter((match) => (match.season || "2026/27") === visibleSeason);
  const aldapanStanding = jdmStandings2025.find((team) => team.team === "Aldapan Gora");

  return <main className="content-page shell">
    <div className="page-intro">
      <div>
        <span className="section-label">TEMPORADA {visibleSeason}</span>
        <h1>Partidos<span>.</span></h1>
        <p>Resultados, alineaciones y todos los detalles de cada encuentro.</p>
      </div>
      <label className="season-selector">Temporada<select value={visibleSeason} onChange={(event) => setSelectedSeason(event.target.value)}>{seasons.map((season) => <option value={season} key={season}>{season}</option>)}</select></label>
    </div>

    {visibleSeason === "2025/26" && aldapanStanding ? <section className="season-summary">
      <div><span>Posición</span><strong>{aldapanStanding.position}º</strong></div>
      <div><span>Puntos</span><strong>{aldapanStanding.points}</strong></div>
      <div><span>Balance</span><strong>{aldapanStanding.won}-{aldapanStanding.drawn}-{aldapanStanding.lost}</strong></div>
      <div><span>Goles</span><strong>{aldapanStanding.goalsFor}-{aldapanStanding.goalsAgainst}</strong></div>
    </section> : null}

    {loading ? <p className="muted">Cargando partidos…</p> : <div className="matches-list">{seasonMatches.map((match) => <Link className="match-card" href={`/partidos/${match.id}`} key={match.id}>
      <div className="match-card-date"><span>{formatDate(match.date)}</span><small>{match.competition}</small></div>
      <div className="match-card-teams"><div><b>Aldapan Gora</b><span>ALG</span></div><strong>{match.homeScore} — {match.awayScore}</strong><div><span>{match.opponentShort}</span><b>{match.opponent}</b></div></div>
      <div className="match-card-meta"><span>{match.status === "finished" ? "FINALIZADO" : "PRÓXIMO"}</span><small>{match.venue}</small><i>Ver ficha →</i></div>
    </Link>)}</div>}

    {visibleSeason === "2025/26" ? <section className="standings-card">
      <div className="detail-card-heading"><h2>Clasificación JDM 2025/26</h2><span>Fuente: jdmmadrid.es</span></div>
      <div className="standings-table">
        <div className="standings-head"><span>Pos</span><span>Equipo</span><span>PJ</span><span>DG</span><span>Pts</span></div>
        {jdmStandings2025.map((team) => <div className={team.team === "Aldapan Gora" ? "standings-row highlight" : "standings-row"} key={team.team}>
          <span>{team.position}</span><strong>{team.team}</strong><span>{team.played}</span><span>{team.goalsFor - team.goalsAgainst}</span><b>{team.points}</b>
        </div>)}
      </div>
    </section> : null}
  </main>;
}
