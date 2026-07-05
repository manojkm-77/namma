import * as Location from 'expo-location';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Location as RideLocation, SavedPlace } from '../types';

const SAVED_PLACES_KEY = 'namma_saved_places';
const RECENT_SEARCHES_KEY = 'namma_recent_searches';

export async function getCurrentLocation(): Promise<RideLocation | null> {
  try {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') return null;

    const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
    const [address] = await Location.reverseGeocodeAsync({
      latitude: loc.coords.latitude,
      longitude: loc.coords.longitude,
    });

    return {
      latitude: loc.coords.latitude,
      longitude: loc.coords.longitude,
      address: address
        ? [address.street, address.district, address.city, address.region]
            .filter(Boolean)
            .join(', ')
        : 'Current Location',
      label: 'Current Location',
    };
  } catch {
    return null;
  }
}

export async function searchLocations(query: string): Promise<RideLocation[]> {
  if (!query.trim()) return [];
  try {
    const results = await Location.geocodeAsync(query);
    return Promise.all(
      results.slice(0, 5).map(async (result) => {
        const [address] = await Location.reverseGeocodeAsync({
          latitude: result.latitude,
          longitude: result.longitude,
        });
        return {
          latitude: result.latitude,
          longitude: result.longitude,
          address: address
            ? [address.street, address.name, address.district, address.city, address.region]
                .filter(Boolean)
                .join(', ')
            : query,
          label: query,
        };
      }),
    );
  } catch {
    return [];
  }
}

export function estimateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export function estimateDuration(distanceKm: number, avgSpeedKmph: number = 25): number {
  return (distanceKm / avgSpeedKmph) * 60;
}

export async function getSavedPlaces(): Promise<SavedPlace[]> {
  try {
    const data = await AsyncStorage.getItem(SAVED_PLACES_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

export async function savePlace(place: SavedPlace): Promise<void> {
  try {
    const places = await getSavedPlaces();
    const filtered = places.filter((p) => p.type !== place.type);
    filtered.push(place);
    await AsyncStorage.setItem(SAVED_PLACES_KEY, JSON.stringify(filtered));
  } catch {
    // silent
  }
}

export async function getRecentSearches(): Promise<RideLocation[]> {
  try {
    const data = await AsyncStorage.getItem(RECENT_SEARCHES_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

export async function saveRecentSearch(location: RideLocation): Promise<void> {
  try {
    const searches = await getRecentSearches();
    const filtered = searches.filter((s) => s.address !== location.address);
    filtered.unshift(location);
    await AsyncStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(filtered.slice(0, 10)));
  } catch {
    // silent
  }
}
