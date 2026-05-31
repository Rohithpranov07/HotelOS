export interface LatLng {
  lat: number;
  lng: number;
}

/** Kodai International — 17/328 Lawsghat Road, Kodaikanal 624 101. */
export const HOTEL_COORDS: LatLng = { lat: 10.2404, lng: 77.4897 };

/** Great-circle distance in km between two points. */
export function haversineKm(a: LatLng, b: LatLng): number {
  const R = 6371;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const sinDLat = Math.sin(dLat / 2);
  const sinDLng = Math.sin(dLng / 2);
  const h = sinDLat * sinDLat + Math.cos(lat1) * Math.cos(lat2) * sinDLng * sinDLng;
  return 2 * R * Math.asin(Math.sqrt(h));
}

export function formatKm(km: number): string {
  if (km < 1) return `${Math.round(km * 1000)} m`;
  if (km < 10) return `${km.toFixed(1)} km`;
  return `${Math.round(km)} km`;
}

/**
 * Rough drive-time estimate for hill-station roads (~22 km/h average accounting
 * for ghats, hairpins and tourist traffic). Adds a 4-minute base for parking
 * and walking from the porch.
 */
export function estimateDriveMinutes(km: number): number {
  return Math.max(4, Math.round((km / 22) * 60) + 4);
}

export function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m === 0 ? `${h} hr` : `${h} hr ${m} min`;
}
