"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useMatches } from "@/components/matches-context";
import { useTeam } from "@/components/team-context";
import { calculateMatchMinutes } from "@/lib/player-stats";
const roleByIndex = (index: number) => index === 0 ? "POR" : index < 5 ? "DEF" : index < 8 ? "MED" : "ATA";
const formatDate = (date: string) => new Date(date).toLocaleDateString("es-ES", { weekday: "long", day: "numeric", month: "long", year: "numeric" });

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
  const scorers = [...goals.reduce((summary, goal) => summary.set(goal.player, (summary.get(goal.player) || 0) + 1), new Map<string, number>())];
  const hasLineup = match.starters.length || match.substitutes.length;

  return <main className="content-page shell match-detail">
    <Link className="text-link" href="/partidos">Volver a partidos</Link>
    <header className="match-detail-header">
      <span className="section-label">{match.competition} - {formatDate(match.date)}</span>
      <div className="match-scoreboard">
        <div><strong>Aldapan Gora</strong><small>ALG</small></div>
        <b>{match.homeScore} - {match.awayScore}</b>
        <div><small>{match.opponentShort}</small><strong>{match.opponent}</strong></div>
      </div>
      <p>{match.venue} - {match.status === "finished" ? `Finalizado · ${match.duration || 90}'` : "Proximo partido"}</p>
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
      <div className="scorer-summary">{scorers.map(([playerId, count]) => <div key={playerId}><strong>{playerName(playerId)}</strong><span>{count === 1 ? "1 gol" : `${count} goles`}</span></div>)}</div>
    </section>
    {mvp ? <section className="match-detail-card match-mvp-spotlight">
      <div><span className="section-label">JUGADOR DEL PARTIDO</span><h2>MVP: {playerName(mvp.player)}</h2><p>{mvpPlayer?.alias || "Partido enorme de principio a fin."}</p></div>
      {mvpPlayer?.photo ? <img src={mvpPlayer.photo} alt={`Foto de ${mvpPlayer.name}`} /> : <div className="mvp-photo-placeholder">{playerName(mvp.player).slice(0, 1)}</div>}
    </section> : null}
  </main>;
}
