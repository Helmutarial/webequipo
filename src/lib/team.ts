export type Role = "ADMIN" | "USER";

export type Player = {
  id: string;
  name: string;
  alias: string;
  number: number;
  position: string;
  photo: string;
  goals: number;
  assists: number;
  appearances: number;
  minutes: number;
  starterAppearances: number;
  substituteAppearances: number;
  mvpCount: number;
  bio: string;
};

export const ADMIN_PROFILE = {
  email: "pedrojiblanco@gmail.com",
  name: "Pedro",
  role: "ADMIN" as const,
};

export const initialPlayers: Player[] = [
  ["urko", "Urko", "El Muro", 3], ["caspilla", "Caspilla", "Capi", 7], ["eskuh", "Eskuh", "Eskuh", 13], ["zuha", "Zuha", "Zuha", 8], ["corisco", "Corisco", "Cori", 10], ["mauro-m", "Mauro M", "Mauro", 2], ["beltran-jr", "Beltran JR", "Beltran", 9], ["joaquinho", "Joaquinho", "Joa", 6], ["ortiz", "Ortiz", "Ortiz", 15], ["krepox", "Krepox", "Kre", 17], ["rey", "Rey", "Rey", 5], ["tono", "Toño", "Toño", 99], ["d-plaza", "D. Plaza", "Plaza", 21], ["fj-garcia", "F.J. García", "F.J.", 14], ["juanorro", "Juanorro", "Juanorro", 23], ["anglada", "Anglada", "Anglada", 80], ["molinpower", "MolinPower", "Molin", 19], ["moreno", "Moreno", "Moreno", 22], ["luaces", "Luaces", "Luaces", 4], ["ivan", "Ivan", "Ivan", 28], ["saul", "Saúl", "Saúl", 20], ["pedro", "Pedro", "Pedro", 11],
  ["mario", "Mario", "Mario", 25], ["juan-baroffi", "Juan Baroffi", "Baroffi", 18],
].map(([id, name, alias, number]) => ({
  id: id as string, name: name as string, alias: alias as string, number: number as number,
  position: "Jugador", photo: "", goals: 0, assists: 0, appearances: 0,
  minutes: 0, starterAppearances: 0, substituteAppearances: 0, mvpCount: 0,
  bio: "Jugador del Aldapan Gora.",
}));

initialPlayers.find((player) => player.id === "caspilla")!.name = "Jare";
initialPlayers.find((player) => player.id === "caspilla")!.alias = "Jare";
initialPlayers.find((player) => player.id === "corisco")!.name = "Sergio";
initialPlayers.find((player) => player.id === "corisco")!.alias = "Sergio";
initialPlayers.find((player) => player.id === "krepox")!.name = "Martin";
initialPlayers.find((player) => player.id === "krepox")!.alias = "Martin";
initialPlayers.push({ id: "dani", name: "Dani", alias: "Dani", number: 15, position: "Jugador", photo: "", goals: 0, assists: 0, appearances: 0, minutes: 0, starterAppearances: 0, substituteAppearances: 0, mvpCount: 0, bio: "Jugador del Aldapan Gora." });
initialPlayers.push(
  ...["Juanjo", "Padri", "Gerardo", "Carlos"].map((name) => ({ id: name.toLowerCase(), name, alias: name, number: 0, position: "Jugador", photo: "", goals: 0, assists: 0, appearances: 0, minutes: 0, starterAppearances: 0, substituteAppearances: 0, mvpCount: 0, bio: "Jugador del Aldapan Gora." })),
);

const removedPlayerIds = new Set(["zuha", "beltran-jr", "joaquinho", "tono", "d-plaza", "juanorro", "luaces", "saul"]);
for (let index = initialPlayers.length - 1; index >= 0; index--) if (removedPlayerIds.has(initialPlayers[index].id)) initialPlayers.splice(index, 1);

const positionUpdates: Record<string, { name?: string; alias?: string; position: string }> = {
  eskuh: { position: "POR" },
  "juan-baroffi": { position: "DC / MP" },
  pedro: { position: "Delantero" },
  ortiz: { position: "MI" },
  moreno: { position: "MI / MC" },
  krepox: { position: "LD" },
  "fj-garcia": { name: "Figa", alias: "Figa", position: "DC" },
  anglada: { position: "MD" },
  corisco: { position: "MC / MCD" },
  mario: { position: "DFC / MC / MCD" },
  dani: { position: "LI" },
  ivan: { position: "LI" },
  molinpower: { name: "Molina", alias: "Molina", position: "MC / MCD" },
};
for (const player of initialPlayers) {
  const update = positionUpdates[player.id];
  if (update) Object.assign(player, update);
}
