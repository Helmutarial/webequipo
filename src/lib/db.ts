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
      { minute: 0, type: "goal", player: playerId("Izan"), detail: "Aldapan Gora" },
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
  return database;
}
