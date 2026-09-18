const pool = require('../config/db');
const render = require('../core/renderer');
const scheduleService = require('../services/scheduleService');

async function listActivities(req, res) {
    try {
        const queryText = `
            SELECT activities.*, associations.name AS club_name, facilities.name AS facility_name
            FROM activities
            JOIN associations ON activities.association_id = associations.id
            JOIN facilities ON activities.facility_id = facilities.id
            ORDER BY activities.day_of_week, activities.start_time
        `;
        const result = await pool.query(queryText);
        render(res, 'pages/activities.ejs', { activities: result.rows });
    } catch (error) {
        res.statusCode = 500;
        res.end("Internal Server Error");
    }
}

async function showCreateForm(req, res) {
    try {
        const clubsResult = await pool.query('SELECT id, name FROM associations ORDER BY name');
        const facilitiesResult = await pool.query('SELECT id, name, erp_capacity FROM facilities ORDER BY name');
        render(res, 'pages/activity-form.ejs', { clubs: clubsResult.rows, facilities: facilitiesResult.rows });
    } catch (error) {
        res.statusCode = 500;
        res.end("Internal Server Error");
    }
}

async function createActivity(req, res) {
    try {
        const { name, association_id, facility_id, sub_zone, day_of_week, start_time, end_time, max_capacity, base_price } = req.body;
        const capacity = parseInt(max_capacity, 10);
        const price = parseFloat(base_price);
        const subZone = sub_zone && sub_zone.trim() !== '' ? sub_zone.trim() : null;

        const facilityRes = await pool.query('SELECT erp_capacity FROM facilities WHERE id = $1', [facility_id]);
        
        if (!scheduleService.validateCapacity(capacity, facilityRes.rows[0].erp_capacity)) {
            res.statusCode = 400;
            return res.end("Erreur : Capacité ERP dépassée.");
        }

        const existingRes = await pool.query(
            'SELECT start_time, end_time FROM activities WHERE facility_id = $1 AND day_of_week = $2',
            [facility_id, day_of_week]
        );

        for (let i = 0; i < existingRes.rows.length; i++) {
            const existing = existingRes.rows[i];
            if (scheduleService.hasTimeCollision(start_time, end_time, existing.start_time, existing.end_time)) {
                res.statusCode = 400;
                return res.end("Erreur : Conflit d'horaire détecté.");
            }
        }

        const queryText = `
            INSERT INTO activities (name, association_id, facility_id, sub_zone, day_of_week, start_time, end_time, max_capacity, base_price) 
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        `;
        await pool.query(queryText, [name, association_id, facility_id, subZone, day_of_week, start_time, end_time, capacity, price]);

        res.writeHead(302, { Location: '/activities' });
        res.end();
    } catch (error) {
        res.statusCode = 500;
        res.end("Internal Server Error");
    }
}

async function showEditForm(req, res, params) {
    try {
        const activityRes = await pool.query('SELECT * FROM activities WHERE id = $1', [params.id]);
        const clubsRes = await pool.query('SELECT id, name FROM associations ORDER BY name');
        const facilitiesRes = await pool.query('SELECT id, name, erp_capacity FROM facilities ORDER BY name');
        
        render(res, 'pages/activity-edit.ejs', { 
            activity: activityRes.rows[0],
            clubs: clubsRes.rows,
            facilities: facilitiesRes.rows
        });
    } catch (error) {
        res.statusCode = 500;
        res.end("Internal Server Error");
    }
}

async function updateActivity(req, res, params) {
    try {
        const { name, association_id, facility_id, sub_zone, day_of_week, start_time, end_time, max_capacity, base_price } = req.body;
        const capacity = parseInt(max_capacity, 10);
        const price = parseFloat(base_price);
        const subZone = sub_zone && sub_zone.trim() !== '' ? sub_zone.trim() : null;

        const facilityRes = await pool.query('SELECT erp_capacity FROM facilities WHERE id = $1', [facility_id]);
        
        if (!scheduleService.validateCapacity(capacity, facilityRes.rows[0].erp_capacity)) {
            res.statusCode = 400;
            return res.end("Erreur : Capacité ERP dépassée.");
        }

        const scheduleRes = await pool.query(
            'SELECT start_time, end_time FROM activities WHERE facility_id = $1 AND day_of_week = $2 AND id != $3',
            [facility_id, day_of_week, params.id]
        );
        
        for (let i = 0; i < scheduleRes.rows.length; i++) {
            const existing = scheduleRes.rows[i];
            if (scheduleService.hasTimeCollision(start_time, end_time, existing.start_time, existing.end_time)) {
                res.statusCode = 400;
                return res.end("Erreur : Conflit d'horaire détecté.");
            }
        }

        const queryText = `
            UPDATE activities 
            SET name = $1, association_id = $2, facility_id = $3, sub_zone = $4, day_of_week = $5, 
                start_time = $6, end_time = $7, max_capacity = $8, base_price = $9
            WHERE id = $10
        `;
        await pool.query(queryText, [name, association_id, facility_id, subZone, day_of_week, start_time, end_time, capacity, price, params.id]);

        res.writeHead(302, { Location: '/activities' });
        res.end();
    } catch (error) {
        res.statusCode = 500;
        res.end("Internal Server Error");
    }
}

async function deleteActivity(req, res, params) {
    try {
        await pool.query('DELETE FROM activities WHERE id = $1', [params.id]);
        res.writeHead(302, { Location: '/activities' });
        res.end();
    } catch (error) {
        res.statusCode = 500;
        res.end("Internal Server Error");
    }
}

module.exports = { 
    listActivities, showCreateForm, createActivity, 
    showEditForm, updateActivity, deleteActivity 
};