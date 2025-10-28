const http = require('http');
const fs = require('fs');

const PORT = 3005; // Port für das Logging-Skript
const LOGFILE = './ip_log.txt'; // Pfad zur Log-Datei
const FORM_URL = 'http://192.168.100.73:5678/form/e1d1b9c8-f46f-4ca8-8061-f0a317e1964e'; // Ziel-URL für Weiterleitung

http.createServer((req, res) => {
  // IP-Adresse ermitteln
  let ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown';

  // IPv6-mapped IPv4 entfernen, falls vorhanden
  if (ip.startsWith('::ffff:')) {
    ip = ip.substring(7);
  }

  // Zeitstempel erzeugen
  const now = new Date().toISOString();

  // Log-Eintrag
  const logEntry = `${now} - ${ip}\n`;

  // Log in Datei schreiben (anhängen)
  fs.appendFile(LOGFILE, logEntry, (err) => {
    if (err) {
      console.error('Fehler beim Schreiben der Log-Datei:', err);
    }
  });

  // HTTP-Redirect zum Formular
  res.writeHead(302, { Location: FORM_URL });
  res.end();

}).listen(PORT, () => {
  console.log(`IP-Logging Server läuft auf Port ${PORT}`);
});
