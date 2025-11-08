/**
 * Success Emoji Server
 * Displays success page after emoji submission
 */
const express = require('express');
const path = require('path');
const config = require('../shared/config');
const Logger = require('../shared/logger');

const app = express();
const PORT = config.ports.successEmoji;
const logger = new Logger('SuccessEmoji', path.join(__dirname, '../dashboard/public/data/success-emoji-logs.txt'));

// Serve static files
app.use(express.static('public'));

// Start server
app.listen(PORT, '0.0.0.0', async () => {
    console.log(`✅ Success Emoji page running on http://localhost:${PORT}`);
    await logger.info(`Success Emoji server started on port ${PORT}`);
});

// Graceful shutdown
process.on('SIGINT', async () => {
    console.log('\n🛑 Shutting down server...');
    await logger.info('Server shutting down');
    process.exit(0);
});

process.on('SIGTERM', async () => {
    console.log('\n🛑 Shutting down server...');
    await logger.info('Server shutting down');
    process.exit(0);
});
