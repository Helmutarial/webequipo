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

export function calculatePlayerStats(matches: Match[], playerIds: string[]) {
  const validPlayers = new Set(playerIds);
  const totals = new Map<string, PlayerTotals>();
  for (const playerId of playerIds) totals.set(playerId, emptyTotals());

  const add = (playerId: string, field: keyof PlayerTotals, value = 1) => {
    const playerTotals = totals.get(playerId);
    if (!playerTotals) return;
    playerTotals[field] += value;
  };

  for (const match of matches.filter((item) => item.status === "finished")) {
    const duration = match.duration || 90;
    const substitutions = match.events.filter((event) => event.type === "substitution");
    const enteringMinutes = new Map(substitutions.map((event) => [event.player, event.minute]));
    const leavingMinutes = new Map(substitutions.map((event) => [event.relatedPlayer, event.minute]));

    for (const playerId of match.starters.filter((id) => validPlayers.has(id))) {
      add(playerId, "appearances");
      add(playerId, "starterAppearances");
      add(playerId, "minutes", Math.max(0, leavingMinutes.get(playerId) ?? duration));
    }

    for (const playerId of match.substitutes.filter((id) => validPlayers.has(id) && enteringMinutes.has(id))) {
      add(playerId, "appearances");
      add(playerId, "substituteAppearances");
      add(playerId, "minutes", Math.max(0, duration - (enteringMinutes.get(playerId) ?? duration)));
    }

    for (const event of match.events) {
      if (!validPlayers.has(event.player)) continue;
      if (event.type === "goal") add(event.player, "goals");
      if (event.type === "mvp") add(event.player, "mvpCount");
      if (event.type === "goal" && event.relatedPlayer && validPlayers.has(event.relatedPlayer)) add(event.relatedPlayer, "assists");
    }
  }

  return totals;
}

export function calculateMatchMinutes(match: Match, playerIds: string[]) {
  const validPlayers = new Set(playerIds);
  const duration = match.duration || 90;
  const substitutions = match.events.filter((event) => event.type === "substitution");
  const enteringMinutes = new Map(substitutions.map((event) => [event.player, event.minute]));
  const leavingMinutes = new Map(substitutions.map((event) => [event.relatedPlayer, event.minute]));
  const rows = new Map<string, { playerId: string; role: "Titular" | "Suplente"; inMinute: number; outMinute: number; minutes: number }>();

  for (const playerId of match.starters.filter((id) => validPlayers.has(id))) {
    const outMinute = leavingMinutes.get(playerId) ?? duration;
    rows.set(playerId, { playerId, role: "Titular", inMinute: 0, outMinute, minutes: Math.max(0, outMinute) });
  }

  for (const playerId of match.substitutes.filter((id) => validPlayers.has(id) && enteringMinutes.has(id))) {
    const inMinute = enteringMinutes.get(playerId) ?? duration;
    rows.set(playerId, { playerId, role: "Suplente", inMinute, outMinute: duration, minutes: Math.max(0, duration - inMinute) });
  }

  return [...rows.values()].sort((a, b) => (a.role === "Titular" ? 0 : 1) - (b.role === "Titular" ? 0 : 1) || b.minutes - a.minutes);
}
