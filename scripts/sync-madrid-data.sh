#!/usr/bin/env bash
set -euo pipefail

docker compose exec -T web node -e '
const secret = process.env.MADRID_SYNC_SECRET;
if (!secret) throw new Error("Falta MADRID_SYNC_SECRET en el contenedor web");
fetch("http://127.0.0.1:3000/api/official-competition?season=2026/27", { method: "POST", headers: { "x-madrid-sync-secret": secret } })
  .then(async (response) => { const body = await response.text(); if (!response.ok) throw new Error(`${response.status}: ${body}`); console.log(body); })
  .catch((error) => { console.error(error); process.exit(1); });
'
