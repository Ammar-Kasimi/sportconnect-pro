const pool = require('../config/db');
const pricingService = require('../services/pricingService');
const waitingListService = require('../services/waitingListService');
const { render, sendError } = require('../core/renderer');
const eligibilityService = require('../services/eligibilityService');

async function prepareCheckout(req, res) {
    try {
        const url = new URL(req.url, `http://${req.headers.host}`);
        const memberId = url.searchParams.get('member_id');
        const activityId = url.searchParams.get('activity_id');

        if (!memberId || !activityId) {
            res.statusCode = 400;
            return res.end("Missing member_id or activity_id");
        }
        
        const memberQuery = `
            SELECT m.*, f.quotient_familial 
            FROM members m
            LEFT JOIN families f ON m.family_id = f.id
            WHERE m.id = $1
        `;
        const memberResult = await pool.query(memberQuery, [memberId]);
        const member = memberResult.rows[0];
        
        const activityResult = await pool.query(
            'SELECT name, base_price, is_high_risk, target_category FROM activities WHERE id = $1',
            [activityId] 
        ); 
        const activity = activityResult.rows[0];
        
        let existingFamilyRegistrations = 0;
        if (member.family_id) {
            const familyRegQuery = `
                SELECT COUNT(*) as count 
                FROM registrations r
                JOIN members m ON r.member_id = m.id
                WHERE m.family_id = $1 AND r.status = 'confirmed'
            `;
            const familyRegResult = await pool.query(familyRegQuery, [member.family_id]);
            existingFamilyRegistrations = parseInt(familyRegResult.rows[0].count, 10);
        }
        
        const hasPassSport = member.pass_sport_code ? true : false;

        const pricingDetails = pricingService.calculateFinalPrice(
            activity.base_price,
            member.is_resident,
            existingFamilyRegistrations,
            member.quotient_familial,
            hasPassSport
        );
        
        render(res, 'pages/checkout.ejs', {
            member,
            activity,
            pricingDetails,
            existingFamilyRegistrations
        });

    } catch (error) {
        console.error('Database error:', error);
        return sendError(res, 500, "Une erreur interne est survenue. Veuillez réessayer ultérieurement.");
    }
}

async function createRegistration(req, res) {
    try {
        let safePaymentPlan = 'single';
        const { member_id, activity_id, payment_plan } = req.body;

        if (!member_id || !activity_id) {
            return sendError(res, 400, "Erreur : member_id ou activity_id manquant.");
        }
        if (payment_plan === 'three_times') {
            safePaymentPlan = 'three_times';
        }
        
        const memberQuery = `
            SELECT m.*, f.quotient_familial 
            FROM members m
            LEFT JOIN families f ON m.family_id = f.id
            WHERE m.id = $1
        `;
        const memberResult = await pool.query(memberQuery, [member_id]);
        const member = memberResult.rows[0];

        if (!member) {
            return sendError(res, 404, "Erreur : Adhérent introuvable.");
        }

        const activityResult = await pool.query(
            'SELECT name, base_price, is_high_risk, target_category FROM activities WHERE id = $1', 
            [activity_id]
        );
        const activity = activityResult.rows[0];

        if (!activity) {
            return sendError(res, 404, "Erreur : Activité introuvable.");
        }

        const isMedicalValid = eligibilityService.isMedicalCertificateValid(
            member.medical_certificate_date, 
            activity.is_high_risk
        );

        if (activity.is_high_risk && !isMedicalValid) {
            return sendError(res, 400, `Erreur : L'activité ${activity.name} exige un certificat médical de moins d'un an.`);
        }

        const memberCategory = eligibilityService.calculateAgeCategory(member.birth_date);
        
        if (activity.target_category !== 'Tous publics' && activity.target_category !== memberCategory) {
            return sendError(res, 400, `Erreur : L'adhérent est de catégorie ${memberCategory}, mais l'activité est réservée à la catégorie ${activity.target_category}.`);
        }

        let existingFamilyRegs = 0;
        if (member.family_id) {
            const familyRegQuery = `
                SELECT COUNT(*) as count FROM registrations r
                JOIN members m ON r.member_id = m.id
                WHERE m.family_id = $1 AND r.status = 'confirmed'
            `;
            const familyRegResult = await pool.query(familyRegQuery, [member.family_id]);
            existingFamilyRegs = parseInt(familyRegResult.rows[0].count, 10);
        }

        const hasPassSport = member.pass_sport_code ? true : false;
        const pricingDetails = pricingService.calculateFinalPrice(
            activity.base_price,
            member.is_resident,
            existingFamilyRegs,
            member.quotient_familial,
            hasPassSport
        );
        const secureFinalPrice = pricingDetails.finalPrice;

        const client = await pool.connect();

        try {
            await client.query('BEGIN');
            const dupCheck = await client.query(
                `SELECT id FROM registrations WHERE member_id = $1 AND activity_id = $2
                 UNION 
                 SELECT id FROM waiting_list WHERE member_id = $1 AND activity_id = $2`,
                [req.body.member_id, req.body.activity_id]
            );

            if (dupCheck.rows.length > 0) {
                await client.query('ROLLBACK');
                return sendError(res, 400, "L'adhérent est déjà inscrit ou sur liste d'attente pour ce cours.");
            }

            const actRes = await client.query('SELECT max_capacity FROM activities WHERE id = $1 FOR UPDATE', [req.body.activity_id]);
            const maxCapacity = actRes.rows[0].max_capacity;

            const countRes = await client.query("SELECT COUNT(*) AS total FROM registrations WHERE activity_id = $1 AND status = 'confirmed'", [req.body.activity_id]);
            const currentCount = parseInt(countRes.rows[0].total, 10);

            if (currentCount >= maxCapacity) {
                const priorityScore = waitingListService.calculatePriorityScore(member.is_resident);

                await client.query(
                    'INSERT INTO waiting_list (activity_id, member_id, priority_score, status) VALUES ($1, $2, $3, $4)',
                    [req.body.activity_id, req.body.member_id, priorityScore, 'waiting']
                );
                await client.query('COMMIT');
                res.writeHead(302, { Location: '/registrations?status=waitlisted' });
                return res.end();
            } else {
                await client.query(
                    'INSERT INTO registrations (member_id, activity_id, final_price, payment_plan, status, installments_paid) VALUES ($1, $2, $3, $4, $5, 1)',
                    [req.body.member_id, req.body.activity_id, secureFinalPrice, safePaymentPlan, 'confirmed']
                );
                await client.query('COMMIT');
                res.writeHead(302, { Location: '/registrations?status=confirmed' });
                return res.end();
            }
        } catch (txError) {
            await client.query('ROLLBACK');
            throw txError;
        } finally {
            client.release();
        }

    } catch (error) {
        console.error('Erreur Inscription:', error);
        return sendError(res, 500, "Erreur critique lors de l'inscription. Veuillez réessayer.");
    }
}

