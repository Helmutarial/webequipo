# Plan del proyecto web del equipo de fútbol

## 1. Objetivo

Crear una plataforma web responsive con:

- una zona pública para aficionados;
- un panel privado para administrar noticias, plantilla, partidos y estadísticas;
- una base preparada para temporadas, cantera y más equipos en el futuro.

## 2. Decisiones recomendadas

### Repositorio y despliegue

Se recomienda utilizar **GitHub como repositorio principal** y no mantener dos fuentes de verdad.

Flujo:

1. Cada cambio se desarrolla en una rama `feature/...`.
2. Se abre un Pull Request hacia `main`.
3. GitHub Actions ejecuta validaciones y construye la imagen Docker.
4. La imagen se publica en GitHub Container Registry.
5. Portainer recibe un webhook y vuelve a desplegar el servicio en el VPS.
6. Docker Compose arranca la nueva versión y conserva PostgreSQL con un volumen persistente.

Bitbucket solo debe añadirse si existe una necesidad concreta. Si se necesita usarlo, lo más limpio es mantenerlo como espejo de GitHub o utilizar Bitbucket como repositorio principal, pero no mezclar ambos flujos de forma manual.

### Arquitectura inicial

- Next.js con App Router y TypeScript estricto.
- TailwindCSS y componentes reutilizables basados en shadcn/ui.
- Prisma como única capa de acceso a datos.
- PostgreSQL.
- Auth.js con acceso privado y roles.
- Validación con Zod.
- Docker Compose para desarrollo y producción.
- VPS Ubuntu, Portainer, Nginx Proxy Manager y Cloudflare.

## 3. Alcance del MVP

### Zona pública

- Inicio con último resultado, próximo partido, últimas noticias y jugador destacado.
- Listado y detalle de noticias.
- Plantilla activa.
- Ficha pública de cada jugador.
- Calendario y resultados.
- Selección del MVP del partido.
- Diseño responsive para móvil, tablet y escritorio.

### Panel privado

- Inicio de sesión.
- Dashboard básico.
- CRUD de noticias, incluyendo borrador/publicación e imagen de portada.
- CRUD de jugadores y activación/desactivación.
- CRUD de partidos y actualización de resultados.
- Registro de estadísticas por jugador y partido.
- Selección del MVP.
- Permisos para `ADMIN`, `COACH` y `EDITOR`.

### Fuera del MVP

- Constructor visual de alineaciones con drag & drop.
- Portal de jugador con edición de datos.
- Aplicación móvil.
- Varios equipos y cantera.
- Automatización de resultados desde servicios externos.

## 4. Fases de trabajo

### Fase 0 — Definición

- Nombre, escudo, colores y tipografías.
- Dominio y proveedor del VPS.
- Contenido inicial y responsables de actualización.
- Política de privacidad y qué datos de jugadores serán públicos.

### Fase 1 — Base técnica

- Crear repositorio y protección de `main`.
- Inicializar Next.js, TypeScript, Tailwind y componentes base.
- Configurar Docker Compose con aplicación y PostgreSQL.
- Configurar Prisma, migraciones y semillas de desarrollo.
- Crear estructura de rutas pública y privada.
- Configurar Auth.js, sesiones y autorización por rol.
- Añadir lint, formato, validación de tipos y pruebas básicas.

### Fase 2 — Modelo y administración básica

- Crear jugadores.
- Crear noticias.
- Crear partidos.
- Añadir subida de imágenes.
- Crear dashboard y navegación del panel.
- Registrar acciones importantes en auditoría.

### Fase 3 — Experiencia pública

- Inicio.
- Noticias.
- Plantilla y fichas.
- Calendario y resultados.
- Estados de carga, errores y páginas vacías.
- SEO básico, metadatos, sitemap y optimización de imágenes.

### Fase 4 — Estadísticas

- Introducir estadísticas por partido.
- Validar que un jugador solo tenga una ficha por partido.
- Calcular totales por temporada.
- Mostrar estadísticas públicas seleccionadas.
- Asociar y mostrar el MVP.

