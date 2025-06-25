// HAUPT-DASHBOARD SERVER - Angepasst für MySQL
const express = require('express');
const path = require('path');
const fs = require('fs');
const { pool, testConnection } = require('../shared/db');

const app = express();
const PORT = 3000;

// Middleware
app.use(express.static('public'));
app.use(express.json());

// CORS
const allowedOrigins = ['http://localhost', 'http://localhost:3000'];
app.use((req, res, next) => {
    const origin = req.headers.origin;
    if (allowedOrigins.includes(origin)) {
        res.header('Access-Control-Allow-Origin', origin);
    }
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
    next();
});

// IP-Logging Middleware (bleibt JSON-basiert wie gewünscht)
app.use((req, res, next) => {
    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown IP';
    const now = new Date().toISOString();
    const method = req.method;
    const url = req.originalUrl;
    const userAgent = req.headers['user-agent'] || 'unknown UA';

    const logLine = `[${now}] ${ip} - ${method} ${url} - UA: ${userAgent}\n`;

    console.log(logLine.trim());

    const logFilePath = "/home/regie/schulolympiade/dashboard/public/data/api-logs.txt";
    fs.appendFile(logFilePath, logLine, (err) => {
        if (err) {
            console.error('Fehler beim Schreiben in api-logs.txt:', err);
        }
    });

    next();
});

// Daten aus MySQL abrufen und verarbeiten
async function getProcessedData() {
    try {
        // Alle Ergebnisse abrufen
        const [results] = await pool.execute(
            'SELECT team, disziplin, punkte, platz, TIME_FORMAT(uhr, "%H:%i:%s") as uhr FROM results ORDER BY uhr DESC'
        );

        // Team-Statistiken berechnen
        const teamScores = {};
        const disciplineStats = {};

        results.forEach(row => {
            // Team-Daten sammeln
            if (!teamScores[row.team]) {
                teamScores[row.team] = {
                    name: row.team,
                    totalPoints: 0,
                    events: 0,
                    avgPlace: 0,
                    places: []
                };
            }

            teamScores[row.team].totalPoints += row.punkte;
            teamScores[row.team].events++;
            teamScores[row.team].places.push(row.platz);

            // Disziplin-Daten sammeln
            if (!disciplineStats[row.disziplin]) {
                disciplineStats[row.disziplin] = {
                    name: row.disziplin,
                    participants: new Set(),
                    totalPoints: 0,
                    events: 0
                };
            }

            disciplineStats[row.disziplin].participants.add(row.team);
            disciplineStats[row.disziplin].totalPoints += row.punkte;
            disciplineStats[row.disziplin].events++;
        });

        // Durchschnittsplätze berechnen
        Object.values(teamScores).forEach(team => {
            if (team.places.length > 0) {
                team.avgPlace = team.places.reduce((a, b) => a + b, 0) / team.places.length;
            }
        });

        // Rangliste erstellen
        const leaderboard = Object.values(teamScores)
            .sort((a, b) => b.totalPoints - a.totalPoints)
            .map((team, index) => ({
                ...team,
                rank: index + 1
            }));

        // Disziplin-Statistiken formatieren
        const disciplines = Object.values(disciplineStats).map(d => ({
            name: d.name,
            participants: d.participants.size,
            avgPoints: d.events > 0 ? (d.totalPoints / d.events).toFixed(1) : 0,
            totalEvents: d.events
        }));

        // Neueste Ergebnisse (bereits nach Zeit sortiert)
        const recentResults = results.slice(0, 10).map(r => ({
            team: r.team,
            discipline: r.disziplin,
            points: r.punkte,
            place: r.platz,
            time: r.uhr
        }));

        return {
            teams: Object.keys(teamScores),
            disciplines,
            totalParticipants: Object.keys(teamScores).length,
            totalEvents: results.length,
            leaderboard,
            recentResults
        };
    } catch (error) {
        console.error('Fehler beim Abrufen der Daten:', error);
        throw error;
    }
}

// API-Endpunkte
app.get('/api/stats', async (req, res) => {
    try {
        const data = await getProcessedData();
        res.json({
            totalParticipants: data.totalParticipants,
            totalEvents: data.totalEvents,
            totalDisciplines: data.disciplines.length,
            lastUpdate: new Date().toLocaleString('de-DE')
        });
    } catch (error) {
        res.status(500).json({ error: 'Datenbankfehler' });
    }
});

app.get('/api/leaderboard', async (req, res) => {
    try {
        const data = await getProcessedData();
        res.json(data.leaderboard);
    } catch (error) {
        res.status(500).json({ error: 'Datenbankfehler' });
    }
});

app.get('/api/disciplines', async (req, res) => {
    try {
        const data = await getProcessedData();
        res.json(data.disciplines);
    } catch (error) {
        res.status(500).json({ error: 'Datenbankfehler' });
    }
});

app.get('/api/recent', async (req, res) => {
    try {
        const data = await getProcessedData();
        res.json(data.recentResults);
    } catch (error) {
        res.status(500).json({ error: 'Datenbankfehler' });
    }
});

app.get('/api/emoji-map', async (req, res) => {
    try {
        const [rows] = await pool.execute(
            'SELECT emoji, trigger_word FROM emoji_mappings'
        );
        res.json(rows);
    } catch (error) {
        console.error('Fehler beim Abrufen der Emoji-Map:', error);
        res.json([]);
    }
});

// Server starten
app.listen(PORT, '0.0.0.0', async () => {
    console.log(`🚀 Dashboard läuft auf http://localhost:${PORT}`);
    
    // Datenbankverbindung testen
    const dbConnected = await testConnection();
    if (!dbConnected) {
        console.error('⚠️ Dashboard läuft, aber keine Datenbankverbindung!');
    }
});

process.on('SIGINT', () => {
    console.log('\n🛑 Server wird beendet...');
    pool.end();
    process.exit(0);
});
