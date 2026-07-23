"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/components/auth-context";
import { useTeam } from "@/components/team-context";
import { useNews } from "@/components/news-context";
import MatchAdminEditor from "@/components/match-admin-editor";
import UsersAdminEditor from "@/components/users-admin-editor";
import { NewsItem } from "@/lib/news";
import { ADMIN_PROFILE, Player } from "@/lib/team";

const blankNews = (): NewsItem => ({ id: "", title: "", slug: "", excerpt: "", content: "", tag: "CLUB", date: new Date().toISOString().slice(0, 10), image: "", accent: "gold", published: true });
const blankPlayer = (): Player => ({ id: "", name: "", alias: "", number: 0, position: "Jugador", photo: "", goals: 0, assists: 0, appearances: 0, minutes: 0, starterAppearances: 0, substituteAppearances: 0, mvpCount: 0, bio: "Jugador del Aldapan Gora.", active: true });

export default function AdminPage() {
  const router = useRouter();
  const { session } = useAuth();
  const { players, updatePlayer, createPlayer, deletePlayer } = useTeam();
  const { news, refresh, saveNews, createNews, deleteNews } = useNews();
  const [section, setSection] = useState<"players" | "news" | "matches" | "users">("players");
  const [selected, setSelected] = useState<Player | null>(null);
  const [selectedNews, setSelectedNews] = useState<NewsItem | null>(null);
  const [saved, setSaved] = useState(false);
  const [photoStatus, setPhotoStatus] = useState("");
  const [newsImageStatus, setNewsImageStatus] = useState("");
  const editPanelRef = useRef<HTMLElement | null>(null);

  const isAdmin = session?.role === "ADMIN" || session?.email === ADMIN_PROFILE.email;
  const isNewsEditor = session?.role === "NEWS_EDITOR";

  useEffect(() => {
    if (!session) router.replace("/iniciar-sesion");
    else {
      if (session.role === "NEWS_EDITOR") {
        setSection("news");
        setSelectedNews(blankNews());
      }
      void refresh(true);
    }
  }, [router, session]);

  if (!session) return null;

  const save = async () => {
    if (isAdmin && selected) {
      if (!selected.name.trim()) {
        setPhotoStatus("El nombre del jugador es obligatorio.");
        return;
      }
      if (selected.id) await updatePlayer(selected);
      else {
        const created = await createPlayer(selected);
        if (created) setSelected(created);
      }
      setSaved(true);
    }
  };

  const revealEditPanel = () => {
    window.setTimeout(() => editPanelRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 0);
  };

  const updateSelected = (field: keyof Player, value: string | number | boolean) => setSelected((current) => current ? { ...current, [field]: value } : current);
  const updateSelectedNews = (field: keyof NewsItem, value: string | boolean) => setSelectedNews((current) => current ? { ...current, [field]: value } : current);
  const uploadPlayerPhoto = async (file: File) => {
    if (!selected) return;
    if (!selected.id) {
      setPhotoStatus("Guarda el jugador antes de subir foto.");
      return;
    }
    setPhotoStatus("Subiendo foto...");
    const formData = new FormData();
    formData.append("photo", file);
    const response = await fetch(`/api/players/${selected.id}/photo`, { method: "POST", body: formData });
    if (!response.ok) {
      setPhotoStatus("No se ha podido subir la foto.");
      return;
    }
    const result = await response.json();
    const nextPlayer = { ...selected, photo: result.photo };
    setSelected(nextPlayer);
    updatePlayer(nextPlayer);
    setPhotoStatus("Foto subida.");
  };
  const uploadNewsImage = async (file: File) => {
    if (!selectedNews) return;
    setNewsImageStatus("Subiendo imagen...");
    const formData = new FormData();
    formData.append("image", file);
    const response = await fetch("/api/news/image", { method: "POST", body: formData });
    if (!response.ok) {
      setNewsImageStatus("No se ha podido subir la imagen.");
      return;
    }
    const result = await response.json();
    setSelectedNews({ ...selectedNews, image: result.image });
    setNewsImageStatus("Imagen subida.");
  };
  const saveNewsItem = async () => {
    if (!selectedNews) return;
    if (selectedNews.id && isAdmin) await saveNews(selectedNews);
    else await createNews(selectedNews);
    setSelectedNews(isNewsEditor ? blankNews() : null);
  };

  return <main className="content-page shell">
    <div className="admin-heading">
      <div>
        <span className="section-label">{isNewsEditor ? "EDITOR DE NOTICIAS" : "PANEL DE ADMINISTRACION"}</span>
        <h1>Hola, {session.name}<span>.</span></h1>
        <p>{isNewsEditor ? "Crea nuevas noticias para publicarlas en la web del club." : "Edita la informacion publica de la plantilla y del club."}</p>
      </div>
      <Link className="text-link" href="/noticias">Ver noticias</Link>
    </div>

    {isAdmin && <div className="admin-tabs">
      <button className={section === "players" ? "active" : ""} onClick={() => setSection("players")}>Jugadores</button>
      <button className={section === "matches" ? "active" : ""} onClick={() => setSection("matches")}>Partidos</button>
      <button className={section === "users" ? "active" : ""} onClick={() => setSection("users")}>Usuarios</button>
      <button className={section === "news" ? "active" : ""} onClick={() => setSection("news")}>Noticias</button>
    </div>}

    {section === "users" && isAdmin ? <UsersAdminEditor /> : section === "matches" && isAdmin ? <MatchAdminEditor players={players} /> : section === "players" && isAdmin ? <div className="admin-layout">
      <div className="admin-player-list">
        <button className="save-button news-new-button" onClick={() => { setSelected(blankPlayer()); setSaved(false); setPhotoStatus(""); revealEditPanel(); }}>+ Nuevo jugador</button>
        {players.map((player) => <button className={`${selected?.id === player.id ? "admin-player active" : "admin-player"} ${player.active ? "" : "inactive-player"}`} onClick={() => { setSelected(player); setSaved(false); setPhotoStatus(""); revealEditPanel(); }} key={player.id}>
          <span className="player-avatar">{player.name.slice(0, 1)}</span>
          <span><strong>{player.name}</strong><small>{player.active ? "Activo" : "Inactivo"} · {player.number ? `#${player.number}` : "Sin dorsal"} - {player.position}</small></span>
          <b>Editar</b>
        </button>)}
      </div>
      {selected ? <section className="edit-card" ref={editPanelRef}>
        <span className="section-label">{selected.id ? "EDITANDO JUGADOR" : "NUEVO JUGADOR"}</span>
        <h2>{selected.name || "Nuevo jugador"}</h2>
        <div className="edit-grid">
          <label>Nombre<input value={selected.name} onChange={(e) => updateSelected("name", e.target.value)} /></label>
          <label>Alias<input value={selected.alias} onChange={(e) => updateSelected("alias", e.target.value)} /></label>
          <label>Dorsal<input type="number" value={selected.number} onChange={(e) => updateSelected("number", Number(e.target.value))} /></label>
          <label>Posicion<input value={selected.position} onChange={(e) => updateSelected("position", e.target.value)} /></label>
          <label>Goles<input type="number" value={selected.goals} onChange={(e) => updateSelected("goals", Number(e.target.value))} /></label>
          <label>Asistencias<input type="number" value={selected.assists} onChange={(e) => updateSelected("assists", Number(e.target.value))} /></label>
          <label>Partidos<input type="number" value={selected.appearances} onChange={(e) => updateSelected("appearances", Number(e.target.value))} /></label>
          <label>Minutos<input type="number" value={selected.minutes} onChange={(e) => updateSelected("minutes", Number(e.target.value))} /></label>
          <label>Titularidades<input type="number" value={selected.starterAppearances} onChange={(e) => updateSelected("starterAppearances", Number(e.target.value))} /></label>
          <label>Suplencias<input type="number" value={selected.substituteAppearances} onChange={(e) => updateSelected("substituteAppearances", Number(e.target.value))} /></label>
          <label>MVP conseguidos<input type="number" value={selected.mvpCount} onChange={(e) => updateSelected("mvpCount", Number(e.target.value))} /></label>
          <label className="checkbox-field"><input type="checkbox" checked={selected.active} onChange={(e) => updateSelected("active", e.target.checked)} /> Jugador activo en plantilla</label>
          <div className="photo-upload-field">
            <span>Foto del jugador</span>
            <div className="photo-upload-preview">{selected.photo ? <img src={selected.photo} alt={selected.name} /> : <span>{selected.name.slice(0, 1)}</span>}</div>
            <label className="file-upload-button">Subir foto<input type="file" accept="image/png,image/jpeg,image/webp,image/gif" onChange={(e) => { const file = e.target.files?.[0]; if (file) void uploadPlayerPhoto(file); e.currentTarget.value = ""; }} /></label>
            {selected.photo && <button className="reset-button" type="button" onClick={() => updateSelected("photo", "")}>Quitar foto</button>}
            {photoStatus && <small>{photoStatus}</small>}
          </div>
          <label className="full-field">Descripcion<textarea value={selected.bio} onChange={(e) => updateSelected("bio", e.target.value)} /></label>
        </div>
        <button className="save-button" onClick={save}>{selected.id ? "Guardar cambios" : "Crear jugador"}</button>
        {selected.id && <button className="delete-button" onClick={async () => { if (!confirm(`¿Eliminar a ${selected.name}? Se quitará también de partidos y alineaciones guardadas.`)) return; await deletePlayer(selected.id); setSelected(null); }}>Eliminar jugador</button>}
        {saved && <span className="saved-notice">Cambios guardados.</span>}
      </section> : <section className="edit-empty"><span>←</span><p>Selecciona un jugador para editar su ficha.</p></section>}
    </div> : <div className="admin-layout news-admin-layout">
      {isAdmin && <div className="admin-player-list news-list">
        <button className="save-button news-new-button" onClick={() => { setSelectedNews(blankNews()); setNewsImageStatus(""); revealEditPanel(); }}>+ Nueva noticia</button>
        {news.map((item) => <button className={selectedNews?.id === item.id ? "admin-player active" : "admin-player"} onClick={() => { setSelectedNews(item); setNewsImageStatus(""); revealEditPanel(); }} key={item.id}>
          <span className="player-avatar">{item.title.slice(0, 1)}</span>
          <span><strong>{item.title}</strong><small>{item.published ? "Publicada" : "Borrador"} - {item.date}</small></span>
          <b>Editar</b>
        </button>)}
      </div>}
      {selectedNews ? <section className="edit-card" ref={editPanelRef}>
        <span className="section-label">{selectedNews.id ? "EDITANDO NOTICIA" : "NUEVA NOTICIA"}</span>
        <h2>{selectedNews.id ? selectedNews.title : "Nueva noticia"}</h2>
        <div className="edit-grid">
          <label className="full-field">Titulo<input value={selectedNews.title} onChange={(e) => updateSelectedNews("title", e.target.value)} /></label>
          <label>Etiqueta<input value={selectedNews.tag} onChange={(e) => updateSelectedNews("tag", e.target.value)} /></label>
          <label>Fecha<input type="date" value={selectedNews.date} onChange={(e) => updateSelectedNews("date", e.target.value)} /></label>
          <label>Estilo<select value={selectedNews.accent} onChange={(e) => updateSelectedNews("accent", e.target.value)}><option value="gold">Dorado</option><option value="dark">Oscuro</option><option value="cream">Crema</option></select></label>
          <label className="full-field">Resumen<textarea value={selectedNews.excerpt} onChange={(e) => updateSelectedNews("excerpt", e.target.value)} /></label>
          <label className="full-field">Contenido<textarea rows={8} value={selectedNews.content} onChange={(e) => updateSelectedNews("content", e.target.value)} /></label>
          <div className="photo-upload-field news-image-upload full-field">
            <span>Imagen de la noticia</span>
            <div className="news-upload-preview">{selectedNews.image ? <img src={selectedNews.image} alt={selectedNews.title || "Imagen de noticia"} /> : <span>IMG</span>}</div>
            <label className="file-upload-button">Subir imagen<input type="file" accept="image/png,image/jpeg,image/webp,image/gif" onChange={(e) => { const file = e.target.files?.[0]; if (file) void uploadNewsImage(file); e.currentTarget.value = ""; }} /></label>
            {selectedNews.image && <button className="reset-button" type="button" onClick={() => updateSelectedNews("image", "")}>Quitar imagen</button>}
            {newsImageStatus && <small>{newsImageStatus}</small>}
          </div>
          <label className="checkbox-field"><input type="checkbox" checked={selectedNews.published} onChange={(e) => updateSelectedNews("published", e.target.checked)} /> Publicar noticia</label>
        </div>
        <button className="save-button" onClick={saveNewsItem}>{selectedNews.id ? "Guardar noticia" : "Crear noticia"}</button>
        {isAdmin && selectedNews.id && <button className="delete-button" onClick={async () => { await deleteNews(selectedNews.id); setSelectedNews(null); }}>Eliminar</button>}
      </section> : <section className="edit-empty"><span>←</span><p>{isNewsEditor ? "Prepara una nueva noticia." : "Selecciona una noticia o crea una nueva."}</p></section>}
    </div>}
  </main>;
}
