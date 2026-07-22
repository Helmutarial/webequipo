export type NewsItem = {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  tag: string;
  date: string;
  image: string;
  accent: "gold" | "dark" | "cream";
  published: boolean;
};

export const initialNews: NewsItem[] = [
  { id: "season-2026", title: "Arranca una nueva temporada", slug: "arranca-una-nueva-temporada", excerpt: "Toda la energía del Aldapan Gora vuelve al césped.", content: "Comienza una nueva etapa para el equipo. En esta sección iremos contando las novedades del vestuario.", tag: "CLUB", date: "2026-06-18", image: "", accent: "gold", published: true },
  { id: "new-kit", title: "La nueva piel del equipo", slug: "la-nueva-piel-del-equipo", excerpt: "Nuestros colores, dentro y fuera del campo.", content: "Muy pronto compartiremos todos los detalles de la equipación.", tag: "EQUIPO", date: "2026-06-12", image: "", accent: "dark", published: true },
  { id: "squad-ready", title: "Plantilla lista para competir", slug: "plantilla-lista-para-competir", excerpt: "Conoce a los jugadores que forman parte del proyecto.", content: "Consulta las fichas de todos nuestros jugadores desde la sección El equipo.", tag: "PLANTILLA", date: "2026-06-05", image: "", accent: "cream", published: true },
];
