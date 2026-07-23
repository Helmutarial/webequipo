import fs from "node:fs/promises";
import path from "node:path";
import sqlite3 from "sqlite3";
import { open, Database } from "sqlite";
import { initialPlayers } from "@/lib/team";
import { initialNews } from "@/lib/news";
import { initialMatches } from "@/lib/matches";
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
  await database.exec(`CREATE TABLE IF NOT EXISTS players (id TEXT PRIMARY KEY, name TEXT NOT NULL, alias TEXT NOT NULL DEFAULT '', number INTEGER NOT NULL, position TEXT NOT NULL DEFAULT 'Jugador', photo TEXT NOT NULL DEFAULT '', goals INTEGER NOT NULL DEFAULT 0, assists INTEGER NOT NULL DEFAULT 0, appearances INTEGER NOT NULL DEFAULT 0, minutes INTEGER NOT NULL DEFAULT 0, starterAppearances INTEGER NOT NULL DEFAULT 0, substituteAppearances INTEGER NOT NULL DEFAULT 0, mvpCount INTEGER NOT NULL DEFAULT 0, bio TEXT NOT NULL DEFAULT '', active INTEGER NOT NULL DEFAULT 1, updated_at TEXT NOT NULL)`);
  const columns = await database.all<{ name: string }[]>("PRAGMA table_info(players)");
  const existingColumns = new Set(columns.map((column) => column.name));
  for (const [name, definition] of [["minutes", "INTEGER NOT NULL DEFAULT 0"], ["starterAppearances", "INTEGER NOT NULL DEFAULT 0"], ["substituteAppearances", "INTEGER NOT NULL DEFAULT 0"], ["mvpCount", "INTEGER NOT NULL DEFAULT 0"], ["active", "INTEGER NOT NULL DEFAULT 1"]] as const) {
    if (!existingColumns.has(name)) await database.exec(`ALTER TABLE players ADD COLUMN ${name} ${definition}`);
  }
  const statement = await database.prepare("INSERT OR IGNORE INTO players (id,name,alias,number,position,photo,goals,assists,appearances,minutes,starterAppearances,substituteAppearances,mvpCount,bio,active,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,datetime('now'))");
  for (const player of initialPlayers) await statement.run(player.id, player.name, player.alias, player.number, player.position, player.photo, player.goals, player.assists, player.appearances, player.minutes, player.starterAppearances, player.substituteAppearances, player.mvpCount, player.bio, player.active ? 1 : 0);
  await statement.finalize();
  await database.run("UPDATE players SET name='Jare', alias='Jare' WHERE id='caspilla'");
  await database.run("UPDATE players SET name='Sergio', alias='Sergio' WHERE id='corisco'");
  await database.run("UPDATE players SET name='Martin', alias='Martin' WHERE id='krepox'");
  await database.run("DELETE FROM players WHERE id IN ('zuha','beltran-jr','joaquinho','tono','d-plaza','juanorro','luaces','saul')");
  await database.run("UPDATE players SET position='DFC' WHERE id IN ('urko','rey')");
  await database.run("UPDATE players SET position='MD' WHERE id='caspilla'");
  await database.run("UPDATE players SET position='DFC / MC / MCD' WHERE id='mauro-m'");
  await database.run("UPDATE players SET position='POR' WHERE id='eskuh'");
  await database.run("UPDATE players SET position='DC / MP' WHERE id='juan-baroffi'");
  await database.run("UPDATE players SET position='DC' WHERE id='pedro'");
  await database.run("UPDATE players SET position='MI' WHERE id='ortiz'");
  await database.run("UPDATE players SET position='MI / MC' WHERE id='moreno'");
  await database.run("UPDATE players SET position='LD' WHERE id='krepox'");
  await database.run("UPDATE players SET name='Figa', alias='Figa', position='DC' WHERE id='fj-garcia'");
  await database.run("UPDATE players SET position='MD' WHERE id='anglada'");
  await database.run("UPDATE players SET position='MC / MCD' WHERE id='corisco'");
  await database.run("UPDATE players SET position='DFC / MC / MCD' WHERE id='mario'");
  await database.run("UPDATE players SET position='LI' WHERE id IN ('dani','ivan')");
  await database.run("UPDATE players SET position='DC / MP / MC' WHERE id='juanjo'");
  await database.run("UPDATE players SET position='DC / MP' WHERE id='padri'");
  await database.run("UPDATE players SET position='LD / MD' WHERE id='gerardo'");
  await database.run("UPDATE players SET position='DFC / LI / LD' WHERE id='carlos'");
  await database.run("UPDATE players SET name='Molina', alias='Molina', position='MC / MCD' WHERE id='molinpower'");
  await database.exec(`CREATE TABLE IF NOT EXISTS news (id TEXT PRIMARY KEY, title TEXT NOT NULL, slug TEXT NOT NULL UNIQUE, excerpt TEXT NOT NULL DEFAULT '', content TEXT NOT NULL DEFAULT '', tag TEXT NOT NULL DEFAULT 'CLUB', date TEXT NOT NULL, image TEXT NOT NULL DEFAULT '', accent TEXT NOT NULL DEFAULT 'gold', published INTEGER NOT NULL DEFAULT 1, updated_at TEXT NOT NULL)`);
  await database.exec(`CREATE TABLE IF NOT EXISTS app_meta (key TEXT PRIMARY KEY, value TEXT NOT NULL)`);
  const demoNewsCleanup = await database.get<{ value: string }>("SELECT value FROM app_meta WHERE key='news_seed_cleanup_20260723'");
  if (!demoNewsCleanup) {
    await database.run("DELETE FROM news WHERE id IN (?,?,?)", ...initialNews.map((item) => item.id));
    await database.run("INSERT OR REPLACE INTO app_meta (key,value) VALUES ('news_seed_cleanup_20260723','1')");
  }
  await database.exec(`CREATE TABLE IF NOT EXISTS matches (id TEXT PRIMARY KEY, season TEXT NOT NULL DEFAULT '2026/27', opponent TEXT NOT NULL, opponentShort TEXT NOT NULL, date TEXT NOT NULL, competition TEXT NOT NULL, venue TEXT NOT NULL, status TEXT NOT NULL, duration INTEGER NOT NULL DEFAULT 90, homeScore INTEGER, awayScore INTEGER, starters TEXT NOT NULL, substitutes TEXT NOT NULL, events TEXT NOT NULL, updated_at TEXT NOT NULL)`);
  const matchColumns = await database.all<{ name: string }[]>("PRAGMA table_info(matches)");
  const existingMatchColumns = new Set(matchColumns.map((column) => column.name));
  if (!existingMatchColumns.has("season")) await database.exec("ALTER TABLE matches ADD COLUMN season TEXT NOT NULL DEFAULT '2026/27'");
  if (!existingMatchColumns.has("duration")) await database.exec("ALTER TABLE matches ADD COLUMN duration INTEGER NOT NULL DEFAULT 90");
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
  return database;
}
