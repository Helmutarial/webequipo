"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useMatches } from "@/components/matches-context";
import { useTeam } from "@/components/team-context";
import { calculateMatchMinutes } from "@/lib/player-stats";

const eventIcon = { goal: "GOL", substitution: "CAM", yellow: "TA", mvp: "MVP" };
const eventLabel = { goal: "Gol", substitution: "Cambio", yellow: "Tarjeta", mvp: "MVP" };
const roleByIndex = (index: number) => index === 0 ? "POR" : index < 5 ? "DEF" : index < 8 ? "MED" : "ATA";
const formatDate = (date: string) => new Date(date).toLocaleDateString("es-ES", { weekday: "long", day: "numeric", month: "long", year: "numeric" });

export default function MatchPage() {
  const { id } = useParams<{ id: string }>();
  const { matches, loading } = useMatches();
  const { players } = useTeam();
  const match = matches.find((item) => item.id === id);
  const playerIds = new Set(players.map((player) => player.id));
  const playerName = (playerId: string) => players.find((player) => player.id === playerId)?.name || playerId;

  if (loading) return <main className="content-page shell"><p className="muted">Cargando partido...</p></main>;
  if (!match) return <main className="content-page shell"><h1>Partido no encontrado<span>.</span></h1><Link className="text-link" href="/partidos">Volver a partidos</Link></main>;

  const goals = match.events.filter((event) => event.type === "goal");
  const substitutions = match.events.filter((event) => event.type === "substitution");
  const minutes = calculateMatchMinutes(match, players.map((player) => player.id));
  const mvp = match.events.find((event) => event.type === "mvp");
  const substitutionIn = new Map(substitutions.map((event) => [event.player, event.minute]));
  const substitutionOut = new Map(substitutions.map((event) => [event.relatedPlayer, event.minute]));

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

    <section className="match-detail-card lineup-overview-card">
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
    </section>

    <div className="match-detail-grid">
      <section className="match-detail-card">
        <div className="detail-card-heading"><h2>Eventos del partido</h2><span>{match.events.length} acciones</span></div>
        <div className="timeline">
          {match.events.filter((event) => event.type !== "mvp").map((event, index) => <div className="timeline-row" key={`${event.minute}-${index}`}>
            <time>{event.minute}'</time>
            <i className={`event-icon ${event.type}`}>{eventIcon[event.type]}</i>
            <div>
              <strong>{eventLabel[event.type]}</strong>
              <span>{event.type === "substitution" ? `${playerName(event.player)} entra por ${playerName(event.relatedPlayer || "")}` : event.type === "goal" ? playerName(event.player) : event.detail || playerName(event.player)}</span>
            </div>
          </div>)}
        </div>
        {mvp && <div className="mvp-callout"><span>MVP</span><div><small>JUGADOR DEL PARTIDO</small><strong>{playerName(mvp.player)}</strong></div></div>}
      </section>

      <section className="match-detail-card scorers-card">
        <div className="detail-card-heading"><h2>Goles</h2><span>{goals.length} goles registrados</span></div>
        <div className="scorers-grid">
          {goals.map((goal, index) => <div className={playerIds.has(goal.player) ? "" : "opponent-goal"} key={`${goal.minute}-${index}`}>
            <time>{goal.minute}'</time>
            <strong>{playerName(goal.player)}</strong>
            <span>{goal.relatedPlayer && playerIds.has(goal.relatedPlayer) ? `Asistencia: ${playerName(goal.relatedPlayer)}` : goal.detail}</span>
          </div>)}
        </div>
        <h3 className="bench-title">Cambios realizados</h3>
        <div className="substitution-list">
          {substitutions.map((event, index) => <div key={`${event.minute}-${index}`}><time>{event.minute}'</time><span><b>{playerName(event.player)}</b> por {playerName(event.relatedPlayer || "")}</span></div>)}
        </div>
      </section>
    </div>
  </main>;
}
