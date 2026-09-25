require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
    user: process.env.DB_USER || 'postgres',
    host: process.env.DB_HOST || '127.0.0.1',
    database: process.env.DB_NAME || 'sportconnect',
    password: String(process.env.DB_PASSWORD || 'postgres'),
    port: parseInt(process.env.DB_PORT, 10) || 5432,
});

pool.connect((err, client, release) => {
    if (err) {
        console.error('Erreur de connexion à PostgreSQL :', err.stack);
    } else {
        console.log('Connecté à PostgreSQL avec succès');
        release();
    }
});

module.exports = pool;