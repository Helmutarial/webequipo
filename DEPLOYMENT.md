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
