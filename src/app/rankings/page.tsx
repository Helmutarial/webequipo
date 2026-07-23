"use client";

import { useMemo, useState } from "react";
import SeasonNav from "@/components/season-nav";
import { useMatches } from "@/components/matches-context";
import { useTeam } from "@/components/team-context";
import { calculatePlayerStats } from "@/lib/player-stats";
import { getMatchSeason, getSeasons } from "@/lib/season-utils";

const rankingConfig = [
  { key: "goals", label: "Máximo goleador", unit: "goles" },
  { key: "assists", label: "Asistencias", unit: "asis." },
  { key: "minutes", label: "Más minutos", unit: "min" },
  { key: "appearances", label: "Partidos jugados", unit: "PJ" },
  { key: "starterAppearances", label: "Titularidades", unit: "tit." },
  { key: "mvpCount", label: "MVP", unit: "MVP" },
] as const;

export default function RankingsPage() {
  const { matches } = useMatches();
  const { players } = useTeam();
  const seasons = useMemo(() => getSeasons(matches), [matches]);
  const [selectedSeason, setSelectedSeason] = useState("2026/27");
  const visibleSeason = seasons.includes(selectedSeason) ? selectedSeason : seasons[0];
  const seasonMatches = matches.filter((match) => getMatchSeason(match) === visibleSeason);
  const activePlayers = players.filter((player) => player.active);
  const totals = calculatePlayerStats(seasonMatches, activePlayers.map((player) => player.id));
  const rankedPlayers = activePlayers.map((player) => ({ player, stats: totals.get(player.id) ?? player }));

  return <main className="content-page shell">
    <div className="page-intro">
      <div><span className="section-label">TEMPORADA {visibleSeason}</span><h1>Rankings<span>.</span></h1><p>Goles, asistencias, minutos y presencia en el campo.</p></div>
      <label className="season-selector">Temporada<select value={visibleSeason} onChange={(event) => setSelectedSeason(event.target.value)}>{seasons.map((season) => <option value={season} key={season}>{season}</option>)}</select></label>
    </div>
    <SeasonNav />
    <div className="rankings-grid">{rankingConfig.map((ranking) => {
      const rows = [...rankedPlayers].sort((a, b) => b.stats[ranking.key] - a.stats[ranking.key]).slice(0, 8);
      return <section className="ranking-card" key={ranking.key}>
        <div className="detail-card-heading"><h2>{ranking.label}</h2><span>{ranking.unit}</span></div>
        <div className="ranking-list">{rows.map(({ player, stats }, index) => <div className={index === 0 ? "ranking-row leader" : "ranking-row"} key={player.id}>
          <b>{index + 1}</b><span>{player.photo ? <img src={player.photo} alt="" /> : player.name.slice(0, 1)}</span><strong>{player.name}</strong><i>{stats[ranking.key]}</i>
        </div>)}</div>
      </section>;
    })}</div>
  </main>;
}

