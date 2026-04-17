# Cómo generar y configurar la clave Fernet para cifrado seguro

## 1. Generar una clave Fernet segura

Ejecuta este comando en tu terminal de producción (con Python instalado):

```bash
python -c "from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())"
```

Esto imprimirá una clave similar a:

```
3Qw1vQw8vQw1vQw8vQw1vQw8vQw1vQw8vQw1vQw8vQw=
```

## 2. Configurar la variable de entorno

Agrega la clave generada a tu entorno de producción, por ejemplo en tu archivo `.env` o en la configuración de tu servidor:

```
FERNET_KEY=3Qw1vQw8vQw1vQw8vQw1vQw8vQw1vQw8vQw1vQw8vQw=
```

**Nunca compartas ni subas esta clave a ningún repositorio.**

## 3. Reinicia el backend

El backend solo arrancará si la variable `FERNET_KEY` está definida correctamente.

---

**IMPORTANTE:**
- Si cambias la clave Fernet, los datos cifrados previamente no podrán descifrarse. Haz backup antes de rotar la clave.
- Guarda la clave en un gestor de secretos seguro (ej: AWS Secrets Manager, Azure Key Vault, Google Secret Manager).
