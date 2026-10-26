import { getDatabase } from "@/lib/db";

const STANDINGS_URL = "https://datos.madrid.es/dataset/211549-0-juegos-deportivos-actual/resource/211549-2-juegos-deportivos-actual-csv/download/clasificaciones.csv";
const MATCHES_URL = "https://datos.madrid.es/dataset/211549-0-juegos-deportivos-actual/resource/211549-0-juegos-deportivos-actual-csv/download/partidos.csv";
const ALDAPAN = "ALDAPAN GORA FC";

type CsvRow = Record<string, string>;

export type OfficialStanding = { position: number; team: string; played: number; won: number; drawn: number; lost: number; goalsFor: number; goalsAgainst: number; points: number; };
export type OfficialMatch = { jornada: number; homeTeam: string; awayTeam: string; homeScore: number | null; awayScore: number | null; date: string; time: string; venue: string; status: string; };
export type OfficialCompetition = { standings: OfficialStanding[]; matches: OfficialMatch[]; syncedAt: string | null; source: "Ayuntamiento de Madrid"; };

const clean = (value: string) => value.trim().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, " ").toUpperCase();
const number = (value: string) => Number(value.replace(",", ".")) || 0;
const nullableScore = (value: string) => /^-?\d+$/.test(value.trim()) ? Number(value) : null;

function parseCsv(source: string): CsvRow[] {
  const rows: string[][] = []; let row: string[] = []; let value = ""; let quoted = false;
  for (let index = 0; index < source.length; index += 1) {
    const char = source[index]; const next = source[index + 1];
    if (char === '"' && quoted && next === '"') { value += '"'; index += 1; }
    else if (char === '"') quoted = !quoted;
    else if (char === ";" && !quoted) { row.push(value); value = ""; }
    else if ((char === "\n" || char === "\r") && !quoted) { if (char === "\r" && next === "\n") index += 1; row.push(value); if (row.some(Boolean)) rows.push(row); row = []; value = ""; }
    else value += char;
  }
  if (row.length || value) { row.push(value); rows.push(row); }
  const [headers, ...records] = rows;
  return records.map((record) => Object.fromEntries(headers.map((header, index) => [header.trim(), (record[index] || "").trim()])));
}

async function fetchCsv(url: string) {
  const response = await fetch(url, { headers: { "User-Agent": "Aldapan-Gora/1.0" }, cache: "no-store" });
  if (!response.ok) throw new Error(`Madrid Datos Abiertos devolvió ${response.status}`);
  return new TextDecoder("windows-1252").decode(await response.arrayBuffer());
}

export async function readOfficialCompetition(season: string): Promise<OfficialCompetition> {
  const database = await getDatabase();
  const standings = await database.all<OfficialStanding[]>("SELECT position, team, played, won, drawn, lost, goalsFor, goalsAgainst, points FROM official_standings WHERE season=? ORDER BY position, team", season);
  const matches = await database.all<OfficialMatch[]>("SELECT jornada, homeTeam, awayTeam, homeScore, awayScore, date, time, venue, status FROM official_matches WHERE season=? ORDER BY jornada, date, time", season);
  const sync = await database.get<{ synced_at: string }>("SELECT synced_at FROM official_sync WHERE season=?", season);
  return { standings, matches, syncedAt: sync?.synced_at ?? null, source: "Ayuntamiento de Madrid" };
}

