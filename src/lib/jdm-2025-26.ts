import { Match } from "@/lib/matches";

const normalize = (text: string) => text.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
const shortName = (team: string) => team.split(/\s+/).filter(Boolean).slice(0, 3).map((word) => word[0]).join("").toUpperCase();
const date = (value: string) => {
  const [day, month, year] = value.split("/");
  return `${year}-${month}-${day}T12:00:00`;
};

type JdmResult = {
  round: number;
  date: string;
  home: string;
  away: string;
  homeScore: number;
  awayScore: number;
  venue: string;
};

const rawResults: JdmResult[] = [
  { round: 1, date: "19/10/2025", home: "Aldapan Gora", away: "TATO F.C.", homeScore: 3, awayScore: 3, venue: "Fútbol 11 C-1 CDM Luis Aragonés" },
  { round: 2, date: "26/10/2025", home: "Aldapan Gora", away: "Asociación Alacrán 1997", homeScore: 1, awayScore: 4, venue: "Fútbol 11 C-2 CDM Luis Aragonés" },
  { round: 3, date: "02/11/2025", home: "ATLETICO JABALIS", away: "Aldapan Gora", homeScore: 3, awayScore: 0, venue: "Fútbol 11 C-1 CDM Luis Aragonés" },
  { round: 4, date: "16/11/2025", home: "Aldapan Gora", away: "BOSTON TURRADORES", homeScore: 4, awayScore: 5, venue: "Fútbol 11 C-2 CDM Luis Aragonés" },
  { round: 5, date: "07/12/2025", home: "Club Atlético Manzanares", away: "Aldapan Gora", homeScore: 5, awayScore: 2, venue: "Fútbol 11 C-1 CDM Luis Aragonés" },
  { round: 6, date: "30/11/2025", home: "Aldapan Gora", away: "Dragones de Lavapiés B", homeScore: 0, awayScore: 2, venue: "Fútbol 11 C-2 CDM Luis Aragonés" },
  { round: 7, date: "15/02/2026", home: "EMBASSY FC", away: "Aldapan Gora", homeScore: 1, awayScore: 1, venue: "Fútbol 11 C-2 CDM Luis Aragonés" },
  { round: 8, date: "15/02/2026", home: "Aldapan Gora", away: "ESCUELA DE HORTALEZA", homeScore: 0, awayScore: 1, venue: "Fútbol 11 C-1 CDM Luis Aragonés" },
  { round: 9, date: "11/01/2026", home: "Estrella Coja F. C.", away: "Aldapan Gora", homeScore: 3, awayScore: 1, venue: "Fútbol 11 C-2 CDM Luis Aragonés" },
  { round: 10, date: "18/01/2026", home: "Aldapan Gora", away: "Inter de America", homeScore: 2, awayScore: 3, venue: "Fútbol 11 C-1 CDM Luis Aragonés" },
  { round: 11, date: "25/01/2026", home: "Madrid Internationals", away: "Aldapan Gora", homeScore: 8, awayScore: 0, venue: "Fútbol 11 C-2 CDM Luis Aragonés" },
  { round: 12, date: "15/02/2026", home: "TATO F.C.", away: "Aldapan Gora", homeScore: 6, awayScore: 0, venue: "Fútbol 11 C-2 CDM Luis Aragonés" },
  { round: 13, date: "08/02/2026", home: "Asociación Alacrán 1997", away: "Aldapan Gora", homeScore: 2, awayScore: 3, venue: "Fútbol 11 C-2 CDM Luis Aragonés" },
  { round: 14, date: "22/02/2026", home: "Aldapan Gora", away: "ATLETICO JABALIS", homeScore: 2, awayScore: 4, venue: "Fútbol 11 C-1 CDM Luis Aragonés" },
  { round: 15, date: "03/05/2026", home: "BOSTON TURRADORES", away: "Aldapan Gora", homeScore: 0, awayScore: 0, venue: "Fútbol 11 C-2 CDM Luis Aragonés" },
  { round: 16, date: "08/03/2026", home: "Aldapan Gora", away: "Club Atlético Manzanares", homeScore: 4, awayScore: 5, venue: "Fútbol 11 C-1 CDM Luis Aragonés" },
  { round: 17, date: "15/03/2026", home: "Dragones de Lavapiés B", away: "Aldapan Gora", homeScore: 0, awayScore: 0, venue: "Fútbol 11 C-2 CDM Luis Aragonés" },
  { round: 18, date: "22/03/2026", home: "Aldapan Gora", away: "EMBASSY FC", homeScore: 3, awayScore: 3, venue: "Fútbol 11 C-2 CDM Luis Aragonés" },
  { round: 19, date: "12/04/2026", home: "ESCUELA DE HORTALEZA", away: "Aldapan Gora", homeScore: 3, awayScore: 1, venue: "Fútbol 11 C-1 CDM Luis Aragonés" },
  { round: 20, date: "19/04/2026", home: "Aldapan Gora", away: "Estrella Coja F. C.", homeScore: 1, awayScore: 2, venue: "Fútbol 11 C-2 CDM Luis Aragonés" },
  { round: 21, date: "26/04/2026", home: "Inter de America", away: "Aldapan Gora", homeScore: 0, awayScore: 3, venue: "Fútbol 11 C-1 CDM Luis Aragonés" },
  { round: 22, date: "10/05/2026", home: "Aldapan Gora", away: "Madrid Internationals", homeScore: 7, awayScore: 3, venue: "Fútbol 11 C-2 CDM Luis Aragonés" },
];

