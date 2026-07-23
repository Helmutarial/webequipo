"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import { useTeam } from "@/components/team-context";

type FormationKey = "4-3-3" | "4-4-2" | "4-2-3-1" | "4-1-4-1" | "4-5-1" | "3-5-2" | "3-4-3" | "3-4-1-2" | "5-3-2" | "5-4-1" | "5-2-3";
type Position = { id: string; label: string; x: number; y: number };
type Player = { id: string; name: string; number: number; position: string; initials: string };
type PickerRole = "starter" | "substitute";

const players: Player[] = [
  { id: "urko", name: "Urko", number: 3, position: "DFC", initials: "U" },
  { id: "caspilla", name: "Jare", number: 7, position: "MD", initials: "J" },
  { id: "eskuh", name: "Eskuh", number: 13, position: "POR", initials: "E" },
  { id: "corisco", name: "Sergio", number: 10, position: "MC / MCD", initials: "S" },
  { id: "mauro-m", name: "Mauro M", number: 2, position: "DFC / MC / MCD", initials: "M" },
  { id: "ortiz", name: "Ortiz", number: 15, position: "MI", initials: "O" },
  { id: "krepox", name: "Martin", number: 17, position: "LD", initials: "M" },
  { id: "rey", name: "Rey", number: 5, position: "DFC", initials: "R" },
  { id: "fj-garcia", name: "Figa", number: 14, position: "DC", initials: "F" },
  { id: "anglada", name: "Anglada", number: 80, position: "MD", initials: "A" },
  { id: "molinpower", name: "Molina", number: 19, position: "MC / MCD", initials: "M" },
  { id: "moreno", name: "Moreno", number: 22, position: "MI / MC", initials: "M" },
  { id: "ivan", name: "Ivan", number: 28, position: "LI", initials: "I" },
  { id: "pedro", name: "Pedro", number: 11, position: "DC", initials: "P" },
  { id: "dani", name: "Dani", number: 15, position: "LI", initials: "D" },
  { id: "mario", name: "Mario", number: 25, position: "DFC / MC / MCD", initials: "M" },
  { id: "juan-baroffi", name: "Juan Baroffi", number: 18, position: "DC / MP", initials: "J" },
  { id: "juanjo", name: "Juanjo", number: 0, position: "DC / MP / MC", initials: "J" },
  { id: "padri", name: "Padri", number: 0, position: "DC / MP", initials: "P" },
  { id: "gerardo", name: "Gerardo", number: 0, position: "LD / MD", initials: "G" },
  { id: "carlos", name: "Carlos", number: 0, position: "DFC / LI / LD", initials: "C" },
];

