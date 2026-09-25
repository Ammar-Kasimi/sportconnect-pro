const pool = require('../config/db');
const { sendError,render } = require('../core/renderer')
const eligibilityService = require('../services/eligibilityService');

async function listMembers(req, res) {
    try {
        const queryText = `
            SELECT members.*, families.family_code
            FROM members
            LEFT JOIN families ON members.family_id = families.id
            ORDER BY members.last_name, members.first_name
        `;
        const result = await pool.query(queryText);
        const membersList = result.rows.map(member => {
            const category = eligibilityService.calculateAgeCategory(member.birth_date);
            const isMedicalValid = eligibilityService.isMedicalCertificateValid(member.medical_certificate_date, false);

            return {
                ...member,
                category: category,
                medical_status: isMedicalValid ? 'compliant' : 'medical_non_compliant'
            };
        });

        render(res, 'pages/members.ejs', { members: membersList });
    } catch (error) {
        console.error('Database error:', error);
    return sendError(res, 500, "Une erreur interne est survenue. Veuillez réessayer ultérieurement.");
    }
}

async function showCreateForm(req, res) {
    try {
        const familiesResult = await pool.query('SELECT id, family_code FROM families ORDER BY family_code');
        render(res, 'pages/member-form.ejs', { member: null, families: familiesResult.rows });
    } catch (error) {
      console.error('Database error:', error);
    return sendError(res, 500, "Une erreur interne est survenue. Veuillez réessayer ultérieurement.");
    }
}

async function showEditForm(req, res, params) {
    try {
        const memberId = params.id;
        const memberResult = await pool.query('SELECT * FROM members WHERE id = $1', [memberId]);
        
        if (memberResult.rows.length === 0) {
            res.statusCode = 404;
            return res.end("Adhérent introuvable");
        }

        const familiesResult = await pool.query('SELECT id, family_code FROM families ORDER BY family_code');
        const member = memberResult.rows[0];
        if (member.birth_date) member.birth_date = new Date(member.birth_date).toISOString().split('T')[0];
        if (member.medical_certificate_date) member.medical_certificate_date = new Date(member.medical_certificate_date).toISOString().split('T')[0];

        render(res, 'pages/member-form.ejs', { member: member, families: familiesResult.rows });
    } catch (error) {
        console.error('Database error:', error);
    return sendError(res, 500, "Une erreur interne est survenue. Veuillez réessayer ultérieurement.");
    }
}

async function createMember(req, res) {
    try {
        const { family_id, first_name, last_name, birth_date, is_resident, pass_sport_code, medical_certificate_date } = req.body;
        const residentBoolean = is_resident === 'on';
        const passCode = pass_sport_code && pass_sport_code.trim() !== '' ? pass_sport_code.trim() : null;

        const queryText = `
            INSERT INTO members (family_id, first_name, last_name, birth_date, is_resident, pass_sport_code, medical_certificate_date) 
            VALUES ($1, $2, $3, $4, $5, $6, $7)
        `;

        await pool.query(queryText, [
            family_id || null,
            first_name,
            last_name,
            birth_date,
            residentBoolean,
            passCode,
            medical_certificate_date
        ]);

        res.writeHead(302, { Location: '/members' });
        res.end();
    } catch (error) {
      console.error('Database error:', error);
    return sendError(res, 500, "Une erreur interne est survenue. Veuillez réessayer ultérieurement.");
    }
}
async function updateMember(req, res, params) {
    try {
        const memberId = params.id;
        const { family_id, first_name, last_name, birth_date, is_resident, pass_sport_code, medical_certificate_date } = req.body;
        
        const residentBoolean = is_resident === 'on';
        const passCode = pass_sport_code && pass_sport_code.trim() !== '' ? pass_sport_code.trim() : null;

        const queryText = `
            UPDATE members 
            SET family_id = $1, first_name = $2, last_name = $3, birth_date = $4, 
                is_resident = $5, pass_sport_code = $6, medical_certificate_date = $7
            WHERE id = $8
        `;

        await pool.query(queryText, [
            family_id || null, first_name, last_name, birth_date, 
            residentBoolean, passCode, medical_certificate_date, memberId
        ]);

        res.writeHead(302, { Location: '/members' });
        res.end();
    } catch (error) {
       console.error('Database error:', error);
    return sendError(res, 500, "Une erreur interne est survenue. Veuillez réessayer ultérieurement.");
    }
}
module.exports = {
    listMembers,
    showCreateForm,
    createMember,
    showEditForm,
    updateMember
};
