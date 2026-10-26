# Despliegue y mantenimiento

## Actualizar la web

```bash
cd /opt/aldapan-gora
git pull origin main
docker compose up -d --build
docker compose ps
```

## Perfil editor de noticias

El editor de noticias puede entrar al panel y crear noticias nuevas, pero no puede editar jugadores, borrar noticias ni modificar noticias existentes.

En el servidor, editar `/opt/aldapan-gora/.env` y anadir:

```env
NEWS_EDITOR_EMAIL="correo-del-companero@example.com"
NEWS_EDITOR_NAME="Nombre del companero"
NEWS_EDITOR_PASSWORD="contrasena-segura"
```

Despues aplicar cambios:

```bash
cd /opt/aldapan-gora
docker compose up -d --build
```

## Comprobar salud

```bash
docker compose exec web node -e "fetch('http://127.0.0.1:3000/api/health').then(async r => console.log(r.status, await r.text()))"
```

## Sincronizar clasificación y jornadas oficiales

La web utiliza los CSV públicos del Ayuntamiento de Madrid. Cada sincronización reemplaza la clasificación y las jornadas almacenadas por la versión más reciente disponible, por lo que incorpora automáticamente las correcciones oficiales.

Antes de desplegar, añadir a `/opt/aldapan-gora/.env` una clave larga y privada:

```env
MADRID_SYNC_SECRET="una-clave-larga-y-unica"
```

Después del despliegue, ejecutar una primera sincronización:

```bash
cd /opt/aldapan-gora
bash scripts/sync-madrid-data.sh
```

Programar la ejecución cada noche a las 02:30:

```cron
30 2 * * * cd /opt/aldapan-gora && bash scripts/sync-madrid-data.sh >> /var/log/aldapan-madrid-sync.log 2>&1
```

El Ayuntamiento publica normalmente el fichero de competición una vez por semana. La tarea nocturna conserva siempre el último fichero disponible y recogerá cualquier corrección que publiquen.

## Crear una copia de seguridad

```bash
cd /opt/aldapan-gora
bash scripts/backup-data.sh
```

Las copias se guardan en `/opt/backups/aldapan-gora` y se conservan durante 14 días.

## Programar copia diaria

```bash
crontab -e
```

Añadir esta línea:

```cron
30 3 * * * cd /opt/aldapan-gora && bash scripts/backup-data.sh >> /var/log/aldapan-backup.log 2>&1
```
