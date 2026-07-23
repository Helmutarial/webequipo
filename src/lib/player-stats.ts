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
    const substitutions = match.events.filter((event) => event.type === "substitution");
    const enteringMinutes = new Map(substitutions.map((event) => [event.player, event.minute]));
    const leavingMinutes = new Map(substitutions.map((event) => [event.relatedPlayer, event.minute]));

    for (const playerId of match.starters.filter((id) => validPlayers.has(id))) {
      add(playerId, "appearances");
      add(playerId, "starterAppearances");
      add(playerId, "minutes", Math.max(0, leavingMinutes.get(playerId) ?? 90));
    }

    for (const playerId of match.substitutes.filter((id) => validPlayers.has(id) && enteringMinutes.has(id))) {
      add(playerId, "appearances");
      add(playerId, "substituteAppearances");
      add(playerId, "minutes", Math.max(0, 90 - (enteringMinutes.get(playerId) ?? 90)));
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
