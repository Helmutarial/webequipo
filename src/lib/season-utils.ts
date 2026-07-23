import { Match } from "@/lib/matches";
import { jdmStandings2025 } from "@/lib/jdm-2025-26";

export type StandingRow = {
  position: number;
  team: string;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
  points: number;
};

export const getMatchSeason = (match: Match) => match.season || "2026/27";

export const getSeasons = (matches: Match[]) => {
  const seasons = [...new Set(matches.map(getMatchSeason))].sort().reverse();
  return seasons.length ? seasons : ["2026/27"];
};

const emptyStanding = (team: string): StandingRow => ({
  position: 0,
  team,
  played: 0,
  won: 0,
  drawn: 0,
  lost: 0,
  goalsFor: 0,
  goalsAgainst: 0,
  points: 0,
});

export function getStandings(matches: Match[], season: string): StandingRow[] {
  if (season === "2025/26") return jdmStandings2025;

  const rows = new Map<string, StandingRow>();
  const getRow = (team: string) => {
    if (!rows.has(team)) rows.set(team, emptyStanding(team));
    return rows.get(team)!;
  };

  for (const match of matches.filter((item) => getMatchSeason(item) === season && item.status === "finished" && item.homeScore !== null && item.awayScore !== null)) {
    const aldapan = getRow("Aldapan Gora");
    const opponent = getRow(match.opponent);
    const homeScore = match.homeScore ?? 0;
    const awayScore = match.awayScore ?? 0;

    aldapan.played += 1;
    opponent.played += 1;
    aldapan.goalsFor += homeScore;
    aldapan.goalsAgainst += awayScore;
    opponent.goalsFor += awayScore;
    opponent.goalsAgainst += homeScore;

    if (homeScore > awayScore) {
      aldapan.won += 1;
      opponent.lost += 1;
      aldapan.points += 3;
    } else if (homeScore < awayScore) {
      opponent.won += 1;
      aldapan.lost += 1;
      opponent.points += 3;
    } else {
      aldapan.drawn += 1;
      opponent.drawn += 1;
      aldapan.points += 1;
      opponent.points += 1;
    }
  }

  return [...rows.values()]
    .sort((a, b) => b.points - a.points || (b.goalsFor - b.goalsAgainst) - (a.goalsFor - a.goalsAgainst) || b.goalsFor - a.goalsFor)
    .map((row, index) => ({ ...row, position: index + 1 }));
}

