# Pruebas de seguridad automatizadas y análisis estático

## 1. Análisis estático de seguridad en Python (Bandit)

Instala Bandit:
```bash
pip install bandit
```

Ejecuta el análisis en tu backend:
```bash
bandit -r backend/
```

## 2. Análisis de dependencias (safety)

Instala Safety:
```bash
pip install safety
```

Ejecuta el análisis:
```bash
safety check -r backend/requirements.txt
```

## 3. Pruebas de endpoints (fuzzing y pentesting básico)

- Usa herramientas como [OWASP ZAP](https://www.zaproxy.org/) o [Postman](https://www.postman.com/) para escanear tus endpoints en busca de vulnerabilidades comunes (XSS, CSRF, SQLi, etc).
- Puedes lanzar ZAP en modo automático:

```bash
# Instala ZAP y ejecuta:
zap-baseline.py -t http://localhost:8000 -r zap_report.html
```

## 4. Automatización en CI/CD

Agrega estos comandos a tu pipeline de CI/CD (GitHub Actions, GitLab CI, etc) para que se ejecuten en cada push.

---

**IMPORTANTE:**
- Corrige cualquier vulnerabilidad crítica antes de pasar a producción.
- Repite estos análisis tras cada actualización de dependencias o cambios importantes.
