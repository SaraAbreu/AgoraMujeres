# Backup seguro de MongoDB para producción

## 1. Realizar backup cifrado de la base de datos

Utiliza la herramienta oficial de MongoDB para hacer backups:

```bash
mongodump --uri="mongodb+srv://<usuario>:<password>@<cluster>/<db>" --archive=backup_$(date +%F).gz --gzip
```

Esto genera un archivo comprimido. Para cifrarlo, usa OpenSSL o GPG:

### Opción 1: OpenSSL (AES-256)
```bash
openssl enc -aes-256-cbc -pbkdf2 -salt -in backup_2026-04-17.gz -out backup_2026-04-17.gz.enc
```

### Opción 2: GPG
```bash
gpg -c backup_2026-04-17.gz
```

## 2. Almacenamiento seguro
- Sube los backups cifrados a un bucket privado en S3, Google Cloud Storage, Azure Blob o similar.
- Nunca almacenes backups sin cifrar en servidores públicos.

## 3. Restaurar backup

### OpenSSL
```bash
openssl enc -d -aes-256-cbc -pbkdf2 -in backup_2026-04-17.gz.enc -out backup_2026-04-17.gz
```

### GPG
```bash
gpg -d backup_2026-04-17.gz.gpg > backup_2026-04-17.gz
```

Luego restaura con:
```bash
mongorestore --uri="mongodb+srv://<usuario>:<password>@<cluster>/<db>" --gzip --archive=backup_2026-04-17.gz
```

## 4. Automatización
- Programa backups automáticos diarios/semanales con cron y scripts.
- Revisa periódicamente que los backups se puedan restaurar correctamente.

---

**IMPORTANTE:**
- Cambia la contraseña de cifrado regularmente y almacénala en un gestor de secretos seguro.
- Elimina backups antiguos según tu política de retención.