export const jdmMatches2025: Match[] = rawResults.map((result) => {
  const aldapanHome = result.home === "Aldapan Gora";
  const opponent = aldapanHome ? result.away : result.home;
  return {
    id: `jdm-2025-26-j${String(result.round).padStart(2, "0")}-${normalize(opponent)}`,
    season: "2025/26",
    opponent,
    opponentShort: shortName(opponent),
    date: date(result.date),
    competition: `Liga JDM 2025/26 · Jornada ${result.round}`,
    venue: `${result.venue}${aldapanHome ? "" : " · Aldapan visitante"}`,
    status: "finished",
    homeScore: aldapanHome ? result.homeScore : result.awayScore,
    awayScore: aldapanHome ? result.awayScore : result.homeScore,
    starters: [],
    substitutes: [],
    events: [],
  };
});

export const jdmStandings2025 = [
  { position: 1, team: "Estrella Coja F. C.", played: 22, won: 17, drawn: 3, lost: 2, goalsFor: 67, goalsAgainst: 32, points: 54 },
  { position: 2, team: "Madrid Internationals", played: 22, won: 15, drawn: 2, lost: 5, goalsFor: 111, goalsAgainst: 51, points: 47 },
  { position: 3, team: "TATO F.C.", played: 22, won: 12, drawn: 5, lost: 5, goalsFor: 69, goalsAgainst: 42, points: 41 },
  { position: 4, team: "ESCUELA DE HORTALEZA", played: 22, won: 13, drawn: 2, lost: 7, goalsFor: 54, goalsAgainst: 35, points: 41 },
  { position: 5, team: "BOSTON TURRADORES", played: 22, won: 10, drawn: 7, lost: 2, goalsFor: 48, goalsAgainst: 36, points: 34 },
  { position: 6, team: "Club Atlético Manzanares", played: 22, won: 10, drawn: 3, lost: 9, goalsFor: 59, goalsAgainst: 58, points: 33 },
  { position: 7, team: "ATLETICO JABALIS", played: 22, won: 9, drawn: 5, lost: 8, goalsFor: 51, goalsAgainst: 48, points: 32 },
  { position: 8, team: "Asociación Alacrán 1997", played: 22, won: 8, drawn: 3, lost: 11, goalsFor: 55, goalsAgainst: 67, points: 26 },
  { position: 9, team: "Dragones de Lavapiés B", played: 22, won: 4, drawn: 6, lost: 12, goalsFor: 42, goalsAgainst: 65, points: 16 },
  { position: 10, team: "Aldapan Gora", played: 22, won: 3, drawn: 5, lost: 14, goalsFor: 38, goalsAgainst: 66, points: 14 },
  { position: 11, team: "EMBASSY FC", played: 22, won: 2, drawn: 2, lost: 17, goalsFor: 19, goalsAgainst: 87, points: 4 },
  { position: 12, team: "Inter de America", played: 22, won: 7, drawn: 1, lost: 13, goalsFor: 34, goalsAgainst: 60, points: 3 },
];
