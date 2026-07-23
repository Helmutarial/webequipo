"use client";

import Image from "next/image";
import Link from "next/link";
import { useAuth } from "./auth-context";
import { useState } from "react";

export default function SiteNav() {
  const { session, logout } = useAuth(); const [open, setOpen] = useState(false); const closeMenu = () => setOpen(false);
  return <nav className="topbar shell site-nav"><Link className="brand" href="/" onClick={closeMenu}><Image src="/club-crest.png" alt="Escudo Aldapan Gora" width={42} height={42} className="crest small" priority /><span>ALDAPAN<br /><i>GORA</i></span></Link><button className="mobile-menu-button" aria-label="Abrir menú" aria-expanded={open} onClick={() => setOpen((current) => !current)}><span /><span /><span /></button><div className={open ? "navlinks mobile-open" : "navlinks"}><Link href="/equipo" onClick={closeMenu}>El equipo</Link><Link href="/partidos" onClick={closeMenu}>Partidos</Link><Link href="/noticias" onClick={closeMenu}>Noticias</Link><Link href="/alineaciones" onClick={closeMenu}>Alineaciones</Link></div>{session ? <div className="nav-session"><Link href="/admin">Hola, {session.name}</Link><button onClick={logout}>Salir</button></div> : <Link className="menu-button" href="/iniciar-sesion">Iniciar sesión <span>↗</span></Link>}</nav>;
}
