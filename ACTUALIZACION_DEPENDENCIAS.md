# Actualización automática de dependencias y escaneo de vulnerabilidades

## 1. Dependabot (GitHub)
- Activa Dependabot en tu repositorio para recibir PRs automáticos con actualizaciones de dependencias.
- Crea el archivo `.github/dependabot.yml`:

```yaml
version: 2
updates:
  - package-ecosystem: "pip"
    directory: "/backend/"
    schedule:
      interval: "weekly"
  - package-ecosystem: "npm"
    directory: "/app-agora/"
    schedule:
      interval: "weekly"
```

## 2. Escaneo de vulnerabilidades
- Usa `safety` para Python y `npm audit` para Node.js:

```bash
pip install safety
safety check -r backend/requirements.txt

cd app-agora
npm audit
```

## 3. Automatización en CI/CD
- Añade estos comandos a tu pipeline de CI/CD para que fallen si hay vulnerabilidades críticas.

## 4. Revisión manual
- Revisa y acepta los PRs de Dependabot solo tras pasar los tests.

---

**IMPORTANTE:**
- No ignores vulnerabilidades críticas o altas.
- Haz backup antes de actualizar dependencias mayores.
