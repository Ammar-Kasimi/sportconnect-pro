function validateCapacity(activityCapacity, facilityErpCapacity) {
    return activityCapacity <= facilityErpCapacity;
}

function hasTimeCollision(newStart, newEnd, existingStart, existingEnd) {
    return (newStart < existingEnd) && (existingStart < newEnd);
}

module.exports = {
    validateCapacity,
    hasTimeCollision
};