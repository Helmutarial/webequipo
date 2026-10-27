"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { GiSoccerBall, GiSoccerKick } from "react-icons/gi";
import { useMatches } from "@/components/matches-context";
import { useTeam } from "@/components/team-context";
const roleByIndex = (index: number) => index === 0 ? "POR" : index < 5 ? "DEF" : index < 8 ? "MED" : "ATA";
const formatDate = (date: string) => new Date(date).toLocaleDateString("es-ES", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
const normalize = (value: string) => value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]/gi, "").toLowerCase();
const GoalIcon = () => <GiSoccerBall className="match-event-icon" aria-label="Gol" role="img" />;
const AssistIcon = () => <GiSoccerKick className="match-event-icon assist" aria-label="Asistencia" role="img" />;

export default function MatchPage() {
  const { id } = useParams<{ id: string }>();
  const { matches, loading } = useMatches();
  const { players } = useTeam();
  const match = matches.find((item) => item.id === id);
  const playerFor = (reference: string | undefined) => players.find((player) => player.id === reference || normalize(player.id) === normalize(reference || "") || normalize(player.id.split("-").at(-1) || "") === normalize(reference || ""));
  const playerName = (playerId: string) => playerFor(playerId)?.name || playerId;

  if (loading) return <main className="content-page shell"><p className="muted">Cargando partido...</p></main>;
  if (!match) return <main className="content-page shell"><h1>Partido no encontrado<span>.</span></h1><Link className="text-link" href="/jornadas">Volver a jornadas</Link></main>;

  const goals = match.events.filter((event) => event.type === "goal");
  const substitutions = match.events.filter((event) => event.type === "substitution");
  const mvp = match.events.find((event) => event.type === "mvp");
  const mvpPlayer = mvp ? playerFor(mvp.player) : undefined;
  const substitutionIn = new Map(substitutions.map((event) => [playerFor(event.player)?.id || event.player, event.minute]));
  const substitutionOut = new Map(substitutions.map((event) => [playerFor(event.relatedPlayer)?.id || event.relatedPlayer, event.minute]));
  const substitutionByIncomingPlayer = new Map(substitutions.map((event) => [playerFor(event.player)?.id || event.player, event]));
  const hasLineup = match.starters.length || match.substitutes.length;
  const aldapanFirst = match.isHome !== false;
  const eventMarks = new Map<string, { goals: number; assists: number }>();
  for (const event of goals) {
    const scorer = playerFor(event.player)?.id; const assistant = playerFor(event.relatedPlayer)?.id;
    if (scorer) eventMarks.set(scorer, { ...(eventMarks.get(scorer) || { goals: 0, assists: 0 }), goals: (eventMarks.get(scorer)?.goals || 0) + 1 });
    if (assistant) eventMarks.set(assistant, { ...(eventMarks.get(assistant) || { goals: 0, assists: 0 }), assists: (eventMarks.get(assistant)?.assists || 0) + 1 });
  }
  const starterId = (name: string) => match.starters.find((reference) => normalize(playerName(reference)) === normalize(name) || normalize(reference) === normalize(name));
  const preferredFormation = match.id === "liga-2026-27-aula"
    ? [["Juanjo"], ["Moreno", "Baroffi", "Ortiz"], ["Sergio", "Molina"], ["Dani", "Mauro", "Juanma", "Martin"], ["Javi"]]
    : [["Juanjo"], ["Ortiz", "Sergio", "Jare"], ["Izan", "Molina"], ["Dani", "Mauro", "Rey", "Dan"], ["Javi"]];
  const placedStarters = preferredFormation.flat().map(starterId).filter((playerId): playerId is string => Boolean(playerId));
  const formation = [...preferredFormation.map((row) => row.map(starterId).filter((playerId): playerId is string => Boolean(playerId))), ...match.starters.filter((playerId) => !placedStarters.includes(playerId)).map((playerId) => [playerId])];

  return <main className="content-page shell match-detail">
    <Link className="text-link" href={match.competition.startsWith("Liga") ? "/jornadas" : "/amistosos"}>Volver a {match.competition.startsWith("Liga") ? "jornadas" : "amistosos"}</Link>
    <header className="match-detail-header">
      <span className="section-label">{match.competition} - {formatDate(match.date)}</span>
      <div className="match-scoreboard">
        {match.status === "bye" ? <b className="bye-score">DESCANSO</b> : <><div><strong>{aldapanFirst ? "Aldapan Gora" : match.opponent}</strong><small>{aldapanFirst ? "ALG" : match.opponentShort}</small></div><b>{aldapanFirst ? match.homeScore ?? "—" : match.awayScore ?? "—"} - {aldapanFirst ? match.awayScore ?? "—" : match.homeScore ?? "—"}</b><div><small>{aldapanFirst ? match.opponentShort : "ALG"}</small><strong>{aldapanFirst ? match.opponent : "Aldapan Gora"}</strong></div></>}
      </div>
      <p>{match.venue || "Sin partido"} - {match.status === "finished" ? `Finalizado · ${match.duration || 90}'` : match.status === "bye" ? "Jornada de descanso" : "Próximo partido"}</p>
    </header>

    {hasLineup && match.competition.startsWith("Liga") ? <section className="match-detail-card league-lineup-card">
      <div className="league-lineup-layout">
        <div className="league-pitch-panel">
          <div className="detail-card-heading"><h2>Alineación</h2><span>{match.starters.length} jugadores</span></div>
          <div className="league-pitch">
            <i className="league-halfway" /><i className="league-circle" /><i className="league-box top" /><i className="league-box bottom" />
            <div className="league-formation">{formation.map((row, rowIndex) => <div className={`league-line league-line-${rowIndex}`} key={rowIndex}>{row.map((playerId) => {
              const player = playerFor(playerId); const marks = eventMarks.get(player?.id || playerId);
              return <div className="league-player" key={playerId}>{player?.photo ? <img src={player.photo} alt={player.name} /> : <span className="league-player-placeholder">{playerName(playerId).slice(0, 1)}</span>}<b>{playerName(playerId)}</b>{player?.number ? <i>#{player.number}</i> : null}{marks?.goals || marks?.assists ? <span className="league-event-markers">{marks?.goals ? <em className="league-event goal"><GoalIcon />{marks.goals > 1 ? marks.goals : null}</em> : null}{marks?.assists ? <em className="league-event assist"><AssistIcon />{marks.assists > 1 ? marks.assists : null}</em> : null}</span> : null}{substitutionOut.has(player?.id || playerId) ? <small>CAM {substitutionOut.get(player?.id || playerId)}'</small> : null}</div>;
            })}</div>)}</div>
          </div>
        </div>
        <aside className="league-bench-panel">
          <div className="detail-card-heading"><h2>Cambios</h2><span>{substitutions.length}</span></div>
          <p className="bench-panel-help">Suplentes utilizados</p>
          <div className="league-bench-photos">{match.substitutes.map((playerId) => {
            const player = playerFor(playerId); const incomingKey = player?.id || playerId; const substitution = substitutionByIncomingPlayer.get(incomingKey);
            return <div className="league-bench-player" key={playerId}>{player?.photo ? <img src={player.photo} alt={player.name} /> : <span>{playerName(playerId).slice(0, 1)}</span>}<div><b>{playerName(playerId)}</b>{substitution ? <small><time>{substitution.minute}'</time><i>entra por</i><strong>{playerName(substitution.relatedPlayer || "")}</strong></small> : <small className="unused-substitute">Sin minutos</small>}</div></div>;
          })}</div>
        </aside>
      </div>
    </section> : hasLineup ? <section className="match-detail-card lineup-overview-card">
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
    </section> : null}

    <section className="match-detail-card match-summary-card">
      <div className="detail-card-heading"><h2>Resumen del partido</h2><span>{goals.length} goles</span></div>
      <div className="scorer-summary">{goals.map((goal, index) => {
        const ownGoal = normalize(goal.player).includes("golenpropiapuerta");
        return <div key={`${goal.player}-${index}`}><strong className={ownGoal ? "own-goal-name" : undefined}>{ownGoal ? playerName(goal.player) : <><GoalIcon />{playerName(goal.player)}</>}</strong><span>{ownGoal ? "Autogol" : "Gol"}</span>{goal.relatedPlayer ? <small><AssistIcon />Asistencia: {playerName(goal.relatedPlayer)}</small> : null}</div>;
      })}</div>
    </section>
    {mvp ? <section className="match-detail-card match-mvp-spotlight">
      <div><span className="section-label">JUGADOR DEL PARTIDO</span><h2>MVP: {playerName(mvp.player)}</h2><p>{mvpPlayer?.alias || "Partido enorme de principio a fin."}</p></div>
      {mvpPlayer?.photo ? <img src={mvpPlayer.photo} alt={`Foto de ${mvpPlayer.name}`} /> : <div className="mvp-photo-placeholder">{playerName(mvp.player).slice(0, 1)}</div>}
    </section> : null}
  </main>;
}
