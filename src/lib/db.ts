import fs from "node:fs/promises";
import path from "node:path";
import sqlite3 from "sqlite3";
import { open, Database } from "sqlite";
import { initialPlayers } from "@/lib/team";
import { initialNews } from "@/lib/news";
import { initialMatches, season2026Matches } from "@/lib/matches";
import { jdmMatches2025 } from "@/lib/jdm-2025-26";

let databasePromise: Promise<Database> | undefined;

export function getDatabase() {
  if (!databasePromise) databasePromise = initializeDatabase();
  return databasePromise;
}

async function initializeDatabase() {
  const dataDirectory = path.join(process.cwd(), "data");
  await fs.mkdir(dataDirectory, { recursive: true });
  const database = await open({ filename: path.join(dataDirectory, "team.db"), driver: sqlite3.Database });
  await database.exec(`CREATE TABLE IF NOT EXISTS app_meta (key TEXT PRIMARY KEY, value TEXT NOT NULL)`);
  await database.exec(`CREATE TABLE IF NOT EXISTS official_standings (season TEXT NOT NULL, position INTEGER NOT NULL, team TEXT NOT NULL, played INTEGER NOT NULL, won INTEGER NOT NULL, drawn INTEGER NOT NULL, lost INTEGER NOT NULL, goalsFor INTEGER NOT NULL, goalsAgainst INTEGER NOT NULL, points INTEGER NOT NULL, PRIMARY KEY (season, team))`);
  await database.exec(`CREATE TABLE IF NOT EXISTS official_matches (season TEXT NOT NULL, jornada INTEGER NOT NULL, homeTeam TEXT NOT NULL, awayTeam TEXT NOT NULL, homeScore INTEGER, awayScore INTEGER, date TEXT NOT NULL, time TEXT NOT NULL, venue TEXT NOT NULL, status TEXT NOT NULL, PRIMARY KEY (season, jornada, homeTeam, awayTeam))`);
  await database.exec(`CREATE TABLE IF NOT EXISTS official_sync (season TEXT PRIMARY KEY, synced_at TEXT NOT NULL, source_url TEXT NOT NULL)`);
  await database.exec(`CREATE TABLE IF NOT EXISTS players (id TEXT PRIMARY KEY, name TEXT NOT NULL, alias TEXT NOT NULL DEFAULT '', number INTEGER NOT NULL, position TEXT NOT NULL DEFAULT 'Jugador', photo TEXT NOT NULL DEFAULT '', goals INTEGER NOT NULL DEFAULT 0, assists INTEGER NOT NULL DEFAULT 0, appearances INTEGER NOT NULL DEFAULT 0, minutes INTEGER NOT NULL DEFAULT 0, starterAppearances INTEGER NOT NULL DEFAULT 0, substituteAppearances INTEGER NOT NULL DEFAULT 0, mvpCount INTEGER NOT NULL DEFAULT 0, bio TEXT NOT NULL DEFAULT '', active INTEGER NOT NULL DEFAULT 1, updated_at TEXT NOT NULL)`);
  const columns = await database.all<{ name: string }[]>("PRAGMA table_info(players)");
  const existingColumns = new Set(columns.map((column) => column.name));
  for (const [name, definition] of [["minutes", "INTEGER NOT NULL DEFAULT 0"], ["starterAppearances", "INTEGER NOT NULL DEFAULT 0"], ["substituteAppearances", "INTEGER NOT NULL DEFAULT 0"], ["mvpCount", "INTEGER NOT NULL DEFAULT 0"], ["active", "INTEGER NOT NULL DEFAULT 1"]] as const) {
    if (!existingColumns.has(name)) await database.exec(`ALTER TABLE players ADD COLUMN ${name} ${definition}`);
  }
  const playerCountBeforeSeed = await database.get<{ count: number }>("SELECT COUNT(*) as count FROM players");
  const statement = await database.prepare("INSERT OR IGNORE INTO players (id,name,alias,number,position,photo,goals,assists,appearances,minutes,starterAppearances,substituteAppearances,mvpCount,bio,active,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,datetime('now'))");
  for (const player of initialPlayers) await statement.run(player.id, player.name, player.alias, player.number, player.position, player.photo, player.goals, player.assists, player.appearances, player.minutes, player.starterAppearances, player.substituteAppearances, player.mvpCount, player.bio, player.active ? 1 : 0);
  await statement.finalize();
  await database.exec(`CREATE TABLE IF NOT EXISTS news (id TEXT PRIMARY KEY, title TEXT NOT NULL, slug TEXT NOT NULL UNIQUE, excerpt TEXT NOT NULL DEFAULT '', content TEXT NOT NULL DEFAULT '', tag TEXT NOT NULL DEFAULT 'CLUB', date TEXT NOT NULL, image TEXT NOT NULL DEFAULT '', accent TEXT NOT NULL DEFAULT 'gold', published INTEGER NOT NULL DEFAULT 1, updated_at TEXT NOT NULL)`);
  if (!playerCountBeforeSeed?.count) await database.run("INSERT OR REPLACE INTO app_meta (key,value) VALUES ('players_seeded_fresh','1')");
  await database.exec(`CREATE TABLE IF NOT EXISTS users (id TEXT PRIMARY KEY, email TEXT NOT NULL UNIQUE, passwordHash TEXT NOT NULL, name TEXT NOT NULL, playerId TEXT NOT NULL DEFAULT '', role TEXT NOT NULL DEFAULT 'USER', status TEXT NOT NULL DEFAULT 'PENDING', created_at TEXT NOT NULL, updated_at TEXT NOT NULL, approved_at TEXT)`);
  const demoNewsCleanup = await database.get<{ value: string }>("SELECT value FROM app_meta WHERE key='news_seed_cleanup_20260723'");
  if (!demoNewsCleanup) {
    await database.run("DELETE FROM news WHERE id IN (?,?,?)", ...initialNews.map((item) => item.id));
    await database.run("INSERT OR REPLACE INTO app_meta (key,value) VALUES ('news_seed_cleanup_20260723','1')");
  }
  await database.run(
    "INSERT OR IGNORE INTO news (id,title,slug,excerpt,content,tag,date,image,accent,published,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,datetime('now'))",
    "amistoso-alacran-octubre-2026",
    "Juanjo firma un triplete ante Alacrán",
    "juanjo-firma-un-triplete-ante-alacran",
    "El Aldapan Gora vence 2–3 en el amistoso frente a Asociación Alacrán 1997, con Juanjo como gran protagonista.",
    "El Aldapan Gora cerró el domingo con una victoria de mucho carácter ante Asociación Alacrán 1997. Juanjo firmó los tres goles del equipo en el 2–3 final y fue elegido MVP del partido. Un buen test para seguir afinando al grupo antes del inicio de la liga.",
    "PARTIDOS",
    "2026-10-11",
    "",
    "gold",
    1,
  );
  await database.exec(`CREATE TABLE IF NOT EXISTS matches (id TEXT PRIMARY KEY, season TEXT NOT NULL DEFAULT '2026/27', opponent TEXT NOT NULL, opponentShort TEXT NOT NULL, date TEXT NOT NULL, competition TEXT NOT NULL, venue TEXT NOT NULL, status TEXT NOT NULL, isHome INTEGER NOT NULL DEFAULT 1, duration INTEGER NOT NULL DEFAULT 90, homeScore INTEGER, awayScore INTEGER, starters TEXT NOT NULL, substitutes TEXT NOT NULL, events TEXT NOT NULL, updated_at TEXT NOT NULL)`);
  const matchColumns = await database.all<{ name: string }[]>("PRAGMA table_info(matches)");
  const existingMatchColumns = new Set(matchColumns.map((column) => column.name));
  if (!existingMatchColumns.has("season")) await database.exec("ALTER TABLE matches ADD COLUMN season TEXT NOT NULL DEFAULT '2026/27'");
  if (!existingMatchColumns.has("duration")) await database.exec("ALTER TABLE matches ADD COLUMN duration INTEGER NOT NULL DEFAULT 90");
  if (!existingMatchColumns.has("isHome")) await database.exec("ALTER TABLE matches ADD COLUMN isHome INTEGER NOT NULL DEFAULT 1");
  await database.exec(`CREATE TABLE IF NOT EXISTS match_votes (match_id TEXT NOT NULL, user_email TEXT NOT NULL, player_id TEXT NOT NULL, created_at TEXT NOT NULL, updated_at TEXT NOT NULL, PRIMARY KEY (match_id, user_email), FOREIGN KEY (match_id) REFERENCES matches(id))`);
  const matchesSeeded = await database.get<{ value: string }>("SELECT value FROM app_meta WHERE key='matches_seeded_once'");
  const matchCount = await database.get<{ count: number }>("SELECT COUNT(*) as count FROM matches");
  if (!matchesSeeded) {
    if (!matchCount?.count) {
      const matchStatement = await database.prepare("INSERT INTO matches (id,season,opponent,opponentShort,date,competition,venue,status,duration,homeScore,awayScore,starters,substitutes,events,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,datetime('now'))");
      for (const match of initialMatches) await matchStatement.run(match.id, match.season, match.opponent, match.opponentShort, match.date, match.competition, match.venue, match.status, match.duration, match.homeScore, match.awayScore, JSON.stringify(match.starters), JSON.stringify(match.substitutes), JSON.stringify(match.events));
      await matchStatement.finalize();
    }
    await database.run("INSERT OR REPLACE INTO app_meta (key,value) VALUES ('matches_seeded_once','1')");
  }
  const jdmImported = await database.get<{ value: string }>("SELECT value FROM app_meta WHERE key='jdm_2025_26_imported'");
  if (!jdmImported) {
    await database.run("DELETE FROM matches WHERE id IN ('aldapan-rival-2026-06-15','aldapan-union-2026-06-08')");
    const jdmStatement = await database.prepare("INSERT OR REPLACE INTO matches (id,season,opponent,opponentShort,date,competition,venue,status,duration,homeScore,awayScore,starters,substitutes,events,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,datetime('now'))");
    for (const match of jdmMatches2025) await jdmStatement.run(match.id, match.season, match.opponent, match.opponentShort, match.date, match.competition, match.venue, match.status, match.duration, match.homeScore, match.awayScore, JSON.stringify(match.starters), JSON.stringify(match.substitutes), JSON.stringify(match.events));
    await jdmStatement.finalize();
    await database.run("INSERT OR REPLACE INTO app_meta (key,value) VALUES ('jdm_2025_26_imported','1')");
  }
  await database.run(
    "INSERT OR IGNORE INTO matches (id,season,opponent,opponentShort,date,competition,venue,status,duration,homeScore,awayScore,starters,substitutes,events,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,datetime('now'))",
    "aldapan-atletico-jabalies-2026-09-20", "2026/27", "Atlético Jabalíes", "JAB", "2026-09-20T21:00:00", "Amistoso", "Campo Municipal - Gora", "finished", 90, 4, 0, "[]", "[]", JSON.stringify([{ minute: 0, type: "goal", player: "ortiz", detail: "Aldapan Gora" }, { minute: 0, type: "goal", player: "ortiz", detail: "Aldapan Gora" }, { minute: 0, type: "goal", player: "ortiz", detail: "Aldapan Gora" }, { minute: 0, type: "goal", player: "corisco", detail: "Aldapan Gora" }, { minute: 90, type: "mvp", player: "ortiz" }])
  );
  const jabaliesResultApplied = await database.get<{ value: string }>("SELECT value FROM app_meta WHERE key='aldapan_jabalies_result_20260920'");
  if (!jabaliesResultApplied) {
    const events = JSON.stringify([{ minute: 0, type: "goal", player: "ortiz", detail: "Aldapan Gora" }, { minute: 0, type: "goal", player: "ortiz", detail: "Aldapan Gora" }, { minute: 0, type: "goal", player: "ortiz", detail: "Aldapan Gora" }, { minute: 0, type: "goal", player: "corisco", detail: "Aldapan Gora" }, { minute: 90, type: "mvp", player: "ortiz" }]);
    await database.run("UPDATE matches SET status='finished', homeScore=4, awayScore=0, events=?, updated_at=datetime('now') WHERE id=?", events, "aldapan-atletico-jabalies-2026-09-20");
    await database.run("INSERT OR REPLACE INTO app_meta (key,value) VALUES ('aldapan_jabalies_result_20260920','1')");
  }
  const jabaliesMvpApplied = await database.get<{ value: string }>("SELECT value FROM app_meta WHERE key='aldapan_jabalies_mvp_20260920'");
  if (!jabaliesMvpApplied) {
    const events = JSON.stringify([{ minute: 0, type: "goal", player: "ortiz", detail: "Aldapan Gora" }, { minute: 0, type: "goal", player: "ortiz", detail: "Aldapan Gora" }, { minute: 0, type: "goal", player: "ortiz", detail: "Aldapan Gora" }, { minute: 0, type: "goal", player: "corisco", detail: "Aldapan Gora" }, { minute: 90, type: "mvp", player: "ortiz" }]);
    await database.run("UPDATE matches SET events=?, updated_at=datetime('now') WHERE id=?", events, "aldapan-atletico-jabalies-2026-09-20");
    await database.run("INSERT OR REPLACE INTO app_meta (key,value) VALUES ('aldapan_jabalies_mvp_20260920','1')");
  }
  const season2026Imported = await database.get<{ value: string }>("SELECT value FROM app_meta WHERE key='season_2026_27_schedule_20261013'");
  if (!season2026Imported) {
    await database.run("DELETE FROM matches WHERE id IN (?,?,?)", "aldapan-rival-2026-06-15", "aldapan-union-2026-06-08", "aldapan-atletico-jabalies-2026-09-20");
    const scheduleStatement = await database.prepare("INSERT OR REPLACE INTO matches (id,season,opponent,opponentShort,date,competition,venue,status,isHome,duration,homeScore,awayScore,starters,substitutes,events,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,datetime('now'))");
    for (const match of season2026Matches) await scheduleStatement.run(match.id, match.season, match.opponent, match.opponentShort, match.date, match.competition, match.venue, match.status, match.isHome ? 1 : 0, match.duration, match.homeScore, match.awayScore, JSON.stringify(match.starters), JSON.stringify(match.substitutes), JSON.stringify(match.events));
    await scheduleStatement.finalize();
    await database.run("INSERT OR REPLACE INTO app_meta (key,value) VALUES ('season_2026_27_schedule_20261013','1')");
  }
  await database.run(
    "INSERT OR IGNORE INTO matches (id,season,opponent,opponentShort,date,competition,venue,status,isHome,duration,homeScore,awayScore,starters,substitutes,events,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,datetime('now'))",
    "amistoso-alacran-2026-10-11", "2026/27", "Asociación Alacrán 1997", "ALA", "2026-10-11T00:00:00", "Amistoso", "Campo por confirmar", "finished", 0, 90, 3, 2, "[]", "[]",
    JSON.stringify([{ minute: 0, type: "goal", player: "juanjo", detail: "Aldapan Gora" }, { minute: 0, type: "goal", player: "juanjo", detail: "Aldapan Gora" }, { minute: 0, type: "goal", player: "juanjo", detail: "Aldapan Gora" }, { minute: 90, type: "mvp", player: "juanjo" }]),
  );
  await database.run(
    "INSERT OR IGNORE INTO matches (id,season,opponent,opponentShort,date,competition,venue,status,isHome,duration,homeScore,awayScore,starters,substitutes,events,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,datetime('now'))",
    "aldapan-atletico-jabalies-2026-09-20", "2026/27", "Atlético Jabalíes", "JAB", "2026-09-20T21:00:00", "Amistoso", "Campo Municipal - Gora", "finished", 1, 90, 4, 0, "[]", "[]",
    JSON.stringify([{ minute: 0, type: "goal", player: "ortiz", detail: "Aldapan Gora" }, { minute: 0, type: "goal", player: "ortiz", detail: "Aldapan Gora" }, { minute: 0, type: "goal", player: "ortiz", detail: "Aldapan Gora" }, { minute: 0, type: "goal", player: "corisco", detail: "Aldapan Gora" }, { minute: 90, type: "mvp", player: "ortiz" }]),
  );
  return database;
}
