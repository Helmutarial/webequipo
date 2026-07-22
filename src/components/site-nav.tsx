"use client";

import Image from "next/image";
import Link from "next/link";
import { useAuth } from "./auth-context";

export default function SiteNav() {
  const { session, logout } = useAuth();
  return <nav className="topbar shell site-nav"><Link className="brand" href="/"><Image src="/club-crest.png" alt="Escudo Aldapan Gora" width={42} height={42} className="crest small" priority /><span>ALDAPAN<br /><i>GORA</i></span></Link><div className="navlinks"><Link href="/equipo">El equipo</Link><Link href="/#partidos">Partidos</Link><Link href="/#noticias">Noticias</Link><Link href="/#estadisticas">Estadísticas</Link><Link href="/alineaciones">Alineaciones</Link></div>{session ? <div className="nav-session"><Link href="/admin">Hola, {session.name}</Link><button onClick={logout}>Salir</button></div> : <Link className="menu-button" href="/iniciar-sesion">Iniciar sesión <span>↗</span></Link>}</nav>;
}
