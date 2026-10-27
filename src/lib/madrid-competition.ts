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
  // Durante esta fase los resultados los valida y registra directamente el club.
  // Mantenemos el endpoint para no romper el programador instalado, pero nunca
  // descargamos ni sobreescribimos datos desde el CSV externo.
  return { disabled: true, season, message: "La sincronización externa está desactivada. Los resultados se actualizan manualmente." };
}
