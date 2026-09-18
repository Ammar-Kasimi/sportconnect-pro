const pool = require('../config/db');
const render = require('../core/renderer');

async function listAssociations(req, res) {
    try {
        const result = await pool.query('select * from associations order by name')
        render(res, 'pages/associations.ejs', { clubs: result })
    } catch (error) {
        console.error('database error', error)
        res.statusCode = 500;
        res.end('internal server Error')
    }
}
function showCreateForm(req, res) {
    render(res, 'pages/association-form.ejs', {});
}

async function createAssociation(req, res) {
    try {
        const { name, contact_email, phone } = req.body;
        await pool.query(
            `INSERT INTO associations (name, contact_email, phone) VALUES ($1, $2, $3)`, 
            [name, contact_email, phone]
        );
        res.writeHead(302, { Location: '/associations' });
        res.end();
    } catch (error) {
        res.statusCode = 500;
        res.end("Internal Server Error");
    }
}

async function showEditForm(req, res, params) {
    try {
        const result = await pool.query('SELECT * FROM associations WHERE id = $1', [params.id]);
        render(res, 'pages/association-edit.ejs', { club: result.rows[0] });
    } catch (error) {
        res.statusCode = 500;
        res.end("Internal Server Error");
    }
}

async function updateAssociation(req, res, params) {
    try {
        const { name, contact_email, phone } = req.body;
        await pool.query(
            `UPDATE associations SET name = $1, contact_email = $2, phone = $3 WHERE id = $4`, 
            [name, contact_email, phone, params.id]
        );
        res.writeHead(302, { Location: '/associations' });
        res.end();
    } catch (error) {
        res.statusCode = 500;
        res.end("Internal Server Error");
    }
}

async function deleteAssociation(req, res, params) {
    try {
        await pool.query('DELETE FROM associations WHERE id = $1', [params.id]);
        res.writeHead(302, { Location: '/associations' });
        res.end();
    } catch (error) {
        res.statusCode = 500;
        res.end("Internal Server Error");
    }
}
module.exports = { listAssociations, showCreateForm, createAssociation, showEditForm, updateAssociation, deleteAssociation };