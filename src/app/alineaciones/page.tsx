"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/components/auth-context";
import AlignmentBuilder from "./alignment-builder";

type Note = { title: string; text: string };
type TeamAssessment = { metrics: { label: string; score: number }[]; summary: string; detail: string };
type Analysis = {
  sections?: Note[];
  needs?: { need: string; work: string }[];
  observables?: { aspect: string; question: string }[];
  opponentGuide?: { team: string; strength: string; key: string }[];
  profiles?: Note[];
  teamAssessment?: TeamAssessment;
};
const blank: Analysis = { sections: [], needs: [], opponentGuide: [], profiles: [], teamAssessment: { metrics: [], summary: "", detail: "" } };
const normalise = (value: Analysis): Analysis => ({ ...value, profiles: (value.profiles || []).map((profile: Note & { rows?: { name?: string; detail?: string; protect?: string }[] }) => ({ ...profile, text: profile.text || (profile.rows || []).map((row) => [row.name, row.detail, row.protect].filter(Boolean).join(" · ")).join("\n\n") })) });

function PhaseDiagram({ phase }: { phase: "attack" | "defense" }) {
  const attacking = phase === "attack";
  const players = [
    ["POR", 310, 252], ["LI", 78, 205], ["DFC", 216, 205], ["DFC", 404, 205], ["LD", 542, 205],
    ["MCD", attacking ? 300 : 246, attacking ? 168 : 153], ["MC", attacking ? 400 : 374, attacking ? 132 : 153],
    ["EI", 105, attacking ? 88 : 118], ["MCO", attacking ? 205 : 310, attacking ? 128 : 100], ["ED", 515, attacking ? 88 : 118], ["DC", 310, 34],
  ] as const;
  return <div className="formation-reference"><svg className="phase-diagram" viewBox="0 0 620 300" role="img" aria-label={phase === "attack" ? "Estructura FIFA del Aldapan Gora en fase ofensiva" : "Estructura FIFA del Aldapan Gora en fase defensiva de bloque medio"}>
    <rect className="diagram-pitch" x="12" y="12" width="596" height="276" rx="10" />
    <path className="diagram-line" d="M12 150H608M238 12V58H382V12M238 288V242H382V288M310 105a45 45 0 1 0 0 90a45 45 0 1 0 0-90" />
    {players.map(([label, x, y]) => <g className={`diagram-player ${label === "MCD" || label === "MC" ? "diagram-pivot" : ""}`} key={label + x}><circle cx={x} cy={y} r="22" /><text x={x} y={y + 4}>{label}</text></g>)}
  </svg></div>;
}

function BuildUpDiagram() {
  return <figure className="build-up-diagram">
    <svg viewBox="0 0 620 300" role="img" aria-label="Salida de balón: conexiones entre DFC, LD o LI, MCD y MC">
      <defs><marker id="diagram-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path fill="#b49a6a" d="M 0 0 L 10 5 L 0 10 z" /></marker></defs>
      <rect className="diagram-pitch" x="12" y="12" width="596" height="276" rx="10" />
      <path className="diagram-line" d="M12 12H608M238 288V242H382V288" />
      <path className="diagram-route" d="M157 212L99 180" markerStart="url(#diagram-arrow)" markerEnd="url(#diagram-arrow)" />
      <path className="diagram-route" d="M100 165L240 147" markerStart="url(#diagram-arrow)" markerEnd="url(#diagram-arrow)" />
      <path className="diagram-route" d="M245 162L194 207" markerStart="url(#diagram-arrow)" markerEnd="url(#diagram-arrow)" />
      <path className="diagram-route" d="M91 148L145 88" markerEnd="url(#diagram-arrow)" />
      <path className="diagram-route" d="M241 129L180 85" markerEnd="url(#diagram-arrow)" />
      <g className="diagram-player"><circle cx="178" cy="224" r="24" /><text x="178" y="230">DFC</text></g>
      <g className="diagram-player"><circle cx="78" cy="168" r="24" /><text x="78" y="174">LI</text></g>
      <g className="diagram-player diagram-pivot"><circle cx="262" cy="145" r="24" /><text x="262" y="151">MCD</text></g>
      <g className="diagram-player"><circle cx="160" cy="68" r="24" /><text x="160" y="74">MC</text></g>
    </svg>
    <figcaption>Conexiones para dar salida al balón.</figcaption>
  </figure>;
}

