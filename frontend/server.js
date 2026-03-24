const express = require('express');
const path = require('path');
const app = express();

// Servir archivos estáticos desde public/
app.use(express.static(path.join(__dirname, 'public')));

// Servir index.html para todas las rutas (SPA)
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Fallback para cualquier otra ruta
app.use((req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

const PORT = 8081;
app.listen(PORT, () => {
  console.log(`✅ Frontend running on http://localhost:${PORT}`);
});
