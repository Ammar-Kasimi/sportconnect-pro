const { Pool } = require('pg')
require('dotenv').config();
const pool = new Pool({ connectionString: process.env.Database_URL })
pool.connect((err, client, release) => {
    if (err) {
        console.error('Erreur de connexion à PostgreSQL :', err.stack);
    } else {
        console.log('Connecté à PostgreSQL avec succès');
        release();
    }
    module.exports = pool;
})