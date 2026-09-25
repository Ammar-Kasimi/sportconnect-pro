const pool = require('../config/db');
const { render, sendError } = require('../core/renderer');

async function getDashboardStats(req, res) {
    try {
        const [facilitiesRes, clubsRes, activitiesRes] = await Promise.all([
            pool.query('SELECT COUNT(*) FROM facilities'),
            pool.query('SELECT COUNT(*) FROM associations'),
            pool.query('SELECT COUNT(*) FROM activities')
        ]);
        const revenueRes = await pool.query(
            "SELECT COALESCE(SUM(final_price), 0) AS total_revenue FROM registrations WHERE status = 'confirmed'"
        );
        const fillRateRes = await pool.query(`
            SELECT 
                COALESCE(SUM(a.max_capacity), 0) AS total_capacity,
                COUNT(r.id) AS total_registered
            FROM activities a
            LEFT JOIN registrations r ON a.id = r.activity_id AND r.status = 'confirmed'
        `);
        const capacity = parseInt(fillRateRes.rows[0].total_capacity, 10);
        const registered = parseInt(fillRateRes.rows[0].total_registered, 10);
        const fillRate = capacity > 0 ? ((registered / capacity) * 100).toFixed(1) : 0;

        const stats = {
            facilitiesCount: parseInt(facilitiesRes.rows[0].count, 10),
            clubsCount: parseInt(clubsRes.rows[0].count, 10),
            activitiesCount: parseInt(activitiesRes.rows[0].count, 10),
            totalRevenue: parseFloat(revenueRes.rows[0].total_revenue).toFixed(2),
            fillRate: fillRate
        };
        render(res, 'pages/dashboard.ejs', { stats });
    } catch (error) {
        console.error('Erreur Dashboard:', error);
        return sendError(res, 500, "Impossible de charger les statistiques métropolitaines.");
    }
}

module.exports = { getDashboardStats };