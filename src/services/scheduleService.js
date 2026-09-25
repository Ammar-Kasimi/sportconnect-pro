function validateCapacity(activityCapacity, facilityErpCapacity) {
    return activityCapacity <= facilityErpCapacity;
}

function hasTimeCollision(newStart, newEnd, existingStart, existingEnd) {
    return (newStart < existingEnd) && (existingStart < newEnd);
}


// function isConflicting(newActivity, existingActivity) {
//     if (newActivity.day_of_week !== existingActivity.day_of_week) {
//         return false;
//     }
//     const timeOverlap = hasTimeCollision(
//         newActivity.start_time, newActivity.end_time,
//         existingActivity.start_time, existingActivity.end_time
//     );
//     if (!timeOverlap) {
//         return false;
//     }
//     const newZone = newActivity.sub_zone ? newActivity.sub_zone.toLowerCase() : 'complet';
//     const existingZone = existingActivity.sub_zone ? existingActivity.sub_zone.toLowerCase() : 'complet';
//     if (newZone === 'complet' || existingZone === 'complet') {
//         return true;
//     }
//     if (newZone === existingZone) {
//         return true;
//     }
//     return false;
// }
function isConflicting(newActivity, existingActivity, facility) {
    if (newActivity.day_of_week !== existingActivity.day_of_week) {
        return false;
    }
    const timeOverlap = hasTimeCollision(
        newActivity.start_time, newActivity.end_time,
        existingActivity.start_time, existingActivity.end_time
    );

    if (!timeOverlap) {
        return false;
    }
    if (!facility.is_divisible) {
        return true;
    }
    const newZone = newActivity.sub_zone ? newActivity.sub_zone.toLowerCase() : 'complet';
    const existingZone = existingActivity.sub_zone ? existingActivity.sub_zone.toLowerCase() : 'complet';

    if (newZone === 'complet' || existingZone === 'complet') {
        return true;
    }

    if (newZone === existingZone) {
        return true;
    }

    return false;
}
module.exports = {
    validateCapacity,
    hasTimeCollision,
    isConflicting
};