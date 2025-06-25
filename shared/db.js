// GEMEINSAME DATENBANK-VERBINDUNG FÜR ALLE SERVICES
const mysql = require('mysql2/promise');

// Datenbank-Konfiguration
const dbConfig = {
    host: '192.168.100.73',
    port: 3308,
    user: 'olympiade_user',
    password: 'olympiade2025',
    database: 'schulolympiade',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
};

// Connection Pool erstellen
const pool = mysql.createPool(dbConfig);

// Test-Funktion für Datenbankverbindung
async function testConnection() {
    try {
        const connection = await pool.getConnection();
        console.log('✅ Datenbankverbindung erfolgreich!');
        connection.release();
        return true;
    } catch (error) {
        console.error('❌ Datenbankverbindung fehlgeschlagen:', error.message);
        return false;
    }
}

module.exports = { pool, testConnection };
