/**
 * Main Dashboard Server
 * Provides API endpoints for the School Olympics dashboard
 */
const express = require('express');
const path = require('path');
const { pool, testConnection, closePool } = require('../shared/db');
const config = require('../shared/config');
const Logger = require('../shared/logger');
const { 
    createCorsMiddleware, 
    createLoggingMiddleware, 
    createErrorMiddleware,
    createRateLimitMiddleware 
} = require('../shared/middleware');

const app = express();
const PORT = config.ports.dashboard;
const logger = new Logger('Dashboard', path.join(__dirname, config.logging.filePath));

// Middleware setup
app.use(express.static('public'));
app.use(express.json());
app.use(createCorsMiddleware(config.cors.allowedOrigins));
app.use(createLoggingMiddleware(logger));
app.use(createRateLimitMiddleware({
    windowMs: 1 * 60 * 1000, // 1 minute
    max: 60, // 60 requests per minute
    message: 'Too many requests from this IP, please try again later.'
}));

/**
 * Retrieve and process data from the database
 * @returns {Promise<Object>} Processed data including leaderboard, disciplines, and recent results
 */
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

/**
 * Retrieve and process data from the database
 * @returns {Promise<Object>} Processed data including leaderboard, disciplines, and recent results
 */
async function getProcessedData() {
    try {
        // Fetch all results from database
        const [results] = await pool.execute(
            'SELECT team, disziplin, punkte, platz, TIME_FORMAT(uhr, "%H:%i:%s") as uhr FROM results ORDER BY uhr DESC'
        );

        // Calculate team statistics
        const teamScores = {};
        const disciplineStats = {};

        results.forEach(row => {
            // Collect team data
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

            // Collect discipline data
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

        // Calculate average places
        Object.values(teamScores).forEach(team => {
            if (team.places.length > 0) {
                team.avgPlace = team.places.reduce((a, b) => a + b, 0) / team.places.length;
            }
        });

        // Create leaderboard
        const leaderboard = Object.values(teamScores)
            .sort((a, b) => b.totalPoints - a.totalPoints)
            .map((team, index) => ({
                ...team,
                rank: index + 1
            }));

        // Format discipline statistics
        const disciplines = Object.values(disciplineStats).map(d => ({
            name: d.name,
            participants: d.participants.size,
            avgPoints: d.events > 0 ? (d.totalPoints / d.events).toFixed(1) : 0,
            totalEvents: d.events
        }));

        // Get recent results (already sorted by time)
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
        await logger.error('Error fetching processed data', error);
        throw error;
    }
}

// API Endpoints

/**
 * GET /api/stats
 * Returns overall statistics
 */
app.get('/api/stats', async (req, res, next) => {
    try {
        const data = await getProcessedData();
        res.json({
            totalParticipants: data.totalParticipants,
            totalEvents: data.totalEvents,
            totalDisciplines: data.disciplines.length,
            lastUpdate: new Date().toLocaleString('de-DE')
        });
    } catch (error) {
        next(error);
    }
});

/**
 * GET /api/leaderboard
 * Returns the team leaderboard
 */
app.get('/api/leaderboard', async (req, res, next) => {
    try {
        const data = await getProcessedData();
        res.json(data.leaderboard);
    } catch (error) {
        next(error);
    }
});

/**
 * GET /api/disciplines
 * Returns discipline statistics
 */
app.get('/api/disciplines', async (req, res, next) => {
    try {
        const data = await getProcessedData();
        res.json(data.disciplines);
    } catch (error) {
        next(error);
    }
});

/**
 * GET /api/recent
 * Returns the most recent results
 */
app.get('/api/recent', async (req, res, next) => {
    try {
        const data = await getProcessedData();
        res.json(data.recentResults);
    } catch (error) {
        next(error);
    }
});

/**
 * GET /api/emoji-map
 * Returns emoji mappings for disciplines
 */
app.get('/api/emoji-map', async (req, res, next) => {
    try {
        const [rows] = await pool.execute(
            'SELECT emoji, trigger_word FROM emoji_mappings'
        );
        res.json(rows);
    } catch (error) {
        await logger.error('Error fetching emoji map', error);
        res.json([]);
    }
});

// Error handling middleware (must be last)
app.use(createErrorMiddleware(logger));

// Start server
app.listen(PORT, '0.0.0.0', async () => {
    console.log(`🚀 Dashboard server running on http://localhost:${PORT}`);
    await logger.info(`Dashboard server started on port ${PORT}`);
    
    // Test database connection
    const dbConnected = await testConnection();
    if (!dbConnected) {
        await logger.warn('Dashboard running but no database connection');
    }
});

// Graceful shutdown
process.on('SIGINT', async () => {
    console.log('\n🛑 Shutting down server...');
    await logger.info('Server shutting down');
    await closePool();
    process.exit(0);
});

process.on('SIGTERM', async () => {
    console.log('\n🛑 Shutting down server...');
    await logger.info('Server shutting down');
    await closePool();
    process.exit(0);
});
