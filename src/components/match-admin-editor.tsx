"use client";

import { useRef, useState } from "react";
import { useMatches } from "@/components/matches-context";
import { Match, MatchEvent } from "@/lib/matches";
import { Player } from "@/lib/team";

const blankMatch = (): Match => ({
  id: "",
  opponent: "",
  opponentShort: "",
  date: new Date().toISOString().slice(0, 16),
  competition: "Amistoso",
  venue: "Campo Municipal - Gora",
  status: "upcoming",
  homeScore: null,
  awayScore: null,
  starters: [],
  substitutes: [],
  events: [],
});

const eventLabels = { goal: "Gol", substitution: "Cambio", yellow: "Tarjeta", mvp: "MVP" };

export default function MatchAdminEditor({ players }: { players: Player[] }) {
  const { matches, saveMatch, createMatch, deleteMatch } = useMatches();
  const [selected, setSelected] = useState<Match | null>(null);
  const [saved, setSaved] = useState(false);
  const [eventDraft, setEventDraft] = useState({ minute: "0", scorer: "", assist: "", subIn: "", subOut: "", mvp: "" });
  const editRef = useRef<HTMLElement | null>(null);
  const playerIds = new Set(players.map((player) => player.id));
  const playerName = (id: string) => players.find((player) => player.id === id)?.name || id;
  const reveal = () => window.setTimeout(() => editRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 0);

  const update = <K extends keyof Match>(field: K, value: Match[K]) => setSelected((current) => current ? { ...current, [field]: value } : current);
  const togglePlayer = (field: "starters" | "substitutes", playerId: string) => setSelected((current) => {
    if (!current) return current;
    const next = current[field].includes(playerId) ? current[field].filter((id) => id !== playerId) : [...current[field], playerId];
    const otherField = field === "starters" ? "substitutes" : "starters";
    return { ...current, [field]: next, [otherField]: current[otherField].filter((id) => id !== playerId) };
  });
  const addEvent = () => setSelected((current) => current ? { ...current, events: [...current.events, { minute: 0, type: "goal", player: players[0]?.id || "", relatedPlayer: "", detail: "Aldapan Gora" }] } : current);
  const addQuickEvent = (type: MatchEvent["type"]) => setSelected((current) => {
    if (!current) return current;
    const firstStarter = current.starters[0] || players[0]?.id || "";
    const firstSubstitute = current.substitutes[0] || players[0]?.id || "";
    const event: MatchEvent = type === "substitution"
      ? { minute: 60, type, player: firstSubstitute, relatedPlayer: firstStarter }
      : type === "mvp"
        ? { minute: 90, type, player: firstStarter }
        : { minute: 0, type, player: firstStarter, relatedPlayer: "", detail: "Aldapan Gora" };
    return { ...current, events: [...current.events, event] };
  });
  const addGoalDraft = (opponentGoal = false) => setSelected((current) => {
    if (!current) return current;
    const event: MatchEvent = {
      minute: Number(eventDraft.minute) || 0,
      type: "goal",
      player: opponentGoal ? current.opponent : eventDraft.scorer,
      relatedPlayer: opponentGoal ? "" : eventDraft.assist,
      detail: opponentGoal ? current.opponent : "Aldapan Gora",
    };
    if (!event.player) return current;
    return {
      ...current,
      homeScore: opponentGoal ? current.homeScore : (current.homeScore ?? 0) + 1,
      awayScore: opponentGoal ? (current.awayScore ?? 0) + 1 : current.awayScore,
      events: [...current.events, event],
    };
  });
  const addSubstitutionDraft = () => setSelected((current) => {
    if (!current || !eventDraft.subIn || !eventDraft.subOut) return current;
    return { ...current, events: [...current.events, { minute: Number(eventDraft.minute) || 0, type: "substitution", player: eventDraft.subIn, relatedPlayer: eventDraft.subOut }] };
  });
  const addMvpDraft = () => setSelected((current) => {
    if (!current || !eventDraft.mvp) return current;
    return { ...current, events: [...current.events.filter((event) => event.type !== "mvp"), { minute: 90, type: "mvp", player: eventDraft.mvp }] };
  });
  const updateEvent = <K extends keyof MatchEvent>(index: number, field: K, value: MatchEvent[K]) => setSelected((current) => current ? { ...current, events: current.events.map((event, eventIndex) => eventIndex === index ? { ...event, [field]: value } : event) } : current);
  const removeEvent = (index: number) => setSelected((current) => current ? { ...current, events: current.events.filter((_, eventIndex) => eventIndex !== index) } : current);
  const removePickedPlayer = (field: "starters" | "substitutes", playerId: string) => setSelected((current) => current ? { ...current, [field]: current[field].filter((id) => id !== playerId) } : current);
  const eventSummary = (event: MatchEvent) => {
    if (event.type === "goal") return `${playerName(event.player)}${event.relatedPlayer ? ` · asistencia ${playerName(event.relatedPlayer)}` : ""}`;
    if (event.type === "substitution") return `${playerName(event.player)} entra por ${playerName(event.relatedPlayer || "")}`;
    if (event.type === "mvp") return playerName(event.player);
    return event.detail || playerName(event.player);
  };

  const persist = async () => {
    if (!selected) return;
    const exists = Boolean(selected.id && matches.some((match) => match.id === selected.id));
    if (exists) await saveMatch(selected);
    else await createMatch(selected);
    setSaved(true);
    if (!exists) setSelected(null);
  };

  const liveHomeGoals = selected?.events.filter((event) => event.type === "goal" && playerIds.has(event.player)).length ?? 0;
  const liveAwayGoals = selected?.events.filter((event) => event.type === "goal" && !playerIds.has(event.player)).length ?? 0;
  const usedSubstitutes = selected?.events.filter((event) => event.type === "substitution").length ?? 0;

  return <div className="admin-layout match-admin-layout">
    <div className="admin-player-list news-list">
      <button className="save-button news-new-button" onClick={() => { setSelected(blankMatch()); setSaved(false); reveal(); }}>+ Nuevo partido</button>
      {matches.map((match) => <button className={selected?.id === match.id ? "admin-player active" : "admin-player"} onClick={() => { setSelected(match); setSaved(false); reveal(); }} key={match.id}>
        <span className="player-avatar">{match.opponentShort.slice(0, 1) || "P"}</span>
        <span><strong>{match.opponent}</strong><small>{match.competition} - {new Date(match.date).toLocaleDateString("es-ES")}</small></span>
        <b>Editar</b>
      </button>)}
    </div>

    {selected ? <section className="edit-card match-edit-card" ref={editRef}>
      <span className="section-label">{selected.id ? "EDITANDO PARTIDO" : "NUEVO PARTIDO"}</span>
      <h2>{selected.opponent || "Nuevo partido"}</h2>
      <div className="edit-grid">
        <label>Rival<input value={selected.opponent} onChange={(event) => update("opponent", event.target.value)} /></label>
        <label>Siglas rival<input maxLength={5} value={selected.opponentShort} onChange={(event) => update("opponentShort", event.target.value)} placeholder="RIV" /></label>
        <label>Fecha y hora<input type="datetime-local" value={selected.date.slice(0, 16)} onChange={(event) => update("date", event.target.value)} /></label>
        <label>Competicion<input value={selected.competition} onChange={(event) => update("competition", event.target.value)} /></label>
        <label className="full-field">Campo<input value={selected.venue} onChange={(event) => update("venue", event.target.value)} /></label>
        <label>Estado<select value={selected.status} onChange={(event) => update("status", event.target.value as Match["status"])}><option value="upcoming">Proximo</option><option value="finished">Finalizado</option></select></label>
        <label>Goles Aldapan<input type="number" value={selected.homeScore ?? ""} onChange={(event) => update("homeScore", event.target.value === "" ? null : Number(event.target.value))} /></label>
        <label>Goles rival<input type="number" value={selected.awayScore ?? ""} onChange={(event) => update("awayScore", event.target.value === "" ? null : Number(event.target.value))} /></label>
      </div>

      <div className="match-live-summary">
        <div><strong>{selected.starters.length}</strong><span>Titulares</span></div>
        <div><strong>{selected.substitutes.length}</strong><span>Suplentes</span></div>
        <div><strong>{usedSubstitutes}</strong><span>Cambios</span></div>
        <div><strong>{liveHomeGoals} - {liveAwayGoals}</strong><span>Goles en acta</span></div>
      </div>

      <div className="match-admin-section">
        <div className="detail-card-heading"><h3>Titulares</h3><span>{selected.starters.length}/11</span></div>
        {selected.starters.length ? <div className="picked-player-list">{selected.starters.map((playerId, index) => <button onClick={() => removePickedPlayer("starters", playerId)} key={playerId}><b>{index + 1}</b>{playerName(playerId)}<span>×</span></button>)}</div> : null}
        <div className="player-pick-grid">
          {players.map((player) => <button className={selected.starters.includes(player.id) ? "player-pick active" : "player-pick"} onClick={() => togglePlayer("starters", player.id)} key={player.id}>#{player.number || "-"} {player.name}</button>)}
        </div>
      </div>

      <div className="match-admin-section">
        <div className="detail-card-heading"><h3>Suplentes</h3><span>{selected.substitutes.length}</span></div>
        {selected.substitutes.length ? <div className="picked-player-list bench-picks">{selected.substitutes.map((playerId) => <button onClick={() => removePickedPlayer("substitutes", playerId)} key={playerId}>SUP {playerName(playerId)}<span>×</span></button>)}</div> : null}
        <div className="player-pick-grid">
          {players.map((player) => <button className={selected.substitutes.includes(player.id) ? "player-pick active" : "player-pick"} onClick={() => togglePlayer("substitutes", player.id)} key={player.id}>#{player.number || "-"} {player.name}</button>)}
        </div>
      </div>

      <div className="match-admin-section">
        <div className="detail-card-heading"><h3>Eventos</h3><button className="text-action" onClick={addEvent}>+ Evento manual</button></div>
        <div className="quick-event-actions">
          <button onClick={() => addQuickEvent("goal")}>+ Gol Aldapan</button>
          <button onClick={() => addQuickEvent("substitution")}>+ Cambio</button>
          <button onClick={() => addQuickEvent("mvp")}>+ MVP</button>
        </div>
        <div className="visual-acta">
          <label>Minuto<input type="number" value={eventDraft.minute} onChange={(event) => setEventDraft((current) => ({ ...current, minute: event.target.value }))} /></label>
          <div className="visual-acta-block">
            <h4>Gol</h4>
            <p>Elige goleador y, si quieres, asistente.</p>
            <div className="visual-acta-columns">
              <div><span>Goleador</span><div className="mini-player-grid">{[...selected.starters, ...selected.substitutes].map((playerId) => <button className={eventDraft.scorer === playerId ? "active" : ""} onClick={() => setEventDraft((current) => ({ ...current, scorer: playerId }))} key={playerId}>{playerName(playerId)}</button>)}</div></div>
              <div><span>Asistente</span><div className="mini-player-grid">{[...selected.starters, ...selected.substitutes].map((playerId) => <button className={eventDraft.assist === playerId ? "active" : ""} onClick={() => setEventDraft((current) => ({ ...current, assist: current.assist === playerId ? "" : playerId }))} key={playerId}>{playerName(playerId)}</button>)}</div></div>
            </div>
            <div className="visual-acta-actions"><button onClick={() => addGoalDraft(false)}>Añadir gol Aldapan</button><button onClick={() => addGoalDraft(true)}>Gol rival</button></div>
          </div>
          <div className="visual-acta-block">
            <h4>Cambio</h4>
            <p>Marca quién entra y quién sale.</p>
            <div className="visual-acta-columns">
              <div><span>Entra</span><div className="mini-player-grid">{selected.substitutes.map((playerId) => <button className={eventDraft.subIn === playerId ? "active" : ""} onClick={() => setEventDraft((current) => ({ ...current, subIn: playerId }))} key={playerId}>{playerName(playerId)}</button>)}</div></div>
              <div><span>Sale</span><div className="mini-player-grid">{selected.starters.map((playerId) => <button className={eventDraft.subOut === playerId ? "active" : ""} onClick={() => setEventDraft((current) => ({ ...current, subOut: playerId }))} key={playerId}>{playerName(playerId)}</button>)}</div></div>
            </div>
            <div className="visual-acta-actions"><button onClick={addSubstitutionDraft}>Añadir cambio</button></div>
          </div>
          <div className="visual-acta-block">
            <h4>MVP</h4>
            <p>Selecciona el jugador del partido.</p>
            <div className="mini-player-grid">{[...selected.starters, ...selected.substitutes].map((playerId) => <button className={eventDraft.mvp === playerId ? "active" : ""} onClick={() => setEventDraft((current) => ({ ...current, mvp: playerId }))} key={playerId}>{playerName(playerId)}</button>)}</div>
            <div className="visual-acta-actions"><button onClick={addMvpDraft}>Guardar MVP</button></div>
          </div>
        </div>
        <div className="event-editor-list">
          {selected.events.map((event, index) => <div className="event-editor-row" key={index}>
            <input type="number" value={event.minute} onChange={(change) => updateEvent(index, "minute", Number(change.target.value))} placeholder="min" />
            <select value={event.type} onChange={(change) => updateEvent(index, "type", change.target.value as MatchEvent["type"])}>
              {Object.entries(eventLabels).map(([value, label]) => <option value={value} key={value}>{label}</option>)}
            </select>
            <select value={event.player} onChange={(change) => updateEvent(index, "player", change.target.value)}>
              <option value={selected.opponent}>{selected.opponent || "Gol rival"}</option>
              {players.map((player) => <option value={player.id} key={player.id}>{player.name}</option>)}
            </select>
            <select value={event.relatedPlayer || ""} onChange={(change) => updateEvent(index, "relatedPlayer", change.target.value)}>
              <option value="">Sin asistencia / sale nadie</option>
              {players.map((player) => <option value={player.id} key={player.id}>{playerName(player.id)}</option>)}
            </select>
            <input value={event.detail || ""} onChange={(change) => updateEvent(index, "detail", change.target.value)} placeholder="Detalle" />
            <button className="delete-button compact" onClick={() => removeEvent(index)}>Quitar</button>
            <small>{event.minute || 0}' · {eventLabels[event.type]} · {eventSummary(event)}</small>
          </div>)}
          {!selected.events.length && <p className="muted">Todavia no hay eventos. Añade goles, cambios o MVP.</p>}
        </div>
      </div>

      <button className="save-button" onClick={persist}>{selected.id ? "Guardar partido" : "Crear partido"}</button>
      {selected.id && <button className="delete-button" onClick={async () => { await deleteMatch(selected.id); setSelected(null); }}>Eliminar</button>}
      {saved && <span className="saved-notice">Partido guardado.</span>}
    </section> : <section className="edit-empty"><span>←</span><p>Selecciona un partido o crea uno nuevo.</p></section>}
  </div>;
}
