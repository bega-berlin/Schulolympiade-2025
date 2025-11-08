/**
 * Authentication Utility Module
 * Provides secure password hashing and validation
 */
const bcrypt = require('bcrypt');
const crypto = require('crypto');

const SALT_ROUNDS = 10;

/**
 * Hash a password using bcrypt
 * @param {string} password - Plain text password
 * @returns {Promise<string>} Hashed password
 */
async function hashPassword(password) {
    return await bcrypt.hash(password, SALT_ROUNDS);
}

/**
 * Verify a password against a hash
 * @param {string} password - Plain text password to verify
 * @param {string} hash - Hashed password to compare against
 * @returns {Promise<boolean>} True if password matches
 */
async function verifyPassword(password, hash) {
    return await bcrypt.compare(password, hash);
}

/**
 * Generate a secure random token
 * @param {number} length - Length of the token in bytes (default: 32)
 * @returns {string} Random hex token
 */
function generateToken(length = 32) {
    return crypto.randomBytes(length).toString('hex');
}

/**
 * Create a password hash from environment variable on startup
 * This should be called once when the application starts
 * @param {string} password - Password from environment variable
 * @returns {Promise<string>} Hashed password
 */
async function createPasswordHashFromEnv(password) {
    // For backward compatibility, check if it's already a bcrypt hash
    if (password && password.startsWith('$2b$')) {
        return password;
    }
    // Otherwise, hash it
    return await hashPassword(password);
}

module.exports = {
    hashPassword,
    verifyPassword,
    generateToken,
    createPasswordHashFromEnv
};
