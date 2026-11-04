"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { useTeam } from "@/components/team-context";
import { useMatches } from "@/components/matches-context";
import { calculatePlayerStats } from "@/lib/player-stats";
import { getMatchSeason, getSeasons } from "@/lib/season-utils";
import { useAuth } from "@/components/auth-context";
import { RichTextDisplay, RichTextEditor } from "@/components/rich-text-editor";

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
  const [privateProfile, setPrivateProfile] = useState<{ age: number | null; heightCm: number | null; weightKg: number | null; dominantFoot: string; naturalPosition: string; secondaryPositions: string; analysis: string; keysToUse: string; cautions: string; tacticalFit: string; comments: { id: string; authorName: string; body: string; createdAt: string; authorPhoto?: string }[] } | null>(null);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [commentDraft, setCommentDraft] = useState("");
  const isAdmin = session?.role === "ADMIN";

  useEffect(() => {
    if (!isAdmin || !id) { setPrivateProfile(null); return; }
    void fetch(`/api/admin/player-profiles/${id}`, { cache: "no-store" }).then(async (response) => {
      if (!response.ok) return setPrivateProfile(null);
      const data = await response.json();
      setPrivateProfile({ ...data.profile, comments: data.comments || [] });
    }).catch(() => setPrivateProfile(null));
  }, [id, isAdmin]);

  const savePrivateProfile = async () => {
    if (!privateProfile) return;
    setSaving(true);
    const response = await fetch(`/api/admin/player-profiles/${id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(privateProfile) });
    setSaving(false);
    if (response.ok) setEditing(false);
  };
  const addComment = async () => {
    if (!commentDraft.trim()) return;
    const response = await fetch(`/api/admin/player-profiles/${id}/comments`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ body: commentDraft }) });
    if (!response.ok) return;
    setCommentDraft("");
    const data = await fetch(`/api/admin/player-profiles/${id}`, { cache: "no-store" }).then((result) => result.json());
    setPrivateProfile({ ...data.profile, comments: data.comments || [] });
  };

  if (!player) return <main className="content-page shell"><p>Jugador no encontrado.</p><Link className="text-link" href="/equipo">Volver al equipo</Link></main>;
  const visibleStats = stats ?? { goals: 0, assists: 0, appearances: 0, minutes: 0, starterAppearances: 0, substituteAppearances: 0, mvpCount: 0 };

  const sections = [["Análisis", "analysis", "analysis"], ["Claves de aprovechamiento", "keysToUse", "positive"], ["Precauciones", "cautions", "warning"], ["Encaje táctico", "tacticalFit", "fit"]] as const;
  return <main className="content-page shell"><Link className="text-link" href="/equipo">← Volver a la plantilla</Link><section className="player-profile"><div className="profile-photo">{player.photo ? <img src={player.photo} alt={player.name} /> : <span>{player.name.slice(0, 1)}</span>}<b>{player.number ? `#${player.number}` : "Sin dorsal"}</b></div><div className="profile-copy"><span className="section-label">FICHA DEL JUGADOR</span><h1>{player.name}<em>.</em></h1><p className="profile-alias">“{player.alias}”</p><p>{player.bio}</p><div className="player-stats-filter"><label>Temporada<select value={visibleSeason} onChange={(event) => setSelectedSeason(event.target.value)}>{seasons.map((season) => <option value={season} key={season}>{season}</option>)}</select></label><label>Competición<select value={competition} onChange={(event) => setCompetition(event.target.value as CompetitionFilter)}><option value="league">Liga</option><option value="friendly">Amistosos</option><option value="all">Todo</option></select></label></div><p className="player-stats-caption">{loading ? "Cargando estadísticas…" : `${visibleSeason} · ${competition === "league" ? "Liga" : competition === "friendly" ? "Amistosos" : "Todas las competiciones"}`}</p><div className="player-stats"><div><strong>{visibleStats.appearances}</strong><span>Partidos</span></div><div><strong>{visibleStats.minutes}</strong><span>Minutos</span></div><div><strong>{visibleStats.starterAppearances}</strong><span>Titular</span></div><div><strong>{visibleStats.substituteAppearances}</strong><span>Suplente</span></div><div><strong>{visibleStats.goals}</strong><span>Goles</span></div><div><strong>{visibleStats.assists}</strong><span>Asistencias</span></div><div><strong>{visibleStats.mvpCount}</strong><span>MVP</span></div></div></div></section>{isAdmin && privateProfile && <section className="private-player-view"><div className="private-player-head"><div><span className="section-label">VESTUARIO · SOLO ADMINISTRADORES</span><h2>Informe deportivo</h2></div><button className="text-action" onClick={() => setEditing(!editing)}>{editing ? "Cancelar" : "Editar ficha"}</button></div><div className="private-player-facts"><span>{privateProfile.age ?? "—"} años</span><span>{privateProfile.heightCm ?? "—"} cm</span><span>{privateProfile.weightKg ?? "—"} kg</span><span>{privateProfile.dominantFoot || "Pie sin registrar"}</span><span>{privateProfile.naturalPosition || "Posición sin registrar"}</span></div>{sections.map(([title, field, tone]) => <article className={`private-section ${tone}`} key={field}><h3>{title}</h3>{editing ? <RichTextEditor label={title} value={privateProfile[field]} onChange={(value) => setPrivateProfile({ ...privateProfile, [field]: value })} /> : <RichTextDisplay value={privateProfile[field]} />}</article>)}{editing && <button className="primary-button" onClick={savePrivateProfile} disabled={saving}>{saving ? "Guardando…" : "Guardar cambios"}</button>}<article className="private-comments"><h3>Comentarios de la junta</h3><div className="comment-compose"><textarea value={commentDraft} onChange={(event) => setCommentDraft(event.target.value)} placeholder="Añadir un comentario interno…" /><button className="text-action" onClick={addComment}>Enviar</button></div>{privateProfile.comments.map((comment) => <div className="comment-bubble" key={comment.id}>{comment.authorPhoto ? <img src={comment.authorPhoto} alt="" /> : <span>{comment.authorName.slice(0, 1)}</span>}<p><strong>{comment.authorName}</strong>{comment.body}</p></div>)}</article></section>}</main>;
}
