/**
 * Haversine formula to calculate great-circle distance between two points in kilometers
 */
export function calculateDistanceKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  if (lat1 === lat2 && lon1 === lon2) return 0;

  const R = 6371; // Earth radius in km
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const d = R * c;

  // Round to 2 decimal places
  return Math.round(d * 100) / 100;
}

function toRad(degrees: number): number {
  return (degrees * Math.PI) / 180;
}

/**
 * Calculate dynamic Cash-on-Delivery Delivery Fee based on distance and admin rates
 */
export function calculateDeliveryFee(
  distanceKm: number,
  baseCharge: number,
  perKmRate: number
): number {
  // If under 1km, applies base charge; each additional km adds perKmRate
  const calculated = baseCharge + Math.max(0, distanceKm - 1) * perKmRate;
  return Math.max(baseCharge, Math.round(calculated));
}

/**
 * Parses Google Maps URL or string to extract lat and lng
 * Supported formats:
 * - "23.7937, 90.4049"
 * - "https://maps.google.com/?q=23.7937,90.4049"
 * - "https://www.google.com/maps/@23.7937,90.4049,15z"
 * - "https://www.google.com/maps/place/.../@23.7937,90.4049,17z/..."
 */
export function parseGoogleMapsLinkOrCoords(input: string): { lat: number; lng: number } | null {
  if (!input) return null;
  const trimmed = input.trim();

  // Pattern 1: Raw "lat, lng" or "lat,lng"
  const rawCoordRegex = /^[-+]?([1-8]?\d(\.\d+)?|90(\.0+)?),\s*[-+]?(180(\.0+)?|((1[0-7]\d)|([1-9]?\d))(\.\d+)?)$/;
  if (rawCoordRegex.test(trimmed)) {
    const [latStr, lngStr] = trimmed.split(',').map(s => s.trim());
    return { lat: parseFloat(latStr), lng: parseFloat(lngStr) };
  }

  // Pattern 2: ?q=lat,lng
  const qMatch = trimmed.match(/[?&]q=([-+]?\d+\.\d+),([-+]?\d+\.\d+)/);
  if (qMatch) {
    return { lat: parseFloat(qMatch[1]), lng: parseFloat(qMatch[2]) };
  }

  // Pattern 3: @lat,lng
  const atMatch = trimmed.match(/@([-+]?\d+\.\d+),([-+]?\d+\.\d+)/);
  if (atMatch) {
    return { lat: parseFloat(atMatch[1]), lng: parseFloat(atMatch[2]) };
  }

  // Pattern 4: /maps/search/lat,lng
  const searchMatch = trimmed.match(/maps\/search\/([-+]?\d+\.\d+),\s*([-+]?\d+\.\d+)/);
  if (searchMatch) {
    return { lat: parseFloat(searchMatch[1]), lng: parseFloat(searchMatch[2]) };
  }

  return null;
}
