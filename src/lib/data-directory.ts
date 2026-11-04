import path from "node:path";

// En producción debe apuntar a una carpeta persistente, fuera del checkout.
export function getDataDirectory() {
  const configuredDirectory = process.env.TEAM_DATA_DIR?.trim();
  return configuredDirectory ? path.resolve(configuredDirectory) : path.join(process.cwd(), "data");
}
