"use client";

import { useMemo, useState } from "react";
import SeasonNav from "@/components/season-nav";
import { useMatches } from "@/components/matches-context";
import { getSeasons, getStandings } from "@/lib/season-utils";
import { formatOfficialSync, useOfficialCompetition } from "@/components/official-competition";
import type { OfficialCompetition, OfficialStanding } from "@/lib/madrid-competition";
import { getTeamCrest } from "@/lib/team-crests";

const normalize = (value: string) => value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]/gi, "").toUpperCase();

function standingsWithRegisteredResults(official: OfficialCompetition | null, matches: ReturnType<typeof useMatches>["matches"], season: string): OfficialStanding[] {
  if (!official?.standings.length) return [];
  const table = new Map(official.standings.map((team) => [team.team, { ...team, played: 0, won: 0, drawn: 0, lost: 0, goalsFor: 0, goalsAgainst: 0, points: 0 }]));
  const addResult = (homeTeam: string, awayTeam: string, homeScore: number, awayScore: number) => {
    const home = table.get(homeTeam); const away = table.get(awayTeam); if (!home || !away) return;
    home.played += 1; away.played += 1; home.goalsFor += homeScore; home.goalsAgainst += awayScore; away.goalsFor += awayScore; away.goalsAgainst += homeScore;
    if (homeScore === awayScore) { home.drawn += 1; away.drawn += 1; home.points += 1; away.points += 1; }
    else { const winner = homeScore > awayScore ? home : away; const loser = winner === home ? away : home; winner.won += 1; loser.lost += 1; winner.points += 3; }
  };
  for (const fixture of official.matches) {
    const opponent = normalize(fixture.homeTeam).includes("ALDAPAN") ? fixture.awayTeam : fixture.homeTeam;
    const recorded = matches.find((match) => match.season === season && match.competition.startsWith("Liga") && match.status === "finished" && match.date.slice(0, 10) === fixture.date && normalize(match.opponent) === normalize(opponent));
    const homeScore = recorded ? (recorded.isHome !== false ? recorded.homeScore : recorded.awayScore) : fixture.homeScore;
    const awayScore = recorded ? (recorded.isHome !== false ? recorded.awayScore : recorded.homeScore) : fixture.awayScore;
    if (homeScore !== null && awayScore !== null) addResult(fixture.homeTeam, fixture.awayTeam, homeScore, awayScore);
  }
  return [...table.values()].sort((a, b) => b.points - a.points || (b.goalsFor - b.goalsAgainst) - (a.goalsFor - a.goalsAgainst) || b.goalsFor - a.goalsFor || a.team.localeCompare(b.team)).map((team, index) => ({ ...team, position: index + 1 }));
}

export default function StandingsPage() {
  const { matches } = useMatches();
  const seasons = useMemo(() => getSeasons(matches), [matches]);
  const [selectedSeason, setSelectedSeason] = useState("2026/27");
  const visibleSeason = seasons.includes(selectedSeason) ? selectedSeason : seasons[0];
  const standings = getStandings(matches, visibleSeason);
  const { data: official, loading } = useOfficialCompetition(visibleSeason);
  const registeredOfficialStandings = useMemo(() => standingsWithRegisteredResults(official, matches, visibleSeason), [official, matches, visibleSeason]);
  const visibleStandings = registeredOfficialStandings.length ? registeredOfficialStandings : standings;
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
      <div className="detail-card-heading"><h2>Tabla</h2><span>{official?.standings.length ? `Oficial + resultados registrados · ${formatOfficialSync(official.syncedAt)}` : loading ? "Cargando clasificación oficial…" : visibleSeason === "2025/26" ? "Fuente: jdmmadrid.es" : "Pendiente de sincronización oficial"}</span></div>
      <div className="standings-table">
        <div className="standings-head"><span>Pos</span><span>Equipo</span><span>PJ</span><span>GF</span><span>GC</span><span>DG</span><span>Pts</span></div>
        {visibleStandings.map((team) => <div className={team.team.toUpperCase().includes("ALDAPAN GORA") ? "standings-row highlight" : "standings-row"} key={team.team}>
          <span>{team.position}</span><strong>{getTeamCrest(team.team) ? <img className="team-crest" src={getTeamCrest(team.team)!} alt="" /> : null}{team.team}</strong><span>{team.played}</span><span>{team.goalsFor}</span><span>{team.goalsAgainst}</span><span>{team.goalsFor - team.goalsAgainst}</span><b>{team.points}</b>
        </div>)}
      </div>
    </section>
  </main>;
}
