"use client";

import { useMemo, useState } from "react";
import SeasonNav from "@/components/season-nav";
import { useMatches } from "@/components/matches-context";
import { getSeasons, getStandings } from "@/lib/season-utils";
import { formatOfficialSync, useOfficialCompetition } from "@/components/official-competition";

export default function StandingsPage() {
  const { matches } = useMatches();
  const seasons = useMemo(() => getSeasons(matches), [matches]);
  const [selectedSeason, setSelectedSeason] = useState("2026/27");
  const visibleSeason = seasons.includes(selectedSeason) ? selectedSeason : seasons[0];
  const standings = getStandings(matches, visibleSeason);
  const { data: official, loading } = useOfficialCompetition(visibleSeason);
  const visibleStandings = official?.standings.length ? official.standings : standings;
  const aldapanStanding = visibleStandings.find((team) => team.team.toUpperCase().includes("ALDAPAN GORA"));

  return <main className="content-page shell">
    <div className="page-intro">
      <div><span className="section-label">TEMPORADA {visibleSeason}</span><h1>Clasificación<span>.</span></h1><p>Tabla de la temporada, posición, puntos y balance del Aldapan Gora.</p></div>
      <label className="season-selector">Temporada<select value={visibleSeason} onChange={(event) => setSelectedSeason(event.target.value)}>{seasons.map((season) => <option value={season} key={season}>{season}</option>)}</select></label>
    </div>
    <SeasonNav />
    {aldapanStanding ? <section className="season-summary">
      <div><span>Posición</span><strong>{aldapanStanding.position}º</strong></div>
      <div><span>Puntos</span><strong>{aldapanStanding.points}</strong></div>
      <div><span>Balance</span><strong>{aldapanStanding.won}-{aldapanStanding.drawn}-{aldapanStanding.lost}</strong></div>
      <div><span>Goles</span><strong>{aldapanStanding.goalsFor}-{aldapanStanding.goalsAgainst}</strong></div>
    </section> : null}
    <section className="standings-card">
      <div className="detail-card-heading"><h2>Tabla</h2><span>{official?.standings.length ? `Oficial · ${formatOfficialSync(official.syncedAt)}` : loading ? "Cargando clasificación oficial…" : visibleSeason === "2025/26" ? "Fuente: jdmmadrid.es" : "Pendiente de sincronización oficial"}</span></div>
      <div className="standings-table">
        <div className="standings-head"><span>Pos</span><span>Equipo</span><span>PJ</span><span>GF</span><span>GC</span><span>DG</span><span>Pts</span></div>
        {visibleStandings.map((team) => <div className={team.team.toUpperCase().includes("ALDAPAN GORA") ? "standings-row highlight" : "standings-row"} key={team.team}>
          <span>{team.position}</span><strong>{team.team}</strong><span>{team.played}</span><span>{team.goalsFor}</span><span>{team.goalsAgainst}</span><span>{team.goalsFor - team.goalsAgainst}</span><b>{team.points}</b>
        </div>)}
      </div>
    </section>
  </main>;
}
