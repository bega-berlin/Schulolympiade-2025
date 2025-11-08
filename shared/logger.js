/**
 * Logging Utility Module
 * Provides centralized logging functionality for all services
 */
const fs = require('fs').promises;
const path = require('path');

/**
 * Logger class for handling application logs
 */
class Logger {
    /**
     * Create a logger instance
     * @param {string} serviceName - Name of the service using this logger
     * @param {string} logFilePath - Path to the log file
     */
    constructor(serviceName, logFilePath) {
        this.serviceName = serviceName;
        this.logFilePath = logFilePath;
        this.ensureLogDirectory();
    }

    /**
     * Ensure log directory exists
     */
    async ensureLogDirectory() {
        try {
            const dir = path.dirname(this.logFilePath);
            await fs.mkdir(dir, { recursive: true });
        } catch (error) {
            console.error(`Error creating log directory: ${error.message}`);
        }
    }

    /**
     * Format log message with timestamp
     * @param {string} level - Log level (INFO, WARN, ERROR)
     * @param {string} message - Log message
     * @returns {string} Formatted log message
     */
    formatMessage(level, message) {
        const timestamp = new Date().toISOString();
        return `[${timestamp}] [${this.serviceName}] [${level}] ${message}\n`;
    }

    /**
     * Write log to file
     * @param {string} message - Message to write
     */
    async writeToFile(message) {
        try {
            await fs.appendFile(this.logFilePath, message);
        } catch (error) {
            console.error(`Error writing to log file: ${error.message}`);
        }
    }

    /**
     * Log info message
     * @param {string} message - Info message
     */
    async info(message) {
        const formattedMessage = this.formatMessage('INFO', message);
        console.log(formattedMessage.trim());
        await this.writeToFile(formattedMessage);
    }

    /**
     * Log warning message
     * @param {string} message - Warning message
     */
    async warn(message) {
        const formattedMessage = this.formatMessage('WARN', message);
        console.warn(formattedMessage.trim());
        await this.writeToFile(formattedMessage);
    }

    /**
     * Log error message
     * @param {string} message - Error message
     * @param {Error} error - Error object (optional)
     */
    async error(message, error = null) {
        const errorDetails = error ? ` - ${error.message}\n${error.stack}` : '';
        const formattedMessage = this.formatMessage('ERROR', message + errorDetails);
        console.error(formattedMessage.trim());
        await this.writeToFile(formattedMessage);
    }

    /**
     * Log HTTP request
     * @param {object} req - Express request object
     */
    async logRequest(req) {
        const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown';
        const method = req.method;
        const url = req.originalUrl;
        const userAgent = req.headers['user-agent'] || 'unknown';
        const message = `${ip} - ${method} ${url} - UA: ${userAgent}`;
        await this.info(message);
    }
}

module.exports = Logger;
