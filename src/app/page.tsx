import Image from "next/image";

const news = [
  { tag: "Crónica", title: "El equipo vuelve a competir con hambre", date: "18 JUN 2026", accent: "gold" },
  { tag: "Club", title: "La plantilla ya prepara la nueva temporada", date: "12 JUN 2026", accent: "dark" },
  { tag: "Vestuario", title: "Una familia que sigue creciendo", date: "04 JUN 2026", accent: "cream" },
];

function Crest({ small = false }: { small?: boolean }) {
  return <Image src="/club-crest.png" alt="Escudo Aldapan Gora" width={small ? 42 : 88} height={small ? 42 : 88} className={small ? "crest small" : "crest"} priority />;
}

export default function Home() {
  return (
    <main>
      <nav className="topbar shell legacy-home-nav">
        <a className="brand" href="#inicio"><Crest small /><span>ALDAPAN<br /><i>GORA</i></span></a>
        <div className="navlinks"><a href="#equipo">El equipo</a><a href="#partidos">Partidos</a><a href="#noticias">Noticias</a><a href="#estadisticas">Estadísticas</a><a href="/alineaciones">Alineaciones</a></div>
        <a className="menu-button" href="#partidos">Ver calendario <span>↗</span></a>
      </nav>

      <section id="inicio" className="hero shell">
        <div className="hero-copy"><p className="eyebrow"><span className="live-dot" /> Temporada 2026 · Jornada 01</p><h1>Esto no es solo<br /><em>fútbol.</em></h1><p className="hero-text">Un equipo. Una ciudad. Una forma de vivir cada partido.</p><a href="#partidos" className="primary-button">Descubrir el equipo <span>→</span></a></div>
        <div className="hero-match"><div className="match-top"><span>PRÓXIMO PARTIDO</span><strong>AMISTOSO</strong></div><div className="match-date">SÁB · 28 JUN <b>18:30</b></div><div className="versus"><div><Crest /><span>Aldapan<br />Gora</span></div><p>VS</p><div className="opponent"><div className="opponent-mark">AG</div><span>Atlético<br />Rival</span></div></div><div className="match-place">◉ Campo Municipal · Gora</div></div>
      </section>

      <section id="partidos" className="result-strip"><div className="shell result-inner"><div><span className="section-label">ÚLTIMO RESULTADO</span><p className="result-title">Una victoria para empezar</p></div><div className="score"><span>ALG</span><strong>3 — 1</strong><span>RIV</span></div><div className="result-meta"><span>FINALIZADO</span><small>Jornada 30 · 15 JUN 2026</small></div><a className="text-link" href="#estadisticas">Ver ficha del partido →</a></div></section>

      <section id="noticias" className="section shell"><div className="section-heading"><div><span className="section-label">DESDE EL VESTUARIO</span><h2>Últimas noticias</h2></div><a className="text-link" href="#noticias">Ver todas →</a></div><div className="news-grid">{news.map((item) => <article className={`news-card ${item.accent}`} key={item.title}><div className="news-image"><span>{item.accent === "gold" ? "AG" : item.accent === "dark" ? "✦" : "G"}</span></div><div className="news-info"><span className="tag">{item.tag}</span><h3>{item.title}</h3><time>{item.date}</time></div></article>)}</div></section>

      <section id="estadisticas" className="stats-section"><div className="shell stats-layout"><div><span className="section-label">LA TEMPORADA EN DATOS</span><h2>Los números<br /><em>hablan.</em></h2><p className="muted">Cada partido cuenta. Cada jugador deja su huella.</p></div><div className="stats-grid"><div><strong>24</strong><span>Partidos jugados</span></div><div><strong>16</strong><span>Victorias</span></div><div><strong>57</strong><span>Goles a favor</span></div><div><strong>68%</strong><span>Rendimiento</span></div></div></div></section>

      <footer className="footer shell"><div className="brand"><Crest small /><span>ALDAPAN<br /><i>GORA</i></span></div><p>Más que un equipo.</p><span>© 2026 Aldapan Gora</span></footer>
    </main>
  );
}
