"use client";

import Link from "next/link";
import { useTeam } from "@/components/team-context";

export default function TeamPage() {
  const { players } = useTeam();
  const activePlayers = players.filter((player) => player.active);
  return <main className="content-page shell"><div className="page-intro"><span className="section-label">PLANTILLA 24—25</span><h1>El equipo<span>.</span></h1><p>Conoce a los jugadores que forman parte del Aldapan Gora.</p></div><div className="team-grid">{activePlayers.map((player) => <Link className="team-card" href={`/equipo/${player.id}`} key={player.id}><div className="team-card-photo">{player.photo ? <img src={player.photo} alt={player.name} /> : <span>{player.name.slice(0, 1)}</span>}<b>{player.number ? `#${player.number}` : "Sin dorsal"}</b></div><div className="team-card-info"><span>{player.position}</span><h2>{player.name}</h2><p>“{player.alias}”</p><strong>Ver perfil ↗</strong></div></Link>)}</div></main>;
}
