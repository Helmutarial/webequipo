export type MatchEvent = {
  minute: number;
  type: "goal" | "substitution" | "yellow" | "mvp";
  player: string;
  relatedPlayer?: string;
  detail?: string;
};

export type Match = {
  id: string;
  season: string;
  opponent: string;
  opponentShort: string;
  date: string;
  competition: string;
  venue: string;
  status: "finished" | "upcoming" | "bye";
  isHome?: boolean;
  duration: number;
  homeScore: number | null;
  awayScore: number | null;
  starters: string[];
  substitutes: string[];
  events: MatchEvent[];
};

const scheduleMatch = (id: string, opponent: string, opponentShort: string, date: string, venue: string, isHome: boolean, jornada: number): Match => ({
  id, season: "2026/27", opponent, opponentShort, date, competition: `Liga · Jornada ${String(jornada).padStart(2, "0")}`,
  venue, status: "upcoming", isHome, duration: 90, homeScore: null, awayScore: null, starters: [], substitutes: [], events: [],
});

export const season2026Matches: Match[] = [
  scheduleMatch("liga-2026-27-tato", "TATO F.C.", "TAT", "2026-10-18T16:00:00", "Fútbol 11 C-2 · CDM Luis Aragonés", true, 1),
  scheduleMatch("liga-2026-27-aula", "AULA C.F.", "AUL", "2026-10-25T14:00:00", "Fútbol 11 C-2 · CDM Luis Aragonés", false, 2),
  scheduleMatch("liga-2026-27-atletico-jabalis", "Atlético Jabalís", "JAB", "2026-11-08T14:00:00", "Fútbol 11 C-2 · CDM Luis Aragonés", true, 3),
  scheduleMatch("liga-2026-27-estrella-coja", "Estrella Coja F.C.", "ECF", "2026-11-15T16:00:00", "Fútbol 11 C-2 · CDM Luis Aragonés", false, 4),
  scheduleMatch("liga-2026-27-boston-turradores", "Boston Turradores", "BOS", "2026-11-22T15:00:00", "Fútbol 11 C-1 · CDM Luis Aragonés", true, 5),
  scheduleMatch("liga-2026-27-acdm-cam", "A.C.D.M. C.A.M.", "CAM", "2026-11-29T18:00:00", "Fútbol 11 C-2 · CDM Luis Aragonés", false, 6),
  scheduleMatch("liga-2026-27-ef-tejar", "E.F. Tejar", "TEJ", "2026-12-13T13:00:00", "Fútbol 11 C-1 · CDM Luis Aragonés", true, 7),
  scheduleMatch("liga-2026-27-alacran", "Asociación Alacrán 1997", "ALA", "2026-12-20T11:00:00", "Fútbol 11 C-1 · CDM Luis Aragonés", false, 8),
  { ...scheduleMatch("liga-2026-27-descanso", "* DESCANSA *", "—", "2027-01-10T00:00:00", "", true, 9), status: "bye", duration: 0 },
  scheduleMatch("liga-2026-27-avila", "Ávila FC", "AVI", "2027-01-17T11:00:00", "Fútbol 11 C-1 · CDM Luis Aragonés", true, 10),
  scheduleMatch("liga-2026-27-escuela-hortaleza", "Escuela de Hortaleza", "EDH", "2027-01-24T13:00:00", "Fútbol 11 C-1 · CDM Luis Aragonés", false, 11),
  scheduleMatch("liga-2026-27-dragones", "Dragones de Lavapiés B", "DDL", "2027-01-31T18:00:00", "Fútbol 11 C-2 · CDM Luis Aragonés", true, 12),
  scheduleMatch("liga-2026-27-makakos", "Makakos FC", "MAK", "2027-02-07T15:00:00", "Fútbol 11 C-1 · CDM Luis Aragonés", false, 13),
];

export const initialMatches: Match[] = season2026Matches;
