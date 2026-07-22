"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { NewsItem } from "@/lib/news";

type NewsContextValue = { news: NewsItem[]; loading: boolean; refresh: (includeDrafts?: boolean) => Promise<void>; saveNews: (item: NewsItem) => Promise<void>; createNews: (item: Omit<NewsItem, "id" | "slug"> & { slug?: string }) => Promise<void>; deleteNews: (id: string) => Promise<void> };
const NewsContext = createContext<NewsContextValue | null>(null);

export function NewsProvider({ children }: { children: React.ReactNode }) {
  const [news, setNews] = useState<NewsItem[]>([]); const [loading, setLoading] = useState(true);
  const refresh = async (includeDrafts = false) => { setLoading(true); const response = await fetch(`/api/news${includeDrafts ? "?all=1" : ""}`, { cache: "no-store" }); if (response.ok) setNews(await response.json()); setLoading(false); };
  useEffect(() => { void refresh(); }, []);
  const saveNews = async (item: NewsItem) => { const response = await fetch("/api/news", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(item) }); if (!response.ok) throw new Error("No se pudo guardar la noticia"); await refresh(true); };
  const createNews = async (item: Omit<NewsItem, "id" | "slug"> & { slug?: string }) => { const response = await fetch("/api/news", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(item) }); if (!response.ok) throw new Error("No se pudo crear la noticia"); await refresh(true); };
  const deleteNews = async (id: string) => { const response = await fetch(`/api/news?id=${encodeURIComponent(id)}`, { method: "DELETE" }); if (!response.ok) throw new Error("No se pudo borrar la noticia"); await refresh(true); };
  return <NewsContext.Provider value={{ news, loading, refresh, saveNews, createNews, deleteNews }}>{children}</NewsContext.Provider>;
}

export function useNews() { const value = useContext(NewsContext); if (!value) throw new Error("useNews debe usarse dentro de NewsProvider"); return value; }
