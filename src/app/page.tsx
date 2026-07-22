import Image from "next/image";
import Link from "next/link";
import NewsPreview from "@/components/news-preview";

function Crest({ small = false }: { small?: boolean }) { return <Image src="/club-crest.png" alt="Escudo Aldapan Gora" width={small ? 42 : 88} height={small ? 42 : 88} className={small ? "crest small" : "crest"} priority />; }

export default function Home() { return <main>
  <section id="inicio" className="hero shell"><div className="hero-copy"><p className="eyebrow"><span className="live-dot" /> Temporada 2026 · Jornada 01</p><h1>Esto no es solo<br /><em>fútbol.</em></h1><p className="hero-text">Un equipo. Una ciudad. Una forma de vivir cada partido.</p><Link href="/equipo" className="primary-button">Descubrir el equipo <span>→</span></Link></div><div className="hero-match"><div className="match-top"><span>PRÓXIMO PARTIDO</span><strong>AMISTOSO</strong></div><div className="match-date">SÁB · 28 JUN <b>18:30</b></div><div className="versus"><div><Crest /><span>Aldapan<br />Gora</span></div><p>VS</p><div className="opponent"><div className="opponent-mark">AG</div><span>Atlético<br />Rival</span></div></div><div className="match-place">◉ Campo Municipal · Gora</div></div></section>
  <section id="partidos" className="result-strip"><div className="shell result-inner"><div><span className="section-label">ÚLTIMO RESULTADO</span><p className="result-title">Una victoria para empezar</p></div><div className="score"><span>ALG</span><strong>3 — 1</strong><span>RIV</span></div><div className="result-meta"><span>FINALIZADO</span><small>Jornada 30 · 15 JUN 2026</small></div><Link className="text-link" href="/partidos">Ver partidos →</Link></div></section>
  <section id="noticias" className="section shell"><div className="section-heading"><div><span className="section-label">DESDE EL VESTUARIO</span><h2>Últimas noticias</h2></div><Link className="text-link" href="/noticias">Ver todas →</Link></div><NewsPreview /></section>
  <footer className="footer shell"><div className="brand"><Crest small /><span>ALDAPAN<br /><i>GORA</i></span></div><p>Más que un equipo.</p><span>© 2026 Aldapan Gora</span></footer>
</main>; }
