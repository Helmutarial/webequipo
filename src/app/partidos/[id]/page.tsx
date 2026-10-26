"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useMatches } from "@/components/matches-context";
import { useTeam } from "@/components/team-context";
import { calculateMatchMinutes } from "@/lib/player-stats";
const roleByIndex = (index: number) => index === 0 ? "POR" : index < 5 ? "DEF" : index < 8 ? "MED" : "ATA";
const formatDate = (date: string) => new Date(date).toLocaleDateString("es-ES", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
const GoalIcon = () => <svg className="match-event-icon" viewBox="0 0 24 24" aria-label="Gol" role="img"><circle cx="12" cy="12" r="9" /><path d="m12 7 3 2.2-1.1 3.3h-3.8L9 9.2 12 7Zm-5.7 3.5 2.7-1.3m6-1.3 2.7 1.3m-10.7 7.5 3.1-4.2m3.8 0 3.1 4.2m-8.1.7 2.2 1.8m4.8-1.8-2.2 1.8" /></svg>;
const AssistIcon = () => <svg className="match-event-icon assist" viewBox="0 0 24 24" aria-label="Asistencia" role="img"><path d="M4 17.5h13.5c1.7 0 2.5-1.8 1.3-3l-3.5-2-3.4-5.3-2.6.6 1.2 4.4-2.8 1.7-1.8-1.1-1.9 1.6Z" /><path d="M15 6.5h4m-2-2 2 2-2 2" /></svg>;

export default function MatchPage() {
  const { id } = useParams<{ id: string }>();
  const { matches, loading } = useMatches();
  const { players } = useTeam();
  const match = matches.find((item) => item.id === id);
  const playerName = (playerId: string) => players.find((player) => player.id === playerId)?.name || playerId;

  if (loading) return <main className="content-page shell"><p className="muted">Cargando partido...</p></main>;
  if (!match) return <main className="content-page shell"><h1>Partido no encontrado<span>.</span></h1><Link className="text-link" href="/partidos">Volver a partidos</Link></main>;

  const goals = match.events.filter((event) => event.type === "goal");
  const substitutions = match.events.filter((event) => event.type === "substitution");
  const minutes = calculateMatchMinutes(match, players.map((player) => player.id));
  const mvp = match.events.find((event) => event.type === "mvp");
  const mvpPlayer = mvp ? players.find((player) => player.id === mvp.player) : undefined;
  const substitutionIn = new Map(substitutions.map((event) => [event.player, event.minute]));
  const substitutionOut = new Map(substitutions.map((event) => [event.relatedPlayer, event.minute]));
  const hasLineup = match.starters.length || match.substitutes.length;
  const aldapanFirst = match.isHome !== false;

  return <main className="content-page shell match-detail">
    <Link className="text-link" href="/partidos">Volver a partidos</Link>
    <header className="match-detail-header">
      <span className="section-label">{match.competition} - {formatDate(match.date)}</span>
      <div className="match-scoreboard">
        {match.status === "bye" ? <b className="bye-score">DESCANSO</b> : <><div><strong>{aldapanFirst ? "Aldapan Gora" : match.opponent}</strong><small>{aldapanFirst ? "ALG" : match.opponentShort}</small></div><b>{aldapanFirst ? match.homeScore ?? "—" : match.awayScore ?? "—"} - {aldapanFirst ? match.awayScore ?? "—" : match.homeScore ?? "—"}</b><div><small>{aldapanFirst ? match.opponentShort : "ALG"}</small><strong>{aldapanFirst ? match.opponent : "Aldapan Gora"}</strong></div></>}
      </div>
      <p>{match.venue || "Sin partido"} - {match.status === "finished" ? `Finalizado · ${match.duration || 90}'` : match.status === "bye" ? "Jornada de descanso" : "Próximo partido"}</p>
    </header>

    {hasLineup ? <section className="match-detail-card lineup-overview-card">
      <div className="detail-card-heading">
        <h2>Alineacion titular</h2>
        <span>{match.starters.length} jugadores</span>
      </div>
      <div className="lineup-list lineup-starters">
        {match.starters.map((playerId, index) => {
          const changedAt = substitutionOut.get(playerId);
          return <div className={changedAt ? "changed-player" : ""} key={playerId}>
            <b>{index + 1}</b>
            <span>{playerName(playerId)}{changedAt ? <i className="change-badge">CAM {changedAt}'</i> : null}</span>
            <small>{roleByIndex(index)}</small>
          </div>;
        })}
      </div>
      <h3 className="bench-title">Suplentes usados</h3>
      <div className="lineup-list bench">
        {match.substitutes.map((playerId) => {
          const enteredAt = substitutionIn.get(playerId);
          return <div className={enteredAt ? "changed-player" : ""} key={playerId}>
            <b>{enteredAt ? `${enteredAt}'` : "-"}</b>
            <span>{playerName(playerId)}{enteredAt ? <i className="change-badge in">ENTRA</i> : null}</span>
            <small>SUP</small>
          </div>;
        })}
      </div>
      {minutes.length ? <div className="public-minutes-summary">
        <h3 className="bench-title">Minutos jugados</h3>
        <div>{minutes.map((row) => <span key={row.playerId}><b>{playerName(row.playerId)}</b><i>{row.minutes}'</i></span>)}</div>
      </div> : null}
    </section> : null}

    <section className="match-detail-card match-summary-card">
      <div className="detail-card-heading"><h2>Resumen del partido</h2><span>{goals.length} goles</span></div>
      <div className="scorer-summary">{goals.map((goal, index) => <div key={`${goal.player}-${index}`}><strong><GoalIcon />{playerName(goal.player)}</strong><span>Gol</span>{goal.relatedPlayer ? <small><AssistIcon />Asistencia: {playerName(goal.relatedPlayer)}</small> : null}</div>)}</div>
    </section>
    {mvp ? <section className="match-detail-card match-mvp-spotlight">
      <div><span className="section-label">JUGADOR DEL PARTIDO</span><h2>MVP: {playerName(mvp.player)}</h2><p>{mvpPlayer?.alias || "Partido enorme de principio a fin."}</p></div>
      {mvpPlayer?.photo ? <img src={mvpPlayer.photo} alt={`Foto de ${mvpPlayer.name}`} /> : <div className="mvp-photo-placeholder">{playerName(mvp.player).slice(0, 1)}</div>}
    </section> : null}
  </main>;
}
