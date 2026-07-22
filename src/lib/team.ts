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
  bio: "Jugador del Aldapan Gora.",
}));
