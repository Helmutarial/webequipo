"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { initialPlayers, Player } from "@/lib/team";

const TeamContext = createContext<{ players: Player[]; updatePlayer: (player: Player) => void }>({ players: initialPlayers, updatePlayer: () => undefined });

export function TeamProvider({ children }: { children: React.ReactNode }) {
  const [players, setPlayers] = useState<Player[]>(initialPlayers);
  useEffect(() => { const saved = window.localStorage.getItem("aldapan-players"); if (saved) setPlayers(JSON.parse(saved)); }, []);
  const updatePlayer = (player: Player) => setPlayers((current) => { const next = current.map((item) => item.id === player.id ? player : item); window.localStorage.setItem("aldapan-players", JSON.stringify(next)); return next; });
  const value = useMemo(() => ({ players, updatePlayer }), [players]);
  return <TeamContext.Provider value={value}>{children}</TeamContext.Provider>;
}

export const useTeam = () => useContext(TeamContext);
