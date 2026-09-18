const findMyWay = require('find-my-way')
const { render } = require('./renderer')
const pool = require('../config/db')
const facilityController = require('../controllers/facilityController')
const associationController = require('../controllers/associationController');
const activityController = require('../controllers/activityController');




const router = findMyWay({
    defaultRoute: (req, res) => {
        res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
        res.end('<h1>404 - Page non trouvée</h1>');
    }
})

router.on('GET', '/activities', activityController.listActivities);
router.on('GET', '/activities/new', activityController.showCreateForm);

router.on('GET', '/facilities', facilityController.listFacilities);
router.on('GET', '/facilities/new', facilityController.showCreateForm);
router.on('POST', '/facilities', facilityController.createFacility);
router.on('GET', '/facilities/:id/edit', facilityController.showEditForm);
router.on('POST', '/facilities/:id/edit', facilityController.updateFacility);
router.on('POST', '/facilities/:id/delete', facilityController.deleteFacility);

router.on('GET', '/associations', associationController.listAssociations);
router.on('GET', '/associations/new', associationController.showCreateForm);
router.on('POST', '/associations', associationController.createAssociation);
router.on('GET', '/associations/:id/edit', associationController.showEditForm);
router.on('POST', '/associations/:id/edit', associationController.updateAssociation);
router.on('GET', '/activities', activityController.listActivities);
router.on('GET', '/activities/new', activityController.showCreateForm);
router.on('POST', '/activities', activityController.createActivity);
router.on('GET', '/activities/:id/edit', activityController.showEditForm);
router.on('POST', '/activities/:id/edit', activityController.updateActivity);
router.on('POST', '/activities/:id/delete', activityController.deleteActivity);
router.on('get', '/', async (req, res) => {
    try {
        let facRes = await pool.query('select counT(*) FROM facilities')
        let actRes = await pool.query('SELECT COUNT(*) FROM activities');

        render(res, 'dashboard', {
            stats: {
                facilitiesCount: facRes.rows[0].count,
                activitiesCount: actRes.rows[0].count,
            }
        });
    } catch (err) {
        console.error('Erreur SQL :', err);
        res.writeHead(500, { 'Content-Type': 'text/plain' });
        res.end('Erreur base de données');
    }
})
module.exports = router;