"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/components/auth-context";
import { Player } from "@/lib/team";

type VoteData = { totals: { player_id: string; votes: number }[]; selectedPlayerId: string | null };

export default function MatchMvpVoting({ matchId, candidates }: { matchId: string; candidates: Player[] }) {
  const { session } = useAuth();
  const [data, setData] = useState<VoteData>({ totals: [], selectedPlayerId: null });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => { fetch(`/api/matches/${encodeURIComponent(matchId)}/votes`, { cache: "no-store" }).then(async (response) => response.ok && setData(await response.json())).catch(() => undefined); }, [matchId]);
  const votesByPlayer = useMemo(() => new Map(data.totals.map((item) => [item.player_id, item.votes])), [data]);
  const totalVotes = data.totals.reduce((sum, item) => sum + item.votes, 0);
  const vote = async (playerId: string) => {
    if (!session) return;
    setSaving(true); setMessage("");
    const response = await fetch(`/api/matches/${encodeURIComponent(matchId)}/votes`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ playerId }) });
    const body = await response.json();
    if (response.ok) { setData(body); setMessage("Tu voto ha quedado guardado."); }
    else setMessage(body.error || "No se ha podido guardar el voto.");
    setSaving(false);
  };

  return <section className="match-detail-card mvp-voting">
    <div className="detail-card-heading"><h2>Jugador del partido</h2><span>{totalVotes} votos</span></div>
    <p>Elige al mejor jugador del encuentro. Puedes cambiar tu voto cuando quieras.</p>
    {!session ? <Link className="text-link" href="/iniciar-sesion">Inicia sesión para votar →</Link> : null}
    <div className="mvp-vote-grid">{candidates.map((player) => <button disabled={!session || saving} className={data.selectedPlayerId === player.id ? "selected" : ""} onClick={() => vote(player.id)} key={player.id}>
      <strong>{player.name}</strong><span>{votesByPlayer.get(player.id) || 0} voto{votesByPlayer.get(player.id) === 1 ? "" : "s"}</span>
    </button>)}</div>
    {message ? <small className="vote-message">{message}</small> : null}
  </section>;
}