async function payInstallment(req, res, params) {
    const client = await pool.connect();
    try {
        const updateRes = await client.query(
            `UPDATE registrations 
             SET installments_paid = installments_paid + 1 
             WHERE id = $1 AND payment_plan = 'three_times' AND installments_paid < 3 
             RETURNING id`,
            [params.id]
        );

        if (updateRes.rows.length === 0) {
            return sendError(res, 400, "Impossible d'encaisser cette échéance (déjà soldée ou non applicable).");
        }

        res.writeHead(302, { Location: '/registrations' });
        res.end();
    } catch (error) {
        console.error('Erreur encaissement:', error);
        return sendError(res, 500, "Erreur interne lors de l'encaissement.");
    } finally {
        client.release();
    }
}

async function cancelRegistration(req, res, params) {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        const cancelRes = await client.query(
            `UPDATE registrations 
             SET status = 'cancelled' 
             WHERE id = $1 AND status = 'confirmed' 
             RETURNING activity_id`,
            [params.id]
        );

        if (cancelRes.rows.length === 0) {
            await client.query('ROLLBACK');
            res.statusCode = 400;
            return res.end("Erreur : Inscription introuvable ou déjà annulée.");
        }

        const activityId = cancelRes.rows[0].activity_id;
        await waitingListService.promoteNextCandidate(client, activityId);

        await client.query('COMMIT');
        res.writeHead(302, { Location: '/registrations' });
        res.end();

    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Erreur Annulation:', error);
        return sendError(res, 500, "Une erreur interne est survenue lors de l'annulation.");
    } finally {
        client.release();
    }
}

async function listRegistrations(req, res) {
    try {
        const regQuery = `
            SELECT r.*, m.first_name, m.last_name, a.name AS activity_name 
            FROM registrations r
            JOIN members m ON r.member_id = m.id
            JOIN activities a ON r.activity_id = a.id
            WHERE r.status = 'confirmed' 
            ORDER BY r.id DESC
        `;
        const regResult = await pool.query(regQuery);

        const waitQuery = `
            SELECT w.*, m.first_name, m.last_name, a.name AS activity_name 
            FROM waiting_list w
            JOIN members m ON w.member_id = m.id
            JOIN activities a ON w.activity_id = a.id
            ORDER BY w.priority_score DESC, w.created_at ASC
        `;
        const waitResult = await pool.query(waitQuery);

        const membersResult = await pool.query('SELECT id, first_name, last_name FROM members ORDER BY last_name');
        const activitiesResult = await pool.query('SELECT id, name, base_price FROM activities ORDER BY name');

        render(res, 'pages/registrations.ejs', {
            registrations: regResult.rows,
            waitingList: waitResult.rows,
            allMembers: membersResult.rows,
            allActivities: activitiesResult.rows
        });

    } catch (error) {
        console.error('Database error:', error);
        return sendError(res, 500, "Une erreur interne est survenue. Veuillez réessayer ultérieurement.");
    }
}

async function register(res,req,params){
    let client= await pool.connect()
    try{
     await client.query('BEGIN');

    let capacity= await client.query('select max_capacity from activities where id = $1',[params.id]);le
     let reg_count=await client.query('select count(*) from registrations where activity_id=$1',[params.id])
      
     

     await client.query('COMMIT')
    }catch(err){
        await client.query('ROLLBACK')
    }

}
module.exports = {
    prepareCheckout,
    createRegistration,
    listRegistrations,
    cancelRegistration,
    payInstallment
};