const formations: Record<FormationKey, Position[]> = {
  "4-3-3": [
    { id: "por", label: "POR", x: 50, y: 91 },
    { id: "ld", label: "DEF", x: 14, y: 72 },
    { id: "dfc1", label: "DEF", x: 38, y: 76 },
    { id: "dfc2", label: "DEF", x: 62, y: 76 },
    { id: "li", label: "DEF", x: 86, y: 72 },
    { id: "mc1", label: "MED", x: 28, y: 52 },
    { id: "mc2", label: "MED", x: 50, y: 57 },
    { id: "mc3", label: "MED", x: 72, y: 52 },
    { id: "ed", label: "ATA", x: 18, y: 25 },
    { id: "dc", label: "ATA", x: 50, y: 18 },
    { id: "ei", label: "ATA", x: 82, y: 25 },
  ],
  "4-4-2": [
    { id: "por", label: "POR", x: 50, y: 91 },
    { id: "ld", label: "DEF", x: 14, y: 72 },
    { id: "dfc1", label: "DEF", x: 38, y: 76 },
    { id: "dfc2", label: "DEF", x: 62, y: 76 },
    { id: "li", label: "DEF", x: 86, y: 72 },
    { id: "md", label: "MED", x: 14, y: 48 },
    { id: "mc1", label: "MED", x: 38, y: 54 },
    { id: "mc2", label: "MED", x: 62, y: 54 },
    { id: "mi", label: "MED", x: 86, y: 48 },
    { id: "dc1", label: "ATA", x: 38, y: 23 },
    { id: "dc2", label: "ATA", x: 62, y: 23 },
  ],
  "4-2-3-1": [
    { id: "por", label: "POR", x: 50, y: 91 },
    { id: "ld", label: "DEF", x: 14, y: 72 },
    { id: "dfc1", label: "DEF", x: 38, y: 76 },
    { id: "dfc2", label: "DEF", x: 62, y: 76 },
    { id: "li", label: "DEF", x: 86, y: 72 },
    { id: "mcd1", label: "MED", x: 36, y: 58 },
    { id: "mcd2", label: "MED", x: 64, y: 58 },
    { id: "mp", label: "MED", x: 50, y: 38 },
    { id: "md", label: "ATA", x: 18, y: 36 },
    { id: "mi", label: "ATA", x: 82, y: 36 },
    { id: "dc", label: "ATA", x: 50, y: 19 },
  ],
  "4-1-4-1": [
    { id: "por", label: "POR", x: 50, y: 91 },
    { id: "ld", label: "DEF", x: 14, y: 72 },
    { id: "dfc1", label: "DEF", x: 38, y: 76 },
    { id: "dfc2", label: "DEF", x: 62, y: 76 },
    { id: "li", label: "DEF", x: 86, y: 72 },
    { id: "mcd", label: "MED", x: 50, y: 59 },
    { id: "md", label: "MED", x: 15, y: 42 },
    { id: "mc1", label: "MED", x: 38, y: 45 },
    { id: "mc2", label: "MED", x: 62, y: 45 },
    { id: "mi", label: "MED", x: 85, y: 42 },
    { id: "dc", label: "ATA", x: 50, y: 20 },
  ],
  "4-5-1": [
    { id: "por", label: "POR", x: 50, y: 91 },
    { id: "ld", label: "DEF", x: 14, y: 72 },
    { id: "dfc1", label: "DEF", x: 38, y: 76 },
    { id: "dfc2", label: "DEF", x: 62, y: 76 },
    { id: "li", label: "DEF", x: 86, y: 72 },
    { id: "md", label: "MED", x: 12, y: 49 },
    { id: "mc1", label: "MED", x: 32, y: 54 },
    { id: "mc2", label: "MED", x: 50, y: 49 },
    { id: "mc3", label: "MED", x: 68, y: 54 },
    { id: "mi", label: "MED", x: 88, y: 49 },
    { id: "dc", label: "ATA", x: 50, y: 22 },
  ],
  "3-5-2": [
    { id: "por", label: "POR", x: 50, y: 91 },
    { id: "dfc1", label: "DEF", x: 25, y: 74 },
    { id: "dfc2", label: "DEF", x: 50, y: 78 },
    { id: "dfc3", label: "DEF", x: 75, y: 74 },
    { id: "md", label: "MED", x: 10, y: 50 },
    { id: "mc1", label: "MED", x: 30, y: 56 },
    { id: "mc2", label: "MED", x: 50, y: 49 },
    { id: "mc3", label: "MED", x: 70, y: 56 },
    { id: "mi", label: "MED", x: 90, y: 50 },
    { id: "dc1", label: "ATA", x: 37, y: 23 },
    { id: "dc2", label: "ATA", x: 63, y: 23 },
  ],
  "3-4-3": [
    { id: "por", label: "POR", x: 50, y: 91 },
    { id: "dfc1", label: "DEF", x: 25, y: 74 },
    { id: "dfc2", label: "DEF", x: 50, y: 78 },
    { id: "dfc3", label: "DEF", x: 75, y: 74 },
    { id: "md", label: "MED", x: 14, y: 52 },
    { id: "mc1", label: "MED", x: 38, y: 55 },
    { id: "mc2", label: "MED", x: 62, y: 55 },
    { id: "mi", label: "MED", x: 86, y: 52 },
    { id: "ed", label: "ATA", x: 18, y: 25 },
    { id: "dc", label: "ATA", x: 50, y: 18 },
    { id: "ei", label: "ATA", x: 82, y: 25 },
  ],
  "3-4-1-2": [
    { id: "por", label: "POR", x: 50, y: 91 },
    { id: "dfc1", label: "DEF", x: 25, y: 74 },
    { id: "dfc2", label: "DEF", x: 50, y: 78 },
    { id: "dfc3", label: "DEF", x: 75, y: 74 },
    { id: "md", label: "MED", x: 14, y: 52 },
    { id: "mc1", label: "MED", x: 38, y: 56 },
    { id: "mc2", label: "MED", x: 62, y: 56 },
    { id: "mi", label: "MED", x: 86, y: 52 },
    { id: "mp", label: "MED", x: 50, y: 38 },
    { id: "dc1", label: "ATA", x: 38, y: 21 },
    { id: "dc2", label: "ATA", x: 62, y: 21 },
  ],
  "5-3-2": [
    { id: "por", label: "POR", x: 50, y: 91 },
    { id: "carr1", label: "DEF", x: 9, y: 70 },
    { id: "dfc1", label: "DEF", x: 30, y: 77 },
    { id: "dfc2", label: "DEF", x: 50, y: 80 },
    { id: "dfc3", label: "DEF", x: 70, y: 77 },
    { id: "carr2", label: "DEF", x: 91, y: 70 },
    { id: "mc1", label: "MED", x: 30, y: 52 },
    { id: "mc2", label: "MED", x: 50, y: 56 },
    { id: "mc3", label: "MED", x: 70, y: 52 },
    { id: "dc1", label: "ATA", x: 38, y: 22 },
    { id: "dc2", label: "ATA", x: 62, y: 22 },
  ],
  "5-4-1": [
    { id: "por", label: "POR", x: 50, y: 91 },
    { id: "ld", label: "DEF", x: 9, y: 70 },
    { id: "dfc1", label: "DEF", x: 30, y: 77 },
    { id: "dfc2", label: "DEF", x: 50, y: 80 },
    { id: "dfc3", label: "DEF", x: 70, y: 77 },
    { id: "li", label: "DEF", x: 91, y: 70 },
    { id: "md", label: "MED", x: 14, y: 47 },
    { id: "mc1", label: "MED", x: 38, y: 53 },
    { id: "mc2", label: "MED", x: 62, y: 53 },
    { id: "mi", label: "MED", x: 86, y: 47 },
    { id: "dc", label: "ATA", x: 50, y: 22 },
  ],
  "5-2-3": [
    { id: "por", label: "POR", x: 50, y: 91 },
    { id: "ld", label: "DEF", x: 9, y: 70 },
    { id: "dfc1", label: "DEF", x: 30, y: 77 },
    { id: "dfc2", label: "DEF", x: 50, y: 80 },
    { id: "dfc3", label: "DEF", x: 70, y: 77 },
    { id: "li", label: "DEF", x: 91, y: 70 },
    { id: "mc1", label: "MED", x: 38, y: 53 },
    { id: "mc2", label: "MED", x: 62, y: 53 },
    { id: "ed", label: "ATA", x: 18, y: 25 },
    { id: "dc", label: "ATA", x: 50, y: 18 },
    { id: "ei", label: "ATA", x: 82, y: 25 },
  ],
};

