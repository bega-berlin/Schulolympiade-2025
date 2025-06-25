const express = require('express');
const app = express();
const port = 3001;

// Statischer Ordner, z. B. für HTML-Dateien
app.use(express.static('public'));

// Starte Server auf allen Netzwerk-Interfaces (nicht nur localhost)
app.listen(port, '0.0.0.0', () => {
  console.log(`Server läuft auf http://localhost:${port}`);
  console.log(`Oder im Netzwerk z. B. unter http://192.168.100.73:${port}`);
});