export async function syncOfficialCompetition(season = "2026/27") {
  const [standingsCsv, matchesCsv] = await Promise.all([fetchCsv(STANDINGS_URL), fetchCsv(MATCHES_URL)]);
  const standingsRows = parseCsv(standingsCsv);
  const aldapan = standingsRows.find((row) => row.Nombre_temporada === "2026/2027" && clean(row.Nombre_equipo) === ALDAPAN);
  if (!aldapan) throw new Error("No se encontró a Aldapan Gora FC en la clasificación oficial actual.");
  const groupKeys = ["Codigo_temporada", "Codigo_competicion", "Codigo_fase", "Codigo_grupo"] as const;
  const sameGroup = (row: CsvRow) => groupKeys.every((key) => row[key] === aldapan[key]);
  const groupStandings = standingsRows.filter(sameGroup);
  const groupMatches = parseCsv(matchesCsv).filter(sameGroup);
  const database = await getDatabase();
  const registeredMatches = await database.all<{ opponent: string; date: string; isHome: number; homeScore: number | null; awayScore: number | null }[]>("SELECT opponent,date,isHome,homeScore,awayScore FROM matches WHERE season=? AND competition LIKE 'Liga%' AND status='finished' AND homeScore IS NOT NULL AND awayScore IS NOT NULL", season);
  const savedFixtures = await database.all<{ jornada: number; homeTeam: string; awayTeam: string; homeScore: number | null; awayScore: number | null; status: string }[]>("SELECT jornada,homeTeam,awayTeam,homeScore,awayScore,status FROM official_matches WHERE season=?", season);
  const savedByFixture = new Map(savedFixtures.map((fixture) => [`${fixture.jornada}|${clean(fixture.homeTeam)}|${clean(fixture.awayTeam)}`, fixture]));
  const registeredResult = (row: CsvRow) => {
    const aldapanHome = clean(row.Equipo_local) === ALDAPAN;
    const opponent = aldapanHome ? row.Equipo_visitante : row.Equipo_local;
    const match = registeredMatches.find((item) => item.date.slice(0, 10) === row.Fecha && clean(item.opponent) === clean(opponent));
    if (!match) return null;
    return match.isHome !== 0 ? { homeScore: match.homeScore, awayScore: match.awayScore } : { homeScore: match.awayScore, awayScore: match.homeScore };
  };
  const now = new Date().toISOString();
  await database.exec("BEGIN");
  try {
    await database.run("DELETE FROM official_standings WHERE season=?", season);
    const standingStatement = await database.prepare("INSERT INTO official_standings (season,position,team,played,won,drawn,lost,goalsFor,goalsAgainst,points) VALUES (?,?,?,?,?,?,?,?,?,?)");
    for (const row of groupStandings) await standingStatement.run(season, number(row.Posicion), row.Nombre_equipo, number(row.Partidos_jugados), number(row.Partidos_ganados), number(row.Partidos_empatados), number(row.Partidos_perdidos), number(row.Goles_favor), number(row.Goles_contra), number(row.Puntos));
    await standingStatement.finalize();
    const matchStatement = await database.prepare("INSERT INTO official_matches (season,jornada,homeTeam,awayTeam,homeScore,awayScore,date,time,venue,status) VALUES (?,?,?,?,?,?,?,?,?,?) ON CONFLICT(season,jornada,homeTeam,awayTeam) DO UPDATE SET homeScore=excluded.homeScore,awayScore=excluded.awayScore,date=excluded.date,time=excluded.time,venue=excluded.venue,status=excluded.status");
    for (const row of groupMatches) {
      const jornada = number(row.Jornada);
      const officialHomeScore = row.Estado === "F" ? nullableScore(row.Resultado1) : null;
      const officialAwayScore = row.Estado === "F" ? nullableScore(row.Resultado2) : null;
      const existing = savedByFixture.get(`${jornada}|${clean(row.Equipo_local)}|${clean(row.Equipo_visitante)}`);
      const registered = registeredResult(row);
      const hasOfficialResult = officialHomeScore !== null && officialAwayScore !== null;
      const hasExistingResult = existing?.homeScore !== null && existing?.homeScore !== undefined && existing?.awayScore !== null && existing?.awayScore !== undefined;
      const preserved = registered || (hasExistingResult ? existing : null);
      const homeScore = hasOfficialResult ? officialHomeScore : preserved?.homeScore ?? null;
      const awayScore = hasOfficialResult ? officialAwayScore : preserved?.awayScore ?? null;
      const status = hasOfficialResult ? row.Estado : homeScore !== null && awayScore !== null ? "F" : row.Estado;
      await matchStatement.run(season, jornada, row.Equipo_local, row.Equipo_visitante, homeScore, awayScore, row.Fecha, row.Hora, row.Campo, status);
    }
    await matchStatement.finalize();
    await database.run("INSERT OR REPLACE INTO official_sync (season,synced_at,source_url) VALUES (?,?,?)", season, now, STANDINGS_URL);
    await database.exec("COMMIT");
  } catch (error) { await database.exec("ROLLBACK"); throw error; }
  return { standings: groupStandings.length, matches: groupMatches.length, syncedAt: now };
}
