/**
 * Edit Emoji Dashboard Server
 * Provides admin interface for managing emoji mappings for disciplines
 */
const express = require('express');
const crypto = require('crypto');
const path = require('path');
const { pool, testConnection, closePool } = require('../shared/db');
const config = require('../shared/config');
const Logger = require('../shared/logger');
const { createAuthMiddleware, createErrorMiddleware } = require('../shared/middleware');

const app = express();
const PORT = config.ports.editEmoji;
const logger = new Logger('EditEmoji', path.join(__dirname, '../dashboard/public/data/edit-emoji-logs.txt'));

// Admin credentials hash
const ADMIN_USER = config.admin.username;
const ADMIN_PASS_HASH = crypto.createHash('sha256').update(config.admin.password).digest('hex');
const validTokens = new Set();

// Middleware
app.use(express.json());
app.use(express.static(__dirname));

/**
 * POST /api/login
 * Authenticate admin user and generate token
 */
app.post('/api/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        
        if (!username || !password) {
            return res.status(400).json({ 
                success: false, 
                message: 'Username and password required' 
            });
        }
        
        const hash = crypto.createHash('sha256').update(password).digest('hex');
        
        if (username === ADMIN_USER && hash === ADMIN_PASS_HASH) {
            const token = crypto.randomBytes(32).toString('hex');
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
 * GET /data/emojiMap.json
 * Retrieve all emoji mappings (public endpoint)
 */
app.get('/data/emojiMap.json', async (req, res, next) => {
    try {
        const [rows] = await pool.execute(
            'SELECT id, emoji as Emoji, trigger_word as `Trigger` FROM emoji_mappings ORDER BY trigger_word'
        );
        res.json(rows);
    } catch (error) {
        await logger.error('Error fetching emoji mappings', error);
        next(error);
    }
});

/**
 * POST /api/save
 * Save complete dataset of emoji mappings (requires authentication)
 */
app.post('/api/save', checkAuth, async (req, res) => {
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();
        
        // Delete old mappings
        await connection.execute('DELETE FROM emoji_mappings');
        await logger.info('Deleted old emoji mappings');
        
        // Insert new mappings
        const data = req.body;
        
        if (!Array.isArray(data)) {
            await connection.rollback();
            return res.status(400).json({ 
                success: false, 
                error: 'Invalid data format - expected array' 
            });
        }
        
        for (const item of data) {
            if (!item.Emoji || !item.Trigger) {
                await connection.rollback();
                return res.status(400).json({ 
                    success: false, 
                    error: 'Invalid data - missing required fields' 
                });
            }
            
            await connection.execute(
                'INSERT INTO emoji_mappings (emoji, trigger_word) VALUES (?, ?)',
                [item.Emoji, item.Trigger]
            );
        }
        
        await connection.commit();
        await logger.info(`Saved ${data.length} emoji mappings successfully`);
        res.json({ success: true, count: data.length });
    } catch (error) {
        await connection.rollback();
        await logger.error('Error saving emoji mappings', error);
        res.status(500).json({ success: false, error: error.message });
    } finally {
        connection.release();
    }
});

// Error handling middleware
app.use(createErrorMiddleware(logger));

// Start server
app.listen(PORT, async () => {
    console.log(`😀 Edit Emoji Dashboard running on http://localhost:${PORT}`);
    await logger.info(`Edit Emoji Dashboard started on port ${PORT}`);
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
