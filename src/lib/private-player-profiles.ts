export type PrivatePlayerProfileSeed = {
  age: number | null;
  heightCm: number | null;
  weightKg: number | null;
  dominantFoot: string;
  naturalPosition: string;
  secondaryPositions: string;
};

// Datos importados de las fichas individuales del documento del equipo.
// Nunca se exponen desde la API pública de jugadores.
export const privatePlayerProfileSeeds: Record<string, PrivatePlayerProfileSeed> = {
  "mauro-m": { age: 26, heightCm: 166, weightKg: 67, dominantFoot: "Izquierdo", naturalPosition: "MC Defensivo", secondaryPositions: "Defensa central" },
  urko: { age: 24, heightCm: 188, weightKg: 98, dominantFoot: "Derecho", naturalPosition: "Defensa central", secondaryPositions: "" },
  juanma: { age: 26, heightCm: 185, weightKg: 79, dominantFoot: "Derecho", naturalPosition: "Mediocentro defensivo", secondaryPositions: "Defensa central" },
  rey: { age: 25, heightCm: 180, weightKg: 81, dominantFoot: "Derecho", naturalPosition: "Defensa central", secondaryPositions: "" },
  caspilla: { age: 26, heightCm: 167, weightKg: 68, dominantFoot: "Derecho", naturalPosition: "Extremo derecho", secondaryPositions: "" },
  padri: { age: 25, heightCm: 170, weightKg: 70, dominantFoot: "Derecho", naturalPosition: "Lateral derecho", secondaryPositions: "Mediapunta" },
  ortiz: { age: 23, heightCm: 179, weightKg: 76, dominantFoot: "Derecho", naturalPosition: "Extremo izquierdo", secondaryPositions: "" },
  corisco: { age: 26, heightCm: 176, weightKg: 74, dominantFoot: "Derecho", naturalPosition: "Mediapunta", secondaryPositions: "Mediocentro" },
  pedro: { age: 25, heightCm: 178, weightKg: 92, dominantFoot: "Derecho", naturalPosition: "Delantero centro", secondaryPositions: "" },
  javi: { age: 23, heightCm: 177, weightKg: 78, dominantFoot: "Derecho", naturalPosition: "Portero", secondaryPositions: "" },
  Jones: { age: 26, heightCm: 178, weightKg: 74, dominantFoot: "Derecho", naturalPosition: "Lateral derecho", secondaryPositions: "Defensa central" },
  dani: { age: 26, heightCm: 176, weightKg: 74, dominantFoot: "Izquierdo", naturalPosition: "Lateral izquierdo", secondaryPositions: "Defensa central" },
  krepox: { age: 25, heightCm: 164, weightKg: 63, dominantFoot: "Derecho", naturalPosition: "Carrilero derecho", secondaryPositions: "Lateral derecho" },
  "juan-baroffi": { age: 26, heightCm: 179, weightKg: 74, dominantFoot: "Derecho", naturalPosition: "Mediapunta", secondaryPositions: "Falso 9" },
  molinpower: { age: 24, heightCm: 173, weightKg: 76, dominantFoot: "Derecho", naturalPosition: "Mediocentro", secondaryPositions: "Mediocentro defensivo" },
  moreno: { age: 25, heightCm: 174, weightKg: 73, dominantFoot: "Derecho", naturalPosition: "Interior izquierdo", secondaryPositions: "Mediapunta / Mediocentro" },
  mario: { age: 24, heightCm: 186, weightKg: 82, dominantFoot: "Izquierdo", naturalPosition: "Defensa central", secondaryPositions: "MC Defensivo" },
  ivan: { age: 26, heightCm: 165, weightKg: 77, dominantFoot: "Izquierdo", naturalPosition: "Lateral izquierdo", secondaryPositions: "" },
  izan: { age: 22, heightCm: 182, weightKg: 74, dominantFoot: "Derecho", naturalPosition: "Box-to-box", secondaryPositions: "Mediapunta / MC Defensivo" },
  anglada: { age: 23, heightCm: 164, weightKg: 59, dominantFoot: "Derecho", naturalPosition: "Extremo izquierdo", secondaryPositions: "Extremo derecho" },
  juanjo: { age: 23, heightCm: 176, weightKg: 75, dominantFoot: "Derecho", naturalPosition: "Delantero centro", secondaryPositions: "Mediapunta" },
};