function GamePlan() {
  return <section className="game-plan" aria-labelledby="game-plan-title">
    <div className="game-plan-intro">
      <span className="section-label">MODELO DE JUEGO</span>
      <h2 id="game-plan-title">Plan de juego</h2>
      <p>Dos fotografías iniciales de la estructura del equipo. Esta primera versión sirve como base para concretar movimientos, responsabilidades y ajustes por rival.</p>
    </div>
    <div className="game-plan-formations">
      <article>
        <div className="game-plan-card-heading"><span>Modelo base</span><h3>Fase ofensiva</h3></div>
        <PhaseDiagram phase="attack" />
      </article>
      <article>
        <div className="game-plan-card-heading"><span>Bloque medio</span><h3>Fase defensiva</h3></div>
        <PhaseDiagram phase="defense" />
      </article>
    </div>
    <section className="game-plan-principles" aria-labelledby="game-plan-principles-title">
      <div><h3 id="game-plan-principles-title">Ideas básicas</h3></div>
      <div className="game-plan-principles-grid">
        <article><h4>Salida de balón</h4><p>DFC, LD/LI y MCD forman triángulos para dar salida al balón. El MCD intenta mantener su posición delante de los centrales y dar continuidad a la jugada. El MC tiene más libertad para moverse y recibir. Los LD/LI no suben hasta que el balón llega al medio campo.</p><BuildUpDiagram /></article>
        <article><h4>Si hay ventaja, vamos</h4><p>Al recuperar, necesitamos una opción cercana y otra que ataque el espacio. Solo aceleramos si el pase hacia delante es claro; si no, conservamos el balón y volvemos a organizar el ataque.</p></article>
        <article><h4>Juntos por dentro</h4><p>Sin balón, los extremos bajan hasta la altura de los pivotes para cerrar el centro. El 10 vigila a su mediocentro. Si un defensor sale, un compañero cubre su espalda.</p></article>
        <article><h4>Primero balón, luego rechace</h4><p>Antes de cada córner o falta lateral se decide quién manda, quién va al primer balón y quién queda para la segunda jugada. Tras un cambio, esas tareas se reparten de nuevo.</p></article>
      </div>
    </section>
  </section>;
}

