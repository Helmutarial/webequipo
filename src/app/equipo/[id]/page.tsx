"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useMemo, useState } from "react";
import { useTeam } from "@/components/team-context";
import { useMatches } from "@/components/matches-context";
import { calculatePlayerStats } from "@/lib/player-stats";
import { getMatchSeason, getSeasons } from "@/lib/season-utils";

type CompetitionFilter = "league" | "friendly" | "all";

export default function PlayerPage() {
  const { id } = useParams<{ id: string }>();
  const { players } = useTeam();
  const { matches, loading } = useMatches();
  const player = players.find((item) => item.id === id);
  const seasons = useMemo(() => getSeasons(matches), [matches]);
  const [selectedSeason, setSelectedSeason] = useState("2026/27");
  const [competition, setCompetition] = useState<CompetitionFilter>("league");
  const visibleSeason = seasons.includes(selectedSeason) ? selectedSeason : seasons[0];
  const scopedMatches = matches.filter((match) => getMatchSeason(match) === visibleSeason && (competition === "all" || competition === "league" && match.competition.startsWith("Liga") || competition === "friendly" && !match.competition.startsWith("Liga")));
  const stats = player ? calculatePlayerStats(scopedMatches, [player.id]).get(player.id) : undefined;

  if (!player) return <main className="content-page shell"><p>Jugador no encontrado.</p><Link className="text-link" href="/equipo">Volver al equipo</Link></main>;
  const visibleStats = stats ?? { goals: 0, assists: 0, appearances: 0, minutes: 0, starterAppearances: 0, substituteAppearances: 0, mvpCount: 0 };

  return <main className="content-page shell"><Link className="text-link" href="/equipo">← Volver a la plantilla</Link><section className="player-profile"><div className="profile-photo">{player.photo ? <img src={player.photo} alt={player.name} /> : <span>{player.name.slice(0, 1)}</span>}<b>{player.number ? `#${player.number}` : "Sin dorsal"}</b></div><div className="profile-copy"><span className="section-label">FICHA DEL JUGADOR</span><h1>{player.name}<em>.</em></h1><p className="profile-alias">“{player.alias}”</p><p>{player.bio}</p><div className="player-stats-filter"><label>Temporada<select value={visibleSeason} onChange={(event) => setSelectedSeason(event.target.value)}>{seasons.map((season) => <option value={season} key={season}>{season}</option>)}</select></label><label>Competición<select value={competition} onChange={(event) => setCompetition(event.target.value as CompetitionFilter)}><option value="league">Liga</option><option value="friendly">Amistosos</option><option value="all">Todo</option></select></label></div><p className="player-stats-caption">{loading ? "Cargando estadísticas…" : `${visibleSeason} · ${competition === "league" ? "Liga" : competition === "friendly" ? "Amistosos" : "Todas las competiciones"}`}</p><div className="player-stats"><div><strong>{visibleStats.appearances}</strong><span>Partidos</span></div><div><strong>{visibleStats.minutes}</strong><span>Minutos</span></div><div><strong>{visibleStats.starterAppearances}</strong><span>Titular</span></div><div><strong>{visibleStats.substituteAppearances}</strong><span>Suplente</span></div><div><strong>{visibleStats.goals}</strong><span>Goles</span></div><div><strong>{visibleStats.assists}</strong><span>Asistencias</span></div><div><strong>{visibleStats.mvpCount}</strong><span>MVP</span></div></div></div></section></main>;
}
