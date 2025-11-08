/**
 * Centralized Configuration Module
 * Loads environment variables and provides configuration throughout the application
 */
require('dotenv').config();

const config = {
    // Database Configuration
    database: {
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT || '3306', 10),
        user: process.env.DB_USER || 'olympiade_user',
        password: process.env.DB_PASSWORD || 'olympiade2025',
        database: process.env.DB_NAME || 'schulolympiade',
        connectionLimit: parseInt(process.env.DB_CONNECTION_LIMIT || '10', 10),
        waitForConnections: true,
        queueLimit: 0
    },

    // Service Ports
    ports: {
        dashboard: parseInt(process.env.DASHBOARD_PORT || '3000', 10),
        editData: parseInt(process.env.EDIT_DATA_PORT || '3003', 10),
        editEmoji: parseInt(process.env.EDIT_EMOJI_PORT || '3004', 10),
        successEmoji: parseInt(process.env.SUCCESS_EMOJI_PORT || '3005', 10),
        successEvent: parseInt(process.env.SUCCESS_EVENT_PORT || '3006', 10),
        ipLogging: parseInt(process.env.IP_LOGGING_PORT || '3007', 10)
    },

    // Admin Credentials
    admin: {
        username: process.env.ADMIN_USERNAME || 'admin',
        password: process.env.ADMIN_PASSWORD || 'changeMe123!'
    },

    // Logging Configuration
    logging: {
        filePath: process.env.LOG_FILE_PATH || './data/api-logs.txt'
    },

    // CORS Configuration
    cors: {
        allowedOrigins: (process.env.ALLOWED_ORIGINS || 'http://localhost,http://localhost:3000').split(',')
    }
};

module.exports = config;
