---
name: equipo-futbol-ui
description: Diseña y construye la interfaz web moderna del equipo de fútbol, incluyendo home, resultados, partidos, noticias, plantilla, estadísticas y panel privado. Usar al crear o revisar componentes React/Next.js del proyecto para mantener una experiencia deportiva, responsive, accesible y consistente.
---

# Interfaz del equipo de fútbol

Construir una interfaz tipo plataforma deportiva: información importante visible de un vistazo, navegación sencilla, tarjetas de partido, datos estadísticos y una identidad visual fuerte basada en el escudo.

## Patrón de página

Para páginas públicas, priorizar: cabecera con escudo y navegación; partido destacado; próximo partido y último resultado; noticias recientes; plantilla o estadísticas; y pie sencillo.

En móvil, convertir rejillas en una columna, conservar el marcador visible y evitar tablas con scroll horizontal salvo que sea imprescindible.

## Componentes base

Crear componentes pequeños y reutilizables: `SiteHeader`, `MatchCard`, `Scoreline`, `NewsCard`, `PlayerCard`, `StatCard`, `SectionHeading`, `Badge` y `EmptyState`.

Cada componente debe aceptar datos por props, evitar contenido duplicado y tener estados de carga, vacío y error cuando corresponda.

## Dirección visual

- Fondo carbón, superficies oscuras y acentos dorado-beige.
- Marcadores con números grandes.
- Tarjetas de partido con escudos, rival, competición, fecha y estado.
- Fotografías con recortes limpios y overlays oscuros.
- Bordes, líneas y microdetalles inspirados en un campo de fútbol.
- Animaciones breves y funcionales; no animar todo.

## Calidad

- Diseñar primero el contenido principal y la jerarquía.
- Comprobar viewport móvil y escritorio al levantar cada hito local.
- Mantener contraste AA, foco visible y navegación por teclado.
- No inventar datos reales: usar datos de demo claramente etiquetados.
- Revisar que las imágenes no rompan el layout y tengan `alt` útil.
- Separar componentes de presentación, datos y acciones de servidor.

## Flujo de implementación

1. Definir la pantalla y sus estados.
2. Crear el layout responsive con datos locales.
3. Conectar componentes reutilizables.
4. Verificar visualmente en local.
5. Ajustar con feedback antes de pasar a la siguiente pantalla.

Consultar `references/ui-patterns.md` para decisiones de layout y componentes.