### Fase 5 — Alineaciones

- Modelo de alineación asociado a un partido.
- Editor sobre un campo.
- Posiciones X/Y normalizadas para adaptarse a cualquier pantalla.
- Titulares, suplentes y capitán.
- Vista pública de la alineación.

### Fase 6 — Producción

- Construcción Docker en GitHub Actions.
- Publicación de imagen en GHCR.
- Stack de producción en Portainer.
- Dominio en Cloudflare.
- HTTPS y proxy inverso.
- Backups automáticos de PostgreSQL y prueba de restauración.
- Logs, healthcheck y procedimiento de rollback.

## 5. Modelo de datos recomendado

Además de las entidades del borrador, conviene introducir `Season` desde el principio, aunque solo haya una temporada inicialmente.

Entidades principales:

- `User`: usuario, email, hash o proveedor de autenticación, rol, estado y jugador asociado opcional.
- `Player`: identidad deportiva, dorsal, posición, biografía, fotografía, estado activo y datos privados.
- `Season`: nombre, fechas y estado activa.
- `Match`: temporada, rival, competición, fecha/hora, local/visitante, estadio, estado y resultado.
- `PlayerMatchStats`: jugador, partido, minutos, goles, asistencias, tarjetas, valoración y MVP.
- `News`: título, slug, contenido, portada, estado, autor, fechas de creación/publicación.
- `Lineup`: partido, formación y metadatos.
- `LineupPlayer`: jugador, posición visual, titular, capitán y suplente.
- `Media`: nombre, URL, tipo y relación con noticias o jugadores.
- `AuditLog`: usuario, acción, entidad, identificador, cambios y fecha.

Reglas importantes:

- Un partido pertenece a una temporada.
- No puede haber dos estadísticas del mismo jugador para el mismo partido.
- El dorsal no debe ser necesariamente único entre temporadas.
- La fecha de nacimiento, peso y otros datos sensibles no deben publicarse por defecto.
- Las noticias publicadas deben tener slug único.
- El borrado de jugadores y partidos debería ser lógico o restringido cuando existan relaciones históricas.

## 6. Roles

- `ADMIN`: acceso total, usuarios y configuración.
- `COACH`: partidos, alineaciones y estadísticas.
- `EDITOR`: noticias, imágenes y contenido editorial.
- `PLAYER`: reservar para una fase posterior; inicialmente puede existir en el modelo sin habilitar portal propio.

La autorización debe comprobarse en servidor en cada operación, no solo ocultando botones en la interfaz.

## 7. Calidad y seguridad

- Variables sensibles solo en secretos del entorno.
- Contraseñas con hash seguro si se utiliza acceso por credenciales.
- Validación de entradas con Zod.
- Protección de acciones de servidor y rutas privadas.
- Control de tipo de archivo, tamaño y nombre en las subidas.
- HTTPS, cabeceras seguras y cookies de sesión protegidas.
- Backups cifrados y verificados.
- Auditoría de cambios administrativos.
- Pruebas de permisos, CRUD principal y cálculos estadísticos.

## 8. Estructura de ramas

- `main`: producción y siempre protegida.
- `feature/nombre`: nuevas funcionalidades.
- `fix/nombre`: correcciones.
- Pull Request obligatorio para fusionar.
- Revisión y CI obligatorios antes de fusionar.
- Etiquetas de versión para releases.

## 9. Criterios de aceptación del MVP

El MVP estará terminado cuando un administrador pueda iniciar sesión, crear y publicar una noticia, gestionar jugadores y partidos, introducir estadísticas y seleccionar un MVP; y cuando un visitante pueda consultar correctamente inicio, noticias, plantilla, fichas, calendario y resultados desde móvil y escritorio.

## 10. Próximo paso

Cerrar las decisiones de la Fase 0 y después crear el repositorio, el esqueleto de la aplicación y la primera migración de base de datos. La primera entrega técnica debería mostrar la aplicación funcionando localmente con Docker, login y un CRUD completo como referencia.
