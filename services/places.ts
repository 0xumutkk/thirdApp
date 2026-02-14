/// <reference types="google.maps" />
import type { Cafe } from '../types';

const PLACEHOLDER_IMAGE =
  'https://images.unsplash.com/photo-1554118811-1e0d58224f24?q=80&w=2047&auto=format&fit=crop';

declare global {
  interface Window {
    google?: typeof google;
    __placesScriptResolve?: () => void;
  }
}

let scriptLoadPromise: Promise<void> | null = null;

function loadGoogleMapsScript(): Promise<void> {
  if (typeof window === 'undefined') return Promise.reject(new Error('Not in browser'));
  if (window.google?.maps?.places) return Promise.resolve();
  if (scriptLoadPromise) return scriptLoadPromise;

  const key = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
  if (!key || key === 'your-google-maps-places-api-key') {
    return Promise.reject(new Error('VITE_GOOGLE_MAPS_API_KEY is not set in .env.local'));
  }

  scriptLoadPromise = new Promise((resolve, reject) => {
    const name = '__gmapsPlacesCallback';
    (window as any)[name] = () => {
      if (window.google?.maps?.places) resolve();
      else reject(new Error('Places library failed to load'));
    };
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(key)}&libraries=places&callback=${name}`;
    script.async = true;
    script.onerror = () => reject(new Error('Failed to load Google Maps script'));
    document.head.appendChild(script);
  });

  return scriptLoadPromise;
}

function haversineDistanceMeters(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371e3;
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function formatDistance(meters: number): string {
  if (meters < 1000) return `${Math.round(meters)}m`;
  return `${(meters / 1000).toFixed(1)}km`;
}

function placeResultToCafe(
  place: google.maps.places.PlaceResult,
  userLat: number,
  userLng: number
): Cafe {
  const lat = place.geometry?.location?.lat?.() ?? 0;
  const lng = place.geometry?.location?.lng?.() ?? 0;
  const distanceM = haversineDistanceMeters(userLat, userLng, lat, lng);

  let image = PLACEHOLDER_IMAGE;
  if (place.photos?.length) {
    const photo = place.photos[0];
    if (photo.getUrl) image = photo.getUrl({ maxWidth: 400, maxHeight: 400 }) ?? image;
  }

  return {
    id: place.place_id ?? `place-${lat}-${lng}`,
    name: place.name ?? 'Mekan',
    distance: formatDistance(distanceM),
    rating: place.rating ?? 0,
    reviews: place.user_ratings_total ?? 0,
    image,
    amenities: [],
    address: place.vicinity ?? place.formatted_address ?? '',
    description: '',
    isJoined: false,
    stamps: 0,
    maxStamps: 10,
    points: 0,
    moods: [],
    coordinates: { lat, lng },
  };
}

/**
 * Fetches nearby cafes from Google Places (Maps JavaScript API + Places library).
 * Requires VITE_GOOGLE_MAPS_API_KEY in .env.local and Places API + Maps JavaScript API enabled.
 */
export async function fetchNearbyCafesFromPlaces(
  lat: number,
  lng: number,
  radiusMeters: number,
  keyword?: string
): Promise<Cafe[]> {
  await loadGoogleMapsScript().catch(err => {
    console.error(err);
    throw err;
  });

  const google = window.google;
  if (!google?.maps?.places) return [];

  const mapDiv = document.createElement('div');
  const map = new google.maps.Map(mapDiv, {
    center: { lat, lng },
    zoom: 15,
  });
  const service = new google.maps.places.PlacesService(map);

  return new Promise((resolve, reject) => {
    const request: google.maps.places.PlaceSearchRequest = {
      location: new google.maps.LatLng(lat, lng),
      radius: radiusMeters,
      type: 'cafe',
      keyword: keyword || undefined
    };

    service.nearbySearch(request, (results, status) => {
      if (status !== google.maps.places.PlacesServiceStatus.OK || !results) {
        resolve([]);
        return;
      }
      const cafes = results
        .filter((p): p is google.maps.places.PlaceResult => p != null)
        .map((p) => placeResultToCafe(p, lat, lng))
        .sort((a, b) => {
          if (b.rating !== a.rating) return b.rating - a.rating;
          return b.reviews - a.reviews;
        });
      resolve(cafes);
    });
  });
}
