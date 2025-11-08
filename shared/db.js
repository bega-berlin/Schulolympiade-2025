/**
 * Shared Database Connection Module
 * Provides MySQL connection pool for all services
 */
const mysql = require('mysql2/promise');
const config = require('./config');

// Create connection pool with configuration
const pool = mysql.createPool(config.database);

/**
 * Test database connection
 * @returns {Promise<boolean>} True if connection successful, false otherwise
 */
async function testConnection() {
    try {
        const connection = await pool.getConnection();
        console.log('✅ Database connection successful');
        connection.release();
        return true;
    } catch (error) {
        console.error('❌ Database connection failed:', error.message);
        return false;
    }
}

/**
 * Execute query with error handling and retry logic
 * @param {string} query - SQL query to execute
 * @param {Array} params - Query parameters
 * @param {number} retries - Number of retries (default: 3)
 * @returns {Promise<Array>} Query results
 */
async function executeQuery(query, params = [], retries = 3) {
    let lastError;
    for (let attempt = 1; attempt <= retries; attempt++) {
        try {
            const [results] = await pool.execute(query, params);
            return results;
        } catch (error) {
            lastError = error;
            console.error(`Query failed (attempt ${attempt}/${retries}):`, error.message);
            if (attempt < retries) {
                // Wait before retrying (exponential backoff)
                await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
            }
        }
    }
    throw lastError;
}

/**
 * Close database connection pool
 */
async function closePool() {
    try {
        await pool.end();
        console.log('Database connection pool closed');
    } catch (error) {
        console.error('Error closing database pool:', error.message);
    }
}

module.exports = { 
    pool, 
    testConnection, 
    executeQuery,
    closePool 
};
