function calculatePriorityScore(isResident) {
    return isResident ? 10 : 0;
}

async function promoteNextCandidate(client, activityId) {
    const candidateRes = await client.query(
        `SELECT id, member_id 
         FROM waiting_list 
         WHERE activity_id = $1 AND status = 'waiting' 
         ORDER BY priority_score DESC, created_at ASC 
         LIMIT 1 FOR UPDATE`,
        [activityId]
    );

    if (candidateRes.rows.length === 0) {
        return null;
    }

    const waitlistId = candidateRes.rows[0].id;

    await client.query(
        `UPDATE waiting_list 
         SET status = 'promoted_pending', 
             deadline_confirmation = NOW() + INTERVAL '48 hours' 
         WHERE id = $1`,
        [waitlistId]
    );

    return candidateRes.rows[0];
}

module.exports = {
    calculatePriorityScore,
    promoteNextCandidate
};