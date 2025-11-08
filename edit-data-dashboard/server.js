/**
 * Edit Data Dashboard Server
 * Provides admin interface for managing competition results
 */
const express = require('express');
const path = require('path');
const { pool, testConnection, closePool } = require('../shared/db');
const config = require('../shared/config');
const Logger = require('../shared/logger');
const { 
    createAuthMiddleware, 
    createErrorMiddleware,
    createRateLimitMiddleware,
    createStrictRateLimitMiddleware 
} = require('../shared/middleware');
const { verifyPassword, generateToken, createPasswordHashFromEnv } = require('../shared/auth');

const app = express();
const PORT = config.ports.editData;
const logger = new Logger('EditData', path.join(__dirname, '../dashboard/public/data/edit-data-logs.txt'));

// Admin credentials
const ADMIN_USER = config.admin.username;
let ADMIN_PASS_HASH;
const validTokens = new Set();

// Initialize password hash on startup
(async () => {
    ADMIN_PASS_HASH = await createPasswordHashFromEnv(config.admin.password);
})();

// Middleware
app.use(express.json());
app.use(express.static(__dirname));

// Rate limiting for all routes
app.use(createRateLimitMiddleware());

/**
 * POST /api/login
 * Authenticate admin user and generate token
 */
app.post('/api/login', createStrictRateLimitMiddleware(), async (req, res) => {
    try {
        const { username, password } = req.body;
        
        if (!username || !password) {
            return res.status(400).json({ 
                success: false, 
                message: 'Username and password required' 
            });
        }
        
        // Verify username and password
        if (username === ADMIN_USER && await verifyPassword(password, ADMIN_PASS_HASH)) {
            const token = generateToken();
            validTokens.add(token);
            await logger.info(`User ${username} logged in successfully`);
            res.json({ success: true, token });
        } else {
            await logger.warn(`Failed login attempt for user: ${username}`);
            res.status(401).json({ success: false, message: 'Invalid credentials' });
        }
    } catch (error) {
        await logger.error('Login error', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

// Create authentication middleware with the valid tokens set
const checkAuth = createAuthMiddleware(validTokens);

/**
 * GET /data/results.json
 * Retrieve all competition results (requires authentication)
 */
app.get('/data/results.json', checkAuth, async (req, res, next) => {
    try {
        const [rows] = await pool.execute(
            'SELECT id, team as Team, disziplin as Disziplin, punkte as Punkte, platz as Platz, TIME_FORMAT(uhr, "%H:%i:%s") as Uhr FROM results ORDER BY uhr DESC'
        );
        res.json(rows);
    } catch (error) {
        await logger.error('Error fetching results', error);
        next(error);
    }
});

/**
 * POST /api/save
 * Save complete dataset of results (requires authentication)
 */
app.post('/api/save', checkAuth, async (req, res) => {
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();
        
        // Delete old data
        await connection.execute('DELETE FROM results');
        await logger.info('Deleted old results');
        
        // Insert new data
        const data = req.body;
        
        if (!Array.isArray(data)) {
            await connection.rollback();
            return res.status(400).json({ 
                success: false, 
                error: 'Invalid data format - expected array' 
            });
        }
        
        for (const item of data) {
            if (!item.Team || !item.Disziplin || item.Punkte === undefined || 
                item.Platz === undefined || !item.Uhr) {
                await connection.rollback();
                return res.status(400).json({ 
                    success: false, 
                    error: 'Invalid data - missing required fields' 
                });
            }
            
            await connection.execute(
                'INSERT INTO results (team, disziplin, punkte, platz, uhr) VALUES (?, ?, ?, ?, ?)',
                [item.Team, item.Disziplin, item.Punkte, item.Platz, item.Uhr]
            );
        }
        
        await connection.commit();
        await logger.info(`Saved ${data.length} results successfully`);
        res.json({ success: true, count: data.length });
    } catch (error) {
        await connection.rollback();
        await logger.error('Error saving results', error);
        res.status(500).json({ success: false, error: error.message });
    } finally {
        connection.release();
    }
});

// Error handling middleware
app.use(createErrorMiddleware(logger));

// Start server
app.listen(PORT, async () => {
    console.log(`📝 Edit Data Dashboard running on http://localhost:${PORT}`);
    await logger.info(`Edit Data Dashboard started on port ${PORT}`);
    await testConnection();
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
