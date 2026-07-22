"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { Match } from "@/lib/matches";

const MatchesContext = createContext<{ matches: Match[]; loading: boolean } | null>(null);
export function MatchesProvider({ children }: { children: React.ReactNode }) { const [matches, setMatches] = useState<Match[]>([]); const [loading, setLoading] = useState(true); useEffect(() => { fetch("/api/matches", { cache: "no-store" }).then((response) => response.json()).then(setMatches).finally(() => setLoading(false)); }, []); return <MatchesContext.Provider value={{ matches, loading }}>{children}</MatchesContext.Provider>; }
export function useMatches() { const value = useContext(MatchesContext); if (!value) throw new Error("useMatches debe usarse dentro de MatchesProvider"); return value; }
