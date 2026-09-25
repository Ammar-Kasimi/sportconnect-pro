const pool = require('../config/db')
const { sendError,render } = require('../core/renderer')

async function listFacilities(req, res) {
    try {
        const results = await pool.query('select * FROM facilities order by name asc')
        const facilitiesList = results.rows;
        render(res, 'pages/facilities', { facilities: facilitiesList })

    } catch (error) {
        console.error('Database error:', error);
    return sendError(res, 500, "Une erreur interne est survenue. Veuillez réessayer ultérieurement.");
    }
}

function showCreateForm(req, res) {
    render(res, 'pages/facility-form.ejs', { facility: null });
}

async function createFacility(req, res) {
    try {
        const { name, address, erp_capacity, is_divisible } = req.body;
        const capacity = parseInt(erp_capacity, 10);
        const divisible = is_divisible === 'on' || is_divisible === 'true';

        const queryText = `INSERT INTO facilities (name, address, erp_capacity, is_divisible) VALUES ($1, $2, $3, $4)`;
        await pool.query(queryText, [name, address, capacity, divisible]);

        res.writeHead(302, { Location: '/facilities' });
        res.end();
    } catch (error) {
        console.error('Database error:', error);
        return sendError(res, 500, "Une erreur interne est survenue. Veuillez réessayer ultérieurement.");
    }
}

async function showEditForm(req, res, params) {
    try {
        const result = await pool.query('SELECT * FROM facilities WHERE id = $1', [params.id]);
        render(res, 'pages/facility-form.ejs', { facility: result.rows[0] });
    } catch (error) {
        console.error('Database error:', error);
        return sendError(res, 500, "Une erreur interne est survenue. Veuillez réessayer ultérieurement.");
    }
}

async function updateFacility(req, res, params) {
    try {
        const { name, address, erp_capacity, is_divisible } = req.body;
        const capacity = parseInt(erp_capacity, 10);
        const divisible = is_divisible === 'on' || is_divisible === 'true';

        const queryText = `UPDATE facilities SET name = $1, address = $2, erp_capacity = $3, is_divisible = $4 WHERE id = $5`;
        await pool.query(queryText, [name, address, capacity, divisible, params.id]);

        res.writeHead(302, { Location: '/facilities' });
        res.end();
    } catch (error) {
        console.error('Database error:', error);
        return sendError(res, 500, "Une erreur interne est survenue. Veuillez réessayer ultérieurement.");
    }
}

async function deleteFacility(req, res, params) {
    try {
        await pool.query('DELETE FROM facilities WHERE id = $1', [params.id]);
        res.writeHead(302, { Location: '/facilities' });
        res.end();
    } catch (error) {
        console.error('Database error:', error);
        return sendError(res, 500, "Une erreur interne est survenue. Veuillez réessayer ultérieurement.");
    }
}


module.exports = { listFacilities, showCreateForm, createFacility, showEditForm, updateFacility, deleteFacility }
