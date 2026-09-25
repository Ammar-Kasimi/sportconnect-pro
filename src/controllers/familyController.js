const pool = require('../config/db');
const { sendError,render } = require('../core/renderer')

async function listFamilies(req, res) {
    try {
        const result = await pool.query('SELECT * FROM families ORDER BY family_code');
        render(res, 'pages/families.ejs', { families: result.rows });
    } catch (error) {
     console.error('Database error:', error);
    return sendError(res, 500, "Une erreur interne est survenue. Veuillez réessayer ultérieurement.");
    }
}

function showCreateForm(req, res) {
    render(res, 'pages/family-form.ejs', {});
}

async function createFamily(req, res) {
    try {
        const { family_code, quotient_familial } = req.body;
        const qf = parseFloat(quotient_familial);

        await pool.query(
            'INSERT INTO families (family_code, quotient_familial) VALUES ($1, $2)',
            [family_code, qf]
        );

        res.writeHead(302, { Location: '/families' });
        res.end();
    } catch (error) {
       console.error('Database error:', error);
    return sendError(res, 500, "Une erreur interne est survenue. Veuillez réessayer ultérieurement.");
    }
}

module.exports = { listFamilies, showCreateForm, createFamily };