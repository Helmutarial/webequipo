import fs from "node:fs/promises";
import path from "node:path";
import sqlite3 from "sqlite3";
import { open, Database } from "sqlite";
import * as XLSX from "xlsx";
import { initialPlayers } from "@/lib/team";
import { initialNews } from "@/lib/news";
import { initialMatches, season2026Matches } from "@/lib/matches";
import { jdmMatches2025 } from "@/lib/jdm-2025-26";
import { privatePlayerProfileSeeds } from "@/lib/private-player-profiles";
import { getDataDirectory } from "@/lib/data-directory";

let databasePromise: Promise<Database> | undefined;

export function getDatabase() {
  if (!databasePromise) databasePromise = initializeDatabase();
  return databasePromise;
}

async function initializeDatabase() {
  const dataDirectory = getDataDirectory();
  await fs.mkdir(dataDirectory, { recursive: true });
  const database = await open({ filename: path.join(dataDirectory, "team.db"), driver: sqlite3.Database });
  await database.exec(`CREATE TABLE IF NOT EXISTS app_meta (key TEXT PRIMARY KEY, value TEXT NOT NULL)`);
  await database.exec(`CREATE TABLE IF NOT EXISTS official_standings (season TEXT NOT NULL, position INTEGER NOT NULL, team TEXT NOT NULL, played INTEGER NOT NULL, won INTEGER NOT NULL, drawn INTEGER NOT NULL, lost INTEGER NOT NULL, goalsFor INTEGER NOT NULL, goalsAgainst INTEGER NOT NULL, points INTEGER NOT NULL, PRIMARY KEY (season, team))`);
  await database.exec(`CREATE TABLE IF NOT EXISTS official_matches (season TEXT NOT NULL, jornada INTEGER NOT NULL, homeTeam TEXT NOT NULL, awayTeam TEXT NOT NULL, homeScore INTEGER, awayScore INTEGER, date TEXT NOT NULL, time TEXT NOT NULL, venue TEXT NOT NULL, status TEXT NOT NULL, PRIMARY KEY (season, jornada, homeTeam, awayTeam))`);
  await database.exec(`CREATE TABLE IF NOT EXISTS official_sync (season TEXT PRIMARY KEY, synced_at TEXT NOT NULL, source_url TEXT NOT NULL)`);
  await database.exec(`CREATE TABLE IF NOT EXISTS players (id TEXT PRIMARY KEY, name TEXT NOT NULL, alias TEXT NOT NULL DEFAULT '', number INTEGER NOT NULL, position TEXT NOT NULL DEFAULT 'Jugador', photo TEXT NOT NULL DEFAULT '', goals INTEGER NOT NULL DEFAULT 0, assists INTEGER NOT NULL DEFAULT 0, appearances INTEGER NOT NULL DEFAULT 0, minutes INTEGER NOT NULL DEFAULT 0, starterAppearances INTEGER NOT NULL DEFAULT 0, substituteAppearances INTEGER NOT NULL DEFAULT 0, mvpCount INTEGER NOT NULL DEFAULT 0, bio TEXT NOT NULL DEFAULT '', active INTEGER NOT NULL DEFAULT 1, updated_at TEXT NOT NULL)`);
  await database.exec(`CREATE TABLE IF NOT EXISTS player_private_profiles (player_id TEXT PRIMARY KEY, age INTEGER, height_cm INTEGER, weight_kg INTEGER, dominant_foot TEXT NOT NULL DEFAULT '', natural_position TEXT NOT NULL DEFAULT '', secondary_positions TEXT NOT NULL DEFAULT '', analysis TEXT NOT NULL DEFAULT '', keys_to_use TEXT NOT NULL DEFAULT '', cautions TEXT NOT NULL DEFAULT '', tactical_fit TEXT NOT NULL DEFAULT '', updated_at TEXT NOT NULL, FOREIGN KEY(player_id) REFERENCES players(id))`);
  await database.exec(`CREATE TABLE IF NOT EXISTS player_profile_comments (id TEXT PRIMARY KEY, player_id TEXT NOT NULL, user_email TEXT NOT NULL, author_name TEXT NOT NULL, body TEXT NOT NULL, created_at TEXT NOT NULL, updated_at TEXT NOT NULL, FOREIGN KEY(player_id) REFERENCES players(id))`);
  await database.exec(`CREATE TABLE IF NOT EXISTS match_private_reports (match_id TEXT PRIMARY KEY, overview TEXT NOT NULL DEFAULT '', offensive TEXT NOT NULL DEFAULT '', defensive TEXT NOT NULL DEFAULT '', transitions TEXT NOT NULL DEFAULT '', set_pieces TEXT NOT NULL DEFAULT '', strengths TEXT NOT NULL DEFAULT '', conclusions TEXT NOT NULL DEFAULT '', needs TEXT NOT NULL DEFAULT '', updated_at TEXT NOT NULL, FOREIGN KEY(match_id) REFERENCES matches(id))`);
  await database.exec(`CREATE TABLE IF NOT EXISTS match_report_comments (id TEXT PRIMARY KEY, match_id TEXT NOT NULL, user_email TEXT NOT NULL, author_name TEXT NOT NULL, body TEXT NOT NULL, created_at TEXT NOT NULL, updated_at TEXT NOT NULL, FOREIGN KEY(match_id) REFERENCES matches(id))`);
  await database.exec(`CREATE TABLE IF NOT EXISTS match_player_reports (match_id TEXT NOT NULL, player_id TEXT NOT NULL, evaluation TEXT NOT NULL DEFAULT '', updated_at TEXT NOT NULL, PRIMARY KEY(match_id, player_id), FOREIGN KEY(match_id) REFERENCES matches(id), FOREIGN KEY(player_id) REFERENCES players(id))`);
  await database.exec(`CREATE TABLE IF NOT EXISTS match_player_report_comments (id TEXT PRIMARY KEY, match_id TEXT NOT NULL, player_id TEXT NOT NULL, user_email TEXT NOT NULL, author_name TEXT NOT NULL, body TEXT NOT NULL, created_at TEXT NOT NULL, updated_at TEXT NOT NULL, FOREIGN KEY(match_id) REFERENCES matches(id), FOREIGN KEY(player_id) REFERENCES players(id))`);
  await database.exec(`CREATE TABLE IF NOT EXISTS squad_analysis (id TEXT PRIMARY KEY, payload TEXT NOT NULL DEFAULT '{}', updated_at TEXT NOT NULL)`);
  const columns = await database.all<{ name: string }[]>("PRAGMA table_info(players)");
  const existingColumns = new Set(columns.map((column) => column.name));
  for (const [name, definition] of [["minutes", "INTEGER NOT NULL DEFAULT 0"], ["starterAppearances", "INTEGER NOT NULL DEFAULT 0"], ["substituteAppearances", "INTEGER NOT NULL DEFAULT 0"], ["mvpCount", "INTEGER NOT NULL DEFAULT 0"], ["active", "INTEGER NOT NULL DEFAULT 1"]] as const) {
    if (!existingColumns.has(name)) await database.exec(`ALTER TABLE players ADD COLUMN ${name} ${definition}`);
  }
  const playerCountBeforeSeed = await database.get<{ count: number }>("SELECT COUNT(*) as count FROM players");
  if (!playerCountBeforeSeed?.count) {
    const statement = await database.prepare("INSERT OR IGNORE INTO players (id,name,alias,number,position,photo,goals,assists,appearances,minutes,starterAppearances,substituteAppearances,mvpCount,bio,active,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,datetime('now'))");
    for (const player of initialPlayers) await statement.run(player.id, player.name, player.alias, player.number, player.position, player.photo, player.goals, player.assists, player.appearances, player.minutes, player.starterAppearances, player.substituteAppearances, player.mvpCount, player.bio, player.active ? 1 : 0);
    await statement.finalize();
    await database.run("INSERT OR REPLACE INTO app_meta (key,value) VALUES ('players_seeded_fresh','1')");
  }
  const photoRecovery = await database.get<{ value: string }>("SELECT value FROM app_meta WHERE key='player_photo_recovery_20261026'");
  if (!photoRecovery) {
    const uploadsDirectory = path.join(dataDirectory, "uploads");
    const uploadedPhotos = await fs.readdir(uploadsDirectory).catch(() => [] as string[]);
    const playersWithoutPhoto = await database.all<{ id: string }[]>("SELECT id FROM players WHERE photo = ''");
    for (const player of playersWithoutPhoto) {
      const prefix = `${player.id}-`;
      const candidates = uploadedPhotos.filter((filename) => filename.startsWith(prefix));
      if (!candidates.length) continue;
      const newest = (await Promise.all(candidates.map(async (filename) => ({ filename, modified: (await fs.stat(path.join(uploadsDirectory, filename))).mtimeMs })))).sort((a, b) => b.modified - a.modified)[0];
      await database.run("UPDATE players SET photo=?, updated_at=datetime('now') WHERE id=?", `/api/uploads/${newest.filename}`, player.id);
    }
    await database.run("INSERT OR REPLACE INTO app_meta (key,value) VALUES ('player_photo_recovery_20261026','1')");
  }
  // Algunos perfiles conservaron su ficha tras las migraciones de nombres, pero no
  // la referencia a la foto. Reintentamos buscando también por nombre y alias.
  const photoRecoveryRetry = await database.get<{ value: string }>("SELECT value FROM app_meta WHERE key='player_photo_recovery_retry_20261104'");
  if (!photoRecoveryRetry) {
    const uploadsDirectory = path.join(dataDirectory, "uploads");
    const uploadedPhotos = await fs.readdir(uploadsDirectory).catch(() => [] as string[]);
    const normalizePhotoKey = (value: string) => value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase("es-ES").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
    const playersWithoutPhoto = await database.all<{ id: string; name: string; alias: string }[]>("SELECT id,name,alias FROM players WHERE photo = ''");
    for (const player of playersWithoutPhoto) {
      const keys = new Set([player.id, player.name, player.alias].filter(Boolean).map(normalizePhotoKey));
      if (keys.has("dan") || keys.has("jones")) { keys.add("dan"); keys.add("jones"); }
      const candidates = uploadedPhotos.filter((filename) => {
        const key = normalizePhotoKey(path.parse(filename).name);
        return [...keys].some((candidate) => key === candidate || key.startsWith(`${candidate}-`));
      });
      if (!candidates.length) continue;
      const newest = (await Promise.all(candidates.map(async (filename) => ({ filename, modified: (await fs.stat(path.join(uploadsDirectory, filename))).mtimeMs })))).sort((a, b) => b.modified - a.modified)[0];
      await database.run("UPDATE players SET photo=?, updated_at=datetime('now') WHERE id=?", `/api/uploads/${newest.filename}`, player.id);
    }
    await database.run("INSERT OR REPLACE INTO app_meta (key,value) VALUES ('player_photo_recovery_retry_20261104','1')");
  }
  await database.exec(`CREATE TABLE IF NOT EXISTS users (id TEXT PRIMARY KEY, email TEXT NOT NULL UNIQUE, passwordHash TEXT NOT NULL, name TEXT NOT NULL, playerId TEXT NOT NULL DEFAULT '', role TEXT NOT NULL DEFAULT 'USER', status TEXT NOT NULL DEFAULT 'PENDING', created_at TEXT NOT NULL, updated_at TEXT NOT NULL, approved_at TEXT)`);
  await database.exec(`CREATE TABLE IF NOT EXISTS matches (id TEXT PRIMARY KEY, season TEXT NOT NULL DEFAULT '2026/27', opponent TEXT NOT NULL, opponentShort TEXT NOT NULL, date TEXT NOT NULL, competition TEXT NOT NULL, venue TEXT NOT NULL, status TEXT NOT NULL, isHome INTEGER NOT NULL DEFAULT 1, duration INTEGER NOT NULL DEFAULT 90, homeScore INTEGER, awayScore INTEGER, starters TEXT NOT NULL, substitutes TEXT NOT NULL, events TEXT NOT NULL, updated_at TEXT NOT NULL)`);
  const duplicateCleanup = await database.get<{ value: string }>("SELECT value FROM app_meta WHERE key='player_duplicate_cleanup_20261026'");
  if (!duplicateCleanup) {
    const players = await database.all<{ id: string; name: string; alias: string; photo: string; active: number; updated_at: string }[]>("SELECT id,name,alias,photo,active,updated_at FROM players");
    const normalizePlayerName = (value: string) => value.trim().normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase("es-ES");
    const copies = new Map<string, typeof players>();
    for (const player of players) {
      const key = normalizePlayerName(player.name);
      copies.set(key, [...(copies.get(key) || []), player]);
    }
    const replacements = new Map<string, string>();
    for (const group of copies.values()) {
      if (group.length < 2) continue;
      const [keep, ...duplicates] = [...group].sort((a, b) => Number(Boolean(b.photo)) - Number(Boolean(a.photo)) || b.active - a.active || b.updated_at.localeCompare(a.updated_at));
      for (const duplicate of duplicates) replacements.set(duplicate.id, keep.id);
    }
    const legacyNames = new Set(["eskuh", "figa", "gerardo", "carlos"]);
    for (const player of players) if (legacyNames.has(normalizePlayerName(player.name)) && !player.photo) replacements.set(player.id, "");
    if (replacements.size) {
      const matches = await database.all<{ id: string; starters: string; substitutes: string; events: string }[]>("SELECT id,starters,substitutes,events FROM matches");
      for (const match of matches) {
        const replacePlayer = (id: string) => replacements.has(id) ? replacements.get(id) || "" : id;
        const starters = JSON.parse(match.starters).map(replacePlayer).filter(Boolean);
        const substitutes = JSON.parse(match.substitutes).map(replacePlayer).filter(Boolean);
        const events = JSON.parse(match.events).map((event: { player: string; relatedPlayer?: string }) => ({ ...event, player: replacePlayer(event.player), relatedPlayer: event.relatedPlayer ? replacePlayer(event.relatedPlayer) || undefined : undefined })).filter((event: { player: string }) => Boolean(event.player));
        await database.run("UPDATE matches SET starters=?, substitutes=?, events=?, updated_at=datetime('now') WHERE id=?", JSON.stringify([...new Set(starters)]), JSON.stringify([...new Set(substitutes)]), JSON.stringify(events), match.id);
      }
      for (const [oldId, newId] of replacements) {
        if (newId) await database.run("UPDATE users SET playerId=? WHERE playerId=?", newId, oldId);
        await database.run("DELETE FROM players WHERE id=?", oldId);
      }
    }
    await database.run("INSERT OR REPLACE INTO app_meta (key,value) VALUES ('player_duplicate_cleanup_20261026','1')");
  }
  const nameCorrection = await database.get<{ value: string }>("SELECT value FROM app_meta WHERE key='player_name_correction_20261026'");
  if (!nameCorrection) {
    const players = await database.all<{ id: string; name: string; alias: string; photo: string; updated_at: string }[]>("SELECT id,name,alias,photo,updated_at FROM players");
    const normalizeName = (value: string) => value.trim().normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase("es-ES");
    const replacements = new Map<string, string>();
    const jones = players.find((player) => [player.name, player.alias].some((value) => normalizeName(value) === "jones"));
    const dan = players.find((player) => [player.name, player.alias].some((value) => normalizeName(value) === "dan"));
    if (jones && dan && jones.id !== dan.id) replacements.set(dan.id, jones.id);
    const juanmaPlayers = players.filter((player) => [player.name, player.alias].some((value) => ["juanma", "juamna"].includes(normalizeName(value))));
    if (juanmaPlayers.length) {
      const [juanma, ...copies] = [...juanmaPlayers].sort((a, b) => Number(Boolean(b.photo)) - Number(Boolean(a.photo)) || b.updated_at.localeCompare(a.updated_at));
      await database.run("UPDATE players SET name='Juanma', alias='Juanma', updated_at=datetime('now') WHERE id=?", juanma.id);
      for (const copy of copies) if (copy.id !== juanma.id) replacements.set(copy.id, juanma.id);
    }
    if (replacements.size) {
      const matches = await database.all<{ id: string; starters: string; substitutes: string; events: string }[]>("SELECT id,starters,substitutes,events FROM matches");
      for (const match of matches) {
        const replace = (id: string) => replacements.get(id) || id;
        const starters = JSON.parse(match.starters).map(replace);
        const substitutes = JSON.parse(match.substitutes).map(replace);
        const events = JSON.parse(match.events).map((event: { player: string; relatedPlayer?: string }) => ({ ...event, player: replace(event.player), relatedPlayer: event.relatedPlayer ? replace(event.relatedPlayer) : undefined }));
        await database.run("UPDATE matches SET starters=?, substitutes=?, events=?, updated_at=datetime('now') WHERE id=?", JSON.stringify([...new Set(starters)]), JSON.stringify([...new Set(substitutes)]), JSON.stringify(events), match.id);
      }
      for (const [oldId, newId] of replacements) {
        await database.run("UPDATE users SET playerId=? WHERE playerId=?", newId, oldId);
        await database.run("DELETE FROM players WHERE id=?", oldId);
      }
    }
    await database.run("INSERT OR REPLACE INTO app_meta (key,value) VALUES ('player_name_correction_20261026','1')");
  }
  const legacyRemoval = await database.get<{ value: string }>("SELECT value FROM app_meta WHERE key='legacy_player_removal_20261026_v2'");
  if (!legacyRemoval) {
    const players = await database.all<{ id: string; name: string; alias: string }[]>("SELECT id,name,alias FROM players");
    const normalizeName = (value: string) => value.trim().normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase("es-ES");
    const jones = players.find((player) => [player.name, player.alias].some((value) => normalizeName(value) === "jones"));
    const removals = new Map<string, string>();
    for (const player of players) {
      const name = normalizeName(player.name);
      if (name === "dan" && player.id !== jones?.id) removals.set(player.id, jones?.id || "Jones");
      if (["figa", "esku", "eskuh"].includes(name)) removals.set(player.id, "");
    }
    if (removals.size) {
      const matches = await database.all<{ id: string; starters: string; substitutes: string; events: string }[]>("SELECT id,starters,substitutes,events FROM matches");
      for (const match of matches) {
        const replace = (id: string) => removals.has(id) ? removals.get(id) || "" : id;
        const starters = JSON.parse(match.starters).map(replace).filter(Boolean);
        const substitutes = JSON.parse(match.substitutes).map(replace).filter(Boolean);
        const events = JSON.parse(match.events).map((event: { player: string; relatedPlayer?: string }) => ({ ...event, player: replace(event.player), relatedPlayer: event.relatedPlayer ? replace(event.relatedPlayer) || undefined : undefined })).filter((event: { player: string }) => Boolean(event.player));
        await database.run("UPDATE matches SET starters=?, substitutes=?, events=?, updated_at=datetime('now') WHERE id=?", JSON.stringify([...new Set(starters)]), JSON.stringify([...new Set(substitutes)]), JSON.stringify(events), match.id);
      }
      for (const [oldId, newId] of removals) {
        if (newId && jones?.id) await database.run("UPDATE users SET playerId=? WHERE playerId=?", newId, oldId);
        await database.run("DELETE FROM players WHERE id=?", oldId);
      }
    }
    await database.run("INSERT OR REPLACE INTO app_meta (key,value) VALUES ('legacy_player_removal_20261026_v2','1')");
  }
  const jonesRecovery = await database.get<{ value: string }>("SELECT value FROM app_meta WHERE key='jones_photo_recovery_20261026'");
  if (!jonesRecovery) {
    const tato = await database.get<{ starters: string; substitutes: string; events: string }>("SELECT starters,substitutes,events FROM matches WHERE id='liga-2026-27-tato'");
    const existingJones = await database.get<{ id: string }>("SELECT id FROM players WHERE lower(name)='jones' OR lower(alias)='jones' LIMIT 1");
    const injuryEvent = tato ? JSON.parse(tato.events).find((event: { detail?: string }) => event.detail === "Lesión de Dan") as { relatedPlayer?: string } | undefined : undefined;
    const jonesId = injuryEvent?.relatedPlayer;
    if (!existingJones && jonesId) {
      const uploadsDirectory = path.join(dataDirectory, "uploads");
      const candidates = (await fs.readdir(uploadsDirectory).catch(() => [] as string[])).filter((filename) => filename.startsWith(`${jonesId}-`));
      const newest = candidates.length ? (await Promise.all(candidates.map(async (filename) => ({ filename, modified: (await fs.stat(path.join(uploadsDirectory, filename))).mtimeMs })))).sort((a, b) => b.modified - a.modified)[0].filename : "";
      await database.run("INSERT OR IGNORE INTO players (id,name,alias,number,position,photo,goals,assists,appearances,minutes,starterAppearances,substituteAppearances,mvpCount,bio,active,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,datetime('now'))", jonesId, "Jones", "Dan", 0, "Jugador", newest ? `/api/uploads/${newest}` : "", 0, 0, 0, 0, 0, 0, 0, "Jugador del Aldapan Gora.", 1);
    }
    await database.run("INSERT OR REPLACE INTO app_meta (key,value) VALUES ('jones_photo_recovery_20261026','1')");
  }
  const matchDataCorrection = await database.get<{ value: string }>("SELECT value FROM app_meta WHERE key='match_data_correction_20261026'");
  if (!matchDataCorrection) {
    const players = await database.all<{ id: string; name: string; alias: string; photo: string; updated_at: string }[]>("SELECT id,name,alias,photo,updated_at FROM players");
    const normalized = (value: string) => value.trim().normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase("es-ES");
    const named = (name: string) => players.find((player) => [player.name, player.alias].some((value) => normalized(value) === normalized(name)));
    const danCandidates = players.filter((player) => [player.name, player.alias].some((value) => ["dan", "jones"].includes(normalized(value))));
    const dan = [...danCandidates].sort((a, b) => Number(Boolean(b.photo)) - Number(Boolean(a.photo)) || b.updated_at.localeCompare(a.updated_at))[0];
    if (dan) {
      await database.run("UPDATE players SET name='Dan', alias='Dan', number=14, updated_at=datetime('now') WHERE id=?", dan.id);
      for (const copy of danCandidates.filter((player) => player.id !== dan.id)) await database.run("DELETE FROM players WHERE id=?", copy.id);
    }
    const moreno = named("Moreno"); const baroffi = named("Baroffi");
    const aula = await database.get<{ events: string }>("SELECT events FROM matches WHERE id='liga-2026-27-aula'");
    if (aula && moreno && baroffi) {
      const events = JSON.parse(aula.events);
      const morenoGoal = events.find((event: { type: string }) => event.type === "goal");
      if (morenoGoal) { morenoGoal.player = moreno.id; morenoGoal.relatedPlayer = baroffi.id; }
      await database.run("UPDATE matches SET events=?, updated_at=datetime('now') WHERE id='liga-2026-27-aula'", JSON.stringify(events));
    }
    await database.run("INSERT OR REPLACE INTO app_meta (key,value) VALUES ('match_data_correction_20261026','1')");
  }
  await database.exec(`CREATE TABLE IF NOT EXISTS news (id TEXT PRIMARY KEY, title TEXT NOT NULL, slug TEXT NOT NULL UNIQUE, excerpt TEXT NOT NULL DEFAULT '', content TEXT NOT NULL DEFAULT '', tag TEXT NOT NULL DEFAULT 'CLUB', date TEXT NOT NULL, image TEXT NOT NULL DEFAULT '', accent TEXT NOT NULL DEFAULT 'gold', published INTEGER NOT NULL DEFAULT 1, updated_at TEXT NOT NULL)`);
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
  const firstLeagueResults = await database.get<{ value: string }>("SELECT value FROM app_meta WHERE key='league_results_2026_27_j1_j2_20261026_v2'");
  if (!firstLeagueResults) {
    const roster = await database.all<{ id: string; name: string; alias: string }[]>("SELECT id,name,alias FROM players");
    const playerId = (name: string) => roster.find((player) => player.name.toLocaleLowerCase("es-ES") === name.toLocaleLowerCase("es-ES") || player.alias.toLocaleLowerCase("es-ES") === name.toLocaleLowerCase("es-ES"))?.id || name.toLowerCase();
    const tatoEvents = JSON.stringify([
      { minute: 0, type: "goal", player: playerId("Juanjo"), relatedPlayer: playerId("Jare"), detail: "Aldapan Gora" },
      { minute: 0, type: "goal", player: "Gol en propia puerta", detail: "TATO F.C." },
      { minute: 0, type: "goal", player: playerId("Izan"), relatedPlayer: playerId("Juanjo"), detail: "Aldapan Gora" },
      { minute: 5, type: "substitution", player: playerId("Juanma"), relatedPlayer: playerId("Dan"), detail: "Lesión de Dan" },
      { minute: 45, type: "substitution", player: playerId("Moreno"), relatedPlayer: playerId("Jare") },
      { minute: 45, type: "substitution", player: playerId("Baroffi"), relatedPlayer: playerId("Izan") },
      { minute: 55, type: "substitution", player: playerId("Padri"), relatedPlayer: playerId("Juanjo") },
      { minute: 65, type: "substitution", player: playerId("Urko"), relatedPlayer: playerId("Rey") },
      { minute: 90, type: "mvp", player: playerId("Izan") },
    ]);
    const aulaEvents = JSON.stringify([
      { minute: 0, type: "goal", player: playerId("Moreno"), relatedPlayer: playerId("Baroffi"), detail: "Aldapan Gora" },
      { minute: 0, type: "goal", player: playerId("Ortiz"), detail: "Aldapan Gora" },
      { minute: 45, type: "substitution", player: playerId("Izan"), relatedPlayer: playerId("Mauro") },
      { minute: 45, type: "substitution", player: playerId("Rey"), relatedPlayer: playerId("Ortiz") },
      { minute: 45, type: "substitution", player: playerId("Padri"), relatedPlayer: playerId("Baroffi") },
      { minute: 60, type: "substitution", player: playerId("Ivan"), relatedPlayer: playerId("Moreno") },
      { minute: 70, type: "substitution", player: playerId("Pedro"), relatedPlayer: playerId("Juanjo") },
      { minute: 70, type: "substitution", player: playerId("Urko"), relatedPlayer: playerId("Molina") },
      { minute: 80, type: "substitution", player: playerId("Mario"), relatedPlayer: playerId("Sergio") },
      { minute: 90, type: "mvp", player: playerId("Juanma") },
    ]);
    await database.run("UPDATE matches SET status='finished', homeScore=3, awayScore=3, starters=?, substitutes=?, events=?, updated_at=datetime('now') WHERE id=?", JSON.stringify(["Javi", "Dan", "Mauro", "Dani", "Molina", "Sergio", "Juanjo", "Ortiz", "Jare", "Izan", "Rey"].map(playerId)), JSON.stringify(["Juanma", "Moreno", "Baroffi", "Padri", "Urko"].map(playerId)), tatoEvents, "liga-2026-27-tato");
    await database.run("UPDATE matches SET status='finished', homeScore=2, awayScore=2, starters=?, substitutes=?, events=?, updated_at=datetime('now') WHERE id=?", JSON.stringify(["Javi", "Martin", "Juanma", "Mauro", "Dani", "Molina", "Sergio", "Baroffi", "Ortiz", "Moreno", "Juanjo"].map(playerId)), JSON.stringify(["Izan", "Rey", "Padri", "Ivan", "Pedro", "Urko", "Mario"].map(playerId)), aulaEvents, "liga-2026-27-aula");
    const izanPhoto = (await database.get<{ photo: string }>("SELECT photo FROM players WHERE id=?", playerId("Izan")))?.photo || "";
    const juanmaPhoto = (await database.get<{ photo: string }>("SELECT photo FROM players WHERE id=?", playerId("Juanma")))?.photo || "";
    await database.run("INSERT OR IGNORE INTO news (id,title,slug,excerpt,content,tag,date,image,accent,published,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,datetime('now'))", "liga-tato-empate-2026", "Izan rescata un punto en el estreno liguero", "izan-rescata-un-punto-en-el-estreno-liguero", "El Aldapan Gora firma un 3–3 ante TATO F.C. en una jornada de reacción y carácter.", "El Aldapan Gora abrió la liga con un empate a tres ante TATO F.C. Juanjo inauguró el marcador tras una asistencia de Jare, el segundo llegó en propia puerta y Izan puso el tercero. El equipo tuvo que rehacerse pronto a la lesión de Dan, sustituido por Juanma en el minuto 5, y siguió compitiendo hasta el final. Izan, autor del último tanto, fue elegido MVP del encuentro.", "PARTIDOS", "2026-10-18", izanPhoto, "gold", 1);
    await database.run("INSERT OR IGNORE INTO news (id,title,slug,excerpt,content,tag,date,image,accent,published,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,datetime('now'))", "liga-aula-empate-2026", "Juanma lidera otro empate de mucho oficio", "juanma-lidera-otro-empate-de-mucho-oficio", "El Aldapan Gora empata 2–2 frente a AULA C.F. y suma su segundo punto de la temporada.", "El Aldapan Gora volvió a competir hasta el final para sacar un 2–2 ante AULA C.F. Moreno abrió el marcador tras una asistencia de Baroffi y Ortiz anotó el segundo. El equipo repartió esfuerzos con siete cambios durante el encuentro, con la entrada de Izan, Rey y Padri tras el descanso. Juanma fue elegido MVP por su trabajo y liderazgo en el centro del campo.", "PARTIDOS", "2026-10-25", juanmaPhoto, "dark", 1);
    if (izanPhoto) await database.run("UPDATE news SET image=?, updated_at=datetime('now') WHERE id=? AND image=''", izanPhoto, "liga-tato-empate-2026");
    if (juanmaPhoto) await database.run("UPDATE news SET image=?, updated_at=datetime('now') WHERE id=? AND image=''", juanmaPhoto, "liga-aula-empate-2026");
    await database.run("INSERT OR REPLACE INTO app_meta (key,value) VALUES ('league_results_2026_27_j1_j2_20261026_v2','1')");
  }
  const leaguePresentationRepair = await database.get<{ value: string }>("SELECT value FROM app_meta WHERE key='league_presentation_repair_20261026_v3'");
  if (!leaguePresentationRepair) {
    const roster = await database.all<{ id: string; name: string; alias: string; photo: string }[]>("SELECT id,name,alias,photo FROM players");
    const normalizePlayer = (value: string) => value.trim().normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase("es-ES");
    const player = (name: string) => roster.find((item) => [item.name, item.alias].some((value) => normalizePlayer(value) === normalizePlayer(name)));
    const moreno = player("Moreno");
    const baroffi = player("Baroffi");
    const aula = await database.get<{ events: string }>("SELECT events FROM matches WHERE id='liga-2026-27-aula'");
    if (aula && moreno && baroffi) {
      const events = JSON.parse(aula.events);
      const goal = events.find((event: { type: string; player: string }) => event.type === "goal" && event.player === moreno.id) || events.find((event: { type: string }) => event.type === "goal");
      if (goal) { goal.player = moreno.id; goal.relatedPlayer = baroffi.id; }
      await database.run("UPDATE matches SET events=?, updated_at=datetime('now') WHERE id='liga-2026-27-aula'", JSON.stringify(events));
    }
    const juanjo = player("Juanjo");
    const juanma = player("Juanma");
    if (juanjo?.photo) await database.run("UPDATE news SET image=?, updated_at=datetime('now') WHERE id='amistoso-alacran-octubre-2026'", juanjo.photo);
    if (juanma?.photo) await database.run("UPDATE news SET image=?, updated_at=datetime('now') WHERE id='liga-aula-empate-2026'", juanma.photo);
    await database.run("INSERT OR REPLACE INTO app_meta (key,value) VALUES ('league_presentation_repair_20261026_v3','1')");
  }
  const tatoAssistRepair = await database.get<{ value: string }>("SELECT value FROM app_meta WHERE key='tato_izan_assist_20261027_v1'");
  if (!tatoAssistRepair) {
    const roster = await database.all<{ id: string; name: string; alias: string }[]>("SELECT id,name,alias FROM players");
    const normalizePlayer = (value: string) => value.trim().normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase("es-ES");
    const byName = (name: string) => roster.find((player) => [player.name, player.alias].some((value) => normalizePlayer(value) === normalizePlayer(name)))?.id;
    const tato = await database.get<{ events: string }>("SELECT events FROM matches WHERE id='liga-2026-27-tato'");
    const izanId = byName("Izan"); const juanjoId = byName("Juanjo");
    if (tato && izanId && juanjoId) {
      const events = JSON.parse(tato.events);
      const izanGoal = events.find((event: { type: string; player: string }) => event.type === "goal" && event.player === izanId);
      if (izanGoal) {
        izanGoal.relatedPlayer = juanjoId;
        await database.run("UPDATE matches SET events=?, updated_at=datetime('now') WHERE id='liga-2026-27-tato'", JSON.stringify(events));
      }
    }
    await database.run("INSERT OR REPLACE INTO app_meta (key,value) VALUES ('tato_izan_assist_20261027_v1','1')");
  }
  const manualOfficialResults = await database.get<{ value: string }>("SELECT value FROM app_meta WHERE key='official_results_manual_2026_27_j1_j2_v1'");
  if (!manualOfficialResults) {
    // Resultados validados por el club. No provienen de la descarga externa.
    const results = [
      [1, "A.C.D.M C.A.M.", "ESTRELLA COJA F.C", 1, 2],
      [1, "Asociación Alacrán 1997", "AULA C.F.", 1, 3],
      [1, "E F TEJAR", "ATLETICO JABALIS", 5, 4],
      [1, "Avila FC", "MAKAKOS FC", 2, 2],
      [1, "ESCUELA DE HORTALEZA", "Dragones de Lavapiés B", 11, 0],
      [2, "BOSTON TURRADORES", "A.C.D.M C.A.M.", 1, 0],
      [2, "MAKAKOS FC", "ESCUELA DE HORTALEZA", 1, 2],
      [2, "TATO F.C.", "Avila FC", 3, 1],
      [2, "AULA C.F.", "ALDAPAN GORA FC", 2, 2],
      [2, "ATLETICO JABALIS", "Asociación Alacrán 1997", 4, 2],
      [2, "ESTRELLA COJA F.C", "E F TEJAR", 6, 1],
    ] as const;
    for (const [jornada, homeTeam, awayTeam, homeScore, awayScore] of results) {
      await database.run("UPDATE official_matches SET homeScore=?, awayScore=?, status='F' WHERE season='2026/27' AND jornada=? AND homeTeam=? AND awayTeam=?", homeScore, awayScore, jornada, homeTeam, awayTeam);
    }
    await database.run("INSERT OR REPLACE INTO official_sync (season,synced_at,source_url) VALUES ('2026/27',datetime('now'),'Resultados registrados manualmente por el club')");
    await database.run("INSERT OR REPLACE INTO app_meta (key,value) VALUES ('official_results_manual_2026_27_j1_j2_v1','1')");
  }
  const privateProfilesImported = await database.get<{ value: string }>("SELECT value FROM app_meta WHERE key='private_player_profiles_import_20261104_v1'");
  if (!privateProfilesImported) {
    const statement = await database.prepare("INSERT OR IGNORE INTO player_private_profiles (player_id,age,height_cm,weight_kg,dominant_foot,natural_position,secondary_positions,updated_at) VALUES (?,?,?,?,?,?,?,datetime('now'))");
    for (const [playerId, profile] of Object.entries(privatePlayerProfileSeeds)) {
      const player = await database.get<{ id: string }>("SELECT id FROM players WHERE id=?", playerId);
      if (player) await statement.run(playerId, profile.age, profile.heightCm, profile.weightKg, profile.dominantFoot, profile.naturalPosition, profile.secondaryPositions);
    }
    await statement.finalize();
    await database.run("INSERT OR REPLACE INTO app_meta (key,value) VALUES ('private_player_profiles_import_20261104_v1','1')");
  }
  const privateProfileNarrativesImported = await database.get<{ value: string }>("SELECT value FROM app_meta WHERE key='private_player_profiles_narratives_import_20261104_v1'");
  if (!privateProfileNarrativesImported) {
    const sourceFile = path.join(dataDirectory, "imports", "Aldapan Gora.xlsx");
    const playerBySheet = new Map([
      ["MAURO #2", "mauro-m"], ["URKO #3", "urko"], ["JUANMA #4", "juanma"], ["REY #5", "rey"], ["JARE #7", "caspilla"], ["PADRINO #8", "padri"], ["ORTIZ #9", "ortiz"], ["SERGIO #10", "corisco"], ["PEDRO #11", "pedro"], ["JAVI #13", "javi"], ["DAN #14", "Jones"], ["DANI #15", "dani"], ["MARTIN #17", "krepox"], ["BAROFFI #18", "juan-baroffi"], ["MOLINA #19", "molinpower"], ["MORENO #22", "moreno"], ["MARIO #25", "mario"], ["IVAN #28", "ivan"], ["IZAN #38", "izan"], ["ANGLADA #79", "anglada"], ["JUANJO #80", "juanjo"],
    ]);
    const normalizeSheetName = (value: string) => value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toUpperCase();
    try {
      await fs.access(sourceFile);
      const workbook = XLSX.read(await fs.readFile(sourceFile), { type: "buffer", cellText: false, cellDates: false });
      for (const sheetName of workbook.SheetNames) {
        const playerId = playerBySheet.get(normalizeSheetName(sheetName));
        if (!playerId) continue;
        const worksheet = workbook.Sheets[sheetName];
        const content = (cell: string) => String(worksheet[cell]?.v || "").trim();
        await database.run(
          "INSERT INTO player_private_profiles (player_id,analysis,keys_to_use,cautions,tactical_fit,updated_at) VALUES (?,?,?,?,?,datetime('now')) ON CONFLICT(player_id) DO UPDATE SET analysis=excluded.analysis,keys_to_use=excluded.keys_to_use,cautions=excluded.cautions,tactical_fit=excluded.tactical_fit,updated_at=datetime('now')",
          playerId, content("B17"), content("B36"), content("B55"), content("B74"),
        );
      }
      await database.run("INSERT OR REPLACE INTO app_meta (key,value) VALUES ('private_player_profiles_narratives_import_20261104_v1','1')");
    } catch (error) {
      console.error("No se han podido importar los textos privados de los jugadores", error);
    }
  }
  const privateMatchReportsImported = await database.get<{ value: string }>("SELECT value FROM app_meta WHERE key='private_match_reports_import_20261104_v1'");
  if (!privateMatchReportsImported) {
    const sourceFile = path.join(dataDirectory, "imports", "Aldapan Gora.xlsx");
    try {
      await fs.access(sourceFile);
      const workbook = XLSX.read(await fs.readFile(sourceFile), { type: "buffer", cellText: false, cellDates: false });
      const worksheet = workbook.Sheets["Análisis de partidos"];
      if (worksheet) {
        const content = (cell: string) => String(worksheet[cell]?.v || "").trim();
        const reports = [
          {
            matchId: "liga-2026-27-tato",
            overview: [content("B32"), content("B40")].filter(Boolean).join("\n\n"),
            offensive: content("B78"), defensive: content("B85"), transitions: content("B92"), setPieces: [content("B99"), content("B102")].filter(Boolean).join("\n\n"), strengths: content("B112"), conclusions: content("B148"), needs: [content("B161"), content("B182")].filter(Boolean).join("\n\n"),
          },
          {
            matchId: "liga-2026-27-aula",
            overview: [content("CL32"), content("CL40")].filter(Boolean).join("\n\n"),
            offensive: content("CL78"), defensive: content("CL85"), transitions: content("CL92"), setPieces: [content("CL99"), content("CL102")].filter(Boolean).join("\n\n"), strengths: content("CL112"), conclusions: content("CL148"), needs: [content("CL161"), content("CL182")].filter(Boolean).join("\n\n"),
          },
        ];
        for (const report of reports) await database.run(
          "INSERT OR IGNORE INTO match_private_reports (match_id,overview,offensive,defensive,transitions,set_pieces,strengths,conclusions,needs,updated_at) VALUES (?,?,?,?,?,?,?,?,?,datetime('now'))",
          report.matchId, report.overview, report.offensive, report.defensive, report.transitions, report.setPieces, report.strengths, report.conclusions, report.needs,
        );
        await database.run("INSERT OR REPLACE INTO app_meta (key,value) VALUES ('private_match_reports_import_20261104_v1','1')");
      }
    } catch (error) {
      console.error("No se han podido importar los informes privados de los partidos", error);
    }
  }
  const privateMatchPlayerReportsImported = await database.get<{ value: string }>("SELECT value FROM app_meta WHERE key='private_match_player_reports_import_20261104_v1'");
  if (!privateMatchPlayerReportsImported) {
    const sourceFile = path.join(dataDirectory, "imports", "Aldapan Gora.xlsx");
    try {
      await fs.access(sourceFile);
      const workbook = XLSX.read(await fs.readFile(sourceFile), { type: "buffer", cellText: false, cellDates: false });
      const worksheet = workbook.Sheets["Análisis de partidos"];
      if (worksheet) {
        const playerIds = new Map([
          ["JAVI", "javi"], ["DANIEL JONES", "Jones"], ["DAN", "Jones"], ["REY", "rey"], ["MAURO", "mauro-m"], ["DANI", "dani"], ["JUANMA", "juanma"], ["URKO", "urko"], ["MOLINA", "molinpower"], ["IZAN", "izan"], ["SERGIO", "corisco"], ["PADRINO", "padri"], ["PADRI", "padri"], ["JARE", "caspilla"], ["ORTIZ", "ortiz"], ["MORENO", "moreno"], ["JUANJO", "juanjo"], ["BAROFFI", "juan-baroffi"], ["JUAN BAROFFI", "juan-baroffi"], ["MARTIN", "krepox"], ["MARTÍN", "krepox"], ["IVAN", "ivan"], ["IVÁN", "ivan"], ["MARIO", "mario"], ["PEDRO", "pedro"],
        ]);
        const normalizePlayerName = (value: string) => value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toUpperCase();
        const content = (cell: string) => String(worksheet[cell]?.v || "").trim();
        const rows = [196, 206, 216, 226, 236, 246, 256, 275, 285, 295, 305, 315, 325, 335, 355, 365, 375, 385];
        const importColumn = async (matchId: string, nameColumn: string, evaluationColumn: string) => {
          for (const row of rows) {
            const playerId = playerIds.get(normalizePlayerName(content(`${nameColumn}${row}`)));
            const evaluation = content(`${evaluationColumn}${row}`);
            if (!playerId || !evaluation) continue;
            await database.run("INSERT OR IGNORE INTO match_player_reports (match_id,player_id,evaluation,updated_at) VALUES (?,?,?,datetime('now'))", matchId, playerId, evaluation);
          }
        };
        await importColumn("liga-2026-27-tato", "B", "N");
        await importColumn("liga-2026-27-aula", "CL", "CX");
        await database.run("INSERT OR REPLACE INTO app_meta (key,value) VALUES ('private_match_player_reports_import_20261104_v1','1')");
      }
    } catch (error) {
      console.error("No se han podido importar las valoraciones privadas de jugadores", error);
    }
  }
  const preseasonReportsImported = await database.get<{ value: string }>("SELECT value FROM app_meta WHERE key='private_preseason_reports_import_20261104_v1'");
  if (!preseasonReportsImported) {
    const sourceFile = path.join(dataDirectory, "imports", "Aldapan Gora.xlsx");
    try {
      await fs.access(sourceFile);
      const workbook = XLSX.read(await fs.readFile(sourceFile), { type: "buffer", cellText: false, cellDates: false });
      const worksheet = workbook.Sheets["Análisis de PRETEMPORADA"];
      if (worksheet) {
        const content = (cell: string) => String(worksheet[cell]?.v || "").trim();
        const report = (matchId: string, column: string) => database.run(
          "INSERT OR IGNORE INTO match_private_reports (match_id,overview,offensive,defensive,transitions,set_pieces,strengths,conclusions,needs,updated_at) VALUES (?,?,?,?,?,?,?,?,?,datetime('now'))",
          matchId, [content(`${column}32`), content(`${column}40`)].filter(Boolean).join("\n\n"), content(`${column}78`), content(`${column}85`), content(`${column}92`), [content(`${column}99`), content(`${column}102`)].filter(Boolean).join("\n\n"), content(`${column}112`), content(`${column}148`), [content(`${column}161`), content(`${column}182`)].filter(Boolean).join("\n\n"),
        );
        await report("aldapan-atletico-jabalies-2026-09-20", "B");
        await report("amistoso-alacran-2026-10-11", "CL");
        const playerIds = new Map([ ["JAVI", "javi"], ["DAN JONES", "Jones"], ["DANIEL JONES", "Jones"], ["DANI", "dani"], ["MARTIN", "krepox"], ["MARTÍN", "krepox"], ["MAURO", "mauro-m"], ["REY", "rey"], ["URKO", "urko"], ["JUANMA", "juanma"], ["SERGIO", "corisco"], ["MOLINA", "molinpower"], ["IZAN", "izan"], ["JUANJO", "juanjo"], ["PEDRO", "pedro"], ["BAROFFI", "juan-baroffi"], ["JUAN BAROFFI", "juan-baroffi"], ["MORENO", "moreno"], ["ORTIZ", "ortiz"], ["JARE", "caspilla"], ["PADRINO", "padri"], ["PADRI", "padri"], ["IVAN", "ivan"], ["IVÁN", "ivan"], ["MARIO", "mario"] ]);
        const normal = (value: string) => value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toUpperCase();
        const rows = [196, 206, 216, 226, 236, 246, 256];
        const playerReport = async (matchId: string, nameColumn: string, evaluationColumn: string) => {
          for (const row of rows) { const playerId = playerIds.get(normal(content(`${nameColumn}${row}`))); const evaluation = content(`${evaluationColumn}${row}`); if (playerId && evaluation) await database.run("INSERT OR IGNORE INTO match_player_reports (match_id,player_id,evaluation,updated_at) VALUES (?,?,?,datetime('now'))", matchId, playerId, evaluation); }
        };
        await playerReport("aldapan-atletico-jabalies-2026-09-20", "B", "N");
        await playerReport("amistoso-alacran-2026-10-11", "CL", "CX");
        await database.run("INSERT OR REPLACE INTO app_meta (key,value) VALUES ('private_preseason_reports_import_20261104_v1','1')");
      }
    } catch (error) {
      console.error("No se han podido importar los informes de pretemporada", error);
    }
  }
  const squadAnalysisImported = await database.get<{ value: string }>("SELECT value FROM app_meta WHERE key='squad_analysis_import_20261104_v1'");
  if (!squadAnalysisImported) {
    const sourceFile = path.join(dataDirectory, "imports", "Aldapan Gora.xlsx");
    try {
      await fs.access(sourceFile);
      const workbook = XLSX.read(await fs.readFile(sourceFile), { type: "buffer", cellText: false, cellDates: false });
      const worksheet = workbook.Sheets["Análisis de plantilla"];
      if (worksheet) {
        const content = (cell: string) => String(worksheet[cell]?.v || "").trim();
        const list = (rows: number[], nameColumn: string, detailColumn: string, protectColumn?: string) => rows.map((row) => ({ name: content(`${nameColumn}${row}`), detail: content(`${detailColumn}${row}`), protect: protectColumn ? content(`${protectColumn}${row}`) : "" })).filter((item) => item.name || item.detail || item.protect);
        const payload = {
          sections: [
            { title: "Conclusiones principales", tone: "analysis", text: content("B4") }, { title: "Sistemas recomendados", tone: "fit", text: content("P4") }, { title: "Valoración cualitativa", tone: "analysis", text: content("I23") }, { title: "Composición y equilibrio de la plantilla", tone: "positive", text: content("P34") }, { title: "Fortalezas y debilidades colectivas", tone: "positive", text: content("B101") }, { title: "Riesgos colectivos", tone: "warning", text: content("B157") }, { title: "Defensas centrales", tone: "analysis", text: content("P51") }, { title: "Laterales y carrileros", tone: "analysis", text: content("P72") }, { title: "Centro del campo", tone: "positive", text: content("P110") }, { title: "Extremos", tone: "warning", text: content("P162") }, { title: "Delanteros", tone: "warning", text: content("P204") },
          ].filter((section) => section.text),
          needs: list([21, 22, 23, 24, 25, 26, 27, 28, 29], "AA", "AD"),
          observables: [7, 8, 9, 10, 11, 12, 13, 14, 15].map((row) => ({ aspect: content(`AA${row}`), question: content(`AD${row}`) })).filter((item) => item.aspect),
          opponentGuide: [36, 37, 38, 39, 40, 41].map((row) => ({ rival: content(`AA${row}`), resources: content(`AD${row}`), avoid: content(`AI${row}`) })).filter((item) => item.rival),
          profiles: [
            { title: "Centrales", rows: list([68, 69, 70], "P", "Q", "U") }, { title: "Laterales", rows: list([103, 104, 105, 106, 107], "P", "Q", "U") }, { title: "Extremos", rows: list([200, 201, 202], "P", "Q", "U") },
          ],
        };
        await database.run("INSERT OR IGNORE INTO squad_analysis (id,payload,updated_at) VALUES ('2026-27',?,datetime('now'))", JSON.stringify(payload));
        await database.run("INSERT OR REPLACE INTO app_meta (key,value) VALUES ('squad_analysis_import_20261104_v1','1')");
      }
    } catch (error) {
      console.error("No se ha podido importar el análisis de plantilla", error);
    }
  }
  const squadAnalysisStructureImported = await database.get<{ value: string }>("SELECT value FROM app_meta WHERE key='squad_analysis_structure_import_20261104_v1'");
  if (!squadAnalysisStructureImported) {
    const sourceFile = path.join(dataDirectory, "imports", "Aldapan Gora.xlsx");
    try {
      await fs.access(sourceFile);
      const workbook = XLSX.read(await fs.readFile(sourceFile), { type: "buffer", cellText: false, cellDates: false });
      const worksheet = workbook.Sheets["Análisis de plantilla"];
      const existing = await database.get<{ payload: string }>("SELECT payload FROM squad_analysis WHERE id='2026-27'");
      if (worksheet && existing) {
        const content = (cell: string) => String(worksheet[cell]?.v || "").trim();
        let payload: Record<string, unknown> = {};
        try { payload = JSON.parse(existing.payload || "{}"); } catch { payload = {}; }
        if (!Array.isArray(payload.observables) || payload.observables.length === 0) payload.observables = [7, 8, 9, 10, 11, 12, 13, 14, 15].map((row) => ({ aspect: content(`AA${row}`), question: content(`AD${row}`) })).filter((item) => item.aspect);
        const oldNeeds = Array.isArray(payload.needs) ? payload.needs as { need?: string }[] : [];
        if (oldNeeds.some((item) => item.need === "A estudiar")) payload.needs = [21, 22, 23, 24, 25, 26, 27, 28, 29].map((row) => ({ need: content(`AD${row}`), work: "" })).filter((item) => item.need);
        await database.run("UPDATE squad_analysis SET payload=?, updated_at=datetime('now') WHERE id='2026-27'", JSON.stringify(payload));
        await database.run("INSERT OR REPLACE INTO app_meta (key,value) VALUES ('squad_analysis_structure_import_20261104_v1','1')");
      }
    } catch (error) {
      console.error("No se ha podido completar la estructura del análisis de plantilla", error);
    }
  }
  // Completa la radiografía de plantilla con todos los bloques del Excel. La
  // primera importación solo incorporó un resumen y dejó fuera líneas enteras.
  const squadAnalysisCompleteImported = await database.get<{ value: string }>("SELECT value FROM app_meta WHERE key='squad_analysis_complete_import_20261104_v1'");
  if (!squadAnalysisCompleteImported) {
    const sourceFile = path.join(dataDirectory, "imports", "Aldapan Gora.xlsx");
    try {
      await fs.access(sourceFile);
      const workbook = XLSX.read(await fs.readFile(sourceFile), { type: "buffer", cellText: false, cellDates: false });
      const worksheet = workbook.Sheets["Análisis de plantilla"];
      const existing = await database.get<{ payload: string }>("SELECT payload FROM squad_analysis WHERE id='2026-27'");
      if (worksheet && existing) {
        const content = (cell: string) => String(worksheet[cell]?.v || "").trim();
        const profileText = (introCell: string, rows: number[] = []) => [content(introCell), ...rows.map((row) => {
          const name = content(`P${row}`); const contribution = content(`Q${row}`); const protect = content(`U${row}`);
          return name ? `${name}\nAporta: ${contribution}\nProteger: ${protect}` : "";
        })].filter(Boolean).join("\n\n");
        let payload: { sections?: { title: string; text: string; tone?: string }[]; profiles?: { title: string; text?: string; rows?: unknown[] }[]; needs?: { need: string; work: string }[]; observables?: { aspect: string; question: string }[]; opponentGuide?: { team?: string; strength?: string; key?: string; rival?: string; resources?: string; avoid?: string }[] } = {};
        try { payload = JSON.parse(existing.payload || "{}"); } catch { payload = {}; }
        const originalSummary = content("I23");
        const completeSections = [
          ["Conclusiones principales", "analysis", content("B4")], ["Sistemas recomendados", "fit", content("P4")], ["Valoración cualitativa", "analysis", content("B44")], ["Composición y equilibrio de la plantilla", "positive", content("P34")], ["Fortalezas y debilidades colectivas", "positive", content("B101")], ["Riesgos colectivos", "warning", content("B157")],
          ["Defensas centrales", "analysis", content("P51")], ["Laterales y carrileros", "analysis", content("P72")], ["Centro del campo", "positive", content("P110")], ["Extremos", "warning", content("P162")], ["Delanteros", "warning", content("P204")],
        ] as const;
        const sectionByTitle = new Map((payload.sections || []).map((section) => [section.title, section]));
        for (const [title, tone, text] of completeSections) {
          if (!text) continue;
          const previous = sectionByTitle.get(title);
          const shouldRefresh = !previous || !previous.text || (title === "Valoración cualitativa" && previous.text === originalSummary);
          sectionByTitle.set(title, shouldRefresh ? { title, tone, text } : previous);
        }
        payload.sections = completeSections.map(([title]) => sectionByTitle.get(title)).filter((section): section is { title: string; text: string; tone?: string } => Boolean(section));
        const completeProfiles = [
          { title: "Defensas centrales", text: profileText("P51", [68, 69, 70]) }, { title: "Laterales y carrileros", text: profileText("P72", [103, 104, 105, 106, 107]) }, { title: "Centro del campo", text: profileText("P110") }, { title: "Extremos", text: profileText("P162", [200, 201, 202]) }, { title: "Delanteros", text: profileText("P204") },
        ].filter((profile) => profile.text);
        const profileByTitle = new Map((payload.profiles || []).map((profile) => [profile.title, profile]));
        for (const profile of completeProfiles) {
          const previous = profileByTitle.get(profile.title);
          if (!previous || !previous.text) profileByTitle.set(profile.title, profile);
        }
        payload.profiles = completeProfiles.map((profile) => profileByTitle.get(profile.title) || profile);
        payload.needs = [21, 22, 23, 24, 25, 26, 27, 28, 29].map((row) => ({ need: content(`AA${row}`) || "A desarrollar", work: content(`AD${row}`) })).filter((item) => item.work);
        payload.observables = [7, 8, 9, 10, 11, 12, 13, 14, 15].map((row) => ({ aspect: content(`AA${row}`), question: content(`AD${row}`) })).filter((item) => item.aspect);
        payload.opponentGuide = [36, 37, 38, 39, 40, 41].map((row) => ({ team: content(`AA${row}`), strength: content(`AD${row}`), key: content(`AI${row}`) })).filter((item) => item.team);
        await database.run("UPDATE squad_analysis SET payload=?, updated_at=datetime('now') WHERE id='2026-27'", JSON.stringify(payload));
        await database.run("INSERT OR REPLACE INTO app_meta (key,value) VALUES ('squad_analysis_complete_import_20261104_v1','1')");
      }
    } catch (error) {
      console.error("No se ha podido completar el análisis de plantilla", error);
    }
  }
  // Repara fichas que pudieron perder parte de su contenido al consolidar IDs
  // (por ejemplo Dan/Jones). Solo rellena campos vacíos: no pisa ediciones de la Junta.
  const privateProfilesCompleted = await database.get<{ value: string }>("SELECT value FROM app_meta WHERE key='private_player_profiles_completion_20261104_v1'");
  if (!privateProfilesCompleted) {
    const sourceFile = path.join(dataDirectory, "imports", "Aldapan Gora.xlsx");
    const playerBySheet = new Map([
      ["MAURO #2", "mauro-m"], ["URKO #3", "urko"], ["JUANMA #4", "juanma"], ["REY #5", "rey"], ["JARE #7", "caspilla"], ["PADRINO #8", "padri"], ["ORTIZ #9", "ortiz"], ["SERGIO #10", "corisco"], ["PEDRO #11", "pedro"], ["JAVI #13", "javi"], ["DAN #14", "Jones"], ["DANI #15", "dani"], ["MARTIN #17", "krepox"], ["BAROFFI #18", "juan-baroffi"], ["MOLINA #19", "molinpower"], ["MORENO #22", "moreno"], ["MARIO #25", "mario"], ["IVAN #28", "ivan"], ["IZAN #38", "izan"], ["ANGLADA #79", "anglada"], ["JUANJO #80", "juanjo"],
    ]);
    const normalized = (value: string) => value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toUpperCase();
    try {
      await fs.access(sourceFile);
      const workbook = XLSX.read(await fs.readFile(sourceFile), { type: "buffer", cellText: false, cellDates: false });
      for (const sheetName of workbook.SheetNames) {
        const playerId = playerBySheet.get(normalized(sheetName));
        if (!playerId || !(await database.get<{ id: string }>("SELECT id FROM players WHERE id=?", playerId))) continue;
        const worksheet = workbook.Sheets[sheetName];
        const content = (cell: string) => String(worksheet[cell]?.v || "").trim();
        const previous = await database.get<{ age: number | null; height_cm: number | null; weight_kg: number | null; dominant_foot: string; natural_position: string; secondary_positions: string; analysis: string; keys_to_use: string; cautions: string; tactical_fit: string }>("SELECT age,height_cm,weight_kg,dominant_foot,natural_position,secondary_positions,analysis,keys_to_use,cautions,tactical_fit FROM player_private_profiles WHERE player_id=?", playerId);
        const seed = privatePlayerProfileSeeds[playerId];
        await database.run(
          "INSERT INTO player_private_profiles (player_id,age,height_cm,weight_kg,dominant_foot,natural_position,secondary_positions,analysis,keys_to_use,cautions,tactical_fit,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,datetime('now')) ON CONFLICT(player_id) DO UPDATE SET age=excluded.age,height_cm=excluded.height_cm,weight_kg=excluded.weight_kg,dominant_foot=excluded.dominant_foot,natural_position=excluded.natural_position,secondary_positions=excluded.secondary_positions,analysis=excluded.analysis,keys_to_use=excluded.keys_to_use,cautions=excluded.cautions,tactical_fit=excluded.tactical_fit,updated_at=datetime('now')",
          playerId, previous?.age ?? seed?.age ?? null, previous?.height_cm ?? seed?.heightCm ?? null, previous?.weight_kg ?? seed?.weightKg ?? null, previous?.dominant_foot || seed?.dominantFoot || "", previous?.natural_position || seed?.naturalPosition || "", previous?.secondary_positions || seed?.secondaryPositions || "", previous?.analysis || content("B17"), previous?.keys_to_use || content("B36"), previous?.cautions || content("B55"), previous?.tactical_fit || content("B74"),
        );
      }
      await database.run("INSERT OR REPLACE INTO app_meta (key,value) VALUES ('private_player_profiles_completion_20261104_v1','1')");
    } catch (error) {
      console.error("No se han podido completar las fichas privadas", error);
    }
  }
  const boardAccountsReset = await database.get<{ value: string }>("SELECT value FROM app_meta WHERE key='board_admin_accounts_reset_20261104_v2'");
  if (!boardAccountsReset) {
    // La junta pidió sustituir las cuentas anteriores. Las cinco autorizadas se registran ellas mismas.
    await database.run("DELETE FROM users");
    await database.run("INSERT OR REPLACE INTO app_meta (key,value) VALUES ('board_admin_accounts_reset_20261104_v2','1')");
  }
  return database;
}
