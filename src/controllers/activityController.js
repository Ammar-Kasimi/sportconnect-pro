const pool = require('../config/db');
const scheduleService = require('../services/scheduleService');
const { sendError, render } = require('../core/renderer');

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
        console.error('Database error:', error);
        return sendError(res, 500, "Une erreur interne est survenue. Veuillez réessayer ultérieurement.");
    }
}

async function showCreateForm(req, res) {
    try {
        const clubsResult = await pool.query('SELECT id, name FROM associations ORDER BY name');
        const facilitiesResult = await pool.query('SELECT id, name, erp_capacity FROM facilities ORDER BY name');
        render(res, 'pages/activity-form.ejs', { clubs: clubsResult.rows, facilities: facilitiesResult.rows });
    } catch (error) {
        console.error('Database error:', error);
        return sendError(res, 500, "Une erreur interne est survenue. Veuillez réessayer ultérieurement.");
    }
}

async function createActivity(req, res) {
    try {
        const { name, association_id, facility_id, sub_zone, day_of_week, start_time, end_time, max_capacity, base_price, target_category } = req.body;
        const isHighRisk = req.body.is_high_risk === 'on';
        const safeTargetCategory = target_category || 'Tous publics';
        const capacity = parseInt(max_capacity, 10);
        const price = parseFloat(base_price);
        const subZone = sub_zone && sub_zone.trim() !== '' ? sub_zone.trim() : null;

        const facilityRes = await pool.query('SELECT erp_capacity, is_divisible FROM facilities WHERE id = $1', [facility_id]);
        const facility = facilityRes.rows[0];

        if (!scheduleService.validateCapacity(capacity, facility.erp_capacity)) {
            res.statusCode = 400;
            return res.end("Erreur : Capacité ERP dépassée.");
        }

        const existingRes = await pool.query(
            'SELECT start_time, end_time, sub_zone, day_of_week FROM activities WHERE facility_id = $1 AND day_of_week = $2',
            [facility_id, day_of_week]
        );

        const newActivity = { day_of_week, start_time, end_time, sub_zone: subZone };

        for (let i = 0; i < existingRes.rows.length; i++) {
            const existing = existingRes.rows[i];
            if (scheduleService.isConflicting(newActivity, existing, facility)) {
                res.statusCode = 400;
                return res.end("Erreur : Conflit d'horaire ou de sous-zone détecté.");
            }
        }

        const queryText = `
            INSERT INTO activities (name, association_id, facility_id, sub_zone, day_of_week, start_time, end_time, max_capacity, base_price, is_high_risk, target_category) 
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        `;
        await pool.query(queryText, [name, association_id, facility_id, subZone, day_of_week, start_time, end_time, capacity, price, isHighRisk, safeTargetCategory]);

        res.writeHead(302, { Location: '/activities' });
        res.end();
    } catch (error) {
        console.error('Database error:', error);
        return sendError(res, 500, "Une erreur interne est survenue. Veuillez réessayer ultérieurement.");
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
        console.error('Database error:', error);
        return sendError(res, 500, "Une erreur interne est survenue. Veuillez réessayer ultérieurement.");
    }
}

async function updateActivity(req, res, params) {
    try {
        const { name, association_id, facility_id, sub_zone, day_of_week, start_time, end_time, max_capacity, base_price, target_category } = req.body;
        const isHighRisk = req.body.is_high_risk === 'on';
        const safeTargetCategory = target_category || 'Tous publics';
        const capacity = parseInt(max_capacity, 10);
        const price = parseFloat(base_price);
        const subZone = sub_zone && sub_zone.trim() !== '' ? sub_zone.trim() : null;

        const facilityRes = await pool.query('SELECT erp_capacity, is_divisible FROM facilities WHERE id = $1', [facility_id]);
        const facility = facilityRes.rows[0];

        if (!scheduleService.validateCapacity(capacity, facility.erp_capacity)) {
            res.statusCode = 400;
            return res.end("Erreur : Capacité ERP dépassée.");
        }

        const scheduleRes = await pool.query(
            'SELECT start_time, end_time, sub_zone, day_of_week FROM activities WHERE facility_id = $1 AND day_of_week = $2 AND id != $3',
            [facility_id, day_of_week, params.id]
        );

        const newActivity = { day_of_week, start_time, end_time, sub_zone: subZone };

        for (let i = 0; i < scheduleRes.rows.length; i++) {
            const existing = scheduleRes.rows[i];
            if (scheduleService.isConflicting(newActivity, existing, facility)) {
                res.statusCode = 400;
                return res.end("Erreur : Conflit d'horaire ou de sous-zone détecté.");
            }
        }

        const queryText = `
            UPDATE activities 
            SET name = $1, association_id = $2, facility_id = $3, sub_zone = $4, day_of_week = $5, 
                start_time = $6, end_time = $7, max_capacity = $8, base_price = $9, is_high_risk = $10, target_category = $11
            WHERE id = $12
        `;
        await pool.query(queryText, [name, association_id, facility_id, subZone, day_of_week, start_time, end_time, capacity, price, isHighRisk, safeTargetCategory, params.id]);

        res.writeHead(302, { Location: '/activities' });
        res.end();
    } catch (error) {
        console.error('Database error:', error);
        return sendError(res, 500, "Une erreur interne est survenue. Veuillez réessayer ultérieurement.");
    }
}

async function deleteActivity(req, res, params) {
    try {
        await pool.query('DELETE FROM activities WHERE id = $1', [params.id]);
        res.writeHead(302, { Location: '/activities' });
        res.end();
    } catch (error) {
        console.error('Database error:', error);
        return sendError(res, 500, "Une erreur interne est survenue. Veuillez réessayer ultérieurement.");
    }
}
async function getActivity(req, res, id) {
    try {
        let activity = await pool.query('select * from activities where id =$1', [id])
        // res.writeHead(200,{Location:'/activities'});

        // res.end()
        res.writeHead(200, { location: '/activities-form', accept: text / json })
        res.end
        return res.json(stringify(activity))
    } catch (err) {
        console.error('database error:', error)
        return sendError(res, 500, "une errer 500")
    }
}
let arr = []
arr.map
async function getStats(req, res, parmas) {
    try {
        let results = await pool.query('select activities.nom,activities.max_capacity,count(registrations.*) as registrations from activities join registrations on activities.id = registrations.activity_id')
        // let results=await pool.query('select nom,max_capacity from activities')
        results = results.rows
        let newResults = results.map((e) => { return { activity: e.activity, capacity: parseInt(e.max_capacity), registered: parseInt(e.registrations), fillRate: parseInt(e.max_capacity) / parseInt(e.registrations) * 100 } })
        render(res,'pages/stats',{stats:newResults})

    }
    catch(err){
        console.error('database Error',err)
        return sendError(res,500,'erreur en database')
    }
}
module.exports = {
    listActivities, showCreateForm, createActivity,
    showEditForm, updateActivity, deleteActivity
};