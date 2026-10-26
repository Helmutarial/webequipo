"use client";

import { useMemo, useState } from "react";
import SeasonNav from "@/components/season-nav";
import { useMatches } from "@/components/matches-context";
import { getMatchSeason, getSeasons } from "@/lib/season-utils";
import { formatOfficialSync, useOfficialCompetition } from "@/components/official-competition";
import type { OfficialMatch } from "@/lib/madrid-competition";
import { getTeamCrest } from "@/lib/team-crests";

const formatDate = (value: string, time: string) => new Date(`${value}T${time || "00:00"}:00`).toLocaleDateString("es-ES", { weekday: "short", day: "2-digit", month: "short" }).toUpperCase();
const normalize = (value: string) => value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]/gi, "").toUpperCase();

function withRegisteredResult(fixture: OfficialMatch, matches: ReturnType<typeof useMatches>["matches"], season: string) {
  const aldapanHome = normalize(fixture.homeTeam).includes("ALDAPAN");
  const opponent = aldapanHome ? fixture.awayTeam : fixture.homeTeam;
  const registered = matches.find((match) => getMatchSeason(match) === season && match.competition.startsWith("Liga") && match.status === "finished" && match.date.slice(0, 10) === fixture.date && normalize(match.opponent) === normalize(opponent));
  // Los marcadores del Aldapan solo proceden de los partidos registrados por el club.
  if (!registered || registered.homeScore === null || registered.awayScore === null) return aldapanHome || normalize(fixture.awayTeam).includes("ALDAPAN") ? { ...fixture, homeScore: null, awayScore: null } : fixture;
  return { ...fixture, homeScore: registered.isHome !== false ? registered.homeScore : registered.awayScore, awayScore: registered.isHome !== false ? registered.awayScore : registered.homeScore, status: "F" };
}

export default function MatchdaysPage() {
  const { matches } = useMatches(); const seasons = useMemo(() => getSeasons(matches), [matches]);
  const [selectedSeason, setSelectedSeason] = useState("2026/27"); const visibleSeason = seasons.includes(selectedSeason) ? selectedSeason : seasons[0];
  const { data, loading } = useOfficialCompetition(visibleSeason);
  const fixtures = (data?.matches || []).map((match) => withRegisteredResult(match, matches, visibleSeason));
  const matchdays = fixtures.reduce<Record<number, OfficialMatch[]>>((groups, match) => { groups[match.jornada] = [...(groups[match.jornada] || []), match]; return groups; }, {});
  return <main className="content-page shell"><div className="page-intro"><div><span className="section-label">COMPETICIÓN OFICIAL</span><h1>Jornadas<span>.</span></h1><p>Todos los encuentros del grupo del Aldapan Gora, actualizados desde el Ayuntamiento de Madrid.</p></div><label className="season-selector">Temporada<select value={visibleSeason} onChange={(event) => setSelectedSeason(event.target.value)}>{seasons.map((season) => <option value={season} key={season}>{season}</option>)}</select></label></div><SeasonNav />{loading ? <p className="muted">Cargando jornadas oficiales…</p> : fixtures.length ? <><p className="official-source">Ayuntamiento de Madrid · Última consulta: {formatOfficialSync(data?.syncedAt ?? null)} · Los resultados registrados del Aldapan se conservan hasta que sean oficiales.</p><div className="matchdays">{Object.entries(matchdays).sort(([a], [b]) => Number(a) - Number(b)).map(([number, dayMatches]) => <section className="matchday-card" key={number}><h2>Jornada {number}</h2>{dayMatches.map((match) => <div className="official-match" key={`${match.homeTeam}-${match.awayTeam}`}><time>{formatDate(match.date, match.time)}<small>{match.time}</small></time><strong className="official-team home">{getTeamCrest(match.homeTeam) ? <img src={getTeamCrest(match.homeTeam)!} alt={`Escudo de ${match.homeTeam}`} /> : null}{match.homeTeam}</strong><b>{match.homeScore ?? "—"} – {match.awayScore ?? "—"}</b><strong className="official-team away">{match.awayTeam}{getTeamCrest(match.awayTeam) ? <img src={getTeamCrest(match.awayTeam)!} alt={`Escudo de ${match.awayTeam}`} /> : null}</strong><small>{match.venue}</small></div>)}</section>)}</div></> : <p className="muted">Aún no se han descargado las jornadas oficiales. Se actualizarán en la próxima sincronización.</p>}</main>;
}
