"use client";

import Image from "next/image";
import { useMemo, useState } from "react";

type FormationKey = "4-3-3" | "4-4-2" | "3-5-2";
type Position = { id: string; label: string; x: number; y: number };
type Player = { id: string; name: string; number: number; position: string; initials: string };

const players: Player[] = [
  { id: "marcos", name: "Marcos", number: 1, position: "POR", initials: "M" },
  { id: "iker", name: "Iker", number: 13, position: "POR", initials: "I" },
  { id: "dani", name: "Dani", number: 2, position: "DEF", initials: "D" },
  { id: "javi", name: "Javi", number: 3, position: "DEF", initials: "J" },
  { id: "raul", name: "Raúl", number: 4, position: "DEF", initials: "R" },
  { id: "pablo", name: "Pablo", number: 5, position: "DEF", initials: "P" },
  { id: "sergio", name: "Sergio", number: 6, position: "MED", initials: "S" },
  { id: "alex", name: "Álex", number: 8, position: "MED", initials: "Á" },
  { id: "unai", name: "Unai", number: 10, position: "MED", initials: "U" },
  { id: "tomas", name: "Tomás", number: 14, position: "MED", initials: "T" },
  { id: "lucas", name: "Lucas", number: 17, position: "MED", initials: "L" },
  { id: "adrian", name: "Adrián", number: 7, position: "ATA", initials: "A" },
  { id: "mateo", name: "Mateo", number: 9, position: "ATA", initials: "M" },
  { id: "gael", name: "Gael", number: 11, position: "ATA", initials: "G" },
  { id: "nico", name: "Nico", number: 18, position: "ATA", initials: "N" },
  { id: "bruno", name: "Bruno", number: 19, position: "ATA", initials: "B" },
];

const formations: Record<FormationKey, Position[]> = {
  "4-3-3": [
    { id: "por", label: "POR", x: 50, y: 91 },
    { id: "ld", label: "DEF", x: 14, y: 72 }, { id: "dfc1", label: "DEF", x: 38, y: 76 }, { id: "dfc2", label: "DEF", x: 62, y: 76 }, { id: "li", label: "DEF", x: 86, y: 72 },
    { id: "mc1", label: "MED", x: 28, y: 52 }, { id: "mc2", label: "MED", x: 50, y: 57 }, { id: "mc3", label: "MED", x: 72, y: 52 },
    { id: "ed", label: "ATA", x: 18, y: 25 }, { id: "dc", label: "ATA", x: 50, y: 18 }, { id: "ei", label: "ATA", x: 82, y: 25 },
  ],
  "4-4-2": [
    { id: "por", label: "POR", x: 50, y: 91 },
    { id: "ld", label: "DEF", x: 14, y: 72 }, { id: "dfc1", label: "DEF", x: 38, y: 76 }, { id: "dfc2", label: "DEF", x: 62, y: 76 }, { id: "li", label: "DEF", x: 86, y: 72 },
    { id: "md", label: "MED", x: 14, y: 48 }, { id: "mc1", label: "MED", x: 38, y: 54 }, { id: "mc2", label: "MED", x: 62, y: 54 }, { id: "mi", label: "MED", x: 86, y: 48 },
    { id: "dc1", label: "ATA", x: 38, y: 23 }, { id: "dc2", label: "ATA", x: 62, y: 23 },
  ],
  "3-5-2": [
    { id: "por", label: "POR", x: 50, y: 91 },
    { id: "dfc1", label: "DEF", x: 25, y: 74 }, { id: "dfc2", label: "DEF", x: 50, y: 78 }, { id: "dfc3", label: "DEF", x: 75, y: 74 },
    { id: "md", label: "MED", x: 10, y: 50 }, { id: "mc1", label: "MED", x: 30, y: 56 }, { id: "mc2", label: "MED", x: 50, y: 49 }, { id: "mc3", label: "MED", x: 70, y: 56 }, { id: "mi", label: "MED", x: 90, y: 50 },
    { id: "dc1", label: "ATA", x: 37, y: 23 }, { id: "dc2", label: "ATA", x: 63, y: 23 },
  ],
};

