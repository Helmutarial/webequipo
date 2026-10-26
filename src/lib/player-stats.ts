import { Match } from "@/lib/matches";
import { Player } from "@/lib/team";

type PlayerTotals = Pick<Player, "goals" | "assists" | "appearances" | "minutes" | "starterAppearances" | "substituteAppearances" | "mvpCount">;

const emptyTotals = (): PlayerTotals => ({
  goals: 0,
  assists: 0,
  appearances: 0,
  minutes: 0,
  starterAppearances: 0,
  substituteAppearances: 0,
  mvpCount: 0,
});

const simplifyPlayerReference = (value: string) => value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]/gi, "").toLowerCase();

function createPlayerResolver(playerIds: string[]) {
  const exactIds = new Set(playerIds);
  const normalized = new Map(playerIds.map((id) => [simplifyPlayerReference(id), id]));
  const suffixes = new Map<string, string[]>();
  for (const id of playerIds) {
    const suffix = simplifyPlayerReference(id.split("-").at(-1) || id);
    suffixes.set(suffix, [...(suffixes.get(suffix) || []), id]);
  }
  return (reference: string | undefined) => {
    if (!reference) return undefined;
    if (exactIds.has(reference)) return reference;
    const normalizedReference = simplifyPlayerReference(reference);
    if (normalized.has(normalizedReference)) return normalized.get(normalizedReference);
    const candidates = suffixes.get(normalizedReference) || [];
    return candidates.length === 1 ? candidates[0] : undefined;
  };
}

export function calculatePlayerStats(matches: Match[], playerIds: string[], options: { season?: string; leagueOnly?: boolean } = {}) {
  const resolvePlayer = createPlayerResolver(playerIds);
  const totals = new Map<string, PlayerTotals>();
  for (const playerId of playerIds) totals.set(playerId, emptyTotals());

  const add = (playerId: string, field: keyof PlayerTotals, value = 1) => {
    const playerTotals = totals.get(playerId);
    if (!playerTotals) return;
    playerTotals[field] += value;
  };

  for (const match of matches.filter((item) => item.status === "finished" && (!options.season || item.season === options.season) && (!options.leagueOnly || item.competition.startsWith("Liga")))) {
    const duration = match.duration || 90;
    const substitutions = match.events.filter((event) => event.type === "substitution");
    const enteringMinutes = new Map(substitutions.map((event) => [resolvePlayer(event.player), event.minute]).filter(([playerId]) => Boolean(playerId)) as [string, number][]);
    const leavingMinutes = new Map(substitutions.map((event) => [resolvePlayer(event.relatedPlayer), event.minute]).filter(([playerId]) => Boolean(playerId)) as [string, number][]);

    for (const reference of match.starters) {
      const playerId = resolvePlayer(reference); if (!playerId) continue;
      add(playerId, "appearances");
      add(playerId, "starterAppearances");
      add(playerId, "minutes", Math.max(0, leavingMinutes.get(playerId) ?? duration));
    }

    for (const reference of match.substitutes) {
      const playerId = resolvePlayer(reference); if (!playerId || !enteringMinutes.has(playerId)) continue;
      add(playerId, "appearances");
      add(playerId, "substituteAppearances");
      add(playerId, "minutes", Math.max(0, duration - (enteringMinutes.get(playerId) ?? duration)));
    }

    for (const event of match.events) {
      const playerId = resolvePlayer(event.player);
      const relatedPlayer = resolvePlayer(event.relatedPlayer);
      // La asistencia pertenece al jugador relacionado, aunque el goleador no
      // sea el jugador cuya ficha estamos calculando.
      if (event.type === "goal" && relatedPlayer) add(relatedPlayer, "assists");
      if (!playerId) continue;
      if (event.type === "goal") add(playerId, "goals");
      if (event.type === "mvp") add(playerId, "mvpCount");
    }
  }

  return totals;
}

export function calculateMatchMinutes(match: Match, playerIds: string[]) {
  const resolvePlayer = createPlayerResolver(playerIds);
  const duration = match.duration || 90;
  const substitutions = match.events.filter((event) => event.type === "substitution");
  const enteringMinutes = new Map(substitutions.map((event) => [resolvePlayer(event.player), event.minute]).filter(([playerId]) => Boolean(playerId)) as [string, number][]);
  const leavingMinutes = new Map(substitutions.map((event) => [resolvePlayer(event.relatedPlayer), event.minute]).filter(([playerId]) => Boolean(playerId)) as [string, number][]);
  const rows = new Map<string, { playerId: string; role: "Titular" | "Suplente"; inMinute: number; outMinute: number; minutes: number }>();

  for (const reference of match.starters) {
    const playerId = resolvePlayer(reference); if (!playerId) continue;
    const outMinute = leavingMinutes.get(playerId) ?? duration;
    rows.set(playerId, { playerId, role: "Titular", inMinute: 0, outMinute, minutes: Math.max(0, outMinute) });
  }

  for (const reference of match.substitutes) {
    const playerId = resolvePlayer(reference); if (!playerId || !enteringMinutes.has(playerId)) continue;
    const inMinute = enteringMinutes.get(playerId) ?? duration;
    rows.set(playerId, { playerId, role: "Suplente", inMinute, outMinute: duration, minutes: Math.max(0, duration - inMinute) });
  }

  return [...rows.values()].sort((a, b) => (a.role === "Titular" ? 0 : 1) - (b.role === "Titular" ? 0 : 1) || b.minutes - a.minutes);
}
