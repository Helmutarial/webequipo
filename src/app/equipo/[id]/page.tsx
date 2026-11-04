"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { useTeam } from "@/components/team-context";
import { useMatches } from "@/components/matches-context";
import { calculatePlayerStats } from "@/lib/player-stats";
import { getMatchSeason, getSeasons } from "@/lib/season-utils";
import { useAuth } from "@/components/auth-context";

type CompetitionFilter = "league" | "friendly" | "all";

export default function PlayerPage() {
  const { id } = useParams<{ id: string }>();
  const { players } = useTeam();
  const { matches, loading } = useMatches();
  const { session } = useAuth();
  const player = players.find((item) => item.id === id);
  const seasons = useMemo(() => getSeasons(matches), [matches]);
  const [selectedSeason, setSelectedSeason] = useState("2026/27");
  const [competition, setCompetition] = useState<CompetitionFilter>("league");
  const visibleSeason = seasons.includes(selectedSeason) ? selectedSeason : seasons[0];
  const scopedMatches = matches.filter((match) => getMatchSeason(match) === visibleSeason && (competition === "all" || competition === "league" && match.competition.startsWith("Liga") || competition === "friendly" && !match.competition.startsWith("Liga")));
  const stats = player ? calculatePlayerStats(scopedMatches, [player.id]).get(player.id) : undefined;
  const [privateProfile, setPrivateProfile] = useState<{ age: number | null; heightCm: number | null; weightKg: number | null; dominantFoot: string; naturalPosition: string; secondaryPositions: string; analysis: string; keysToUse: string; cautions: string; tacticalFit: string; comments: { id: string; authorName: string; body: string; createdAt: string }[] } | null>(null);
  const isAdmin = session?.role === "ADMIN";

  useEffect(() => {
    if (!isAdmin || !id) { setPrivateProfile(null); return; }
    void fetch(`/api/admin/player-profiles/${id}`, { cache: "no-store" }).then(async (response) => {
      if (!response.ok) return setPrivateProfile(null);
      const data = await response.json();
      setPrivateProfile({ ...data.profile, comments: data.comments || [] });
    }).catch(() => setPrivateProfile(null));
  }, [id, isAdmin]);

  if (!player) return <main className="content-page shell"><p>Jugador no encontrado.</p><Link className="text-link" href="/equipo">Volver al equipo</Link></main>;
  const visibleStats = stats ?? { goals: 0, assists: 0, appearances: 0, minutes: 0, starterAppearances: 0, substituteAppearances: 0, mvpCount: 0 };

  return <main className="content-page shell"><Link className="text-link" href="/equipo">← Volver a la plantilla</Link><section className="player-profile"><div className="profile-photo">{player.photo ? <img src={player.photo} alt={player.name} /> : <span>{player.name.slice(0, 1)}</span>}<b>{player.number ? `#${player.number}` : "Sin dorsal"}</b></div><div className="profile-copy"><span className="section-label">FICHA DEL JUGADOR</span><h1>{player.name}<em>.</em></h1><p className="profile-alias">“{player.alias}”</p><p>{player.bio}</p><div className="player-stats-filter"><label>Temporada<select value={visibleSeason} onChange={(event) => setSelectedSeason(event.target.value)}>{seasons.map((season) => <option value={season} key={season}>{season}</option>)}</select></label><label>Competición<select value={competition} onChange={(event) => setCompetition(event.target.value as CompetitionFilter)}><option value="league">Liga</option><option value="friendly">Amistosos</option><option value="all">Todo</option></select></label></div><p className="player-stats-caption">{loading ? "Cargando estadísticas…" : `${visibleSeason} · ${competition === "league" ? "Liga" : competition === "friendly" ? "Amistosos" : "Todas las competiciones"}`}</p><div className="player-stats"><div><strong>{visibleStats.appearances}</strong><span>Partidos</span></div><div><strong>{visibleStats.minutes}</strong><span>Minutos</span></div><div><strong>{visibleStats.starterAppearances}</strong><span>Titular</span></div><div><strong>{visibleStats.substituteAppearances}</strong><span>Suplente</span></div><div><strong>{visibleStats.goals}</strong><span>Goles</span></div><div><strong>{visibleStats.assists}</strong><span>Asistencias</span></div><div><strong>{visibleStats.mvpCount}</strong><span>MVP</span></div></div></div></section>{isAdmin && privateProfile && <section className="private-player-view"><span className="section-label">VESTUARIO · SOLO ADMINISTRADORES</span><h2>Informe deportivo</h2><div className="private-player-facts"><span>{privateProfile.age ?? "—"} años</span><span>{privateProfile.heightCm ?? "—"} cm</span><span>{privateProfile.weightKg ?? "—"} kg</span><span>{privateProfile.dominantFoot || "Pie sin registrar"}</span><span>{privateProfile.naturalPosition || "Posición sin registrar"}</span></div>{[["Análisis", privateProfile.analysis], ["Claves de aprovechamiento", privateProfile.keysToUse], ["Precauciones", privateProfile.cautions], ["Encaje táctico", privateProfile.tacticalFit]].filter(([, text]) => text).map(([title, text]) => <article key={title}><h3>{title}</h3><p>{text}</p></article>)}{privateProfile.comments.length > 0 && <article><h3>Comentarios de la junta</h3>{privateProfile.comments.map((comment) => <p key={comment.id}><strong>{comment.authorName}:</strong> {comment.body}</p>)}</article>}</section>}</main>;
}
