"use client";

import { useEffect, useState } from "react";
import type { OfficialCompetition } from "@/lib/madrid-competition";

export function useOfficialCompetition(season: string) {
  const [data, setData] = useState<OfficialCompetition | null>(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    let active = true; setLoading(true);
    fetch(`/api/official-competition?season=${encodeURIComponent(season)}`, { cache: "no-store" })
      .then(async (response) => response.ok ? response.json() : null)
      .then((value) => { if (active) setData(value); })
      .catch(() => { if (active) setData(null); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [season]);
  return { data, loading };
}

export const formatOfficialSync = (value: string | null) => value ? new Date(value).toLocaleString("es-ES", { dateStyle: "medium", timeStyle: "short" }) : "Pendiente de primera sincronización";
