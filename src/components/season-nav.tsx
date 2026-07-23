"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const items = [
  { href: "/partidos", label: "Partidos" },
  { href: "/clasificacion", label: "Clasificación" },
  { href: "/rankings", label: "Rankings" },
  { href: "/calendario", label: "Calendario" },
];

export default function SeasonNav() {
  const pathname = usePathname();
  return <div className="section-tabs">{items.map((item) => <Link className={pathname === item.href ? "active" : ""} href={item.href} key={item.href}>{item.label}</Link>)}</div>;
}

