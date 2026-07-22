import fs from "node:fs/promises";
import path from "node:path";
import sqlite3 from "sqlite3";
import { open, Database } from "sqlite";
import { initialPlayers } from "@/lib/team";
import { initialNews } from "@/lib/news";

let databasePromise: Promise<Database> | undefined;

export function getDatabase() {
  if (!databasePromise) databasePromise = initializeDatabase();
  return databasePromise;
}

async function initializeDatabase() {
  const dataDirectory = path.join(process.cwd(), "data");
  await fs.mkdir(dataDirectory, { recursive: true });
  const database = await open({ filename: path.join(dataDirectory, "team.db"), driver: sqlite3.Database });
  await database.exec(`CREATE TABLE IF NOT EXISTS players (id TEXT PRIMARY KEY, name TEXT NOT NULL, alias TEXT NOT NULL DEFAULT '', number INTEGER NOT NULL, position TEXT NOT NULL DEFAULT 'Jugador', photo TEXT NOT NULL DEFAULT '', goals INTEGER NOT NULL DEFAULT 0, assists INTEGER NOT NULL DEFAULT 0, appearances INTEGER NOT NULL DEFAULT 0, minutes INTEGER NOT NULL DEFAULT 0, starterAppearances INTEGER NOT NULL DEFAULT 0, substituteAppearances INTEGER NOT NULL DEFAULT 0, mvpCount INTEGER NOT NULL DEFAULT 0, bio TEXT NOT NULL DEFAULT '', updated_at TEXT NOT NULL)`);
  const columns = await database.all<{ name: string }[]>("PRAGMA table_info(players)");
  const existingColumns = new Set(columns.map((column) => column.name));
  for (const [name, definition] of [["minutes", "INTEGER NOT NULL DEFAULT 0"], ["starterAppearances", "INTEGER NOT NULL DEFAULT 0"], ["substituteAppearances", "INTEGER NOT NULL DEFAULT 0"], ["mvpCount", "INTEGER NOT NULL DEFAULT 0"]] as const) {
    if (!existingColumns.has(name)) await database.exec(`ALTER TABLE players ADD COLUMN ${name} ${definition}`);
  }
  const statement = await database.prepare("INSERT OR IGNORE INTO players (id,name,alias,number,position,photo,goals,assists,appearances,minutes,starterAppearances,substituteAppearances,mvpCount,bio,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,datetime('now'))");
  for (const player of initialPlayers) await statement.run(player.id, player.name, player.alias, player.number, player.position, player.photo, player.goals, player.assists, player.appearances, player.minutes, player.starterAppearances, player.substituteAppearances, player.mvpCount, player.bio);
  await statement.finalize();
  await database.run("UPDATE players SET name='Jare', alias='Jare' WHERE id='caspilla'");
  await database.run("UPDATE players SET name='Sergio', alias='Sergio' WHERE id='corisco'");
  await database.run("UPDATE players SET name='Martin', alias='Martin' WHERE id='krepox'");
  await database.exec(`CREATE TABLE IF NOT EXISTS news (id TEXT PRIMARY KEY, title TEXT NOT NULL, slug TEXT NOT NULL UNIQUE, excerpt TEXT NOT NULL DEFAULT '', content TEXT NOT NULL DEFAULT '', tag TEXT NOT NULL DEFAULT 'CLUB', date TEXT NOT NULL, image TEXT NOT NULL DEFAULT '', accent TEXT NOT NULL DEFAULT 'gold', published INTEGER NOT NULL DEFAULT 1, updated_at TEXT NOT NULL)`);
  const newsStatement = await database.prepare("INSERT OR IGNORE INTO news (id,title,slug,excerpt,content,tag,date,image,accent,published,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,datetime('now'))");
  for (const item of initialNews) await newsStatement.run(item.id, item.title, item.slug, item.excerpt, item.content, item.tag, item.date, item.image, item.accent, item.published ? 1 : 0);
  await newsStatement.finalize();
  return database;
}
