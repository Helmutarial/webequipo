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
  status: "finished" | "upcoming";
  homeScore: number | null;
  awayScore: number | null;
  starters: string[];
  substitutes: string[];
  events: MatchEvent[];
};

export const initialMatches: Match[] = [
  {
    id: "aldapan-rival-2026-06-15",
    season: "2026/27",
    opponent: "Atletico Rival",
    opponentShort: "RIV",
    date: "2026-06-15T18:30:00",
    competition: "Amistoso",
    venue: "Campo Municipal - Gora",
    status: "finished",
    homeScore: 3,
    awayScore: 1,
    starters: ["eskuh", "gerardo", "urko", "rey", "ivan", "corisco", "mauro-m", "molinpower", "caspilla", "pedro", "juan-baroffi"],
    substitutes: ["dani", "krepox", "ortiz", "moreno", "padri"],
    events: [
      { minute: 18, type: "goal", player: "pedro", relatedPlayer: "juan-baroffi", detail: "Aldapan Gora" },
      { minute: 34, type: "goal", player: "juan-baroffi", relatedPlayer: "caspilla", detail: "Aldapan Gora" },
      { minute: 52, type: "goal", player: "krepox", relatedPlayer: "dani", detail: "Aldapan Gora" },
      { minute: 61, type: "substitution", player: "dani", relatedPlayer: "mauro-m" },
      { minute: 70, type: "substitution", player: "krepox", relatedPlayer: "urko" },
      { minute: 77, type: "goal", player: "Atletico Rival", detail: "Atletico Rival" },
      { minute: 86, type: "mvp", player: "caspilla" },
    ],
  },
  {
    id: "aldapan-union-2026-06-08",
    season: "2026/27",
    opponent: "Union Deportiva",
    opponentShort: "UNI",
    date: "2026-06-08T19:00:00",
    competition: "Liga - Jornada 01",
    venue: "Campo Municipal - Gora",
    status: "finished",
    homeScore: 2,
    awayScore: 2,
    starters: ["eskuh", "mario", "urko", "rey", "dani", "corisco", "mauro-m", "moreno", "anglada", "pedro", "juan-baroffi"],
    substitutes: ["juanjo", "padri", "gerardo", "carlos", "fj-garcia"],
    events: [
      { minute: 22, type: "goal", player: "juan-baroffi", relatedPlayer: "pedro", detail: "Aldapan Gora" },
      { minute: 48, type: "goal", player: "Union Deportiva", detail: "Union Deportiva" },
      { minute: 63, type: "substitution", player: "juanjo", relatedPlayer: "pedro" },
      { minute: 71, type: "goal", player: "caspilla", relatedPlayer: "moreno", detail: "Aldapan Gora" },
      { minute: 79, type: "substitution", player: "padri", relatedPlayer: "mauro-m" },
      { minute: 84, type: "goal", player: "Union Deportiva", detail: "Union Deportiva" },
      { minute: 90, type: "mvp", player: "juan-baroffi" },
    ],
  },
];