export default function AlignmentBuilder() {
  const { players: teamPlayers } = useTeam();
  const players = useMemo(() => teamPlayers.filter((player) => player.active).map((player) => ({ id: player.id, name: player.name, number: player.number, position: player.position, initials: player.name.slice(0, 1).toUpperCase() })), [teamPlayers]);
  const [formation, setFormation] = useState<FormationKey>("4-3-3");
  const [lineup, setLineup] = useState<Record<string, string[]>>({});
  const [slotPicker, setSlotPicker] = useState<string | null>(null);
  const [pickerRole, setPickerRole] = useState<PickerRole>("starter");
  const [saved, setSaved] = useState(false);
  const [sharing, setSharing] = useState(false);
  const [shareMessage, setShareMessage] = useState("");

  const positions = formations[formation];
  const assigned = useMemo(() => Object.values(lineup).flat(), [lineup]);
  const pickerPlayers = players.filter((player) => !assigned.includes(player.id));

  const chooseFormation = (value: FormationKey) => {
    setFormation(value);
    setLineup({});
    setSaved(false);
  };

  const openPicker = (positionId: string) => {
    const existing = lineup[positionId] ?? [];
    setSlotPicker(positionId);
    setPickerRole(existing.length === 0 ? "starter" : "substitute");
  };

  const choosePlayer = (playerId: string) => {
    if (!slotPicker) return;
    setLineup((current) => {
      const existing = current[slotPicker] ?? [];
      if (existing.includes(playerId)) return current;
      if (pickerRole === "starter") return { ...current, [slotPicker]: [playerId, existing[1]].filter(Boolean) };
      if (existing.length >= 2) return current;
      return { ...current, [slotPicker]: [...existing, playerId] };
    });
    setSlotPicker(null);
    setSaved(false);
  };

  const removePlayer = (positionId: string, playerId: string) => {
    setLineup((current) => {
      const nextPlayers = (current[positionId] ?? []).filter((id) => id !== playerId);
      const next = { ...current };
      if (nextPlayers.length) next[positionId] = nextPlayers;
      else delete next[positionId];
      return next;
    });
    setSaved(false);
  };

  const getPlayer = (id: string) => players.find((player) => player.id === id);
  const getPhoto = (id: string) => teamPlayers.find((player) => player.id === id)?.photo || "";

  const shareLineup = async () => {
    setSharing(true);
    setShareMessage("");
    try {
      const crestResponse = await fetch("/club-crest.png");
      const crestBlob = await crestResponse.blob();
      const crestData = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(String(reader.result));
        reader.onerror = reject;
        reader.readAsDataURL(crestBlob);
      });
      const escapeXml = (value: string) => value.replace(/[&<>"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&apos;" }[character] ?? character));
      const field = positions.map((position) => (lineup[position.id] ?? []).map((playerId, index) => {
        const player = getPlayer(playerId);
        if (!player) return "";
        const x = 80 + position.x * 7.4;
        const y = 205 + position.y * 8.1 + index * 74;
        const color = index ? "#595b61" : "#b49a6a";
        const textColor = index ? "#fff" : "#0b0c0f";
        return `<g transform="translate(${x} ${y})"><circle r="28" fill="${color}" stroke="#f7f7f5" stroke-width="3"/><text y="7" text-anchor="middle" font-family="Arial" font-size="20" font-weight="700" fill="${textColor}">${player.number || "-"}</text><rect x="-62" y="34" width="124" height="25" rx="4" fill="#0b0c0fee"/><text y="52" text-anchor="middle" font-family="Arial" font-size="14" font-weight="700" fill="#f7f7f5">${escapeXml(player.name)}</text></g>`;
      }).join("")).join("");
      const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="900" height="1200" viewBox="0 0 900 1200"><rect width="900" height="1200" fill="#101115"/><image href="${crestData}" x="42" y="34" width="74" height="74"/><text x="140" y="66" font-family="Arial" font-size="25" font-weight="700" letter-spacing="4" fill="#f7f7f5">ALDAPAN GORA</text><text x="140" y="94" font-family="Arial" font-size="14" letter-spacing="2" fill="#d1b783">ALINEACION - ${formation}</text><rect x="40" y="140" width="820" height="1015" rx="8" fill="#315f42" stroke="#d0d6c0" stroke-opacity=".5" stroke-width="3"/><path d="M40 647.5H860 M40 211H860 M40 1084H860" stroke="#d0d6c0" stroke-opacity=".5" stroke-width="2" fill="none"/><rect x="261" y="211" width="378" height="162" fill="none" stroke="#d0d6c0" stroke-opacity=".5" stroke-width="2"/><rect x="261" y="922" width="378" height="162" fill="none" stroke="#d0d6c0" stroke-opacity=".5" stroke-width="2"/><circle cx="450" cy="647.5" r="94" fill="none" stroke="#d0d6c0" stroke-opacity=".5" stroke-width="2"/>${field}</svg>`;
      const svgBlob = new Blob([svg], { type: "image/svg+xml;charset=utf-8" });
      const imageUrl = URL.createObjectURL(svgBlob);
      const image = new window.Image();
      image.src = imageUrl;
      await new Promise<void>((resolve, reject) => {
        image.onload = () => resolve();
        image.onerror = () => reject(new Error("No se pudo crear la imagen"));
      });
      const canvas = document.createElement("canvas");
      canvas.width = 900;
      canvas.height = 1200;
      canvas.getContext("2d")?.drawImage(image, 0, 0);
      URL.revokeObjectURL(imageUrl);
      const pngBlob = await new Promise<Blob>((resolve, reject) => canvas.toBlob((blob) => blob ? resolve(blob) : reject(new Error("No se pudo exportar la imagen")), "image/png"));
      const file = new File([pngBlob], `alineacion-${formation}.png`, { type: "image/png" });
      if (navigator.share && navigator.canShare?.({ files: [file] })) {
        await navigator.share({ title: `Alineacion Aldapan Gora - ${formation}`, text: "Nuestra alineacion del Aldapan Gora", files: [file] });
        setShareMessage("Imagen lista para compartir");
      } else {
        const downloadUrl = URL.createObjectURL(pngBlob);
        const link = document.createElement("a");
        link.href = downloadUrl;
        link.download = file.name;
        link.click();
        URL.revokeObjectURL(downloadUrl);
        window.open("https://wa.me/?text=" + encodeURIComponent(`Alineacion Aldapan Gora - ${formation}`), "_blank", "noopener,noreferrer");
        setShareMessage("Imagen descargada. Adjunta el PNG en WhatsApp.");
      }
    } catch (error) {
      if ((error as Error).name !== "AbortError") setShareMessage("No se pudo preparar la imagen. Intentalo de nuevo.");
    } finally {
      setSharing(false);
    }
  };

  return <main className="builder-page">
    <nav className="builder-nav shell legacy-builder-nav">
      <a className="brand" href="/">
        <Image src="/club-crest.png" alt="Escudo Aldapan Gora" width={42} height={42} className="crest small" />
        <span>ALDAPAN<br /><i>GORA</i></span>
      </a>
      <div className="builder-breadcrumb"><span>Panel del equipo</span><b>/</b><strong>Creador de alineaciones</strong></div>
      <a className="builder-back" href="/">Volver a la web <span>↗</span></a>
    </nav>

    <section className="builder-heading shell">
      <div>
        <span className="section-label">HERRAMIENTA DEL CUERPO TECNICO</span>
        <h1>Creador de <em>alineaciones.</em></h1>
        <p>Prepara el once, anade alternativas por posicion y guarda la idea para el proximo partido.</p>
      </div>
      <div className="builder-match">
        <span>PROXIMO PARTIDO</span>
        <strong>ALDAPAN GORA <b>VS</b> ATLETICO RIVAL</strong>
        <small>Sab - 28 JUN 2026 - 18:30</small>
      </div>
    </section>

    <section className="builder-workspace shell">
      <aside className="players-panel">
        <div className="panel-title">
          <div><span className="section-label">PLANTILLA</span><h2>Jugadores</h2></div>
          <span className="player-count">{assigned.length}/11</span>
        </div>
        <p className="panel-help">Pulsa una posicion del campo para elegir titular y suplente.</p>
        <div className="player-list">
          {players.map((player) => {
            const isAssigned = assigned.includes(player.id);
            return <div className={`player-row ${isAssigned ? "assigned" : ""}`} key={player.id}>
              <span className="player-avatar">{player.initials}</span>
              <span className="player-data"><strong>{player.name}</strong><small>{player.position} - #{player.number || "SD"}</small></span>
              {isAssigned ? <span className="assigned-mark">✓</span> : <span className="add-mark">+</span>}
            </div>;
          })}
        </div>
      </aside>

      <div className="pitch-panel">
        <div className="pitch-toolbar">
          <div><span className="section-label">SISTEMA DE JUEGO</span><h2>{formation}</h2></div>
          <div className="formation-options">
            {(Object.keys(formations) as FormationKey[]).map((item) => <button key={item} className={formation === item ? "active" : ""} onClick={() => chooseFormation(item)}>{item}</button>)}
          </div>
        </div>
        <div className="pitch-wrap">
          <div className="pitch">
            <div className="halfway" />
            <div className="center-circle" />
            <div className="penalty top" />
            <div className="penalty bottom" />
            <div className="goal top" />
            <div className="goal bottom" />
            {positions.map((position) => {
              const names = lineup[position.id] ?? [];
              return <button key={position.id} className={`position-slot ${names.length ? "filled" : ""}`} style={{ left: `${position.x}%`, top: `${position.y}%` }} onClick={() => openPicker(position.id)}>
                <span className="position-label">{position.label}</span>
                {names.length ? names.map((playerId, index) => {
                  const player = getPlayer(playerId);
                  return <span className={`slot-player player-${index}`} key={playerId}>
                    {index === 0 ? <span className="starter-photo">{getPhoto(playerId) ? <img src={getPhoto(playerId)} alt="" /> : <svg viewBox="0 0 40 40" aria-label="Silueta sin foto"><circle cx="20" cy="12" r="7" /><path d="M7 37c1-9 6-14 13-14s12 5 13 14" /></svg>}</span> : null}
                    <span className="slot-name-row"><b>{player?.number || "-"}</b><span>{player?.name}</span></span>
                  </span>;
                }) : <span className="empty-slot">+</span>}
              </button>;
            })}
          </div>
        </div>
        <div className="pitch-hint">Pulsa cualquier posicion para elegir titular, suplente o quitar jugadores</div>
      </div>

      <aside className="summary-panel">
        <div className="panel-title">
          <div><span className="section-label">RESUMEN</span><h2>Tu once</h2></div>
          <span className="ready-count">{assigned.length === 11 ? "COMPLETO" : `${11 - assigned.length} POR CUBRIR`}</span>
        </div>
        <div className="summary-list">
          {positions.map((position) => {
            const names = lineup[position.id] ?? [];
            return <div className="summary-slot" key={position.id}>
              <span className="summary-position">{position.label}</span>
              <div>{names.length ? names.map((id, index) => <span key={id} className={index ? "bench-name" : "starter-name"}>{getPlayer(id)?.name}{index ? " - suplente" : ""}</span>) : <span className="missing">Sin asignar</span>}</div>
            </div>;
          })}
        </div>
        <div className="summary-actions">
          <button className="share-button" onClick={shareLineup} disabled={sharing}>{sharing ? "Preparando imagen..." : "Compartir alineacion"}</button>
          {shareMessage && <p className="share-message" aria-live="polite">{shareMessage}</p>}
          <button className="save-button" onClick={() => setSaved(true)}>{saved ? "✓ Alineacion guardada" : "Guardar alineacion"}</button>
          <button className="reset-button" onClick={() => { setLineup({}); setSaved(false); }}>Reiniciar</button>
        </div>
      </aside>
    </section>

    {slotPicker && <div className="picker-backdrop" role="presentation" onClick={() => setSlotPicker(null)}>
      <section className="player-picker" role="dialog" aria-modal="true" aria-label="Elegir jugador" onClick={(event) => event.stopPropagation()}>
        <div className="picker-header">
          <div><span className="section-label">EDITAR POSICION</span><h2>{positions.find((position) => position.id === slotPicker)?.label}</h2></div>
          <button className="picker-close" onClick={() => setSlotPicker(null)}>×</button>
        </div>
        {(lineup[slotPicker] ?? []).length > 0 && <div className="picker-current">
          {(lineup[slotPicker] ?? []).map((playerId, index) => {
            const player = getPlayer(playerId);
            return <div key={playerId}>
              <span><strong>{player?.name}</strong><small>{index ? "Suplente" : "Titular"}</small></span>
              <button onClick={() => removePlayer(slotPicker, playerId)}>Quitar {index ? "suplente" : "titular"}</button>
            </div>;
          })}
        </div>}
        <div className="picker-tabs">
          <button className={pickerRole === "starter" ? "active" : ""} onClick={() => setPickerRole("starter")}>Titular</button>
          <button className={pickerRole === "substitute" ? "active" : ""} onClick={() => setPickerRole("substitute")}>Suplente</button>
        </div>
        <p className="picker-help">Elige quien ocupara esta posicion. Para borrar a alguien, usa los botones de arriba.</p>
        <div className="picker-grid">
          {pickerPlayers.map((player) => <button className="picker-player" key={player.id} onClick={() => choosePlayer(player.id)}>
            <span className="player-avatar">{player.initials}</span>
            <span className="player-data"><strong>{player.name}</strong><small>{player.position} - #{player.number || "SD"}</small></span>
            <span>+</span>
          </button>)}
          {pickerPlayers.length === 0 && <p className="picker-empty">Todos los jugadores estan colocados.</p>}
        </div>
      </section>
    </div>}
  </main>;
}
