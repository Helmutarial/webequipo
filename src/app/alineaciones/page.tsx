"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/components/auth-context";
import AlignmentBuilder from "./alignment-builder";

type Note = { title: string; text: string };
type Analysis = {
  sections?: Note[];
  needs?: { need: string; work: string }[];
  opponentGuide?: { team: string; strength: string; key: string }[];
  profiles?: Note[];
};
const blank: Analysis = { sections: [], needs: [], opponentGuide: [], profiles: [] };

export default function BoardPage() {
  const { session } = useAuth();
  const [tab, setTab] = useState<"analysis" | "lineup">("analysis");
  const [analysis, setAnalysis] = useState<Analysis>(blank);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const isAdmin = session?.role === "ADMIN";

  useEffect(() => {
    if (!isAdmin) { setLoading(false); return; }
    setLoading(true);
    fetch("/api/admin/squad-analysis").then((r) => r.json()).then((data) => setAnalysis(data.analysis || blank)).catch(() => setMessage("No se ha podido cargar el análisis.")).finally(() => setLoading(false));
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
    <div className="pizarra-tabs"><button className={tab === "analysis" ? "active" : ""} onClick={() => setTab("analysis")}>Análisis de plantilla</button><button className={tab === "lineup" ? "active" : ""} onClick={() => setTab("lineup")}>Alineaciones</button></div>
    {tab === "lineup" ? <div className="pizarra-builder"><AlignmentBuilder /></div> : !isAdmin ? <section className="pizarra-private"><span className="section-label">CONTENIDO PRIVADO</span><h2>Análisis de plantilla</h2><p>Inicia sesión como miembro de la Junta para consultar y actualizar esta pizarra.</p></section> : loading ? <p className="pizarra-loading">Cargando pizarra…</p> : <section className="squad-analysis">
      <div className="squad-analysis-head"><div><span className="section-label">ANÁLISIS INTERNO</span><h2>Radiografía de la plantilla</h2></div><button className="admin-save-button" disabled={saving} onClick={save}>{saving ? "Guardando…" : "Guardar cambios"}</button></div>{message && <p className="pizarra-message">{message}</p>}
      <div className="squad-analysis-grid">{(analysis.sections || []).map((item, index) => <article key={item.title}><h3>{item.title}</h3><textarea value={item.text} onChange={(event) => update("sections", (analysis.sections || []).map((section, position) => position === index ? { ...section, text: event.target.value } : section))} /></article>)}</div>
      <div className="squad-analysis-lists"><article><h3>Necesidades detectadas</h3>{(analysis.needs || []).map((item, index) => <div className="analysis-row" key={`${item.need}-${index}`}><input value={item.need} onChange={(event) => update("needs", (analysis.needs || []).map((entry, position) => position === index ? { ...entry, need: event.target.value } : entry))} /><textarea value={item.work} onChange={(event) => update("needs", (analysis.needs || []).map((entry, position) => position === index ? { ...entry, work: event.target.value } : entry))} /></div>)}</article><article><h3>Guía de rivales</h3>{(analysis.opponentGuide || []).map((item, index) => <div className="analysis-row" key={`${item.team}-${index}`}><input value={item.team} onChange={(event) => update("opponentGuide", (analysis.opponentGuide || []).map((entry, position) => position === index ? { ...entry, team: event.target.value } : entry))} /><textarea value={`${item.strength}${item.key ? `\n\nClave: ${item.key}` : ""}`} onChange={(event) => { const [strength, ...key] = event.target.value.split("\n\nClave: "); update("opponentGuide", (analysis.opponentGuide || []).map((entry, position) => position === index ? { ...entry, strength, key: key.join("\n\nClave: ") } : entry)); }} /></div>)}</article></div>
      <div className="squad-profiles"><h3>Perfiles tácticos por demarcación</h3>{(analysis.profiles || []).map((item, index) => <article key={item.title}><h4>{item.title}</h4><textarea value={item.text} onChange={(event) => update("profiles", (analysis.profiles || []).map((profile, position) => position === index ? { ...profile, text: event.target.value } : profile))} /></article>)}</div>
    </section>}
  </main>;
}
