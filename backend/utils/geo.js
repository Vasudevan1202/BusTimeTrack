// Haversine formula to calculate distance in km between two coordinates
export const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Radius of the earth in km
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1); 
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * 
    Math.sin(dLon/2) * Math.sin(dLon/2); 
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
  const distance = R * c; // Distance in km
  return distance;
};

const deg2rad = (deg) => {
  return deg * (Math.PI/180);
};

// Calculate ETA in minutes based on average speed (e.g., 30 km/h)
export const calculateETA = (distanceKm, averageSpeedKmh = 30) => {
  if (distanceKm === 0) return 0;
  const hours = distanceKm / averageSpeedKmh;
  const minutes = hours * 60;
  return Math.round(minutes);
};
