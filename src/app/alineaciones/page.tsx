"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/components/auth-context";
import AlignmentBuilder from "./alignment-builder";

type Note = { title: string; text: string };
type Analysis = {
  sections?: Note[];
  needs?: { need: string; work: string }[];
  observables?: { aspect: string; question: string }[];
  opponentGuide?: { team: string; strength: string; key: string }[];
  profiles?: Note[];
};
const blank: Analysis = { sections: [], needs: [], opponentGuide: [], profiles: [] };
const normalise = (value: Analysis): Analysis => ({ ...value, profiles: (value.profiles || []).map((profile: Note & { rows?: { name?: string; detail?: string; protect?: string }[] }) => ({ ...profile, text: profile.text || (profile.rows || []).map((row) => [row.name, row.detail, row.protect].filter(Boolean).join(" · ")).join("\n\n") })) });

export default function BoardPage() {
  const { session } = useAuth();
  const [tab, setTab] = useState<"analysis" | "lineup">("analysis");
  const [plantillaTab, setPlantillaTab] = useState<"vision" | "roles" | "plan" | "rivals">("vision");
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
    <div className="pizarra-tabs"><button className={tab === "analysis" ? "active" : ""} onClick={() => setTab("analysis")}>Plantilla</button><button className={tab === "lineup" ? "active" : ""} onClick={() => setTab("lineup")}>Alineaciones</button></div>
    {tab === "lineup" ? <div className="pizarra-builder"><AlignmentBuilder /></div> : !isAdmin ? <section className="pizarra-private"><span className="section-label">CONTENIDO PRIVADO</span><h2>Análisis de plantilla</h2><p>Inicia sesión como miembro de la Junta para consultar y actualizar esta pizarra.</p></section> : loading ? <p className="pizarra-loading">Cargando pizarra…</p> : <section className="squad-analysis">
      <div className="squad-analysis-head"><div><span className="section-label">ANÁLISIS INTERNO</span><h2>Radiografía de la plantilla</h2></div><button className="admin-save-button" disabled={saving} onClick={save}>{saving ? "Guardando…" : "Guardar cambios"}</button></div>{message && <p className="pizarra-message">{message}</p>}
      <div className="plantilla-tabs"><button className={plantillaTab === "vision" ? "active" : ""} onClick={() => setPlantillaTab("vision")}>Visión general</button><button className={plantillaTab === "roles" ? "active" : ""} onClick={() => setPlantillaTab("roles")}>Roles y perfiles</button><button className={plantillaTab === "plan" ? "active" : ""} onClick={() => setPlantillaTab("plan")}>Plan de trabajo</button><button className={plantillaTab === "rivals" ? "active" : ""} onClick={() => setPlantillaTab("rivals")}>Rivales</button></div>
      {plantillaTab === "vision" && <div className="squad-analysis-stack">{visionSections.map((item) => { const index = sections.indexOf(item); return <article key={item.title}><h3>{item.title}</h3><textarea value={item.text} onChange={(event) => update("sections", sections.map((section, position) => position === index ? { ...section, text: event.target.value } : section))} /></article>; })}</div>}
      {plantillaTab === "roles" && roleSections.length > 0 && <div className="squad-analysis-grid">{roleSections.map((item) => { const index = sections.indexOf(item); return <article key={item.title}><h3>{item.title}</h3><textarea value={item.text} onChange={(event) => update("sections", sections.map((section, position) => position === index ? { ...section, text: event.target.value } : section))} /></article>; })}</div>}
      {plantillaTab === "roles" && <div className="squad-profiles"><h3>Perfiles tácticos por demarcación</h3>{(analysis.profiles || []).map((item, index) => <article key={item.title}><h4>{item.title}</h4><textarea value={item.text} onChange={(event) => update("profiles", (analysis.profiles || []).map((profile, position) => position === index ? { ...profile, text: event.target.value } : profile))} /></article>)}</div>}
      {plantillaTab === "plan" && <div className="squad-analysis-lists"><article><h3>Necesidades prioritarias</h3>{(analysis.needs || []).map((item, index) => <div className="analysis-row" key={`${item.need}-${index}`}><input value={item.need} onChange={(event) => update("needs", (analysis.needs || []).map((entry, position) => position === index ? { ...entry, need: event.target.value } : entry))} /><textarea value={item.work} onChange={(event) => update("needs", (analysis.needs || []).map((entry, position) => position === index ? { ...entry, work: event.target.value } : entry))} /></div>)}</article><article><h3>Qué observar en los partidos</h3>{(analysis.observables || []).map((item, index) => <div className="analysis-row" key={`${item.aspect}-${index}`}><input value={item.aspect} onChange={(event) => update("observables", (analysis.observables || []).map((entry, position) => position === index ? { ...entry, aspect: event.target.value } : entry))} /><textarea value={item.question} onChange={(event) => update("observables", (analysis.observables || []).map((entry, position) => position === index ? { ...entry, question: event.target.value } : entry))} /></div>)}</article></div>}
      {plantillaTab === "rivals" && <div className="squad-analysis-lists"><article className="rival-guide"><h3>Guía inicial según el rival</h3>{(analysis.opponentGuide || []).map((item, index) => <div className="analysis-row" key={`${item.team}-${index}`}><input value={item.team} onChange={(event) => update("opponentGuide", (analysis.opponentGuide || []).map((entry, position) => position === index ? { ...entry, team: event.target.value } : entry))} /><textarea value={`${item.strength}${item.key ? `\n\nEvitar: ${item.key}` : ""}`} onChange={(event) => { const [strength, ...key] = event.target.value.split("\n\nEvitar: "); update("opponentGuide", (analysis.opponentGuide || []).map((entry, position) => position === index ? { ...entry, strength, key: key.join("\n\nEvitar: ") } : entry)); }} /></div>)}</article></div>}
    </section>}
  </main>;
}
