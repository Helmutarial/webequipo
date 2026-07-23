"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { Match } from "@/lib/matches";

const sortMatches = (matches: Match[]) => [...matches].sort((a, b) => b.date.localeCompare(a.date));

const MatchesContext = createContext<{ matches: Match[]; loading: boolean; refreshMatches: () => Promise<void>; saveMatch: (match: Match) => Promise<void>; createMatch: (match: Match) => Promise<void>; deleteMatch: (id: string) => Promise<void> } | null>(null);
export function MatchesProvider({ children }: { children: React.ReactNode }) {
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const refreshMatches = async () => {
    const response = await fetch("/api/matches", { cache: "no-store" });
    if (response.ok) setMatches(await response.json());
    setLoading(false);
  };
  useEffect(() => { void refreshMatches(); }, []);
  const saveMatch = async (match: Match) => {
    setMatches((current) => sortMatches(current.map((item) => item.id === match.id ? match : item)));
    await fetch(`/api/matches/${match.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(match) });
    await refreshMatches();
  };
  const createMatch = async (match: Match) => {
    const response = await fetch("/api/matches", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(match) });
    if (response.ok) {
      const created = await response.json();
      setMatches((current) => sortMatches([created, ...current]));
    }
  };
  const deleteMatch = async (id: string) => {
    setMatches((current) => current.filter((item) => item.id !== id));
    await fetch(`/api/matches/${id}`, { method: "DELETE" });
  };
  return <MatchesContext.Provider value={{ matches, loading, refreshMatches, saveMatch, createMatch, deleteMatch }}>{children}</MatchesContext.Provider>;
}
export function useMatches() { const value = useContext(MatchesContext); if (!value) throw new Error("useMatches debe usarse dentro de MatchesProvider"); return value; }
