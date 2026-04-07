/**
 * Haversine formula - calculates distance between two lat/lng points in km
 */
function haversineDistance(lat1, lon1, lat2, lon2) {
    if (!lat1 || !lon1 || !lat2 || !lon2) return null;

    const R = 6371; // Earth's radius in km
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);

    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return parseFloat((R * c).toFixed(2));
}

function toRad(deg) {
    return deg * (Math.PI / 180);
}

/**
 * Attach distance to each hospital object
 */
function attachDistances(hospitals, userLat, userLon) {
    return hospitals.map(h => ({
        ...h,
        distance: haversineDistance(userLat, userLon, h.latitude, h.longitude),
    }));
}

/**
 * Sort hospitals by distance (nearest first)
 */
function sortByDistance(hospitals) {
    return hospitals.sort((a, b) => {
        if (a.distance === null) return 1;
        if (b.distance === null) return -1;
        return a.distance - b.distance;
    });
}

module.exports = { haversineDistance, attachDistances, sortByDistance };