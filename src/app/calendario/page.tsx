"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import SeasonNav from "@/components/season-nav";
import { useMatches } from "@/components/matches-context";
import { getMatchSeason, getSeasons } from "@/lib/season-utils";

const formatDay = (date: string) => new Date(date).toLocaleDateString("es-ES", { weekday: "short", day: "2-digit" }).toUpperCase();
const formatMonth = (date: string) => new Date(date).toLocaleDateString("es-ES", { month: "long", year: "numeric" }).toUpperCase();
const formatTime = (date: string) => new Date(date).toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" });

export default function CalendarPage() {
  const { matches, loading } = useMatches();
  const seasons = useMemo(() => getSeasons(matches), [matches]);
  const [selectedSeason, setSelectedSeason] = useState("2025/26");
  const visibleSeason = seasons.includes(selectedSeason) ? selectedSeason : seasons[0];
  const seasonMatches = [...matches].filter((match) => getMatchSeason(match) === visibleSeason).sort((a, b) => a.date.localeCompare(b.date));
  const months = seasonMatches.reduce<Record<string, typeof seasonMatches>>((groups, match) => {
    const month = formatMonth(match.date);
    groups[month] = [...(groups[month] || []), match];
    return groups;
  }, {});

  return <main className="content-page shell">
    <div className="page-intro">
      <div><span className="section-label">TEMPORADA {visibleSeason}</span><h1>Calendario<span>.</span></h1><p>Partidos jugados, próximos encuentros y resultados.</p></div>
      <label className="season-selector">Temporada<select value={visibleSeason} onChange={(event) => setSelectedSeason(event.target.value)}>{seasons.map((season) => <option value={season} key={season}>{season}</option>)}</select></label>
    </div>
    <SeasonNav />
    {loading ? <p className="muted">Cargando calendario…</p> : <div className="calendar-months">{Object.entries(months).map(([month, monthMatches]) => <section className="calendar-month" key={month}>
      <h2>{month}</h2>
      <div>{monthMatches.map((match) => <Link className="calendar-match" href={`/partidos/${match.id}`} key={match.id}>
        <time>{formatDay(match.date)}<small>{formatTime(match.date)}</small></time>
        <div><span>{match.competition}</span><strong>Aldapan Gora vs {match.opponent}</strong><small>{match.venue}</small></div>
        <b>{match.status === "finished" ? `${match.homeScore} — ${match.awayScore}` : "Por jugar"}</b>
      </Link>)}</div>
    </section>)}</div>}
  </main>;
}

