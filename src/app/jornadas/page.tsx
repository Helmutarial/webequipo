"use client";

import { useMemo, useState } from "react";
import SeasonNav from "@/components/season-nav";
import { useMatches } from "@/components/matches-context";
import { getSeasons } from "@/lib/season-utils";
import { formatOfficialSync, useOfficialCompetition } from "@/components/official-competition";
import type { OfficialMatch } from "@/lib/madrid-competition";

const formatDate = (value: string, time: string) => new Date(`${value}T${time || "00:00"}:00`).toLocaleDateString("es-ES", { weekday: "short", day: "2-digit", month: "short" }).toUpperCase();

export default function MatchdaysPage() {
  const { matches } = useMatches(); const seasons = useMemo(() => getSeasons(matches), [matches]);
  const [selectedSeason, setSelectedSeason] = useState("2026/27"); const visibleSeason = seasons.includes(selectedSeason) ? selectedSeason : seasons[0];
  const { data, loading } = useOfficialCompetition(visibleSeason);
  const matchdays = (data?.matches || []).reduce<Record<number, OfficialMatch[]>>((groups, match) => { groups[match.jornada] = [...(groups[match.jornada] || []), match]; return groups; }, {});
  return <main className="content-page shell"><div className="page-intro"><div><span className="section-label">COMPETICIÓN OFICIAL</span><h1>Jornadas<span>.</span></h1><p>Todos los encuentros del grupo del Aldapan Gora, actualizados desde el Ayuntamiento de Madrid.</p></div><label className="season-selector">Temporada<select value={visibleSeason} onChange={(event) => setSelectedSeason(event.target.value)}>{seasons.map((season) => <option value={season} key={season}>{season}</option>)}</select></label></div><SeasonNav />{loading ? <p className="muted">Cargando jornadas oficiales…</p> : data?.matches.length ? <><p className="official-source">Ayuntamiento de Madrid · Última consulta: {formatOfficialSync(data.syncedAt)}</p><div className="matchdays">{Object.entries(matchdays).sort(([a], [b]) => Number(a) - Number(b)).map(([number, dayMatches]) => <section className="matchday-card" key={number}><h2>Jornada {number}</h2>{dayMatches.map((match) => <div className="official-match" key={`${match.homeTeam}-${match.awayTeam}`}><time>{formatDate(match.date, match.time)}<small>{match.time}</small></time><strong>{match.homeTeam}</strong><b>{match.homeScore ?? "—"} – {match.awayScore ?? "—"}</b><strong>{match.awayTeam}</strong><small>{match.venue}</small></div>)}</section>)}</div></> : <p className="muted">Aún no se han descargado las jornadas oficiales. Se actualizarán en la próxima sincronización.</p>}</main>;
}