export default function BoardPage() {
  const { session } = useAuth();
  const [tab, setTab] = useState<"analysis" | "lineup" | "gameplan">("analysis");
  const [plantillaTab, setPlantillaTab] = useState<"vision" | "assessment" | "roles" | "plan" | "rivals">("vision");
  const [analysis, setAnalysis] = useState<Analysis>(blank);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const isAdmin = session?.role === "ADMIN";
  const sections = analysis.sections || [];
  const visionOrder = ["Conclusiones principales", "Sistemas recomendados", "Valoración cualitativa", "Composición y equilibrio de la plantilla", "Fortalezas y debilidades colectivas", "Riesgos colectivos"];
  const visionSections = visionOrder.map((title) => sections.find((item) => item.title === title)).filter((item): item is Note => Boolean(item));
  const profileSectionTitles = ["Defensas centrales", "Laterales y carrileros", "Centro del campo", "Extremos", "Delanteros"];
  const roleSections = sections.filter((item) => !visionSections.includes(item) && !profileSectionTitles.includes(item.title));

  useEffect(() => {
    if (!isAdmin) { setLoading(false); return; }
    setLoading(true);
    fetch("/api/admin/squad-analysis").then((r) => r.json()).then((data) => setAnalysis(normalise(data.analysis || blank))).catch(() => setMessage("No se ha podido cargar el análisis.")).finally(() => setLoading(false));
  }, [isAdmin]);
  const update = <K extends keyof Analysis>(key: K, value: Analysis[K]) => setAnalysis((current) => ({ ...current, [key]: value }));
  async function save() {
    setSaving(true); setMessage("");
    try { const response = await fetch("/api/admin/squad-analysis", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(analysis) }); if (!response.ok) throw new Error(); setMessage("Análisis guardado."); }
    catch { setMessage("No se ha podido guardar el análisis."); }
    finally { setSaving(false); }
  }

  return <main className="content-page shell pizarra-page">
    <div className="page-intro"><div><span className="section-label">JUNTA · TEMPORADA 2026/27</span><h1>Pizarra<em>.</em></h1><p>Planificación de plantilla, lectura de rivales y alineaciones.</p></div></div>
    <div className="pizarra-tabs"><button className={tab === "analysis" ? "active" : ""} onClick={() => setTab("analysis")}>Plantilla</button><button className={tab === "lineup" ? "active" : ""} onClick={() => setTab("lineup")}>Alineaciones</button><button className={tab === "gameplan" ? "active" : ""} onClick={() => setTab("gameplan")}>Plan de juego</button></div>
    {tab === "lineup" ? <div className="pizarra-builder"><AlignmentBuilder /></div> : !isAdmin ? <section className="pizarra-private"><span className="section-label">CONTENIDO PRIVADO</span><h2>{tab === "gameplan" ? "Plan de juego" : "Análisis de plantilla"}</h2><p>Inicia sesión como miembro de la Junta para consultar y actualizar esta pizarra.</p></section> : tab === "gameplan" ? <GamePlan /> : loading ? <p className="pizarra-loading">Cargando pizarra…</p> : <section className="squad-analysis">
      <div className="squad-analysis-head"><div><span className="section-label">ANÁLISIS INTERNO</span><h2>Radiografía de la plantilla</h2></div><button className="admin-save-button" disabled={saving} onClick={save}>{saving ? "Guardando…" : "Guardar cambios"}</button></div>{message && <p className="pizarra-message">{message}</p>}
      <div className="plantilla-tabs"><button className={plantillaTab === "vision" ? "active" : ""} onClick={() => setPlantillaTab("vision")}>Visión general</button><button className={plantillaTab === "assessment" ? "active" : ""} onClick={() => setPlantillaTab("assessment")}>Valoración equipo</button><button className={plantillaTab === "roles" ? "active" : ""} onClick={() => setPlantillaTab("roles")}>Roles y perfiles</button><button className={plantillaTab === "plan" ? "active" : ""} onClick={() => setPlantillaTab("plan")}>Plan de trabajo</button><button className={plantillaTab === "rivals" ? "active" : ""} onClick={() => setPlantillaTab("rivals")}>Rivales</button></div>
      {plantillaTab === "vision" && <div className="squad-analysis-stack">{visionSections.map((item) => { const index = sections.indexOf(item); return <article key={item.title}><h3>{item.title}</h3><textarea value={item.text} onChange={(event) => update("sections", sections.map((section, position) => position === index ? { ...section, text: event.target.value } : section))} /></article>; })}</div>}
      {plantillaTab === "assessment" && <div className="team-assessment"><div className="team-assessment-grid"><article><h3>Indicadores de plantilla</h3><div className="assessment-metrics">{(analysis.teamAssessment?.metrics || []).map((metric, index) => <label key={metric.label}><span>{metric.label}</span><div className={`assessment-bar score-${metric.score}`}><i /><i /><i /><i /><i /></div><input aria-label={`Valoración de ${metric.label}`} type="number" min="0" max="5" value={metric.score} onChange={(event) => update("teamAssessment", { ...(analysis.teamAssessment || { metrics: [], summary: "", detail: "" }), metrics: (analysis.teamAssessment?.metrics || []).map((item, position) => position === index ? { ...item, score: Math.max(0, Math.min(5, Number(event.target.value) || 0)) } : item) })} /></label>)}</div></article><article><h3>Conclusiones rápidas</h3><textarea value={analysis.teamAssessment?.summary || ""} onChange={(event) => update("teamAssessment", { ...(analysis.teamAssessment || { metrics: [], detail: "" }), summary: event.target.value })} /></article></div><article className="team-assessment-detail"><h3>Desarrollo de la valoración</h3><textarea value={analysis.teamAssessment?.detail || ""} onChange={(event) => update("teamAssessment", { ...(analysis.teamAssessment || { metrics: [], summary: "" }), detail: event.target.value })} /></article></div>}
      {plantillaTab === "roles" && roleSections.length > 0 && <div className="squad-analysis-grid">{roleSections.map((item) => { const index = sections.indexOf(item); return <article key={item.title}><h3>{item.title}</h3><textarea value={item.text} onChange={(event) => update("sections", sections.map((section, position) => position === index ? { ...section, text: event.target.value } : section))} /></article>; })}</div>}
      {plantillaTab === "roles" && <div className="squad-profiles"><h3>Perfiles tácticos por demarcación</h3>{(analysis.profiles || []).map((item, index) => <article key={item.title}><h4>{item.title}</h4><textarea value={item.text} onChange={(event) => update("profiles", (analysis.profiles || []).map((profile, position) => position === index ? { ...profile, text: event.target.value } : profile))} /></article>)}</div>}
      {plantillaTab === "plan" && <div className="squad-analysis-lists"><article><h3>Necesidades prioritarias</h3>{(analysis.needs || []).map((item, index) => <div className="analysis-row" key={`${item.need}-${index}`}><input value={item.need} onChange={(event) => update("needs", (analysis.needs || []).map((entry, position) => position === index ? { ...entry, need: event.target.value } : entry))} /><textarea value={item.work} onChange={(event) => update("needs", (analysis.needs || []).map((entry, position) => position === index ? { ...entry, work: event.target.value } : entry))} /></div>)}</article><article><h3>Qué observar en los partidos</h3>{(analysis.observables || []).map((item, index) => <div className="analysis-row" key={`${item.aspect}-${index}`}><input value={item.aspect} onChange={(event) => update("observables", (analysis.observables || []).map((entry, position) => position === index ? { ...entry, aspect: event.target.value } : entry))} /><textarea value={item.question} onChange={(event) => update("observables", (analysis.observables || []).map((entry, position) => position === index ? { ...entry, question: event.target.value } : entry))} /></div>)}</article></div>}
      {plantillaTab === "rivals" && <div className="squad-analysis-lists"><article className="rival-guide"><h3>Guía inicial según el rival</h3>{(analysis.opponentGuide || []).map((item, index) => <div className="analysis-row" key={`${item.team}-${index}`}><input value={item.team} onChange={(event) => update("opponentGuide", (analysis.opponentGuide || []).map((entry, position) => position === index ? { ...entry, team: event.target.value } : entry))} /><textarea value={`${item.strength}${item.key ? `\n\nEvitar: ${item.key}` : ""}`} onChange={(event) => { const [strength, ...key] = event.target.value.split("\n\nEvitar: "); update("opponentGuide", (analysis.opponentGuide || []).map((entry, position) => position === index ? { ...entry, strength, key: key.join("\n\nEvitar: ") } : entry)); }} /></div>)}</article></div>}
    </section>}
  </main>;
}
