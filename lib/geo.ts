// Client-side geolocation + reverse geocoding helpers.
//
// Reverse geocoding uses the free OpenStreetMap Nominatim service
// (https://nominatim.org) which requires NO API key. It is rate-limited
// (~1 req/sec) which is fine for a single user tagging a sighting.
// If the lookup fails we fall back to a coordinate-derived label so the
// UI always has something sensible to suggest.

export interface Coords {
  lat: number;
  lng: number;
  accuracy?: number;
}

export interface SuggestedLocation extends Coords {
  label: string;
}

const NOMINATIM_URL = "https://nominatim.openstreetmap.org/reverse";

/**
 * Request the browser's current position. Resolves to coords on success,
 * or null if permission is denied / unavailable / times out. Never throws,
 * so callers can treat a null result as "skip location" gracefully.
 */
export function getCurrentCoords(timeoutMs = 8000): Promise<Coords | null> {
  return new Promise((resolve) => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      resolve(null);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) =>
        resolve({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
        }),
      () => resolve(null), // permission denied or error -> skip silently
      { enableHighAccuracy: true, timeout: timeoutMs, maximumAge: 60_000 },
    );
  });
}

/**
 * Build a short, human-readable place label from a Nominatim address object,
 * preferring the most specific recognisable name (Instagram-style).
 */
function buildLabel(address: Record<string, string> | undefined): string | null {
  if (!address) return null;
  const place =
    address.attraction ||
    address.leisure ||
    address.park ||
    address.tourism ||
    address.building ||
    address.amenity ||
    address.road ||
    address.neighbourhood ||
    address.suburb ||
    address.village ||
    address.town ||
    address.city ||
    address.county ||
    null;
  const region =
    address.city || address.town || address.village || address.state || null;

  if (place && region && place !== region) return `${place}, ${region}`;
  return place || region || null;
}

/**
 * Reverse-geocode coords into a readable place name. Returns a fallback
 * "lat, lng" string if the lookup fails so the UI always has a suggestion.
 */
export async function reverseGeocode(coords: Coords): Promise<string> {
  const fallback = `${coords.lat.toFixed(4)}, ${coords.lng.toFixed(4)}`;
  try {
    const url = `${NOMINATIM_URL}?format=jsonv2&lat=${coords.lat}&lon=${coords.lng}&zoom=16&addressdetails=1`;
    const res = await fetch(url, {
      headers: { Accept: "application/json" },
    });
    if (!res.ok) return fallback;
    const data = await res.json();
    return buildLabel(data?.address) || data?.display_name?.split(",").slice(0, 2).join(",").trim() || fallback;
  } catch {
    return fallback;
  }
}

/**
 * Convenience: get coords AND a suggested readable label in one call.
 * Returns null if location permission is unavailable.
 */
export async function getSuggestedLocation(): Promise<SuggestedLocation | null> {
  const coords = await getCurrentCoords();
  if (!coords) return null;
  const label = await reverseGeocode(coords);
  return { ...coords, label };
}
