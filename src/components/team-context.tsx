"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { initialPlayers, Player } from "@/lib/team";

const TeamContext = createContext<{ players: Player[]; updatePlayer: (player: Player) => void }>({ players: initialPlayers, updatePlayer: () => undefined });

export function TeamProvider({ children }: { children: React.ReactNode }) {
  const [players, setPlayers] = useState<Player[]>(initialPlayers);
  useEffect(() => { fetch("/api/players").then((response) => response.ok ? response.json() : Promise.reject()).then(setPlayers).catch(() => undefined); }, []);
  const updatePlayer = (player: Player) => { setPlayers((current) => current.map((item) => item.id === player.id ? player : item)); void fetch("/api/players", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(player) }); };
  const value = useMemo(() => ({ players, updatePlayer }), [players]);
  return <TeamContext.Provider value={value}>{children}</TeamContext.Provider>;
}

export const useTeam = () => useContext(TeamContext);
