/**
 * IP Logging Server
 * Logs IP addresses and redirects to form
 */
const http = require('http');
const fs = require('fs').promises;
const path = require('path');
const config = require('../shared/config');
const Logger = require('../shared/logger');

const PORT = config.ports.ipLogging;
const LOGFILE = path.join(__dirname, 'ip_log.txt');
const FORMULAR_URL = process.env.FORMULAR_URL || 'http://192.168.100.73:5678/form/e1d1b9c8-f46f-4ca8-8061-f0a317e1964e';

const logger = new Logger('IPLogging', path.join(__dirname, '../dashboard/public/data/ip-logging-logs.txt'));

/**
 * Extract clean IP address from request
 * @param {object} req - HTTP request object
 * @returns {string} Clean IP address
 */
function getClientIP(req) {
    let ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown';
    
    // Remove IPv6-mapped IPv4 prefix if present
    if (ip.startsWith('::ffff:')) {
        ip = ip.substring(7);
    }
    
    return ip;
}

/**
 * Log IP address to file
 * @param {string} ip - IP address to log
 */
async function logIPAddress(ip) {
    const timestamp = new Date().toISOString();
    const logEntry = `${timestamp} - ${ip}\n`;
    
    try {
        await fs.appendFile(LOGFILE, logEntry);
        await logger.info(`IP logged: ${ip}`);
    } catch (error) {
        await logger.error('Error writing to log file', error);
    }
}

// Create HTTP server
const server = http.createServer(async (req, res) => {
    const ip = getClientIP(req);
    
    // Log IP address
    await logIPAddress(ip);
    
    // Redirect to form
    res.writeHead(302, { Location: FORMULAR_URL });
    res.end();
});

// Start server
server.listen(PORT, '0.0.0.0', async () => {
    console.log(`📝 IP Logging server running on port ${PORT}`);
    await logger.info(`IP Logging server started on port ${PORT}`);
});

// Graceful shutdown
process.on('SIGINT', async () => {
    console.log('\n🛑 Shutting down server...');
    await logger.info('Server shutting down');
    server.close();
    process.exit(0);
});

process.on('SIGTERM', async () => {
    console.log('\n🛑 Shutting down server...');
    await logger.info('Server shutting down');
    server.close();
    process.exit(0);
});
