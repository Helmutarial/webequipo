"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useTeam } from "@/components/team-context";

export default function PlayerPage() {
  const { id } = useParams<{ id: string }>(); const { players } = useTeam(); const player = players.find((item) => item.id === id);
  if (!player) return <main className="content-page shell"><p>Jugador no encontrado.</p><Link className="text-link" href="/equipo">Volver al equipo</Link></main>;
  return <main className="content-page shell"><Link className="text-link" href="/equipo">← Volver a la plantilla</Link><section className="player-profile"><div className="profile-photo">{player.photo ? <img src={player.photo} alt={player.name} /> : <span>{player.name.slice(0, 1)}</span>}<b>{player.number ? `#${player.number}` : "Sin dorsal"}</b></div><div className="profile-copy"><span className="section-label">FICHA DEL JUGADOR</span><h1>{player.name}<em>.</em></h1><p className="profile-alias">“{player.alias}”</p><p>{player.bio}</p><div className="player-stats"><div><strong>{player.appearances}</strong><span>Partidos</span></div><div><strong>{player.minutes}</strong><span>Minutos</span></div><div><strong>{player.starterAppearances}</strong><span>Titular</span></div><div><strong>{player.substituteAppearances}</strong><span>Suplente</span></div><div><strong>{player.goals}</strong><span>Goles</span></div><div><strong>{player.assists}</strong><span>Asistencias</span></div><div><strong>{player.mvpCount}</strong><span>MVP</span></div></div></div></section></main>;
}