export default function AlignmentBuilder() {
  const [formation, setFormation] = useState<FormationKey>("4-3-3");
  const [lineup, setLineup] = useState<Record<string, string[]>>({});
  const [selectedPlayer, setSelectedPlayer] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const positions = formations[formation];
  const assigned = useMemo(() => Object.values(lineup).flat(), [lineup]);
  const availablePlayers = players.filter((player) => !assigned.includes(player.id));

  const chooseFormation = (value: FormationKey) => { setFormation(value); setLineup({}); setSelectedPlayer(null); setSaved(false); };
  const addToPosition = (positionId: string) => {
    if (!selectedPlayer) return;
    setLineup((current) => {
      const existing = current[positionId] ?? [];
      if (existing.includes(selectedPlayer) || existing.length >= 2) return current;
      return { ...current, [positionId]: [...existing, selectedPlayer] };
    });
    setSelectedPlayer(null); setSaved(false);
  };
  const removePlayer = (positionId: string, playerId: string) => { setLineup((current) => ({ ...current, [positionId]: (current[positionId] ?? []).filter((id) => id !== playerId) })); setSaved(false); };
  const getPlayer = (id: string) => players.find((player) => player.id === id);

  return <main className="builder-page">
    <nav className="builder-nav shell"><a className="brand" href="/"><Image src="/club-crest.png" alt="Escudo Aldapan Gora" width={42} height={42} className="crest small" /><span>ALDAPAN<br /><i>GORA</i></span></a><div className="builder-breadcrumb"><span>Panel del equipo</span><b>/</b><strong>Creador de alineaciones</strong></div><a className="builder-back" href="/">Volver a la web <span>↗</span></a></nav>

    <section className="builder-heading shell"><div><span className="section-label">HERRAMIENTA DEL CUERPO TÉCNICO</span><h1>Creador de <em>alineaciones.</em></h1><p>Prepara el once, añade alternativas por posición y guarda la idea para el próximo partido.</p></div><div className="builder-match"><span>PRÓXIMO PARTIDO</span><strong>ALDAPAN GORA <b>VS</b> ATLÉTICO RIVAL</strong><small>Sáb · 28 JUN 2026 · 18:30</small></div></section>

    <section className="builder-workspace shell"><aside className="players-panel"><div className="panel-title"><div><span className="section-label">PLANTILLA</span><h2>Jugadores</h2></div><span className="player-count">{assigned.length}/11</span></div><p className="panel-help">Selecciona un jugador y pulsa una posición del campo. Puedes añadir hasta dos por posición.</p><div className="player-list">{players.map((player) => { const isAssigned = assigned.includes(player.id); const isSelected = selectedPlayer === player.id; return <button className={`player-row ${isSelected ? "selected" : ""} ${isAssigned ? "assigned" : ""}`} key={player.id} onClick={() => setSelectedPlayer(isSelected ? null : player.id)}><span className="player-avatar">{player.initials}</span><span className="player-data"><strong>{player.name}</strong><small>{player.position} · #{player.number}</small></span>{isAssigned ? <span className="assigned-mark">✓</span> : <span className="add-mark">+</span>}</button>; })}</div></aside>

      <div className="pitch-panel"><div className="pitch-toolbar"><div><span className="section-label">SISTEMA DE JUEGO</span><h2>{formation}</h2></div><div className="formation-options">{(Object.keys(formations) as FormationKey[]).map((item) => <button key={item} className={formation === item ? "active" : ""} onClick={() => chooseFormation(item)}>{item}</button>)}</div></div><div className="pitch-wrap"><div className="pitch"><div className="halfway" /><div className="center-circle" /><div className="penalty top" /><div className="penalty bottom" /><div className="goal top" /><div className="goal bottom" />{positions.map((position) => { const names = lineup[position.id] ?? []; return <button key={position.id} className={`position-slot ${selectedPlayer ? "ready" : ""} ${names.length ? "filled" : ""}`} style={{ left: `${position.x}%`, top: `${position.y}%` }} onClick={() => addToPosition(position.id)}><span className="position-label">{position.label}</span>{names.length ? names.map((playerId, index) => { const player = getPlayer(playerId); return <span className={`slot-player player-${index}`} key={playerId} onClick={(event) => { event.stopPropagation(); removePlayer(position.id, playerId); }}><b>{player?.number}</b>{player?.name}<i>×</i></span>; }) : <span className="empty-slot">+</span>}</button>; })}</div></div><div className="pitch-hint">{selectedPlayer ? <><b>{getPlayer(selectedPlayer)?.name}</b> seleccionado · elige una posición</> : "Selecciona un jugador de la plantilla para colocarlo en el campo"}</div></div>

      <aside className="summary-panel"><div className="panel-title"><div><span className="section-label">RESUMEN</span><h2>Tu once</h2></div><span className="ready-count">{assigned.length === 11 ? "COMPLETO" : `${11 - assigned.length} POR CUBRIR`}</span></div><div className="summary-list">{positions.map((position) => { const names = lineup[position.id] ?? []; return <div className="summary-slot" key={position.id}><span className="summary-position">{position.label}</span><div>{names.length ? names.map((id, index) => <span key={id} className={index ? "bench-name" : "starter-name"}>{getPlayer(id)?.name}{index ? " · suplente" : ""}</span>) : <span className="missing">Sin asignar</span>}</div></div>; })}</div><div className="summary-actions"><button className="save-button" onClick={() => setSaved(true)}>{saved ? "✓ Alineación guardada" : "Guardar alineación"}</button><button className="reset-button" onClick={() => { setLineup({}); setSaved(false); }}>Reiniciar</button></div></aside></section>
  </main>;
}
