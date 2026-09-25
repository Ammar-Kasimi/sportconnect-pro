const findMyWay = require('find-my-way')
// const { render } = require('./renderer')
// const pool = require('../config/db')
const facilityController = require('../controllers/facilityController')
const associationController = require('../controllers/associationController');
const activityController = require('../controllers/activityController');
const memberController = require('../controllers/memberController');
const familyController = require('../controllers/familyController');
const registrationController = require ('../controllers/registrationController')
const dashboardController = require('../controllers/dashboardController');
const { sendError } = require('./renderer');
const router = findMyWay({
    defaultRoute: (req, res) => {
        sendError(res, 404, "L'adresse demandée n'existe pas ou a été déplacée.");
    }
});


console.log('activityController:', activityController);
console.log('facilityController:', facilityController);
// router.on('GET', '/', async (req, res) => {
//     try {
//         const [facilitiesRes, clubsRes, activitiesRes] = await Promise.all([
//             pool.query('SELECT COUNT(*) FROM facilities'),
//             pool.query('SELECT COUNT(*) FROM associations'),
//             pool.query('SELECT COUNT(*) FROM activities')
//         ]);

//         const stats = {
//             facilitiesCount: parseInt(facilitiesRes.rows[0].count, 10),
//             clubsCount: parseInt(clubsRes.rows[0].count, 10),
//             activitiesCount: parseInt(activitiesRes.rows[0].count, 10)
//         };

//         render(res, 'partials/dashboard.ejs', { stats });
//     } catch (error) {
//         console.error('Error loading dashboard stats:', error);
//         res.statusCode = 500;
//         res.end('Internal Server Error');
//     }
// });
router.on('GET', '/', dashboardController.getDashboardStats);


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
router.on('POST', '/associations/:id/delete', associationController.deleteAssociation);

router.on('GET', '/members', memberController.listMembers);
router.on('GET', '/members/new', memberController.showCreateForm);
router.on('POST', '/members', memberController.createMember);
router.on('GET', '/members/:id/edit', memberController.showEditForm);
router.on('POST', '/members/:id', memberController.updateMember);

router.on('GET', '/families', familyController.listFamilies);
router.on('GET', '/families/new', familyController.showCreateForm);
router.on('POST', '/families', familyController.createFamily);

router.on('GET', '/checkout', registrationController.prepareCheckout);
router.on('GET', '/registrations', registrationController.listRegistrations);
router.on('POST', '/registrations', registrationController.createRegistration);
router.on('POST', '/registrations/:id/cancel', registrationController.cancelRegistration);
router.on('POST', '/registrations/:id/pay', registrationController.payInstallment);
module.exports = router;