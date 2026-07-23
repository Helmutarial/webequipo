"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { initialPlayers, Player } from "@/lib/team";

const TeamContext = createContext<{ players: Player[]; refreshPlayers: () => Promise<void>; updatePlayer: (player: Player) => Promise<void>; createPlayer: (player: Player) => Promise<Player | null>; deletePlayer: (id: string) => Promise<void> }>({ players: initialPlayers, refreshPlayers: async () => undefined, updatePlayer: async () => undefined, createPlayer: async () => null, deletePlayer: async () => undefined });

export function TeamProvider({ children }: { children: React.ReactNode }) {
  const [players, setPlayers] = useState<Player[]>(initialPlayers);
  const refreshPlayers = async () => { const response = await fetch("/api/players", { cache: "no-store" }); if (response.ok) setPlayers(await response.json()); };
  useEffect(() => { void refreshPlayers(); }, []);
  const updatePlayer = async (player: Player) => { setPlayers((current) => current.map((item) => item.id === player.id ? player : item)); await fetch("/api/players", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(player) }); await refreshPlayers(); };
  const createPlayer = async (player: Player) => { const response = await fetch("/api/players", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(player) }); if (!response.ok) return null; const created = await response.json(); await refreshPlayers(); return created; };
  const deletePlayer = async (id: string) => { setPlayers((current) => current.filter((item) => item.id !== id)); await fetch(`/api/players?id=${encodeURIComponent(id)}`, { method: "DELETE" }); await refreshPlayers(); };
  const value = useMemo(() => ({ players, refreshPlayers, updatePlayer, createPlayer, deletePlayer }), [players]);
  return <TeamContext.Provider value={value}>{children}</TeamContext.Provider>;
}

export const useTeam = () => useContext(TeamContext);
